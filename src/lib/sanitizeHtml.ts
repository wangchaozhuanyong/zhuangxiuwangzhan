import { optimizeContentImageSrc } from "@/lib/imageUrl";

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
  "img",
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
  img: new Set(["src", "alt", "width", "height", "loading", "decoding"]),
};

const isSafeUrl = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:")) return false;
  return true;
};

const replaceElementTag = (el: HTMLElement, tagName: string) => {
  const parent = el.parentNode;
  if (!parent) return null;

  const replacement = document.createElement(tagName);
  for (const attr of Array.from(el.attributes)) {
    replacement.setAttribute(attr.name, attr.value);
  }
  while (el.firstChild) replacement.appendChild(el.firstChild);
  parent.replaceChild(replacement, el);
  return replacement;
};

const cleanNode = (node: Node) => {
  let currentNode = node;

  if (node.nodeType === Node.ELEMENT_NODE) {
    let el = node as HTMLElement;
    let tag = el.tagName.toLowerCase();

    if (tag === "h1") {
      const replacement = replaceElementTag(el, "h2");
      if (replacement) {
        el = replacement;
        currentNode = replacement;
        tag = "h2";
      }
    }

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) return;
      const children = Array.from(el.childNodes);
      for (const child of children) parent.insertBefore(child, el);
      parent.removeChild(el);
      for (const child of children) cleanNode(child);
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

      if ((tag === "a" && name === "href") || (tag === "img" && name === "src")) {
        if (!isSafeUrl(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }

    if (tag === "img") {
      const src = el.getAttribute("src");
      if (src && isSafeUrl(src)) {
        el.setAttribute("src", optimizeContentImageSrc(src));
        if (!el.getAttribute("loading")) el.setAttribute("loading", "lazy");
        if (!el.getAttribute("decoding")) el.setAttribute("decoding", "async");
      } else {
        el.remove();
        return;
      }
    }

    if (tag === "a") {
      const target = el.getAttribute("target");
      if (target === "_blank") {
        el.setAttribute("rel", "noreferrer noopener");
      }
    }
  }

  for (const child of Array.from(currentNode.childNodes)) cleanNode(child);
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
