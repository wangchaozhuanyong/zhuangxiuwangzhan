// PostgreSQL timestamptz has microsecond precision. JavaScript Date alone drops
// the final three digits, which is too weak for a one-time optimistic lock.
export const pgEpochMicros = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return null;
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) return null;
  const micros = Number((match[2] || "").padEnd(6, "0")) % 1000;
  return millis * 1000 + micros;
};

export const samePgTimestamp = (left: unknown, right: unknown) => {
  const a = pgEpochMicros(left);
  const b = pgEpochMicros(right);
  return a !== null && b !== null && a === b;
};
