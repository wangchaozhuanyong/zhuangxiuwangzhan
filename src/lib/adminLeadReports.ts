import type { Language } from "@/i18n/routes";

export type AdminLeadReportPeriod = "30d" | "90d" | "all";

export type LeadReportLeadRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  source?: string | null;
  source_path?: string | null;
  project_type?: string | null;
  location?: string | null;
  deal_value?: number | string | null;
  created_at?: string | null;
};

export type LeadReportQuoteRow = {
  id: string;
  customer_name?: string | null;
  status?: string | null;
  source_path?: string | null;
  project_type?: string | null;
  location?: string | null;
  quoted_amount?: number | string | null;
  created_at?: string | null;
};

export type LeadSourceSummary = {
  key: string;
  label: string;
  sourceType: string;
  sourcePath: string | null;
  leads: number;
  quotes: number;
  total: number;
  contacted: number;
  quoted: number;
  won: number;
  lost: number;
  quotedValue: number;
  wonValue: number;
  quoteRate: number;
  closeRate: number;
};

export type LeadFunnelStage = {
  key: "submitted" | "contacted" | "quoted" | "won";
  label: string;
  count: number;
  rate: number;
};

export type LeadProjectTypeSummary = {
  key: string;
  label: string;
  total: number;
  quotes: number;
  won: number;
  quotedValue: number;
  closeRate: number;
};

export type AdminLeadReport = {
  period: AdminLeadReportPeriod;
  generatedAt: string;
  totals: {
    submitted: number;
    leads: number;
    quotes: number;
    contacted: number;
    quoted: number;
    won: number;
    lost: number;
    quotedValue: number;
    wonValue: number;
    closeRate: number;
  };
  funnel: LeadFunnelStage[];
  sourceRows: LeadSourceSummary[];
  projectTypeRows: LeadProjectTypeSummary[];
};

const sourceLabels: Record<string, Record<Language, string>> = {
  contact: { en: "Contact page", zh: "联系页" },
  quote: { en: "Quote page", zh: "报价页" },
  service: { en: "Service detail", zh: "服务详情" },
  services: { en: "Services list", zh: "服务列表" },
  project: { en: "Project case", zh: "装修案例" },
  projects: { en: "Projects list", zh: "案例列表" },
  material: { en: "Material detail", zh: "材料详情" },
  materials: { en: "Materials list", zh: "材料列表" },
  landing: { en: "Landing page", zh: "落地页" },
  home: { en: "Homepage", zh: "首页" },
  unknown: { en: "Unknown source", zh: "未知来源" },
};

const funnelLabels: Record<LeadFunnelStage["key"], Record<Language, string>> = {
  submitted: { en: "Submitted", zh: "已提交" },
  contacted: { en: "Contacted / Site Visit", zh: "已联系 / 已上门" },
  quoted: { en: "Quoted", zh: "已报价" },
  won: { en: "Won", zh: "已成交" },
};

const leadContactedStatuses = new Set(["contacted", "site_visit_scheduled", "quoted", "converted"]);
const leadQuotedStatuses = new Set(["quoted", "converted"]);
const leadWonStatuses = new Set(["converted"]);
const leadLostStatuses = new Set(["closed", "spam"]);

const quoteContactedStatuses = new Set(["contacted", "site_visit_scheduled", "quoted", "accepted"]);
const quoteQuotedStatuses = new Set(["quoted", "accepted"]);
const quoteWonStatuses = new Set(["accepted"]);
const quoteLostStatuses = new Set(["rejected", "closed"]);

const readNumber = (value: number | string | null | undefined) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const readTime = (value?: string | null) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const periodStartTime = (period: AdminLeadReportPeriod, now: Date) => {
  if (period === "all") return null;
  const days = period === "30d" ? 30 : 90;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
};

export const getAdminLeadReportStartIso = (period: AdminLeadReportPeriod, now = new Date()) => {
  const start = periodStartTime(period, now);
  return start === null ? null : new Date(start).toISOString();
};

