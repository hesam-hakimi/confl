import { ExtensionConfig } from './types';

function quote(v: string): string {
  return `"${v.replace(/"/g, '\\"')}"`;
}

export function enforceSpaces(requested: string[] | undefined, config: ExtensionConfig): string[] {
  if (config.scopeMode === 'all') return requested ?? [];
  const allow = new Set(config.allowedSpaceKeys.filter(Boolean));
  if (allow.size === 0) return [];
  const effective = requested?.length ? requested.filter((s) => allow.has(s)) : [...allow];
  return [...new Set(effective)];
}

export function buildSearchCql(input: { query?: string; cql?: string; spaces?: string[] }, config: ExtensionConfig): string {
  const spaces = enforceSpaces(input.spaces, config);
  const spaceClause = spaces.length ? ` AND space in (${spaces.map(quote).join(',')})` : config.scopeMode === 'allowlist' ? ' AND space in ("___none___")' : '';

  if (input.cql && input.cql.trim()) {
    const raw = input.cql.trim();
    if (config.scopeMode === 'all') return `${raw} AND status=current`;
    return `${raw}${spaceClause} AND status=current`;
  }

  const query = input.query?.trim();
  if (!query) throw new Error('Either query or cql is required.');
  return `type=page AND (title ~ ${quote(query)} OR text ~ ${quote(query)})${spaceClause} AND status=current ORDER BY lastmodified DESC`;
}
