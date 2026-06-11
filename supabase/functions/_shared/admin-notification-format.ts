export type LeadNotificationType = "contact" | "quote";

export const DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE = "Asia/Kuala_Lumpur";

const FIELD_LABELS: Record<string, string> = {
  name: "姓名",
  phone: "电话",
  email: "邮箱",
  message: "留言内容",
  customer_name: "姓名",
  customer_phone: "电话",
  customer_email: "邮箱",
  project_type: "项目类型",
  location: "所在地区",
  property_size: "房屋面积",
  estimated_budget: "预算",
  quoted_amount: "报价金额",
  valid_until: "报价有效期",
  source_path: "来源页面",
  project_details: "项目详情",
  status: "状态",
  notes: "备注",
};

const NOTIFICATION_TITLES: Record<LeadNotificationType, string> = {
  contact: "新客户咨询",
  quote: "新报价请求",
};

const CONTACT_FIELDS = [
  "name",
  "phone",
  "email",
  "project_type",
  "location",
  "source_path",
  "message",
  "status",
  "notes",
];

const QUOTE_FIELDS = [
  "customer_name",
  "customer_phone",
  "customer_email",
  "project_type",
  "location",
  "property_size",
  "estimated_budget",
  "source_path",
  "project_details",
  "status",
  "notes",
];

const STATUS_LABELS: Record<string, string> = {
  new: "新线索",
  pending: "待处理",
  contacted: "已联系",
  site_visit_scheduled: "已安排上门",
  quoted: "已报价",
  accepted: "已接受",
  rejected: "已拒绝",
  converted: "已成交",
  closed: "已关闭",
  spam: "垃圾线索",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  "Residential Renovation": "住宅装修",
  "Commercial / Office Fit-Out": "商业 / 办公室装修",
  "Custom Built-In Furniture": "定制内嵌家具",
  "Kitchen Cabinet": "厨房橱柜",
  Kitchen: "厨房橱柜",
  Bathroom: "浴室装修",
  Office: "办公室装修",
  "Shop Renovation": "店铺装修",
  "Artistic Wall Coating (Remmers)": "艺术墙面涂装（Remmers）",
  "Exterior / Shopfront Works": "外墙 / 门面工程",
  "Warehouse & Shelving": "仓库与货架工程",
  Other: "其他",
};

const BUDGET_LABELS: Record<string, string> = {
  "Below RM 30,000": "RM 30,000 以下",
  "RM 30,000 - RM 60,000": "RM 30,000 - RM 60,000",
  "RM 60,000 - RM 100,000": "RM 60,000 - RM 100,000",
  "RM 100,000 - RM 200,000": "RM 100,000 - RM 200,000",
  "Above RM 200,000": "RM 200,000 以上",
  "Not sure yet": "暂时不确定",
};

const TRAILING_TEST_TRACE_PATTERN = /\s+\d{13,}-[a-z0-9]{4,20}$/i;

const readDate = (value?: string | number | Date | null): Date | null => {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const readPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
  parts.find((part) => part.type === type)?.value || "";

export const formatAdminDateTime = (
  value?: string | number | Date | null,
  timeZone = DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE,
): string => {
  const date = readDate(value);
  if (!date) return "-";

  try {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);

    const year = readPart(parts, "year");
    const month = Number(readPart(parts, "month"));
    const day = Number(readPart(parts, "day"));
    const hour = readPart(parts, "hour").padStart(2, "0");
    const minute = readPart(parts, "minute").padStart(2, "0");
    const second = readPart(parts, "second").padStart(2, "0");

    return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
  } catch {
    if (timeZone !== DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE) {
      return formatAdminDateTime(date, DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE);
    }
    return "-";
  }
};

export const formatAdminDate = (
  value?: string | number | Date | null,
  timeZone = DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE,
): string => {
  const date = readDate(value);
  if (!date) return "-";

  try {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);

    return `${readPart(parts, "year")}年${Number(readPart(parts, "month"))}月${Number(readPart(parts, "day"))}日`;
  } catch {
    if (timeZone !== DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE) {
      return formatAdminDate(date, DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE);
    }
    return "-";
  }
};

export const cleanNotificationValue = (value: unknown, options: { multiline?: boolean } = {}): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((item) => cleanNotificationValue(item)).filter(Boolean).join(", ");

  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  const withoutTrace = raw.replace(TRAILING_TEST_TRACE_PATTERN, "").trim();

  if (options.multiline) {
    return withoutTrace
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  return withoutTrace.replace(/\s+/g, " ").trim();
};

const translateSystemValue = (key: string, value: string) => {
  if (key === "status") return STATUS_LABELS[value] || value;
  if (key === "project_type") return PROJECT_TYPE_LABELS[value] || value;
  if (key === "estimated_budget") return BUDGET_LABELS[value] || value;
  if (key === "valid_until") return formatAdminDate(value);
  return value;
};

const formatFieldValue = (key: string, value: unknown) => {
  const cleaned = cleanNotificationValue(value, { multiline: key === "message" || key === "project_details" || key === "notes" });
  if (!cleaned) return "";
  return translateSystemValue(key, cleaned);
};

const formatLeadLines = (type: LeadNotificationType, data: Record<string, unknown>) => {
  const fields = type === "quote" ? QUOTE_FIELDS : CONTACT_FIELDS;
  return fields
    .map((key) => {
      const value = formatFieldValue(key, data[key]);
      if (!value) return "";
      return `${FIELD_LABELS[key] || key}：${value}`;
    })
    .filter(Boolean);
};

const truncateText = (text: string, limit = 3800) =>
  text.length <= limit ? text : `${text.slice(0, limit - 20)}\n\n[消息已截断]`;

export const buildLeadTelegramMessage = (
  type: LeadNotificationType,
  data: Record<string, unknown>,
  timeZone = DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE,
) => {
  const submittedAt = data.created_at || data.inserted_at || new Date();
  const lines = [
    "FLASH CAST",
    NOTIFICATION_TITLES[type],
    "",
    `提交时间：${formatAdminDateTime(submittedAt as string | Date, timeZone)}`,
    ...formatLeadLines(type, data),
  ];

  return truncateText(lines.join("\n"));
};

export const buildTelegramTestMessage = (
  value: string | number | Date = new Date(),
  timeZone = DEFAULT_ADMIN_NOTIFICATION_TIME_ZONE,
) =>
  [
    "FLASH CAST 测试通知",
    "Telegram 推送已连接成功。",
    `时间：${formatAdminDateTime(value, timeZone)}`,
  ].join("\n");
