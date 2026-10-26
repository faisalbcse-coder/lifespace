/**
 * Rich-text helpers for the notes editor (WYSIWYG).
 * Notes are stored as sanitized HTML. Legacy notes (plain markdown) are converted on load.
 */
import { renderMarkdown } from "@/lib/markdown";

const ALLOWED_TAGS = new Set([
  "P", "BR", "DIV", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6",
  "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL", "SUB", "SUP", "MARK",
  "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "CODE", "HR", "A", "FONT",
  "TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "INPUT",
]);

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "text-align", "font-size", "font-weight",
  "font-style", "text-decoration", "text-decoration-line", "list-style-type", "margin-left",
]);

const SAFE_STYLE_VALUE = /^[#a-z0-9\s.,%()-]+$/i;

const HTML_MARKER = /<(p|div|h[1-6]|ul|ol|blockquote|pre|hr|br|span|strong|em|u|table)[\s>/]/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_MARKER.test(value);
}

function cleanStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.split(":"))
    .filter(([k, v]) => k && v)
    .map(([k, ...rest]) => [k.trim().toLowerCase(), rest.join(":").trim()] as const)
    .filter(([k, v]) => ALLOWED_STYLE_PROPS.has(k) && SAFE_STYLE_VALUE.test(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

export function normalizeLists(root: Element) {
  // 1. Unwrap any wrapper <div> or <blockquote> that contains a list (OL or UL)
  // and has no direct text of its own.
  const wrappers = Array.from(root.querySelectorAll("div, blockquote"));
  for (const w of wrappers) {
    const list = w.querySelector("ul, ol");
    if (list) {
      const clone = w.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("ul, ol").forEach((el) => el.remove());
      if (!clone.textContent?.trim()) {
        w.replaceWith(...Array.from(w.childNodes));
      }
    }
  }

  // 2. Iterate direct children of root to repair separated lists / sublists
  let child = root.firstElementChild;
  while (child) {
    if (child.tagName === "OL") {
      let next = child.nextElementSibling;

      // Skip empty whitespace paragraphs or divs if between lists
      while (next && (next.tagName === "P" || next.tagName === "DIV") && !next.textContent?.trim() && !next.querySelector("img, input, hr")) {
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }

      // If next is a UL, it is a sublist under the last LI of this OL
      if (next && next.tagName === "UL") {
        const lastLi = child.lastElementChild;
        if (lastLi && lastLi.tagName === "LI") {
          lastLi.appendChild(next);
          next = child.nextElementSibling;
        }
      }

      // Skip empty whitespace paragraphs or divs again
      while (next && (next.tagName === "P" || next.tagName === "DIV") && !next.textContent?.trim() && !next.querySelector("img, input, hr")) {
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }

      // If next is another OL, merge its items into this OL
      while (next && next.tagName === "OL") {
        const nextOl = next;
        next = nextOl.nextElementSibling;

        while (nextOl.firstChild) {
          child.appendChild(nextOl.firstChild);
        }
        nextOl.remove();

        // Check if there is another sublist after this merged OL
        if (next && next.tagName === "UL") {
          const lastLi = child.lastElementChild;
          if (lastLi && lastLi.tagName === "LI") {
            lastLi.appendChild(next);
            next = child.nextElementSibling;
          }
        }
      }
    }
    child = child.nextElementSibling;
  }
}

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // drop dangerous containers entirely, unwrap everything else
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|FORM|LINK|META)$/i.test(child.tagName)) {
          child.remove();
        } else {
          walk(child);
          child.replaceWith(...Array.from(child.childNodes));
        }
        return;
      }
      const tag = child.tagName;
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const keep =
          (name === "style") ||
          (tag === "A" && name === "href") ||
          (tag === "FONT" && (name === "color" || name === "size")) ||
          (tag === "INPUT" && (name === "type" || name === "checked")) ||
          (tag === "LI" && (name === "data-checked" || name === "value")) ||
          (tag === "OL" && (name === "start" || name === "type")) ||
          (name === "data-task");
        if (!keep) child.removeAttribute(attr.name);
      });
      if (tag === "INPUT" && child.getAttribute("type") !== "checkbox") {
        child.remove();
        return;
      }
      const style = child.getAttribute("style");
      if (style !== null) {
        const cleaned = cleanStyle(style);
        if (cleaned) child.setAttribute("style", cleaned);
        else child.removeAttribute("style");
      }
      if (tag === "A") {
        const href = (child.getAttribute("href") || "").trim();
        if (/^(https?:\/\/|mailto:)/i.test(href)) {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer nofollow");
        } else {
          child.removeAttribute("href");
        }
      }
      walk(child);
    });
  };
  walk(doc.body);
  normalizeLists(doc.body);
  return doc.body.innerHTML;
}

/** Convert stored note content (markdown or HTML) into safe HTML for editing/display. */
export function notesToHtml(content: string | null | undefined): string {
  if (!content || !content.trim()) return "";
  if (looksLikeHtml(content)) return sanitizeHtml(content);
  return sanitizeHtml(renderMarkdown(content));
}

export function isHtmlEmpty(html: string): boolean {
  if (typeof DOMParser === "undefined") return !html.trim();
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const hasMedia = !!doc.body.querySelector("hr,input,table");
  return !hasMedia && !(doc.body.textContent || "").trim();
}
