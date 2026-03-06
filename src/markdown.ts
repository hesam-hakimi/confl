import TurndownService from 'turndown';

const turndown = new TurndownService();

export function htmlToMarkdownOrText(html: string): string {
  try {
    return turndown.turndown(html);
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export function truncate(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: `${text.slice(0, maxChars)}\n\n...[truncated]`, truncated: true };
}