export const normalizeAdminLeadReportPeriod = (value: string | null | undefined): AdminLeadReportPeriod => {
  if (value === "30d" || value === "90d" || value === "all") return value;
  return "90d";
};

const inReportPeriod = (createdAt: string | null | undefined, period: AdminLeadReportPeriod, now: Date) => {
  const start = periodStartTime(period, now);
  if (start === null) return true;
  const created = readTime(createdAt);
  return created !== null && created >= start;
};

const inferSourceTypeFromPath = (pathname: string) => {
  const clean = pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
  if (clean === "/") return "home";
  if (clean.startsWith("/quote")) return "quote";
  if (clean.startsWith("/contact")) return "contact";
  if (clean.startsWith("/services/")) return "service";
  if (clean.startsWith("/services")) return "services";
  if (clean.startsWith("/projects/")) return "project";
  if (clean.startsWith("/projects")) return "projects";
  if (clean.startsWith("/materials/")) return "material";
  if (clean.startsWith("/materials")) return "materials";
  if (clean.startsWith("/landing/")) return "landing";
  return "unknown";
};

const sourceTypeLabel = (sourceType: string, language: Language) =>
  sourceLabels[sourceType]?.[language] || sourceLabels.unknown[language];

const readSourceInfo = (
  sourcePath: string | null | undefined,
  fallbackSource: string | null | undefined,
  language: Language,
) => {
  const rawPath = sourcePath || "";
  let sourceType = fallbackSource || "unknown";
  let title = "";
  let pathname = "";

  try {
    const parsed = new URL(rawPath || "/", "https://flashcast.local");
    pathname = parsed.pathname;
    sourceType = parsed.searchParams.get("source") || sourceType || inferSourceTypeFromPath(pathname);
    title = parsed.searchParams.get("title") || "";
    if (!sourceType || sourceType === "unknown") sourceType = inferSourceTypeFromPath(pathname);
  } catch {
    pathname = rawPath.split("?")[0] || "";
  }

  const baseLabel = sourceTypeLabel(sourceType, language);
  const pathLabel = pathname ? pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/" : "";
  const label = title ? `${baseLabel}：${title}` : pathLabel && pathLabel !== "/" ? `${baseLabel} · ${pathLabel}` : baseLabel;
  const key = `${sourceType}:${title || pathLabel || rawPath || "unknown"}`.toLowerCase();

  return {
    key,
    label,
    sourceType,
    sourcePath: rawPath || null,
  };
};

const emptySourceSummary = (source: ReturnType<typeof readSourceInfo>): LeadSourceSummary => ({
  ...source,
  leads: 0,
  quotes: 0,
  total: 0,
  contacted: 0,
  quoted: 0,
  won: 0,
  lost: 0,
  quotedValue: 0,
  wonValue: 0,
  quoteRate: 0,
  closeRate: 0,
});

const finalizeSourceSummary = (row: LeadSourceSummary): LeadSourceSummary => ({
  ...row,
  quoteRate: row.total > 0 ? row.quoted / row.total : 0,
  closeRate: row.total > 0 ? row.won / row.total : 0,
});

