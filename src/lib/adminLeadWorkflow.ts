import { adminLeadWorkflowBadgeText, adminLeadWorkflowText } from "@/i18n/adminLeadWorkflowText";
import type { Language } from "@/i18n/routes";

export type AdminLeadListKind = "leads" | "quote_requests";
export type AdminWorkflowFilter = "all" | "today" | "due_followups" | "stale24" | "to_quote";

export type AdminWorkflowOption = {
  value: AdminWorkflowFilter;
  label: string;
  help: string;
};

export type AdminWorkflowBadge = {
  label: string;
  variant: "secondary" | "destructive" | "outline";
};

const workflowOrder: Record<AdminLeadListKind, AdminWorkflowFilter[]> = {
  leads: ["all", "today", "due_followups", "stale24", "to_quote"],
  quote_requests: ["all", "today", "due_followups", "stale24", "to_quote"],
};

const staleLeadStatuses = new Set(["new"]);
const staleQuoteStatuses = new Set(["pending", "contacted"]);

export const getAdminWorkflowOptions = (kind: AdminLeadListKind, language: Language): AdminWorkflowOption[] =>
  workflowOrder[kind].map((value) => ({
    value,
    ...adminLeadWorkflowText[kind][language][value],
  }));

export const normalizeAdminWorkflowFilter = (
  value: string | null | undefined,
  kind: AdminLeadListKind,
): AdminWorkflowFilter => {
  const allowed = workflowOrder[kind];
  return allowed.includes(value as AdminWorkflowFilter) ? (value as AdminWorkflowFilter) : "all";
};

export const buildAdminWorkflowHref = (
  basePath: string,
  options: { status?: string; filter?: AdminWorkflowFilter } = {},
) => {
  const params = new URLSearchParams();
  if (options.status && options.status !== "all") params.set("status", options.status);
  if (options.filter && options.filter !== "all") params.set("filter", options.filter);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const adminDayStartIso = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
};

export const adminSince24hIso = (now = new Date()) => new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

const readTime = (value: unknown) => {
  if (!value) return null;
  const time = new Date(String(value)).getTime();
  return Number.isNaN(time) ? null : time;
};

export const isAdminFollowUpDue = (value: unknown, now = new Date()) => {
  const time = readTime(value);
  return time !== null && time <= now.getTime();
};

export const isAdminStaleLead = (row: Record<string, unknown>, now = new Date()) => {
  const createdAt = readTime(row.created_at);
  const status = String(row.status || "new");
  return createdAt !== null && staleLeadStatuses.has(status) && createdAt < now.getTime() - 24 * 60 * 60 * 1000;
};

export const isAdminStaleQuote = (row: Record<string, unknown>, now = new Date()) => {
  const createdAt = readTime(row.created_at);
  const status = String(row.status || "pending");
  return createdAt !== null && staleQuoteStatuses.has(status) && createdAt < now.getTime() - 24 * 60 * 60 * 1000;
};

export const getAdminWorkflowBadges = (
  kind: AdminLeadListKind,
  row: Record<string, unknown>,
  language: Language,
  now = new Date(),
): AdminWorkflowBadge[] => {
  const badges: AdminWorkflowBadge[] = [];

  if (isAdminFollowUpDue(row.next_follow_up_at, now)) {
    badges.push({
      label: adminLeadWorkflowBadgeText[language].due,
      variant: "destructive",
    });
  } else if (row.next_follow_up_at) {
    badges.push({
      label: adminLeadWorkflowBadgeText[language].scheduled,
      variant: "secondary",
    });
  }

  const stale = kind === "leads" ? isAdminStaleLead(row, now) : isAdminStaleQuote(row, now);
  if (stale) {
    badges.push({
      label: adminLeadWorkflowBadgeText[language].stale,
      variant: "destructive",
    });
  }

  return badges;
};
