/** Preserve explicit Malay edits in editors that construct a field allowlist. */
export function malayFieldsPatch(record: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key.endsWith("_ms")));
}
