function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToMarkdownOrText(html: string): string {
  try {
    let out = html;
    out = out.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    out = out.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    out = out.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    out = out.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    out = out.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    out = out.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    out = out.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    out = out.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    out = out.replace(/<br\s*\/?\s*>/gi, '\n');
    out = out.replace(/<\/p>/gi, '\n\n');
    out = out.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    out = out.replace(/<\/ul>/gi, '\n');
    out = out.replace(/<[^>]+>/g, ' ');
    out = decodeEntities(out).replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return out;
  } catch {
    return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  }
}

export function truncate(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: `${text.slice(0, maxChars)}\n\n...[truncated]`, truncated: true };
}
