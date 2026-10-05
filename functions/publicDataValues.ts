export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

export const readString = (record: Record<string, unknown> | null | undefined, field: string) => {
  const value = record?.[field];
  return typeof value === "string" ? value : "";
};

export const readRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];
