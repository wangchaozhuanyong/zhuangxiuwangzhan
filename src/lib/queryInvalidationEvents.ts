export const QUERY_INVALIDATION_EVENT = "flashcast-query-invalidation";
export type QueryInvalidationNotice = { resources: string[]; published: boolean; settings: boolean };
export const notifyQueryInvalidation = (notice: QueryInvalidationNotice) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(QUERY_INVALIDATION_EVENT, { detail: notice }));
};
export const parseQueryInvalidationNotice = (value: unknown): QueryInvalidationNotice | null => {
  if (!value || typeof value !== "object") return null;
  const notice = value as QueryInvalidationNotice;
  if (!Array.isArray(notice.resources) || notice.resources.length > 32 || notice.resources.some((item) => typeof item !== "string" || !/^[a-z_-]{1,50}$/.test(item))) return null;
  return { resources: notice.resources, published: notice.published === true, settings: notice.settings === true };
};
