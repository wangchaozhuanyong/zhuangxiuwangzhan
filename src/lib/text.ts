export const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const splitContentParagraphs = (value = "") =>
  value
    .replace(/<\/p\s*>/gi, "\n\n")
    .split(/\n\s*\n/);

// Preserve CMS paragraph boundaries while returning text for React to escape.
export const plainTextParagraphs = (value = "") =>
  splitContentParagraphs(value)
    .map((paragraph) => stripHtml(paragraph))
    .filter(Boolean);

export const isHtmlText = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);
