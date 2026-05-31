import type { Language } from "@/i18n/routes";

const knownProjectTypes = new Set([
  "Residential Renovation",
  "Commercial / Office Fit-Out",
  "Custom Built-In Furniture",
  "Kitchen Cabinet",
  "Shop Renovation",
  "Office Renovation",
  "Warehouse & Shelving",
  "Exterior Works",
  "Artistic Wall / Coating",
  "Others",
]);

const serviceSlugProjectType: Record<string, string> = {
  renovation: "Residential Renovation",
  design: "Residential Renovation",
  builtin: "Custom Built-In Furniture",
  kitchen: "Kitchen Cabinet",
  bathroom: "Residential Renovation",
  office: "Office Renovation",
  shoplot: "Shop Renovation",
  "shop-renovation": "Shop Renovation",
  "artistic-coating": "Artistic Wall / Coating",
  "old-house": "Residential Renovation",
  approval: "Others",
  warehouse: "Warehouse & Shelving",
  exterior: "Exterior Works",
};

const projectTypeMap: Record<string, string> = {
  residential: "Residential Renovation",
  commercial: "Commercial / Office Fit-Out",
  "built-in": "Custom Built-In Furniture",
  builtin: "Custom Built-In Furniture",
  warehouse: "Warehouse & Shelving",
  exterior: "Exterior Works",
  office: "Office Renovation",
  shop: "Shop Renovation",
  shoplot: "Shop Renovation",
};

export type QuoteSource = "service" | "project" | "material" | "services" | "projects" | "materials" | "floating" | "general";

export interface QuoteContextInput {
  source?: QuoteSource | string;
  title?: string;
  projectType?: string;
  location?: string;
  details?: string;
}

export interface ParsedQuoteContext {
  source: string;
  title: string;
  projectType: string;
  location: string;
  details: string;
}

const clean = (value?: string | null) => String(value || "").trim();

const validProjectType = (value?: string | null) => {
  const text = clean(value);
  return knownProjectTypes.has(text) ? text : "";
};

export const quoteProjectTypeFromServiceSlug = (slug?: string, fallbackTitle?: string) => {
  const key = clean(slug).toLowerCase();
  if (serviceSlugProjectType[key]) return serviceSlugProjectType[key];

  const title = clean(fallbackTitle).toLowerCase();
  if (title.includes("kitchen")) return "Kitchen Cabinet";
  if (title.includes("office")) return "Office Renovation";
  if (title.includes("shop")) return "Shop Renovation";
  if (title.includes("built")) return "Custom Built-In Furniture";
  if (title.includes("warehouse")) return "Warehouse & Shelving";
  if (title.includes("exterior")) return "Exterior Works";
  if (title.includes("coating") || title.includes("wall")) return "Artistic Wall / Coating";
  return "Residential Renovation";
};

export const quoteProjectTypeFromProjectType = (projectType?: string) => {
  const key = clean(projectType).toLowerCase();
  return projectTypeMap[key] || validProjectType(projectType) || "Others";
};

export const buildQuotePath = (context: QuoteContextInput = {}) => {
  const params = new URLSearchParams();
  if (context.source) params.set("source", clean(context.source));
  if (context.title) params.set("title", clean(context.title));
  if (context.projectType) params.set("projectType", clean(context.projectType));
  if (context.location) params.set("location", clean(context.location));
  if (context.details) params.set("details", clean(context.details));
  const query = params.toString();
  return query ? `/quote?${query}` : "/quote";
};

const sourceLabel = (source: string, language: Language) => {
  const labels: Record<string, Record<Language, string>> = {
    service: { en: "service", zh: "服务" },
    project: { en: "project reference", zh: "案例" },
    material: { en: "material", zh: "材料" },
    services: { en: "service page", zh: "服务页" },
    projects: { en: "project page", zh: "案例页" },
    materials: { en: "material library", zh: "材料库" },
  };
  return labels[source]?.[language] || (language === "zh" ? "官网页面" : "website page");
};

const defaultDetails = (source: string, title: string, language: Language) => {
  if (!title) return "";
  if (source === "project") {
    return language === "zh" ? `我想做类似案例：${title}。` : `I am interested in a similar project: ${title}.`;
  }
  if (source === "material") {
    return language === "zh" ? `我想咨询这种材料：${title}。` : `I would like to ask about this material: ${title}.`;
  }
  return language === "zh" ? `我想咨询：${title}。` : `I would like to ask about: ${title}.`;
};

export const parseQuoteContext = (params: URLSearchParams, language: Language): ParsedQuoteContext => {
  const source = clean(params.get("source"));
  const title = clean(params.get("title"));
  const projectType = validProjectType(params.get("projectType"));
  const location = clean(params.get("location"));
  const details = clean(params.get("details")) || defaultDetails(source, title, language);

  return {
    source,
    title,
    projectType,
    location,
    details,
  };
};

export const formatQuoteContextLabel = (context: ParsedQuoteContext, language: Language) => {
  if (!context.source && !context.title) return "";
  const from = sourceLabel(context.source, language);
  if (!context.title) return language === "zh" ? `已带入来源：${from}` : `Source captured: ${from}`;
  return language === "zh" ? `已带入${from}：${context.title}` : `Prepared from ${from}: ${context.title}`;
};
