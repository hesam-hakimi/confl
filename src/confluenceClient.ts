import { SearchResultItem } from './types';

type FetchLike = typeof fetch;

interface SearchArgs {
  cql: string;
  limit: number;
  start: number;
}

export class ConfluenceClient {
  constructor(private readonly baseUrl: string, private readonly token: string, private readonly fetchImpl: FetchLike = fetch) {}

  static normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
  }

  apiUrl(path: string): string {
    return `${ConfluenceClient.normalizeBaseUrl(this.baseUrl)}/rest/api${path}`;
  }

  private async request(path: string, signal?: AbortSignal): Promise<any> {
    const response = await this.fetchImpl(this.apiUrl(path), {
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error(`Confluence API error ${response.status}`);
    return response.json();
  }

  async testConnection(): Promise<void> {
    await this.request('/content?limit=1');
  }

  async search(args: SearchArgs): Promise<SearchResultItem[]> {
    const params = new URLSearchParams({ cql: args.cql, limit: String(Math.min(50, args.limit)), start: String(args.start) });
    const data = await this.request(`/content/search?${params.toString()}`);
    return (data.results ?? []).map((r: any) => ({
      id: String(r.id),
      title: r.title ?? '',
      spaceKey: r.space?.key ?? '',
      lastUpdated: r.history?.lastUpdated?.when,
      url: this.buildAbsoluteUrl(r._links),
      excerpt: r.excerpt ?? '',
    }));
  }

  async getPage(id: string): Promise<any> {
    return this.request(`/content/${id}?expand=body.view,space,version,history.lastUpdated`);
  }

  buildAbsoluteUrl(links: any): string {
    if (links?.base && links?.webui) return `${links.base}${links.webui}`;
    if (links?.webui) return `${ConfluenceClient.normalizeBaseUrl(this.baseUrl)}${links.webui}`;
    return ConfluenceClient.normalizeBaseUrl(this.baseUrl);
  }

  parsePageIdFromUrl(url: string): string | undefined {
    const match = url.match(/[?&]pageId=(\d+)/);
    return match?.[1];
  }
}
