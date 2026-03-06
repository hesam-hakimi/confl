import * as vscode from 'vscode';

export class ApprovalService {
  constructor(private readonly workspaceState: vscode.Memento) {}

  async shouldAllow(action: 'search' | 'fetch', requirePrompt: boolean): Promise<boolean> {
    const key = `confluence.approval.always.${action}`;
    if (this.workspaceState.get<boolean>(key)) return true;
    if (!requirePrompt) return true;

    const choice = await vscode.window.showWarningMessage(
      `Allow Confluence tool to ${action}?`,
      'Allow once',
      'Always allow for workspace',
      'Deny',
    );

    if (choice === 'Always allow for workspace') {
      await this.workspaceState.update(key, true);
      return true;
    }
    return choice === 'Allow once';
  }
}

export class ToolCallLimiter {
  private readonly calls = new Map<string, number>();

  use(sessionId: string, maxCalls: number): void {
    const used = (this.calls.get(sessionId) ?? 0) + 1;
    if (used > maxCalls) throw new Error(`Tool call limit reached (${maxCalls}) for this session.`);
    this.calls.set(sessionId, used);
  }
}
