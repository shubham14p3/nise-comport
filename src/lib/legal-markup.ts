/**
 * Tiny, safe markup for the policy pages so they can be edited in Admin → Legal pages.
 *   text before the first "## " = introduction box
 *   ## Heading        → numbered section        ### Sub heading
 *   - item            → bullet list              blank line → new paragraph
 *   **bold**   [label](/path or https://…)   {{site}} {{domain}} {{email}} {{phone}} {{address}} {{date}}
 */
export type LegalInline = { text: string; bold?: boolean; href?: string };
export type LegalBlock = { kind: "p"; lines: LegalInline[][] } | { kind: "h3"; text: string } | { kind: "ul"; items: LegalInline[][] };
export type LegalDoc = { intro: LegalBlock[]; sections: { id: string; title: string; blocks: LegalBlock[] }[] };

export type LegalValues = { site: string; domain: string; email: string; phone: string; address: string; date: string };

export function fillPlaceholders(text: string, values: LegalValues) {
  return text.replace(/\{\{\s*(site|domain|email|phone|address|date)\s*\}\}/g, (_, key: keyof LegalValues) => values[key]);
}

function safeHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https:\/\//i.test(href) || /^mailto:[^\s]+$/i.test(href) || /^tel:[+\d\s-]+$/i.test(href)) return href;
  return undefined;
}

export function parseInline(text: string): LegalInline[] {
  const out: LegalInline[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?:^|(?<=\s))([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) out.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) out.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) { const href = safeHref(match[3]); out.push(href ? { text: match[2], href } : { text: match[2] }); }
    else out.push({ text: match[4], href: `mailto:${match[4]}` });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

function blocksFrom(lines: string[]): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let para: string[] = []; let list: string[] = [];
  const flushPara = () => { if (para.length) blocks.push({ kind: "p", lines: para.map(parseInline) }); para = []; };
  const flushList = () => { if (list.length) blocks.push({ kind: "ul", items: list.map(parseInline) }); list = []; };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if (line.startsWith("### ")) { flushPara(); flushList(); blocks.push({ kind: "h3", text: line.slice(4).trim() }); continue; }
    if (/^[-*] /.test(line)) { flushPara(); list.push(line.slice(2).trim()); continue; }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList();
  return blocks;
}

export function slugifyHeading(title: string, used: Set<string>) {
  const base = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
  let id = base; let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

export function parseLegal(source: string, values: LegalValues): LegalDoc {
  const lines = fillPlaceholders(source.replace(/\r\n?/g, "\n"), values).split("\n");
  const intro: string[] = []; const sections: { title: string; lines: string[] }[] = [];
  for (const line of lines) {
    if (line.startsWith("## ")) sections.push({ title: line.slice(3).trim(), lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
    else intro.push(line);
  }
  const used = new Set<string>();
  return { intro: blocksFrom(intro), sections: sections.map((section) => ({ id: slugifyHeading(section.title, used), title: section.title, blocks: blocksFrom(section.lines) })) };
}
