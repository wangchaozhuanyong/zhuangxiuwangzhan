import { beforeEach, describe, expect, it, vi } from "vitest";
import { previewAdminContent, AdminContentPreflightError } from "./adminContentPreflightService";
import { previewAdminService } from "@/backend/modules/services/service/serviceService";
import { previewAdminBlogPost } from "@/backend/modules/blog/service/blogService";
import * as managedPreview from "../../../../../supabase/functions/_shared/managed-targets.ts";

const { invoke, from } = vi.hoisted(() => ({ invoke: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  requireSupabase: () => ({ functions: { invoke }, from }),
}));

const timestamp = "2026-10-05T04:03:12.123456+00:00";
const input = {
  contentType: "service" as const,
  nextStatus: "draft" as const,
  expectedUpdatedAt: timestamp,
  record: { id: "row-1", slug: "ordinary-service", updated_at: timestamp },
};
const validResponse = {
  ok: true, dry_run: true, content_type: "service", existing_id: "row-1", status: "draft",
  slug: "ordinary-service", payload_preview: { title_zh: "示例", title_en: "Example" }, warnings: [],
};

describe("admin read-only content preflight", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invoke.mockReset(); from.mockReset();
    invoke.mockResolvedValue({ data: validResponse, error: null });
  });

  it("calls only dry-run and preserves the raw PostgreSQL revision without publication grants or writes", async () => {
    const result = await previewAdminContent(input);
    expect(invoke).toHaveBeenCalledExactlyOnceWith("content-publish", { body: { ...input, mode: "dry-run" } });
    expect(result).toEqual({ recordId: "row-1", expectedUpdatedAt: timestamp, fieldCount: 2, warningCount: 0 });
    expect(from).not.toHaveBeenCalled();
  });

  it.each(["", "2026-10-05", "not-a-version"])("rejects missing or invalid loaded revisions locally: %s", async (expectedUpdatedAt) => {
    await expect(previewAdminContent({ ...input, expectedUpdatedAt })).rejects.toMatchObject({ reason: "missingVersion" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("refuses new content rather than validating a different row found by slug", async () => {
    await expect(previewAdminContent({ ...input, record: { slug: input.record.slug } })).rejects.toMatchObject({ reason: "missingVersion" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each([
    { dry_run: false }, { performed_write: true }, { saved_id: "row-1" }, { saved_record: {} },
    { saved_updated_at: timestamp }, { cache_invalidation: {} }, { existing_id: "other-row" },
    { content_type: "blog" }, { status: "published" }, { slug: "other-slug" }, { payload_preview: [] },
    { payload_preview: {} }, { ok: undefined },
  ])("never accepts a write receipt, mismatched row or incomplete response: %j", async (patch) => {
    invoke.mockResolvedValue({ data: { ...validResponse, ...patch }, error: null });
    await expect(previewAdminContent(input)).rejects.toMatchObject({ reason: "invalidResponse" });
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    [409, "This service was changed by someone else. Refresh before publishing.", "conflict"],
    [403, "Managed Blog requires an exact locked row and candidate.", "protectedContent"],
    [403, "Content editor access required", "permission"],
    [400, "Invalid service payload", "validation"],
  ])("maps HTTP %s privately to a safe failure", async (status, message, reason) => {
    invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify({ error: message }), { status }) } });
    await expect(previewAdminContent(input)).rejects.toMatchObject({ reason });
  });

  it("keeps transport details out of failures", async () => {
    invoke.mockRejectedValue(new Error("private transport diagnostic"));
    await expect(previewAdminContent(input)).rejects.toEqual(new AdminContentPreflightError("unavailable"));
  });

  it("uses the same service payload normalization as saving", async () => {
    await previewAdminService({ record: { ...input.record, status: "draft", faqs_zh: [{ q: "  问题  ", a: " 答案 " }] } });
    expect(invoke.mock.lastCall?.[1].body.record.faqs_zh).toEqual([{ q: "问题", a: "答案" }]);
    expect(invoke.mock.lastCall?.[1].body.expectedUpdatedAt).toBe(timestamp);
  });

  it("carries the exact zero-write candidate from the service resolver through the real preflight repository", async () => {
    const candidate = { taskId: "fc-20261010-paid-three-page-exact-publication-followthrough-v1",
      actionId: "paid-three-page-kitchen-exact-fields-v1", operation: "publish" as const,
      scope: "flashcast.com.my:services/ce4156db-9034-42c8-ba29-b35724ea7d6d:title_zh,excerpt_zh",
      candidateVersion: "paid-three-page-exact-native-diff-v1-20261010" };
    const resolver = vi.spyOn(managedPreview, "findManagedPreviewCandidate").mockResolvedValueOnce(candidate);
    await previewAdminService({ record: { ...input.record, status: "draft" } });
    expect(resolver).toHaveBeenCalledWith("service", expect.objectContaining({ id: "row-1", updated_at: timestamp }), timestamp);
    expect(invoke.mock.lastCall?.[1].body).toMatchObject({ mode: "dry-run", expectedUpdatedAt: timestamp, managedCandidate: candidate });
    expect(invoke.mock.lastCall?.[1].body).not.toHaveProperty("managedPermit");
    expect(invoke.mock.lastCall?.[1].body).not.toHaveProperty("ownerApproved");
    expect(from).not.toHaveBeenCalled();
  });

  it("uses the same blog payload normalization without generating publication time or saving", async () => {
    invoke.mockResolvedValue({ data: { ...validResponse, content_type: "blog" }, error: null });
    await previewAdminBlogPost({ record: { ...input.record, status: "draft", sort_order: "7" } });
    expect(invoke.mock.lastCall?.[1].body.record).toMatchObject({ sort_order: 7, published_at: null, tags: [] });
    expect(invoke.mock.lastCall?.[1].body).toMatchObject({ contentType: "blog", mode: "dry-run", expectedUpdatedAt: timestamp });
    expect(from).not.toHaveBeenCalled();
  });
});
