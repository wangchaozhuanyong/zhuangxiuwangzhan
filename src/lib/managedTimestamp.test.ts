import { describe, expect, it } from "vitest";
import { samePgTimestamp } from "../../supabase/functions/content-publish/managed-timestamp.ts";

describe("managed CMS microsecond optimistic lock", () => {
  it("accepts the same instant across UTC formats but rejects a one-microsecond drift", () => {
    expect(samePgTimestamp("2026-08-30T10:55:12.151465+00:00", "2026-08-30T10:55:12.151465Z")).toBe(true);
    expect(samePgTimestamp("2026-08-30T10:55:12.151465+00:00", "2026-08-30T10:55:12.151466+00:00")).toBe(false);
    expect(samePgTimestamp("invalid", "invalid")).toBe(false);
  });
});
