export function resolveFurnitureDisplay<T extends { slug: string; sourceUrl: string }>(product: T, language: "en" | "zh"): T;
