import { stripHtml } from "@/lib/text";

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "strong", "em", "br", "a"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "svg", "form"]);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character] || character);

const sameLanguageHref = (value: string, language: "en" | "zh") => {
  if (!value.startsWith(`/${language}/`) || value.includes("\\")) return null;
  try {
    const url = new URL(value, "https://flashcast.com.my");
    if (url.origin !== "https://flashcast.com.my" || !url.pathname.startsWith(`/${language}/`)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

export const sanitizeServiceOverviewHtml = (raw: string, language: "en" | "zh") => {
  if (!raw.trim()) return "";
  if (typeof document === "undefined") return escapeHtml(stripHtml(raw));

  const source = document.createElement("template");
  const output = document.createElement("div");
  source.innerHTML = raw;

  const copySafeNode = (node: Node, parent: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent || ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) return;

    const href = tag === "a" ? sameLanguageHref(element.getAttribute("href") || "", language) : null;
    const safeElement = ALLOWED_TAGS.has(tag) && (tag !== "a" || href)
      ? document.createElement(tag)
      : null;
    if (safeElement && href) safeElement.setAttribute("href", href);

    const destination = safeElement || parent;
    for (const child of Array.from(element.childNodes)) copySafeNode(child, destination);
    if (safeElement) parent.appendChild(safeElement);
  };

  for (const child of Array.from(source.content.childNodes)) copySafeNode(child, output);
  return output.innerHTML;
};
