type GrowthQueryResult = {
  data?: unknown;
  error?: unknown;
};

type GrowthQuery = PromiseLike<GrowthQueryResult> & {
  select: (...args: unknown[]) => GrowthQuery;
  gte: (...args: unknown[]) => GrowthQuery;
  lte: (...args: unknown[]) => GrowthQuery;
  order: (...args: unknown[]) => GrowthQuery;
  limit: (...args: unknown[]) => GrowthQuery;
};

export type GrowthExportClient = {
  from: (table: string) => GrowthQuery;
};

export type GrowthExportRequest = {
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type GrowthSourceRow = Record<string, unknown> & {
  id?: string;
  created_at?: string | null;
  status?: string | null;
  project_type?: string | null;
  location?: string | null;
  source?: string | null;
  source_path?: string | null;
  first_touch_source?: string | null;
  first_touch_medium?: string | null;
  first_touch_campaign?: string | null;
  first_touch_term?: string | null;
  first_touch_content?: string | null;
  last_touch_source?: string | null;
  last_touch_medium?: string | null;
  last_touch_campaign?: string | null;
  last_touch_term?: string | null;
  last_touch_content?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  landing_page?: string | null;
  lead_quality?: string | null;
  qualified_at?: string | null;
  deal_value?: number | string | null;
  quoted_amount?: number | string | null;
};

export type GrowthExportRow = {
  id_hash: string;
  record_type: "lead" | "quote";
  created_at: string;
  status: string;
  lead_quality: "unclassified" | "high" | "medium" | "low" | "spam";
  qualified_at: string;
  qualified: boolean;
  project_type: string;
  location_region: string;
  first_touch_source: string;
  first_touch_medium: string;
  first_touch_campaign: string;
  first_touch_term: string;
  first_touch_content: string;
  last_touch_source: string;
  last_touch_medium: string;
  last_touch_campaign: string;
  last_touch_term: string;
  last_touch_content: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  landing_page: string;
  value_myr: number | null;
};

export type GrowthExportResult = {
  status?: number;
  body: Record<string, unknown>;
};
