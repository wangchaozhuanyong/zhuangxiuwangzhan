const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "blockquote",
  "code",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  div: new Set(["class"]),
  span: new Set(["class"]),
  p: new Set(["class"]),
  ul: new Set(["class"]),
  ol: new Set(["class"]),
  li: new Set(["class"]),
  table: new Set(["class"]),
  thead: new Set(["class"]),
  tbody: new Set(["class"]),
  tr: new Set(["class"]),
  th: new Set(["class", "colspan", "rowspan"]),
  td: new Set(["class", "colspan", "rowspan"]),
  pre: new Set(["class"]),
  code: new Set(["class"]),
  blockquote: new Set(["class"]),
  h2: new Set(["class"]),
  h3: new Set(["class"]),
  h4: new Set(["class"]),
};

const isSafeUrl = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:")) return false;
  return true;
};

const cleanNode = (node: Node) => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) return;
      const children = Array.from(el.childNodes);
      for (const child of children) parent.insertBefore(child, el);
      parent.removeChild(el);
      return;
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const allowedForTag = ALLOWED_ATTRS[tag] || new Set<string>();

      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === "style") {
        el.removeAttribute(attr.name);
        continue;
      }

      if (!allowedForTag.has(name)) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (tag === "a" && name === "href") {
        if (!isSafeUrl(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }

    if (tag === "a") {
      const target = el.getAttribute("target");
      if (target === "_blank") {
        el.setAttribute("rel", "noreferrer noopener");
      }
    }
  }

  for (const child of Array.from(node.childNodes)) cleanNode(child);
};

export const sanitizeHtml = (raw: string) => {
  if (typeof raw !== "string" || !raw.trim()) return "";
  if (typeof window === "undefined") return raw;
  if (typeof document === "undefined") return raw;

  const container = document.createElement("div");
  container.innerHTML = raw;
  cleanNode(container);
  return container.innerHTML;
};

