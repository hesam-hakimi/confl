export type ScopeMode = 'allowlist' | 'all';

export interface ExtensionConfig {
  baseUrl: string;
  scopeMode: ScopeMode;
  allowedSpaceKeys: string[];
  askBeforeSearch: boolean;
  askBeforeFetch: boolean;
  maxResults: number;
  maxPages: number;
  maxChars: number;
  maxToolCalls: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  spaceKey: string;
  lastUpdated?: string;
  url: string;
  excerpt?: string;
}
