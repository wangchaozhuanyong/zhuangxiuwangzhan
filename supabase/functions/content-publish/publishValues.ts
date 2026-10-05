import type { ContentPublishResult } from "./types.ts";

export const cleanText = (value: unknown, max = 8000) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

export const errorResult = (error: string, status = 400, extra: Record<string, unknown> = {}): ContentPublishResult => ({
  status,
  body: { ok: false, error, ...extra },
});
