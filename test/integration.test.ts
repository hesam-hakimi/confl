import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import { ConfluenceClient } from '../src/confluenceClient';
import { buildSearchCql } from '../src/cql';

let server: http.Server;
let baseUrl = '';

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.headers.authorization !== 'Bearer good-token') {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: 'unauthorized' }));
      return;
    }
    if (req.url?.startsWith('/wiki/rest/api/content/search')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: Array.from({ length: 50 }).map((_, i) => ({ id: String(i + 1), title: `Title ${i + 1}`, space: { key: 'ENG' }, _links: { base: baseUrl, webui: `/pages/${i + 1}` } })) }));
      return;
    }
    if (req.url?.startsWith('/wiki/rest/api/content/123')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ id: '123', title: 'Doc', space: { key: 'ENG' }, body: { view: { value: '<p>Hello</p>' } }, history: { lastUpdated: { when: '2025-01-01' } }, _links: { base: baseUrl, webui: '/pages/123' } }));
      return;
    }
    if (req.url?.startsWith('/wiki/rest/api/content?limit=1')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: [] }));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('failed to bind');
  baseUrl = `http://127.0.0.1:${addr.port}/wiki`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('integration', () => {
  it('successful search + getPage', async () => {
    const client = new ConfluenceClient(baseUrl, 'good-token');
    await client.testConnection();
    const results = await client.search({ cql: 'type=page', limit: 80, start: 0 });
    expect(results.length).toBe(50);
    const page = await client.getPage('123');
    expect(page.id).toBe('123');
  });

  it('401 invalid token', async () => {
    const client = new ConfluenceClient(baseUrl, 'bad-token');
    await expect(client.testConnection()).rejects.toThrow('401');
  });

  it('allowlist filtering enforced', () => {
    const cfg: any = { scopeMode: 'allowlist', allowedSpaceKeys: ['ENG'] };
    const cql = buildSearchCql({ query: 'runbook', spaces: ['ENG', 'HR'] }, cfg);
    expect(cql).toContain('"ENG"');
    expect(cql).not.toContain('"HR"');
  });

  it('result cap at 50', async () => {
    const client = new ConfluenceClient(baseUrl, 'good-token');
    const results = await client.search({ cql: 'type=page', limit: 200, start: 0 });
    expect(results.length).toBe(50);
  });
});
