# Confluence Copilot Tools (VS Code Extension)

Integrates **Confluence Data Center / Server** REST API into GitHub Copilot Chat agent mode using VS Code Language Model Tools API.

## Features
- Activity Bar container **Confluence** with views for:
  - Connection
  - Scope & Safety
  - Search & Browse
- PAT auth via `Authorization: Bearer <token>`
- PAT stored only in VS Code `SecretStorage`
- Language model tools:
  - `confluence.search`
  - `confluence.getPage`
  - `confluence.getPageByUrl`
- Optional `@confluence` participant with `/search`, `/page`, `/help`
- Caching enabled by default with TTL + clear cache action
- Approval prompts (search/fetch) configurable in settings and sidebar
- HTML page body converted to Markdown with plain-text fallback

## Setup
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Launch extension host from VS Code (`F5`).
4. Open Confluence sidebar and configure:
   - Base URL (`https://confluence.company.com` or `https://confluence.company.com/wiki`)
   - PAT token
   - Scope, approvals, limits, cache

## Settings
- `confluence.baseUrl`
- `confluence.scopeMode` (`allowlist` default)
- `confluence.allowedSpaceKeys`
- `confluence.approval.askBeforeSearch`
- `confluence.approval.askBeforeFetch`
- `confluence.limits.maxResults` (clamped to 50)
- `confluence.limits.maxPages`
- `confluence.limits.maxChars`
- `confluence.limits.maxToolCalls`
- `confluence.cache.enabled`
- `confluence.cache.ttlSeconds`

## Troubleshooting
- **401/403**: verify PAT validity and permissions.
- **No results in allowlist mode**: add at least one allowed space key.
- **Tool not available**: ensure your VS Code build supports language model tools APIs.

## Security
- PAT is never written to settings, output logs, or telemetry.
- PAT is persisted only in VS Code SecretStorage.
- Attachments are intentionally out of scope.
