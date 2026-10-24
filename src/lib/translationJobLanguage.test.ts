import { describe, expect, it, vi } from "vitest";
import { fetchTranslationJobs } from "./adminEditorData";

const db = vi.hoisted(() => ({
  job: { id: "malay-job", table_name: "blog_posts", record_id: "draft", status: "failed", target_language: "ms", error_message: "provider unavailable" },
}));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({
  from: (table: string) => ({ select: (columns: string) => table === "translation_jobs" ? {
    order: () => ({ limit: async () => ({
      data: [Object.fromEntries(Object.entries(db.job).filter(([key]) => columns.split(",").map(s => s.trim()).includes(key)))], error: null,
    }) }),
  } : { in: async () => ({ data: [{ id: "draft", title_zh: "合成文案" }], error: null }) } }),
}) }));

describe("translation history language identity", () => {
  it("reads and retains the actual Malay language while resolving content labels", async () => {
    const [job] = await fetchTranslationJobs();
    expect(job).toMatchObject({ id: "malay-job", target_language: "ms", record_label: "合成文案" });
  });
});
