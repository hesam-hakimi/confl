type Thenable<T> = Promise<T>;
declare module 'vscode' {
  export interface Disposable { dispose(): void }
  export interface Memento { get<T>(key: string): T | undefined; update(key: string, value: any): Thenable<void> }
  export interface SecretStorage { get(key: string): Thenable<string | undefined>; store(key: string, value: string): Thenable<void>; delete(key: string): Thenable<void> }
  export interface ExtensionContext { secrets: SecretStorage; workspaceState: Memento; subscriptions: Disposable[] }
  export interface CancellationToken { onCancellationRequested(listener: () => any): Disposable }
  export interface Webview { html: string; options: { enableScripts?: boolean }; postMessage(message: any): Thenable<boolean>; onDidReceiveMessage(listener: (e: any) => any): Disposable }
  export interface WebviewView { webview: Webview }
  export interface WebviewViewProvider { resolveWebviewView(view: WebviewView): void }
  export interface TextDocument {}
  export interface QuickPickItem { label: string; description?: string; detail?: string }
  export const window: {
    showInformationMessage(message: string): Thenable<any>;
    showErrorMessage(message: string): Thenable<any>;
    showWarningMessage(message: string, ...items: string[]): Thenable<string | undefined>;
    showQuickPick<T extends QuickPickItem | string>(items: readonly T[] | Thenable<readonly T[]>, options?: any): Thenable<T | undefined>;
    showTextDocument(doc: TextDocument, options?: any): Thenable<any>;
    registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider): Disposable;
  };
  export const workspace: {
    getConfiguration(section?: string): { get<T>(key: string, defaultValue?: T): T; update(key: string, value: any, target?: any): Thenable<void> };
    openTextDocument(options: { content: string; language: string }): Thenable<TextDocument>;
  };
  export const env: { openExternal(uri: Uri): Thenable<boolean>; clipboard: { writeText(text: string): Thenable<void> } };
  export class Uri { static parse(value: string): Uri }
  export const commands: { executeCommand(command: string, ...args: any[]): Thenable<any>; registerCommand(command: string, callback: (...args: any[]) => any): Disposable };
  export const ConfigurationTarget: { Workspace: any };
}
