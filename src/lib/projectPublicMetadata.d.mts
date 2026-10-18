export const conceptMetadataSlugs: readonly string[];
export function projectPublicMetadata(row: Record<string, unknown>, language: "en" | "zh" | "ms"): { title: string; description: string } | undefined;
