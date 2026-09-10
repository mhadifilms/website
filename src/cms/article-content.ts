export function readingMinutes(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));
}
export function articleHeadings(html: string) {
  const headings: { id: string; title: string }[] = [];
  const content = html.replace(
    /<h([234])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (_all, level, attrs, body) => {
      const id = `section-${headings.length + 1}`;
      const title = body
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      headings.push({ id, title });
      return `<h${level}${attrs.replace(/\s+id="[^"]*"/g, "")} id="${id}">${body}</h${level}>`;
    },
  );
  return { content, headings };
}
