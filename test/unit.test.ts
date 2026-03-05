import { describe, expect, it } from 'vitest';
import { ConfluenceClient } from '../src/confluenceClient';
import { buildSearchCql } from '../src/cql';
import { truncate } from '../src/markdown';
import { TtlCache } from '../src/cache';

describe('normalizeBaseUrl', () => {
  it('keeps host root', () => {
    expect(ConfluenceClient.normalizeBaseUrl('https://confluence.company.com/')).toBe('https://confluence.company.com');
  });
  it('keeps context path', () => {
    expect(ConfluenceClient.normalizeBaseUrl('https://confluence.company.com/wiki/')).toBe('https://confluence.company.com/wiki');
  });
});

describe('CQL builder', () => {
  const cfg: any = { scopeMode: 'allowlist', allowedSpaceKeys: ['ENG', 'DOCS'] };
  it('enforces allowlist', () => {
    const cql = buildSearchCql({ query: 'deploy', spaces: ['ENG', 'SECRET'] }, cfg);
    expect(cql).toContain('space in ("ENG")');
    expect(cql).not.toContain('SECRET');
  });
});

describe('truncate', () => {
  it('truncates text at max', () => {
    const out = truncate('abcdef', 3);
    expect(out.truncated).toBe(true);
    expect(out.text).toContain('abc');
  });
});

describe('cache ttl', () => {
  it('expires values', async () => {
    const cache = new TtlCache<string>(20);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
    await new Promise((r) => setTimeout(r, 30));
    expect(cache.get('k')).toBeUndefined();
  });
});
