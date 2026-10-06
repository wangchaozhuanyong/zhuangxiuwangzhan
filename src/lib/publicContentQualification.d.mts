export type PublicContentKind = "project" | "blog" | "material" | "service_area" | "landing_page" | "service" | "site_page" | "cms_page";
export type PublicSourceTable = "projects" | "blog_posts" | "materials" | "service_areas" | "landing_pages" | "services" | "site_pages" | "cms_pages";
export const sourceKinds: Readonly<Record<PublicSourceTable, PublicContentKind>>;
export const sourceFields: Readonly<Record<PublicSourceTable, string>>;
export const knownSourceTemplates: Partial<Readonly<Record<PublicSourceTable, ReadonlySet<string>>>>;
export function qualifiesLocale(row: Record<string, unknown>, kind: PublicContentKind, language: "en" | "zh"): boolean;
export function currentSourcePath(row: Record<string, unknown>, kind: PublicContentKind): string | null;
export function serializeSourcePath(path: string): string;
export function pickPublicSourceOwners(rows: Partial<Record<PublicSourceTable, Record<string, unknown>[]>>): Map<string, { row: Record<string, unknown>; kind: PublicContentKind }>;
