export const PUBLIC_SEO_BRAND: string;
export function normalizePublicSeoTitle(title: string): string;
export function formatPublicSeoTitle(
  title: string,
  brand?: string,
  aliases?: readonly (string | null | undefined)[],
): string;
