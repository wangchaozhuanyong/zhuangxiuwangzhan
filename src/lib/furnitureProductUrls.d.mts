export function decodeFurnitureSlug(slug: string | undefined): string | undefined;
export function resolveFurnitureSourceSlug(slug: string | undefined): string | undefined;
export function furnitureProductPathForSlug(slug: string, language?: "en" | "zh" | "ms"): string;
export function getLegacyFurnitureProductRedirectPath(pathname: string): string | null;
export function validateFurnitureProductUrlAliases(catalogSlugs: string[], managedSlugs: string[]): void;
