import type { GrowthExportClient, GrowthSourceRow } from "./types.ts";

const BASE_FIELDS = "id,created_at,status,project_type,location,source_path";
const FIRST_TOUCH = "first_touch_source,first_touch_medium,first_touch_campaign,first_touch_term,first_touch_content";
const LAST_TOUCH = "last_touch_source,last_touch_medium,last_touch_campaign,last_touch_term,last_touch_content";
const OUTCOME_FIELDS = "gclid,gbraid,wbraid,landing_page,lead_quality,qualified_at";
const ATTRIBUTION_FIELDS = `${BASE_FIELDS},${FIRST_TOUCH},${LAST_TOUCH},${OUTCOME_FIELDS}` as const;
const LEAD_FIELDS = `${ATTRIBUTION_FIELDS},source,deal_value` as const;
const QUOTE_FIELDS = `${ATTRIBUTION_FIELDS},quoted_amount` as const;

async function fetchRows(
  client: GrowthExportClient,
  table: "leads" | "quote_requests",
  startIso: string,
  endIso: string,
  limit: number,
): Promise<GrowthSourceRow[]> {
  const query = table === "leads"
    ? client.from("leads").select(LEAD_FIELDS)
    : client.from("quote_requests").select(QUOTE_FIELDS);
  const { data, error } = await query
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export const fetchGrowthLeadRows = (
  client: GrowthExportClient,
  startIso: string,
  endIso: string,
  limit: number,
) => fetchRows(client, "leads", startIso, endIso, limit);

export const fetchGrowthQuoteRows = (
  client: GrowthExportClient,
  startIso: string,
  endIso: string,
  limit: number,
) => fetchRows(client, "quote_requests", startIso, endIso, limit);

export async function insertGrowthExportAudit(
  client: GrowthExportClient,
  actorId: string | null,
  metadata: Record<string, unknown>,
) {
  const { error } = await client.from("system_event_logs").insert({
    event_type: "managed_growth_export",
    severity: "info",
    source: "managed_growth",
    actor_id: actorId,
    message: "Growth export completed.",
    metadata,
  });
  if (error) throw new Error("Growth export audit could not be recorded");
}
