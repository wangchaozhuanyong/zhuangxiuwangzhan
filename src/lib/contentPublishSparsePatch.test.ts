import { describe, expect, it, vi } from "vitest";
import type { ManagedTarget } from "../../supabase/functions/content-publish/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
type Fixture = { name: string; before: Row; after: Row; target: ManagedTarget; narrow: boolean };
const local = vi.hoisted(() => ({ fixtures: [] as Fixture[] }));

// These targets exist only in this isolated test module. No runtime registration.
vi.mock("../../supabase/functions/content-publish/managed-targets.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../supabase/functions/content-publish/managed-targets.ts")>();
  const { createHash } = await import("node:crypto");
  const stable = (v: unknown): unknown => Array.isArray(v) ? v.map(stable) : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable((v as Row)[k])])) : v ?? null;
  const digest = (v: unknown) => createHash("sha256").update(JSON.stringify(stable(v))).digest("hex");
  for (const [index, kind] of ["faq", "process", "blog", "narrow-process", "org-faq"].entries()) {
    const before: Row = { id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      slug: `fixture-${kind}`, status: "published", version: 1, updated_at: "2026-09-24T14:58:51.371384+00:00",
      title_en: "Fixture title", title_zh: "测试标题", excerpt_en: "Fixture excerpt", excerpt_zh: "测试摘要",
      content_en: "<p>Fixture body</p>", content_zh: "<p>测试正文</p>", alt_en: "Fixture image", alt_zh: "测试图片",
      seo_title_en: "Fixture SEO", seo_title_zh: "测试 SEO", seo_description_en: "Fixture description", seo_description_zh: "测试描述" };
    if (kind === "blog") Object.assign(before, { cover_image_url: "/fixture.webp", category: "fixture", tags: [],
      published_at: "2026-09-20T00:00:00Z", sort_order: 0 });
    else {
      before.image_url = "/fixture.webp";
      for (const lang of ["en", "zh"]) {
        for (const name of ["suitable_for", "common_projects", "scope_items"]) before[`${name}_${lang}`] = ["Fixture item"];
        before[`process_steps_${lang}`] = Array.from({ length: 5 }, (_, n) => ({ title: `Step ${n + 1}`, desc: `Description ${n + 1}` }));
        before[`faqs_${lang}`] = [{ q: "Fixture question", a: "Fixture answer" }];
      }
    }
    const fields = kind.includes("faq") ? ["faqs_en", "faqs_zh"] : kind.includes("process")
      ? ["process_steps_en", "process_steps_zh"] : ["content_en", "content_zh"];
    const after: Row = {};
    for (const field of fields) after[field] = field.startsWith("faqs_")
      ? [...before[field] as Row[], { q: "Appended question", a: "Appended answer" }]
      : field.startsWith("process_steps_") ? (before[field] as Row[]).map((row, n) => n === 0 ? { ...row, desc: "New first description" } : { ...row })
      : String(before[field]) + "<p>Appended paragraph</p>";
    const narrow = kind === "narrow-process";
    const projection = narrow ? ["id", "slug", "status", "version", "updated_at", ...fields, "content_en", "content_zh"] : Object.keys(before);
    const retained = projection.filter(field => !fields.includes(field));
    const project = (keys: string[]) => Object.fromEntries(keys.map(k => [k, before[k] ?? null]));
    const target: ManagedTarget = { id: String(before.id), slug: String(before.slug), contentType: kind === "blog" ? "blog" : "service",
      table: kind === "blog" ? "blog_posts" : "services", taskId: `local-fixture-${kind}`, actionId: `local-fixture-publish-${kind}`,
      candidateVersion: `local-fixture-${kind}-v1`, scope: `local-fixture:${kind}`, changedFields: fields,
      expectedUpdatedAt: String(before.updated_at), desiredFieldsSha256: digest(after), baselineFieldsSha256: digest(project(projection)),
      baselineProjectionFields: projection, rollbackFieldsSha256: kind === "org-faq" ? undefined : digest(project(fields)),
      retainedProjectionFields: retained, retainedFieldsSha256: digest(project(retained)), rollbackAllowed: kind !== "org-faq" };
    local.fixtures.push({ name: kind, before, after, target, narrow });
  }
  const all = local.fixtures.map(f => f.target);
  return { ...original,
    MANAGED_TARGETS: [...original.MANAGED_TARGETS, ...all],
    MANAGED_SERVICES: [...original.MANAGED_SERVICES, ...all.filter(t => t.contentType === "service")],
    MANAGED_BLOGS: [...original.MANAGED_BLOGS, ...all.filter(t => t.contentType === "blog")],
    ORG020_V7_TARGETS: [...original.ORG020_V7_TARGETS, ...all.filter(t => t.rollbackAllowed === false)] };
});

