import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

export function readConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('confluence');
  return {
    baseUrl: cfg.get<string>('baseUrl', ''),
    scopeMode: cfg.get<'allowlist' | 'all'>('scopeMode', 'allowlist'),
    allowedSpaceKeys: cfg.get<string[]>('allowedSpaceKeys', []),
    askBeforeSearch: cfg.get<boolean>('approval.askBeforeSearch', true),
    askBeforeFetch: cfg.get<boolean>('approval.askBeforeFetch', true),
    maxResults: Math.max(1, Math.min(50, cfg.get<number>('limits.maxResults', 20))),
    maxPages: Math.max(1, cfg.get<number>('limits.maxPages', 3)),
    maxChars: Math.max(1000, cfg.get<number>('limits.maxChars', 12000)),
    maxToolCalls: Math.max(1, cfg.get<number>('limits.maxToolCalls', 8)),
    cacheEnabled: cfg.get<boolean>('cache.enabled', true),
    cacheTtlSeconds: Math.max(1, cfg.get<number>('cache.ttlSeconds', 300)),
  };
}
