import { afterEach, describe, expect, it, vi } from "vitest";
import { generateEnglishContent } from "../../supabase/functions/generate-english-content/service";
import type { GenerateEnglishClient } from "../../supabase/functions/generate-english-content/types";
import { MANAGED_TARGETS } from "../../supabase/functions/_shared/managed-targets";

vi.mock("../../supabase/functions/generate-english-content/translator.ts", () => ({
  isBlankValue: (value: unknown) => !value,
  translateValue: async () => "Translated fixture",
}));
const sync = vi.hoisted(() => vi.fn().mockResolvedValue({ cache_invalidation: { ok: true, revision: "r2" } }));
vi.mock("../../supabase/functions/_shared/public-content-sync.ts", () => ({ syncPublicContent: sync }));

function fixture(role = "content_editor", active = true, aal = "aal2", row: Record<string, unknown> = {}) {
  const record = { id: "fixture-id", status: "draft", updated_at: "2026-10-08T00:00:00Z", title_zh: "测试", title_en: "", ...row };
  const insert = vi.fn().mockResolvedValue({ error: null });
  const writeFilters: unknown[][] = [];
  const query = {
    eq: vi.fn((...args: unknown[]) => { writeFilters.push(args); return query; }),
    is: vi.fn((...args: unknown[]) => { writeFilters.push(["is", ...args]); return query; }),
    select: () => query, maybeSingle: vi.fn().mockResolvedValue({ data: record, error: null }),
  };
  const update = vi.fn(() => query);
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "fixture-user" } }, error: null }) },
    from: vi.fn((table: string) => table === "admin_users"
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role, active }, error: null }) }) }) }
      : table === "translation_jobs" ? { insert }
      : { select: () => ({ eq: () => ({ single: async () => ({ data: record, error: null }) }) }), update }),
  } as unknown as GenerateEnglishClient;
  const req = new Request("https://fixture.invalid", { headers: { Authorization: `Bearer fixture.${btoa(JSON.stringify({ aal }))}.fixture` } });
  return { req, client, insert, update, query, writeFilters, record };
}
afterEach(() => { vi.unstubAllGlobals(); sync.mockClear(); });

describe("translation authorization and protected content", () => {
  it.each(["viewer", "lead_manager"])("rejects %s before content/job writes", async (role) => {
    const f = fixture(role);
    expect((await generateEnglishContent(f.req, { table: "services", id: "fixture-id" }, f.client)).status).toBe(403);
    expect(f.insert).not.toHaveBeenCalled(); expect(f.update).not.toHaveBeenCalled();
  });
  it.each([[false, "aal2"], [true, "aal1"]])("retains active=%s assurance=%s checks", async (active, aal) => {
    const f = fixture("super_admin", active as boolean, aal as string);
    expect((await generateEnglishContent(f.req, { table: "services", id: "fixture-id" }, f.client)).status).toBe(403);
    expect(f.insert).not.toHaveBeenCalled();
  });
  it.each(["content_editor", "super_admin"])("allows %s with an atomic record version", async (role) => {
    const f = fixture(role);
    const result = await generateEnglishContent(f.req, { table: "services", id: "fixture-id" }, f.client);
    expect(result.body.ok).toBe(true);
    expect(f.writeFilters).toContainEqual(["updated_at", "2026-10-08T00:00:00Z"]);
  });
  it.each(MANAGED_TARGETS.map((target) => [target.table || ({ service: "services", blog: "blog_posts", service_area: "service_areas", site_page: "site_pages", faq: "faqs" })[target.contentType], target.id]))(
    "cannot bypass protected %s/%s", async (table, id) => {
      const f = fixture("super_admin", true, "aal2", { id, status: "published" });
      expect((await generateEnglishContent(f.req, { table, id, force: true }, f.client)).status).toBe(403);
      expect(f.update).not.toHaveBeenCalled(); expect(f.insert).not.toHaveBeenCalled();
    },
  );
  it("does not acknowledge zero-row translation", async () => {
    const f = fixture(); f.query.maybeSingle.mockResolvedValue({ data: null, error: null } as never);
    expect((await generateEnglishContent(f.req, { table: "services", id: "fixture-id" }, f.client)).status).toBe(409);
    expect(sync).not.toHaveBeenCalled();
  });
  it("translates existing unversioned project images with an atomic complete snapshot", async () => {
    vi.stubGlobal("Deno", { env: { get: () => undefined } });
    const f = fixture("content_editor", true, "aal2", {
      updated_at: undefined, title_zh: null, title_en: null, project_id: "parent",
      image_url: "/fixture.webp", image_type: "gallery", alt_zh: "测试图片", alt_en: null,
      sort_order: 0, created_at: "2026-10-08T00:00:00Z",
    });
    delete (f.record as Record<string, unknown>).status;
    const result = await generateEnglishContent(f.req, { table: "project_images", id: "fixture-id" }, f.client);
    expect(result.body.ok).toBe(true);
    expect(f.update).toHaveBeenCalledWith({ alt_en: "Translated fixture" });
    expect(f.writeFilters).toContainEqual(["alt_zh", "测试图片"]);
    expect(f.writeFilters).toContainEqual(["is", "alt_en", null]);
    expect(f.writeFilters).toContainEqual(["image_url", "/fixture.webp"]);
    expect(f.writeFilters).not.toContainEqual(["updated_at", undefined]);
    expect(sync).toHaveBeenCalledOnce();
  });
  it("refuses an incomplete project image snapshot before translation writes", async () => {
    const f = fixture("content_editor", true, "aal2", { updated_at: undefined, alt_zh: "测试图片" });
    expect((await generateEnglishContent(f.req, { table: "project_images", id: "fixture-id" }, f.client)).status).toBe(409);
    expect(f.insert).not.toHaveBeenCalled(); expect(f.update).not.toHaveBeenCalled();
  });
  it("reports a project image snapshot conflict without public synchronization", async () => {
    const f = fixture("content_editor", true, "aal2", {
      updated_at: undefined, title_zh: null, title_en: null, project_id: null,
      image_url: "/fixture.webp", image_type: "gallery", alt_zh: "测试图片", alt_en: null,
      sort_order: 0, created_at: "2026-10-08T00:00:00Z",
    });
    f.query.maybeSingle.mockResolvedValue({ data: null, error: null } as never);
    expect((await generateEnglishContent(f.req, { table: "project_images", id: "fixture-id" }, f.client)).status).toBe(409);
    expect(sync).not.toHaveBeenCalled();
  });
  it("synchronizes a legitimate published translation after saving", async () => {
    vi.stubGlobal("Deno", { env: { get: () => undefined } });
    const f = fixture("content_editor", true, "aal2", { status: "published" });
    expect((await generateEnglishContent(f.req, { table: "services", id: "fixture-id" }, f.client)).body.cache_invalidation?.ok).toBe(true);
    expect(sync).toHaveBeenCalledOnce(); expect(f.update).toHaveBeenCalledOnce();
  });
});
