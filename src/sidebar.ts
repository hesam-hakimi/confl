import * as vscode from 'vscode';
import { readConfig } from './config';

type Message = { type: string; payload?: any };

export class ConfluenceViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext, private readonly viewType: string) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.html();
    view.webview.onDidReceiveMessage(async (msg: Message) => {
      if (msg.type === 'init') {
        const tokenExists = !!(await this.context.secrets.get('confluence.pat'));
        view.webview.postMessage({ type: 'state', payload: { config: readConfig(), tokenExists } });
      }
      if (msg.type === 'saveConnection') {
        await vscode.workspace.getConfiguration('confluence').update('baseUrl', msg.payload.baseUrl, vscode.ConfigurationTarget.Workspace);
        if (msg.payload.token) await this.context.secrets.store('confluence.pat', msg.payload.token);
        vscode.window.showInformationMessage('Confluence connection saved.');
      }
      if (msg.type === 'disconnect') {
        await this.context.secrets.delete('confluence.pat');
        vscode.window.showInformationMessage('Confluence token removed.');
      }
      if (msg.type === 'saveSettings') {
        const cfg = vscode.workspace.getConfiguration('confluence');
        for (const [k, v] of Object.entries(msg.payload)) {
          await cfg.update(k, v, vscode.ConfigurationTarget.Workspace);
        }
      }
      if (msg.type === 'clearCache') {
        vscode.commands.executeCommand('confluence.clearCache');
      }
      if (msg.type === 'testConnection') {
        vscode.commands.executeCommand('confluence.testConnection');
      }
      if (msg.type === 'runSearch') {
        vscode.commands.executeCommand('confluence.searchFromSidebar', msg.payload);
      }
    });
  }

  private html(): string {
    return `<!doctype html><html><body>
      <h3>Confluence</h3>
      <div>
        <h4>Connection</h4>
        <input id="baseUrl" placeholder="Base URL" style="width:100%" />
        <input id="token" type="password" placeholder="PAT" style="width:100%;margin-top:4px" />
        <button onclick="send('saveConnection',{baseUrl:val('baseUrl'),token:val('token')})">Save</button>
        <button onclick="send('testConnection')">Test Connection</button>
        <button onclick="send('disconnect')">Disconnect</button>
      </div>
      <div>
        <h4>Scope & Safety</h4>
        <label>Scope <select id="scopeMode"><option value="allowlist">allowlist</option><option value="all">all</option></select></label>
        <textarea id="spaces" placeholder="Space keys comma-separated" style="width:100%"></textarea>
        <label><input type="checkbox" id="askSearch"/> ask before search</label>
        <label><input type="checkbox" id="askFetch"/> ask before fetch</label>
        <label><input type="checkbox" id="cacheEnabled"/> cache enabled</label>
        <input id="ttl" type="number" placeholder="TTL seconds"/>
        <button onclick="saveSettings()">Save Settings</button>
        <button onclick="send('clearCache')">Clear Cache</button>
      </div>
      <div>
        <h4>Search & Browse</h4>
        <input id="query" placeholder="Query" style="width:100%" />
        <label><input id="advanced" type="checkbox"/> Raw CQL</label>
        <button onclick="runSearch()">Search</button>
      </div>
      <script>
      const vscode = acquireVsCodeApi();
      const val=(id)=>document.getElementById(id).value;
      const send=(type,payload)=>vscode.postMessage({type,payload});
      function saveSettings(){
        send('saveSettings',{
          scopeMode: val('scopeMode'),
          allowedSpaceKeys: val('spaces').split(',').map(s=>s.trim()).filter(Boolean),
          'approval.askBeforeSearch': document.getElementById('askSearch').checked,
          'approval.askBeforeFetch': document.getElementById('askFetch').checked,
          'cache.enabled': document.getElementById('cacheEnabled').checked,
          'cache.ttlSeconds': Number(val('ttl')||300)
        })
      }
      function runSearch(){send('runSearch',{query:val('query'),advanced:document.getElementById('advanced').checked})}
      window.addEventListener('message', (event)=>{
        const s=event.data.payload?.config; if(!s)return;
        document.getElementById('baseUrl').value=s.baseUrl||'';
        document.getElementById('scopeMode').value=s.scopeMode;
        document.getElementById('spaces').value=(s.allowedSpaceKeys||[]).join(',');
        document.getElementById('askSearch').checked=s.askBeforeSearch;
        document.getElementById('askFetch').checked=s.askBeforeFetch;
        document.getElementById('cacheEnabled').checked=s.cacheEnabled;
        document.getElementById('ttl').value=s.cacheTtlSeconds;
      });
      send('init');
      </script>
      </body></html>`;
  }
}
