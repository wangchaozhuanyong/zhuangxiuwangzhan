export type MaterialTermField = "category" | "subcategory" | "type" | "color" | "texture";
export type MaterialTerminologyIssue = { field: "category" | "subcategory" | "material_type" | "color" | "texture"; value: string };
export const materialMalayTerms: Record<MaterialTermField, Record<string, string>>;
export const materialChineseSpecifications: Record<"type" | "color" | "texture", Record<string, string>>;
export function reviewedMaterialChineseTerm(field: MaterialTermField, value: unknown): string | undefined;
export function normalizeMaterialTerm(value: unknown): string;
export function reviewedMaterialMalayTerm(field: MaterialTermField, value: unknown): string | undefined;
export function reviewedMaterialMalayText(value: unknown): string | undefined;
export function materialTerminologyIssues(record: Record<string, unknown>): MaterialTerminologyIssue[];
export class MaterialTerminologyError extends Error { issues: MaterialTerminologyIssue[]; constructor(issues: MaterialTerminologyIssue[]); }
export function assertMaterialTerminology(record: Record<string, unknown>): void;
