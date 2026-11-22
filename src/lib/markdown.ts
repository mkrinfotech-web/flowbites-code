/**
 * Dependency-free markdown renderer for CMS pages and blog posts.
 * Safe for server and client use. All input is HTML-escaped first, so raw
 * HTML can never pass through; only the tags emitted below are produced.
 */
import { PRODUCT_SHORTCODE_LINE, productCardPlaceholder } from "@/lib/blog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Accepts only absolute http(s) URLs or site-relative `/path` URLs (operates on escaped text). */
function safeUrl(url: string, httpsOnly = false): string | null {
  if (/&quot;|&#39;|&lt;|&gt;|[\s\\\u0000-\u001f]/.test(url)) return null;
  if (httpsOnly ? /^https:\/\//i.test(url) : /^https?:\/\//i.test(url)) return url;
  if (/^\/(?!\/)/.test(url)) return url;
  return null;
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function inline(text: string): string {
  const stash: string[] = [];
  const hold = (html: string) => `\u0000${stash.push(html) - 1}\u0000`;

  let out = text.replace(/`([^`]+)`/g, (_, code: string) => hold(`<code>${code}</code>`));

  out = out.replace(/!?\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, url: string) => {
    const isImage = m.startsWith("!");
    const href = safeUrl(url);
    if (!href) return label;
    if (isImage) return hold(`<a href="${href}" rel="noopener noreferrer">${label}</a>`);
    return hold(`<a href="${href}" rel="noopener noreferrer">${emphasis(label)}</a>`);
  });

  out = emphasis(out);
  // Restore stashed fragments (links may themselves have been stashed inside code-free text).
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => stash[Number(i)] ?? "");
}

function emphasis(text: string): string {
  return text
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, "<em>$1</em>");
}

export type RenderMarkdownOptions = {
  /** Render `#` as h1 (CMS pages that have no separate page title). Default: `#` becomes h2. */
  allowH1?: boolean;
};

export function renderMarkdown(md: string, options: RenderMarkdownOptions = {}): string {
  // Strip NULs (used internally as placeholders) then escape everything.
  const lines = escapeHtml((md ?? "").replace(/\u0000/g, "").replace(/\r\n?/g, "\n")).split("\n");
  const out: string[] = [];
  let i = 0;

  const isBlockStart = (line: string) =>
    /^#{1,4}\s+/.test(line) ||
    /^```/.test(line) ||
    /^&gt;/.test(line) ||
    /^[-*+]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(line) ||
    PRODUCT_SHORTCODE_LINE.test(line) ||
    IMAGE_LINE.test(line);

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (/^```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trimEnd())) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence (or EOF)
      out.push(`<pre><code>${code.join("\n")}</code></pre>`);
      continue;
    }

    // Product shortcode
    const sc = PRODUCT_SHORTCODE_LINE.exec(line.trim());
    if (sc) {
      out.push(productCardPlaceholder(sc[1]));
      i++;
      continue;
    }

    // Headings: # and ## both render as h2 unless allowH1 (page supplies the only h1)
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = options.allowH1 ? h[1].length : Math.max(2, h[1].length);
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push("<hr />");
      i++;
      continue;
    }

    // Standalone image -> figure
    const img = IMAGE_LINE.exec(line.trim());
    if (img) {
      const src = safeUrl(img[2], false);
      if (src && (/^https:\/\//i.test(src) || src.startsWith("/"))) {
        out.push(
          `<figure><img src="${src}" alt="${img[1]}" loading="lazy" /><figcaption>${img[1]}</figcaption></figure>`,
        );
      } else {
        out.push(`<p>${img[1]}</p>`);
      }
      i++;
      continue;
    }

    // Blockquote
    if (/^&gt;/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^&gt;/.test(lines[i].trimEnd())) {
        quote.push(lines[i].trimEnd().replace(/^&gt;\s?/, ""));
        i++;
      }
      const paras = quote.join("\n").split(/\n{2,}|\n(?=\s*$)/).map((p) => p.trim()).filter(Boolean);
      out.push(`<blockquote>${paras.map((p) => `<p>${inline(p.replace(/\n/g, " "))}</p>`).join("")}</blockquote>`);
      continue;
    }

    // Lists
    const ul = /^[-*+]\s+/.test(line);
    if (ul || /^\d+\.\s+/.test(line)) {
      const re = ul ? /^[-*+]\s+/ : /^\d+\.\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i].trimEnd())) {
        items.push(`<li>${inline(lines[i].trimEnd().replace(re, ""))}</li>`);
        i++;
      }
      const tag = ul ? "ul" : "ol";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // Paragraph
    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i].trimEnd())) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}
