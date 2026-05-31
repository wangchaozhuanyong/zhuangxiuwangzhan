export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const toRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

export const toArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const toText = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};