export const buildAdminLeadReport = ({
  leads,
  quotes,
  period = "90d",
  language = "zh",
  now = new Date(),
}: {
  leads: LeadReportLeadRow[];
  quotes: LeadReportQuoteRow[];
  period?: AdminLeadReportPeriod;
  language?: Language;
  now?: Date;
}): AdminLeadReport => {
  const filteredLeads = leads.filter((lead) => inReportPeriod(lead.created_at, period, now));
  const filteredQuotes = quotes.filter((quote) => inReportPeriod(quote.created_at, period, now));
  const sourceMap = new Map<string, LeadSourceSummary>();
  const projectTypeMap = new Map<string, LeadProjectTypeSummary>();

  const touchSource = (source: ReturnType<typeof readSourceInfo>) => {
    const existing = sourceMap.get(source.key) || emptySourceSummary(source);
    sourceMap.set(source.key, existing);
    return existing;
  };

  const touchProjectType = (value: string | null | undefined) => {
    const label = value?.trim() || (language === "zh" ? "未填写项目类型" : "No project type");
    const key = label.toLowerCase();
    const existing =
      projectTypeMap.get(key) ||
      {
        key,
        label,
        total: 0,
        quotes: 0,
        won: 0,
        quotedValue: 0,
        closeRate: 0,
      };
    projectTypeMap.set(key, existing);
    return existing;
  };

  const totals = {
    submitted: 0,
    leads: filteredLeads.length,
    quotes: filteredQuotes.length,
    contacted: 0,
    quoted: 0,
    won: 0,
    lost: 0,
    quotedValue: 0,
    wonValue: 0,
    closeRate: 0,
  };

  filteredLeads.forEach((lead) => {
    const status = lead.status || "new";
    const source = touchSource(readSourceInfo(lead.source_path, lead.source, language));
    const projectType = touchProjectType(lead.project_type);
    const dealValue = readNumber(lead.deal_value);

    totals.submitted += 1;
    source.leads += 1;
    source.total += 1;
    projectType.total += 1;

    if (leadContactedStatuses.has(status)) {
      totals.contacted += 1;
      source.contacted += 1;
    }
    if (leadQuotedStatuses.has(status)) {
      totals.quoted += 1;
      source.quoted += 1;
    }
    if (leadWonStatuses.has(status)) {
      totals.won += 1;
      source.won += 1;
      projectType.won += 1;
      totals.wonValue += dealValue;
      source.wonValue += dealValue;
    }
    if (leadLostStatuses.has(status)) {
      totals.lost += 1;
      source.lost += 1;
    }
  });

  filteredQuotes.forEach((quote) => {
    const status = quote.status || "pending";
    const source = touchSource(readSourceInfo(quote.source_path, null, language));
    const projectType = touchProjectType(quote.project_type);
    const quotedAmount = readNumber(quote.quoted_amount);

    totals.submitted += 1;
    totals.quotedValue += quotedAmount;
    source.quotes += 1;
    source.total += 1;
    source.quotedValue += quotedAmount;
    projectType.total += 1;
    projectType.quotes += 1;
    projectType.quotedValue += quotedAmount;

    if (quoteContactedStatuses.has(status)) {
      totals.contacted += 1;
      source.contacted += 1;
    }
    if (quoteQuotedStatuses.has(status)) {
      totals.quoted += 1;
      source.quoted += 1;
    }
    if (quoteWonStatuses.has(status)) {
      totals.won += 1;
      source.won += 1;
      source.wonValue += quotedAmount;
      projectType.won += 1;
      totals.wonValue += quotedAmount;
    }
    if (quoteLostStatuses.has(status)) {
      totals.lost += 1;
      source.lost += 1;
    }
  });

  totals.closeRate = totals.submitted > 0 ? totals.won / totals.submitted : 0;

  const funnel: LeadFunnelStage[] = [
    { key: "submitted", label: funnelLabels.submitted[language], count: totals.submitted, rate: totals.submitted > 0 ? 1 : 0 },
    { key: "contacted", label: funnelLabels.contacted[language], count: totals.contacted, rate: totals.submitted > 0 ? totals.contacted / totals.submitted : 0 },
    { key: "quoted", label: funnelLabels.quoted[language], count: totals.quoted, rate: totals.submitted > 0 ? totals.quoted / totals.submitted : 0 },
    { key: "won", label: funnelLabels.won[language], count: totals.won, rate: totals.submitted > 0 ? totals.won / totals.submitted : 0 },
  ];

  const sourceRows = Array.from(sourceMap.values())
    .map(finalizeSourceSummary)
    .sort((a, b) => b.total - a.total || b.won - a.won || a.label.localeCompare(b.label));

  const projectTypeRows = Array.from(projectTypeMap.values())
    .map((row) => ({ ...row, closeRate: row.total > 0 ? row.won / row.total : 0 }))
    .sort((a, b) => b.total - a.total || b.won - a.won || a.label.localeCompare(b.label));

  return {
    period,
    generatedAt: now.toISOString(),
    totals,
    funnel,
    sourceRows,
    projectTypeRows,
  };
};
