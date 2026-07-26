type GrowthNotifyQueryResult = {
  data?: Record<string, unknown> | null;
  error?: unknown;
};

type GrowthNotifyQuery = PromiseLike<GrowthNotifyQueryResult> & {
  select: (...args: unknown[]) => GrowthNotifyQuery;
  insert: (...args: unknown[]) => GrowthNotifyQuery;
  eq: (...args: unknown[]) => GrowthNotifyQuery;
  maybeSingle: (...args: unknown[]) => GrowthNotifyQuery;
};

export type GrowthNotifyClient = {
  from: (table: string) => GrowthNotifyQuery;
};

export type GrowthEventType =
  | "system_test"
  | "seo_publish"
  | "negative_keyword"
  | "campaign_pause"
  | "rollback"
  | "execution_failure";

export type GrowthNotifyRequest = {
  eventType?: GrowthEventType;
  changeId?: string;
  title?: string;
  reason?: string;
  evidence?: string[];
  before?: string;
  after?: string;
  reportPath?: string;
  rollbackId?: string;
};

export type GrowthNotifyResult = {
  status?: number;
  body: Record<string, unknown>;
};
