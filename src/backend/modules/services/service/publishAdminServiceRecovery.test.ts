import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishAdminService } from "./serviceService";
import { getPublicSyncIssues, registerPublicSyncIssue, resolvePublicSyncIssue, type PublicSyncIssue } from "@/lib/publicSyncRecovery";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
// Keep the service, publishing repository, recovery store and cache real.
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, requireSupabase: () => ({ functions: { invoke } }) }));

const syncKey = "services:fixture-service:publish";
const record = {
  id: "fixture-service", slug: "fixture-service", status: "published" as const,
  title_zh: "服务", title_en: "Service", excerpt_zh: "简介", excerpt_en: "Excerpt",
  content_zh: "内容", content_en: "Content", image_url: "/fixture.webp", alt_zh: "图片", alt_en: "Image",
  suitable_for_zh: ["适合"], suitable_for_en: ["Suitable"], common_projects_zh: ["项目"], common_projects_en: ["Project"],
  scope_items_zh: ["范围"], scope_items_en: ["Scope"],
  process_steps_zh: [{ title: "步骤", desc: "说明" }], process_steps_en: [{ title: "Step", desc: "Description" }],
  faqs_zh: [{ q: "问题", a: "答案" }], faqs_en: [{ q: "Question", a: "Answer" }],
  seo_title_zh: "标题", seo_title_en: "Title", seo_description_zh: "描述", seo_description_en: "Description",
};
const response = (ok: boolean) => ({ data: { ok: true, saved_id: record.id, saved_record: record, cache_invalidation: { ok } }, error: null });
const issue = (): PublicSyncIssue => ({ key: syncKey, retry: vi.fn(async () => undefined) });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

describe("service publishing recovery preserves the issue owned by each request", () => {
  beforeEach(() => {
    getPublicSyncIssues().forEach((pending) => resolvePublicSyncIssue(pending.key));
    invoke.mockReset();
  });

  it("an older retry cannot clear a newer failure with the same key", async () => {
    const client = new QueryClient();
    client.setQueryData(["admin", "services", "list"], ["before"]);
    client.setQueryData(["published", "services"], ["before"]);
    const delivery = deferred<ReturnType<typeof response>>();
    invoke.mockResolvedValueOnce(response(false)).mockReturnValueOnce(delivery.promise);
    try {
      const saved = await publishAdminService({ record, queryClient: client });
      expect(saved.savedId).toBe(record.id);
      const original = getPublicSyncIssues()[0];
      expect(original).toBeDefined();
      if (!original) throw new Error("Publishing must register a recoverable issue");
      const retry = original.retry();
      const replacement = issue();
      registerPublicSyncIssue(replacement);
      delivery.resolve(response(true));
      await retry;
      expect(getPublicSyncIssues()).toEqual([replacement]);
      expect(client.getQueryState(["admin", "services", "list"])?.isInvalidated).toBe(true);
      expect(client.getQueryState(["published", "services"])?.isInvalidated).toBe(true);
      expect(invoke).toHaveBeenCalledTimes(2);
      expect(invoke.mock.calls[1]?.[1]?.body).toMatchObject({ contentType: "cache_invalidation", record: { table: "services", action: "publish", id: record.id } });
    } finally { client.clear(); }
  });

  it.each([false, true])("an in-flight publish success preserves a newly registered issue (previous issue: %s)", async (hasPrevious) => {
    if (hasPrevious) registerPublicSyncIssue(issue());
    const publication = deferred<ReturnType<typeof response>>();
    invoke.mockReturnValueOnce(publication.promise);
    const pending = publishAdminService({ record });
    const replacement = issue();
    registerPublicSyncIssue(replacement);
    publication.resolve(response(true));
    await expect(pending).resolves.toMatchObject({ savedId: record.id });
    expect(getPublicSyncIssues()).toEqual([replacement]);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("a publish success still resolves its captured prior issue", async () => {
    registerPublicSyncIssue(issue());
    invoke.mockResolvedValueOnce(response(true));
    await publishAdminService({ record });
    expect(getPublicSyncIssues()).toEqual([]);
  });

  it("a retry still resolves its own issue when no replacement exists", async () => {
    invoke.mockResolvedValueOnce(response(false)).mockResolvedValueOnce(response(true));
    await publishAdminService({ record });
    const original = getPublicSyncIssues()[0];
    expect(original).toBeDefined();
    if (!original) throw new Error("Publishing must register a recoverable issue");
    await original.retry();
    expect(getPublicSyncIssues()).toEqual([]);
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
