import { describe, expect, it, vi } from "vitest";
import { syncPublicContent } from "../../supabase/functions/_shared/public-content-sync";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("committed content delivery", () => {
  it("does not write a second revision for an atomic publication", async () => {
    const from = vi.fn(() => { throw new Error("Unexpected business write"); });
    const result = await syncPublicContent({ from } as unknown as SupabaseClient, { advanceRevision: false, revision: "committed-version" });
    expect(from).not.toHaveBeenCalled();
    expect(result.cache_invalidation).toMatchObject({ ok: true, revision: "committed-version" });
  });
  it("keeps a committed save acknowledged when revision delivery throws", async () => {
    const from = vi.fn(() => { throw new Error("Fixture unavailable"); });
    const result = await syncPublicContent({ from } as unknown as SupabaseClient);
    expect(from).toHaveBeenCalledOnce();
    expect(result.cache_invalidation.ok).toBe(false);
    expect(result.warnings).toContain("Content was saved; public content synchronization needs retry.");
  });
});
