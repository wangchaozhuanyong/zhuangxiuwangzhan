import type { GrowthExportClient, GrowthSourceRow } from "./types.ts";

const LEAD_FIELDS = [
  "id",
  "created_at",
  "status",
  "project_type",
  "location",
  "source",
  "source_path",
  "first_touch_source",
  "first_touch_medium",
  "first_touch_campaign",
  "first_touch_term",
  "first_touch_content",
  "last_touch_source",
  "last_touch_medium",
  "last_touch_campaign",
  "last_touch_term",
  "last_touch_content",
  "gclid",
  "gbraid",
  "wbraid",
  "landing_page",
  "lead_quality",
  "qualified_at",
  "deal_value",
].join(",");

const QUOTE_FIELDS = [
  "id",
  "created_at",
  "status",
  "project_type",
  "location",
  "source_path",
  "first_touch_source",
  "first_touch_medium",
  "first_touch_campaign",
  "first_touch_term",
  "first_touch_content",
  "last_touch_source",
  "last_touch_medium",
  "last_touch_campaign",
  "last_touch_term",
  "last_touch_content",
  "gclid",
  "gbraid",
  "wbraid",
  "landing_page",
  "lead_quality",
  "qualified_at",
  "quoted_amount",
].join(",");

async function fetchRows(
  client: GrowthExportClient,
  table: "leads" | "quote_requests",
  fields: string,
  startIso: string,
  endIso: string,
  limit: number,
): Promise<GrowthSourceRow[]> {
  const { data, error } = await client
    .from(table)
    .select(fields)
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as GrowthSourceRow[];
}

export const fetchGrowthLeadRows = (
  client: GrowthExportClient,
  startIso: string,
  endIso: string,
  limit: number,
) => fetchRows(client, "leads", LEAD_FIELDS, startIso, endIso, limit);

export const fetchGrowthQuoteRows = (
  client: GrowthExportClient,
  startIso: string,
  endIso: string,
  limit: number,
) => fetchRows(client, "quote_requests", QUOTE_FIELDS, startIso, endIso, limit);
