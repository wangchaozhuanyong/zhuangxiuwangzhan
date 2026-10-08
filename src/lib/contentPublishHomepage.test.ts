import { describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

const version = "2026-10-08T01:00:00.000001Z";
const tables: Record<string, Record<string, unknown>[]> = {
  site_pages: [{ id: "site-home", page_key: "home", path: "/", status: "published", updated_at: version }],
  faqs: [{ id: "faq-old", page_key: "home", status: "published", updated_at: version }],
  cta_blocks: [{ id: "cta-home", block_key: "home_final", status: "published", updated_at: version }],
};
const request: ContentPublishRequest = {
  contentType: "homepage", mode: "publish", nextStatus: "published", ownerApproved: true, explicitExecution: true,
  record: {
    sitePage: { page_key: "home", path: "/", updated_at: version, seo_title_en: "Approved homepage" },
    ctaBlocks: [{ block_key: "home_final", updated_at: version, title_en: "Planning a renovation?", primary_url: "/quote" }],
    replaceFaqs: true, expectedFaqs: [{ id: "faq-old", updated_at: version }],
    faqs: [{ question_en: "What do you handle?", answer_en: "Owner-approved services only." }],
  },
};
function fixture(rpcError: { code: string; message: string } | null = null) {
  const rpc = vi.fn(async () => ({ data: { saved_records: [{ table: "site_pages", saved_id: "site-home" }], public_revision: version }, error: rpcError }));
  const directWrite = vi.fn(() => { throw new Error("Partial publication is forbidden"); });
  const client = { from(table: string) {
    const filters: Array<[string, unknown]> = [];
    const rows = () => (tables[table] || []).filter((row) => filters.every(([key, value]) => row[key] === value));
    const builder = { select() { return builder; }, eq(key: string, value: unknown) { filters.push([key, value]); return builder; },
      maybeSingle: async () => ({ data: rows()[0] || null, error: null }),
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({ data: rows(), error: null }).then(resolve); },
      update: directWrite, insert: directWrite,
    };
    return builder;
  }, rpc } as unknown as ContentPublishClient;
  return { client, rpc, directWrite };
}

describe("content-publish homepage transaction contract", () => {
  it("previews every baseline version without any publication call", async () => {
    const { client, rpc, directWrite } = fixture();
    const result = await publishContent({ ...request, mode: "dry-run" }, client, { role: "content_editor" });
    expect(result.body).toMatchObject({ ok: true, dry_run: true, expected_versions: {
      site_page: { id: "site-home", updated_at: version }, faqs: [{ id: "faq-old", updated_at: version }],
    } });
    expect(rpc).not.toHaveBeenCalled();
    expect(directWrite).not.toHaveBeenCalled();
  });
  it("passes the whole approved homepage and exact caller versions into one transaction", async () => {
    const { client, rpc, directWrite } = fixture();
    const result = await publishContent(request, client, { role: "content_editor" });
    expect(result.body).toMatchObject({ ok: true, dry_run: false, public_revision: version });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("publish_homepage_atomic", expect.objectContaining({
      p_site_page: expect.objectContaining({ expectedId: "site-home", expectedUpdatedAt: version }),
      p_cta_blocks: [expect.objectContaining({ expectedId: "cta-home", expectedUpdatedAt: version })],
      p_expected_faqs: [{ id: "faq-old", updated_at: version }], p_replace_faqs: true,
    }));
    expect(directWrite).not.toHaveBeenCalled();
  });
  it.each(["missing CTA version", "changed CTA version", "missing FAQ set", "changed FAQ set"])("rejects %s before writing", async (kind) => {
    const { client, rpc } = fixture();
    const record = structuredClone(request.record!);
    if (kind.includes("CTA")) (record.ctaBlocks as Record<string, unknown>[])[0].updated_at = kind.startsWith("missing") ? "" : "2026-10-08T01:00:00.000002Z";
    else record.expectedFaqs = kind.startsWith("missing") ? undefined : [];
    const result = await publishContent({ ...request, record }, client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(["40001", "PGRST202"])("does not fall back to partial writes on transaction error %s", async (code) => {
    const { client, rpc, directWrite } = fixture({ code, message: "test-only" });
    const result = await publishContent(request, client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(result.body.ok).toBe(false);
    expect(rpc).toHaveBeenCalledOnce();
    expect(directWrite).not.toHaveBeenCalled();
  });
});
