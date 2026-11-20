export const PUBLIC_SEO_BRAND = "FLASH CAST";

export function normalizePublicSeoTitle(title) {
  return title.replace(
    /(^|[|｜]\s*)FLASH\s+CAST\s+SDN\.?\s+BHD\.?\s*$/i,
    (_, prefix) => prefix + PUBLIC_SEO_BRAND,
  );
}

export function formatPublicSeoTitle(title, brand = PUBLIC_SEO_BRAND, aliases = []) {
  const normalized = normalizePublicSeoTitle(title);
  const lowerTitle = normalized.toLowerCase();
  if ([brand, ...aliases].some((name) => name && lowerTitle.includes(name.toLowerCase()))) {
    return normalized;
  }
  return `${normalized} | ${brand}`;
}