import { publishContent } from "../../supabase/functions/content-publish/service.ts";
const identity = { repositoryId: 1248188229, actorId: 123, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main", runId: 1, runAttempt: 1 };
const context = { role: "content_editor", authMode: "cron", managedIdentity: identity };
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function request(f: Fixture, mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
  const selector = { taskId: f.target.taskId, actionId: f.target.actionId, scope: f.target.scope,
    candidateVersion: f.target.candidateVersion, operation: "publish" as const };
  return { contentType: f.target.contentType, mode, nextStatus: "published", expectedUpdatedAt: String(f.before.updated_at),
    record: { id: f.before.id, slug: f.before.slug, status: "published", ...clone(f.after) },
    ownerApproved: true, explicitExecution: true, approvalId: "LOCAL_FIXTURE_ONLY",
    ...(mode === "dry-run" ? { managedCandidate: selector } : { managedPermit: { ...selector, permitId: "11111111-1111-4111-8111-111111111111" } }) };
}
function clientFor(f: Fixture, options: { claimDenied?: boolean; race?: boolean; before?: Row } = {}) {
  let row = clone(options.before || f.before);
  const writes: Array<{ table: string; patch: Row; filters: Array<[string, unknown]> }> = [];
  const calls: string[] = []; const reads: string[] = [];
  const client = {
    from(table: string) {
      let patch: Row | undefined;
      const filters: Array<[string, unknown]> = [];
      const builder = { select() { return builder; }, eq(k: string, v: unknown) { filters.push([k, v]); return builder; },
        update(p: Row) { patch = clone(p); return builder; },
        insert() { if (table !== "admin_audit_logs") throw new Error("Unexpected content insert"); return builder; },
        async single() { return { data: {}, error: null }; },
        async maybeSingle() {
          if (table !== f.target.table) throw new Error("Unexpected content table");
          if (filters.some(([k, v]) => row[k] !== v)) return { data: null, error: null };
          if (patch) { writes.push({ table, patch, filters }); row = { ...row, ...patch, updated_at: "2026-09-24T14:58:52.371384+00:00" }; }
          else reads.push(table);
          return { data: clone(row), error: null };
        },
        then(done: (v: unknown) => unknown) { return Promise.resolve({ data: [], error: null }).then(done); } };
      return builder;
    },
    async rpc(name: string, args: Row) {
      calls.push(name);
      if (name === "claim_managed_cms_release_permit" && (options.claimDenied || args.p_github_actor_id !== identity.actorId)) return { data: [], error: null };
      if (name === "begin_managed_cms_release_write" && options.race) row.updated_at = "2026-09-24T14:58:51.371385+00:00";
      return { data: [{}], error: null };
    } } as unknown as ContentPublishClient;
  return { client, writes, calls, reads, current: () => row };
}

describe("locked sparse native patches (local fixtures, no real permits or DB)", () => {
  const supported = local.fixtures.filter(f => !f.narrow);
  it.each(supported)("$name validates from approved existing projection, without caller title/SEO/image", async f => {
    const mock = clientFor(f); const input = request(f);
    expect(input.record).not.toHaveProperty("title_en");
    const result = await publishContent(input, mock.client, context);
    expect(result.body.ok, String(result.body.error)).toBe(true);
    expect(result.body.payload_preview).toEqual(f.after);
    expect(mock.writes).toHaveLength(0); expect(mock.calls).toHaveLength(0);
    expect(mock.current()).toEqual(f.before);
  });
  it.each(supported)("$name writes only the frozen pair and retains unrelated values", async f => {
    const mock = clientFor(f); const result = await publishContent(request(f, "publish"), mock.client, context);
    expect(result.body.ok, String(result.body.error)).toBe(true);
    expect(mock.writes).toEqual([{ table: f.target.table, patch: f.after, filters: [["id", f.before.id], ["updated_at", f.before.updated_at]] }]);
    for (const k of Object.keys(f.before).filter(k => !f.target.changedFields!.includes(k) && k !== "updated_at")) expect(mock.current()[k]).toEqual(f.before[k]);
    expect(mock.calls).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
  });
  it.each(supported)("$name rejects wrong row/field/candidate, native drift and stale microseconds", async f => {
    const input = request(f);
    const first = f.target.changedFields![0];
    const wrongAfter = clone(f.after);
    if (Array.isArray(wrongAfter[first])) (wrongAfter[first] as Row[])[0][first.startsWith("faqs_") ? "a" : "desc"] = "Unapproved text";
    else wrongAfter[first] = String(wrongAfter[first]) + "Unapproved text";
    const variations = [
      { input: { ...input, record: { ...input.record, id: "00000000-0000-4000-8000-000000009999" } } },
      { input: { ...input, record: { ...input.record, title_en: "Unapproved title" } } },
      { input: { ...input, record: { ...input.record, unexpected_field: true } } },
      { input: { ...input, record: { ...input.record, ...wrongAfter } } },
      { input: { ...input, managedCandidate: { ...input.managedCandidate!, candidateVersion: "wrong-candidate" } } },
      { input: { ...input, expectedUpdatedAt: "2026-09-24T14:58:51.371385+00:00" } },
      { input, before: { ...f.before, version: 2 } },
      { input, before: { ...f.before, [first]: "Before drift" } },
    ];
    for (const v of variations) {
      const mock = clientFor(f, { before: v.before }); const result = await publishContent(v.input, mock.client, context);
      expect([400, 403, 404, 409]).toContain(result.status);
      expect(mock.writes).toHaveLength(0); expect(mock.calls).toHaveLength(0);
    }
  });
  it.each(supported)("$name keeps missing/wrong executor, expired-claim and write-race guards", async f => {
    for (const actor of [{ ...context, managedIdentity: undefined }, { ...context, role: "viewer" },
      { ...context, managedIdentity: { ...identity, actorId: 999 } }]) {
      const mock = clientFor(f); expect((await publishContent(request(f, "publish"), mock.client, actor)).status).toBe(403);
      expect(mock.writes).toHaveLength(0);
    }
    const expired = clientFor(f, { claimDenied: true });
    expect((await publishContent(request(f, "publish"), expired.client, context)).status).toBe(403);
    expect(expired.writes).toHaveLength(0);
    const race = clientFor(f, { race: true }); expect((await publishContent(request(f, "publish"), race.client, context)).status).toBe(409);
    expect(race.writes).toHaveLength(0);
  });
  it("does not borrow unapproved columns from a full database row to validate a nine-field projection", async () => {
    const f = local.fixtures.find(f => f.narrow)!;
    // The fake DB has title/SEO/image; only the approved nine fields may be used.
    const mock = clientFor(f); const result = await publishContent(request(f), mock.client, context);
    expect(result.status).toBe(400); expect(result.body.error).toContain("Published service requires");
    expect(mock.writes).toHaveLength(0); expect(mock.calls).toHaveLength(0);
  });
  it("rejects original question/answer objects instead of silently dropping accepted FAQs", async () => {
    const f = local.fixtures.find(f => f.name === "faq")!; const input = request(f);
    input.record!.faqs_en = (f.after.faqs_en as Row[]).map(row => ({ question: row.q, answer: row.a }));
    const mock = clientFor(f); expect([400, 403]).toContain((await publishContent(input, mock.client, context)).status);
    expect(mock.writes).toHaveLength(0); expect(mock.calls).toHaveLength(0);
  });
  it("still requires full published validation for ordinary unregistered records", async () => {
    const f = local.fixtures[0]; const mock = clientFor(f);
    const input: ContentPublishRequest = { contentType: "service", mode: "dry-run", nextStatus: "published",
      record: { id: "00000000-0000-4000-8000-000000008888", slug: "ordinary", faqs_en: f.after.faqs_en, faqs_zh: f.after.faqs_zh } };
    expect((await publishContent(input, mock.client, context)).status).toBe(400);
    expect(mock.reads).toHaveLength(0); expect(mock.writes).toHaveLength(0);
  });
});
