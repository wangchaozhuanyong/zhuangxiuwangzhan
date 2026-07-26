import { fetchGrowthLeadRows, fetchGrowthQuoteRows } from "./repository.ts";
import type {
  GrowthExportClient,
  GrowthExportRequest,
  GrowthExportResult,
  GrowthExportRow,
  GrowthSourceRow,
} from "./types.ts";

const MAX_WINDOW_DAYS = 90;
const DEFAULT_WINDOW_DAYS = 30;
const MAX_ROWS_PER_TABLE = 1000;
const QUALITY_VALUES = new Set(["unclassified", "high", "medium", "low", "spam"]);

const clean = (value: unknown, max = 240) => String(value ?? "").trim().slice(0, max);

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hashId = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const dateAtStart = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dateAtEnd = (value: string) => new Date(`${value}T23:59:59.999Z`);

export const resolveGrowthExportWindow = (input: GrowthExportRequest, now = new Date()) => {
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStartDate = new Date(now);
  defaultStartDate.setUTCDate(defaultStartDate.getUTCDate() - (DEFAULT_WINDOW_DAYS - 1));
  const startDate = clean(input.startDate || defaultStartDate.toISOString().slice(0, 10), 10);
  const endDate = clean(input.endDate || defaultEnd, 10);
  const start = dateAtStart(startDate);
  const end = dateAtEnd(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error("Invalid growth export date range");
  }
  const windowDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (windowDays > MAX_WINDOW_DAYS) throw new Error(`Growth export window cannot exceed ${MAX_WINDOW_DAYS} days`);

  const limit = Math.min(MAX_ROWS_PER_TABLE, Math.max(1, Math.trunc(Number(input.limit || MAX_ROWS_PER_TABLE))));
  return {
    startDate,
    endDate,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    windowDays,
    limit,
  };
};

const normalizeQuality = (value: unknown): GrowthExportRow["lead_quality"] => {
  const quality = clean(value, 20);
  return QUALITY_VALUES.has(quality) ? (quality as GrowthExportRow["lead_quality"]) : "unclassified";
};

const normalizeProjectType = (value: unknown) => {
  const text = clean(value, 120).toLowerCase();
  const categories: Array<[string, RegExp]> = [
    ["residential_renovation", /residential|home|house|condo|apartment|住宅|住家|公寓|排屋/],
    ["commercial_renovation", /commercial|office|shop|retail|商业|办公室|店铺/],
    ["kitchen_renovation", /kitchen|cabinet|厨房|橱柜/],
    ["bathroom_renovation", /bathroom|toilet|浴室|厕所/],
    ["interior_design", /interior|design|室内设计/],
  ];
  return categories.find(([, pattern]) => pattern.test(text))?.[0] || "other_or_unclassified";
};

const normalizeLocationRegion = (value: unknown) => {
  const text = clean(value, 200).toLowerCase();
  if (/kuala lumpur|(^|\W)kl(\W|$)|吉隆坡/.test(text)) return "kuala_lumpur";
  if (/selangor|雪兰莪|雪州/.test(text)) return "selangor";
  if (/klang valley|巴生谷/.test(text)) return "klang_valley";
  return "other_or_unclassified";
};

const safeLandingPage = (value: unknown) => {
  const raw = clean(value, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://flashcast.com.my");
    if (!["flashcast.com.my", "www.flashcast.com.my"].includes(url.hostname)) return "";
    return clean(url.pathname, 400);
  } catch {
    return "";
  }
};

export async function sanitizeGrowthRow(
  row: GrowthSourceRow,
  recordType: GrowthExportRow["record_type"],
): Promise<GrowthExportRow> {
  const quality = normalizeQuality(row.lead_quality);
  return {
    id_hash: await hashId(`${recordType}:${clean(row.id, 80)}`),
    record_type: recordType,
    created_at: clean(row.created_at, 40),
    status: clean(row.status, 80),
    lead_quality: quality,
    qualified_at: clean(row.qualified_at, 40),
    qualified: quality === "high" || quality === "medium",
    project_type: normalizeProjectType(row.project_type),
    location_region: normalizeLocationRegion(row.location),
    first_touch_source: clean(row.first_touch_source || row.source, 120),
    first_touch_medium: clean(row.first_touch_medium, 120),
    first_touch_campaign: clean(row.first_touch_campaign),
    first_touch_term: clean(row.first_touch_term),
    first_touch_content: clean(row.first_touch_content),
    last_touch_source: clean(row.last_touch_source || row.first_touch_source || row.source, 120),
    last_touch_medium: clean(row.last_touch_medium || row.first_touch_medium, 120),
    last_touch_campaign: clean(row.last_touch_campaign || row.first_touch_campaign),
    last_touch_term: clean(row.last_touch_term || row.first_touch_term),
    last_touch_content: clean(row.last_touch_content || row.first_touch_content),
    gclid: clean(row.gclid, 300),
    gbraid: clean(row.gbraid, 300),
    wbraid: clean(row.wbraid, 300),
    landing_page: safeLandingPage(row.landing_page || row.source_path),
    value_myr: parseNumber(recordType === "lead" ? row.deal_value : row.quoted_amount),
  };
}

export async function buildGrowthExportRows(
  leads: GrowthSourceRow[],
  quotes: GrowthSourceRow[],
): Promise<GrowthExportRow[]> {
  return Promise.all([
    ...leads.map((row) => sanitizeGrowthRow(row, "lead")),
    ...quotes.map((row) => sanitizeGrowthRow(row, "quote")),
  ]);
}

export async function exportGrowthData(
  input: GrowthExportRequest,
  client: GrowthExportClient,
): Promise<GrowthExportResult> {
  let window;
  try {
    window = resolveGrowthExportWindow(input);
  } catch (error) {
    return { status: 400, body: { ok: false, error: error instanceof Error ? error.message : "Invalid date range" } };
  }

  const [leadRows, quoteRows] = await Promise.all([
    fetchGrowthLeadRows(client, window.startIso, window.endIso, window.limit),
    fetchGrowthQuoteRows(client, window.startIso, window.endIso, window.limit),
  ]);
  const records = await buildGrowthExportRows(leadRows, quoteRows);
  const qualified = records.filter((row) => row.qualified);
  const qualityCounts = records.reduce<Record<string, number>>((counts, row) => {
    counts[row.lead_quality] = (counts[row.lead_quality] || 0) + 1;
    return counts;
  }, {});

  return {
    body: {
      ok: true,
      generated_at: new Date().toISOString(),
      window: {
        start_date: window.startDate,
        end_date: window.endDate,
        days: window.windowDays,
      },
      summary: {
        total_records: records.length,
        lead_records: leadRows.length,
        quote_records: quoteRows.length,
        qualified_records: qualified.length,
        quality_counts: qualityCounts,
      },
      records,
      privacy: {
        pii_included: false,
        excluded_fields: ["name", "phone", "email", "message", "project_details", "exact_location"],
      },
    },
  };
}
