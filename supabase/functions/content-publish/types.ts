type ContentPublishQueryResult<T = unknown> = {
  data: T;
  error: { message: string } | null;
};

type ContentPublishQueryBuilder = PromiseLike<ContentPublishQueryResult<unknown[]>> & {
  select: (columns?: string) => ContentPublishQueryBuilder;
  eq: (field: string, value: unknown) => ContentPublishQueryBuilder;
  maybeSingle: () => Promise<ContentPublishQueryResult<unknown | null>>;
  single: () => Promise<ContentPublishQueryResult<unknown>>;
  insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => ContentPublishQueryBuilder;
  update: (payload: Record<string, unknown>) => ContentPublishQueryBuilder;
};

export type ContentPublishClient = {
  from: (table: string) => ContentPublishQueryBuilder;
};

export type ContentPublishMode = "dry-run" | "publish";
export type ContentPublishType = "service" | "homepage";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentPublishRequest = {
  contentType?: ContentPublishType;
  mode?: ContentPublishMode;
  record?: Record<string, unknown>;
  nextStatus?: ContentStatus;
  expectedUpdatedAt?: string | null;
  ownerApproved?: boolean;
  explicitExecution?: boolean;
  approvalId?: string;
  source?: string;
};

export type ServiceRow = Record<string, unknown> & {
  id?: string;
  slug?: string;
  updated_at?: string | null;
  status?: ContentStatus | null;
};

export type ContentRow = Record<string, unknown> & {
  id?: string;
  updated_at?: string | null;
  status?: ContentStatus | null;
};

export type ContentPublishResult = {
  status?: number;
  body: Record<string, unknown>;
};
