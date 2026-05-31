import type { Language } from "@/i18n/routes";

export type AdminLeadListKind = "leads" | "quote_requests";
export type AdminWorkflowFilter = "all" | "today" | "due_followups" | "stale24" | "to_quote";

type WorkflowCopy = Record<AdminWorkflowFilter, { label: string; help: string }>;

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

const workflowCopy: Record<AdminLeadListKind, Record<Language, WorkflowCopy>> = {
  leads: {
    en: {
      all: { label: "All Leads", help: "Show all contact enquiries." },
      today: { label: "Today", help: "Enquiries submitted today." },
      due_followups: { label: "Follow-up Due", help: "Enquiries with a due follow-up time." },
      stale24: { label: "24h Unhandled", help: "New enquiries older than 24 hours." },
      to_quote: { label: "Ready to Quote", help: "Contacted or site-visit leads that may need a quote." },
    },
    zh: {
      all: { label: "全部咨询", help: "查看所有联系咨询。" },
      today: { label: "今日新增", help: "今天提交到后台的咨询。" },
      due_followups: { label: "待跟进", help: "已经到下次跟进时间的咨询。" },
      stale24: { label: "24小时未处理", help: "超过 24 小时仍是新咨询的记录。" },
      to_quote: { label: "可转报价", help: "已联系或已安排上门、可能需要报价的咨询。" },
    },
  },
  quote_requests: {
    en: {
      all: { label: "All Quotes", help: "Show all quote requests." },
      today: { label: "Today", help: "Quote requests submitted today." },
      due_followups: { label: "Follow-up Due", help: "Quote requests with a due follow-up time." },
      stale24: { label: "24h Unhandled", help: "Pending or contacted quote requests older than 24 hours." },
      to_quote: { label: "To Quote", help: "Requests that still need quote preparation or reply." },
    },
    zh: {
      all: { label: "全部报价", help: "查看所有报价请求。" },
      today: { label: "今日新增", help: "今天提交到后台的报价请求。" },
      due_followups: { label: "待跟进", help: "已经到下次跟进时间的报价请求。" },
      stale24: { label: "24小时未处理", help: "超过 24 小时仍待处理的报价请求。" },
      to_quote: { label: "待报价", help: "还需要整理报价或回复客户的请求。" },
    },
  },
};

const staleLeadStatuses = new Set(["new"]);
const staleQuoteStatuses = new Set(["pending", "contacted"]);

export const getAdminWorkflowOptions = (kind: AdminLeadListKind, language: Language): AdminWorkflowOption[] =>
  workflowOrder[kind].map((value) => ({
    value,
    ...workflowCopy[kind][language][value],
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
      label: language === "zh" ? "跟进已到期" : "Follow-up due",
      variant: "destructive",
    });
  } else if (row.next_follow_up_at) {
    badges.push({
      label: language === "zh" ? "已安排跟进" : "Follow-up scheduled",
      variant: "secondary",
    });
  }

  const stale = kind === "leads" ? isAdminStaleLead(row, now) : isAdminStaleQuote(row, now);
  if (stale) {
    badges.push({
      label: language === "zh" ? "超过24小时未处理" : "Unhandled over 24h",
      variant: "destructive",
    });
  }

  return badges;
};
