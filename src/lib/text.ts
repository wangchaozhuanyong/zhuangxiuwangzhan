export const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isHtmlText = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);
