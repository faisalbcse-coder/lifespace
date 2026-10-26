/**
 * Minimal, dependency-free and XSS-safe markdown renderer used for the note preview.
 * All input is HTML-escaped first; only a small set of constructs is then re-introduced
 * and links are restricted to http(s)/mailto.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  // inline code (protect contents from further formatting)
  const codes: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_m, code) => {
    codes.push(`<code class="md-inline-code">${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  out = out.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, (_m, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow" class="md-link">${label}</a>`;
  });
  // eslint-disable-next-line no-control-regex
  out = out.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)]);
  return out;
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      html.push(
        `<pre class="md-code-block"><code>${escapeHtml(buf.join("\n"))}</code></pre>`
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level} class="md-h${level}">${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeList();
      html.push('<hr class="md-hr" />');
      i++;
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      closeList();
      html.push(`<blockquote class="md-quote">${renderInline(quote[1])}</blockquote>`);
      i++;
      continue;
    }

    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (listType !== type) {
        closeList();
        html.push(`<${type} class="md-list">`);
        listType = type;
      }
      html.push(`<li>${renderInline((ul || ol)![1])}</li>`);
      i++;
      continue;
    }

    if (line.trim() === "") {
      closeList();
      i++;
      continue;
    }

    closeList();
    html.push(`<p class="md-p">${renderInline(line)}</p>`);
    i++;
  }
  closeList();
  return html.join("\n");
}
