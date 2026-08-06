const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "b",
  "caption",
  "code",
  "col",
  "colgroup",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);
const URI_ATTRS = new Set(["href", "src"]);

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeUrl(value: string) {
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (!trimmed) return false;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed);
}

function sanitizeAttrs(attrs: string) {
  const safeAttrs: string[] = [];
  const attrPattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(attrs))) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if (name.startsWith("on") || name === "style" || name === "srcdoc") continue;
    if (!["alt", "aria-label", "class", "colspan", "height", "href", "rel", "rowspan", "src", "target", "title", "width"].includes(name)) continue;
    if (URI_ATTRS.has(name) && !isSafeUrl(value)) continue;

    safeAttrs.push(`${name}="${escapeHtml(value)}"`);
  }

  const hasTargetBlank = safeAttrs.some((attr) => attr === 'target="_blank"');
  const hasRel = safeAttrs.some((attr) => attr.startsWith("rel="));
  if (hasTargetBlank && !hasRel) safeAttrs.push('rel="noopener noreferrer"');

  return safeAttrs.length ? ` ${safeAttrs.join(" ")}` : "";
}

export function sanitizeHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[^>]*\/?\s*>/gi, "")
    .replace(/<\s*\/?\s*([a-zA-Z0-9-]+)([^>]*)>/g, (fullTag, rawName, attrs) => {
      const name = String(rawName).toLowerCase();
      const isClosing = /^<\s*\//.test(fullTag);
      if (!ALLOWED_TAGS.has(name)) return "";
      if (isClosing) return VOID_TAGS.has(name) ? "" : `</${name}>`;
      return `<${name}${sanitizeAttrs(String(attrs || ""))}${VOID_TAGS.has(name) ? " />" : ">"}`;
    });
}
