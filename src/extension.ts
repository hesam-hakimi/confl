import * as vscode from 'vscode';
import { ConfluenceClient } from './confluenceClient';
import { readConfig } from './config';
import { buildSearchCql } from './cql';
import { htmlToMarkdownOrText, truncate } from './markdown';
import { TtlCache } from './cache';
import { ApprovalService, ToolCallLimiter } from './approvals';
import { ConfluenceViewProvider } from './sidebar';

export function activate(context: vscode.ExtensionContext): void {
  const cache = new TtlCache<any>(readConfig().cacheTtlSeconds * 1000);
  const approval = new ApprovalService(context.workspaceState);
  const limiter = new ToolCallLimiter();

  const getClient = async (): Promise<ConfluenceClient> => {
    const cfg = readConfig();
    const token = await context.secrets.get('confluence.pat');
    if (!cfg.baseUrl) throw new Error('Confluence base URL is not configured.');
    if (!token) throw new Error('Confluence PAT is not configured.');
    return new ConfluenceClient(cfg.baseUrl, token);
  };

  async function runSearch(input: any, sessionId = 'sidebar') {
    const cfg = readConfig();
    limiter.use(sessionId, cfg.maxToolCalls);
    if (!(await approval.shouldAllow('search', cfg.askBeforeSearch))) throw new Error('Search denied by user.');
    const client = await getClient();
    const cql = buildSearchCql(input, cfg);
    const key = `search:${cql}:${input.start ?? 0}:${Math.min(50, input.limit ?? cfg.maxResults)}`;
    if (cfg.cacheEnabled) {
      const hit = cache.get(key);
      if (hit) return hit;
    }
    const results = await client.search({ cql, start: input.start ?? 0, limit: Math.min(50, input.limit ?? cfg.maxResults) });
    const payload = { results };
    if (cfg.cacheEnabled) cache.set(key, payload);
    return payload;
  }

  async function runGetPage(input: any, sessionId = 'sidebar') {
    const cfg = readConfig();
    limiter.use(sessionId, cfg.maxToolCalls);
    if (!(await approval.shouldAllow('fetch', cfg.askBeforeFetch))) throw new Error('Fetch denied by user.');
    const client = await getClient();
    const cacheKey = `page:${input.id}`;
    if (cfg.cacheEnabled) {
      const hit = cache.get(cacheKey);
      if (hit) return hit;
    }
    const data = await client.getPage(input.id);
    const converted = htmlToMarkdownOrText(data.body?.view?.value ?? '');
    const limited = truncate(converted, Math.min(input.maxChars ?? cfg.maxChars, cfg.maxChars));
    const payload = {
      id: String(data.id),
      title: data.title,
      spaceKey: data.space?.key ?? '',
      lastUpdated: data.history?.lastUpdated?.when,
      url: client.buildAbsoluteUrl(data._links),
      bodyMarkdown: limited.text,
      truncated: limited.truncated,
    };
    if (cfg.cacheEnabled) cache.set(cacheKey, payload);
    return payload;
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('confluence.connectionView', new ConfluenceViewProvider(context, 'confluence.connectionView')),
    vscode.window.registerWebviewViewProvider('confluence.scopeView', new ConfluenceViewProvider(context, 'confluence.scopeView')),
    vscode.window.registerWebviewViewProvider('confluence.searchView', new ConfluenceViewProvider(context, 'confluence.searchView')),
    vscode.commands.registerCommand('confluence.clearCache', () => cache.clear()),
    vscode.commands.registerCommand('confluence.testConnection', async () => {
      try {
        const client = await getClient();
        await client.testConnection();
        vscode.window.showInformationMessage('Confluence connection successful.');
      } catch (e: any) {
        vscode.window.showErrorMessage(`Connection failed: ${e.message}`);
      }
    }),
    vscode.commands.registerCommand('confluence.searchFromSidebar', async (input: any) => {
      try {
        const out = await runSearch(input.advanced ? { cql: input.query } : { query: input.query }, 'sidebar');
        const picks = out.results.map((r: any) => ({ label: r.title, description: `${r.spaceKey} ${r.lastUpdated ?? ''}`, detail: r.url, id: r.id }));
        const selected = await vscode.window.showQuickPick(picks, { placeHolder: 'Search Results' });
        if (!selected) return;
        const action = await vscode.window.showQuickPick(['Open link', 'Copy link', 'Fetch content', 'Copy markdown']);
        if (!action) return;
        if (action === 'Open link') vscode.env.openExternal(vscode.Uri.parse(selected.detail!));
        if (action === 'Copy link') vscode.env.clipboard.writeText(selected.detail!);
        if (action === 'Fetch content' || action === 'Copy markdown') {
          const page = await runGetPage({ id: selected.id }, 'sidebar');
          if (action === 'Copy markdown') {
            await vscode.env.clipboard.writeText(page.bodyMarkdown);
          } else {
            const doc = await vscode.workspace.openTextDocument({ content: `# ${page.title}\n\n${page.bodyMarkdown}`, language: 'markdown' });
            await vscode.window.showTextDocument(doc, { preview: true });
          }
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    }),
  );

  const lm = (vscode as any).lm;
  if (lm?.registerTool) {
    context.subscriptions.push(
      lm.registerTool('confluence.search', async (options: any, token: vscode.CancellationToken) => {
        const controller = new AbortController();
        token.onCancellationRequested(() => controller.abort());
        return runSearch(options.input ?? {}, options.session?.id ?? 'tool');
      }),
      lm.registerTool('confluence.getPage', async (options: any) => runGetPage(options.input ?? {}, options.session?.id ?? 'tool')),
      lm.registerTool('confluence.getPageByUrl', async (options: any) => {
        const client = await getClient();
        const id = client.parsePageIdFromUrl(options.input?.url ?? '');
        if (!id) throw new Error('Could not determine pageId from URL.');
        return runGetPage({ id }, options.session?.id ?? 'tool');
      }),
    );
  }

  if ((vscode as any).chat?.createChatParticipant) {
    const participant = (vscode as any).chat.createChatParticipant('confluence.chat', async (request: any, chatContext: any, stream: any) => {
      const cmd = request.command;
      if (cmd === 'help') {
        stream.markdown('Use /search <query> or /page <id>.');
        return;
      }
      if (cmd === 'search') {
        const out = await runSearch({ query: request.prompt }, chatContext.sessionId ?? 'chat');
        stream.markdown(out.results.map((r: any) => `- [${r.title}](${r.url})`).join('\n') || 'No results.');
      }
      if (cmd === 'page') {
        const out = await runGetPage({ id: request.prompt.trim() }, chatContext.sessionId ?? 'chat');
        stream.markdown(`# ${out.title}\n\n${out.bodyMarkdown}`);
      }
    });
    context.subscriptions.push(participant);
  }
}

export function deactivate(): void {}
