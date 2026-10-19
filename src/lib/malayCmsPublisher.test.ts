import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publishContent, publishMalayTranslationPatch } from "../../supabase/functions/content-publish/service.ts";
import { updateMalayTranslationAtVersion } from "../../supabase/functions/content-publish/repository.ts";
import { MALAY_TRANSLATION_MANIFEST_SHA256, MALAY_TRANSLATION_TARGETS } from "../../supabase/functions/_shared/malay-translation-targets.ts";
import type { ManagedTarget } from "../../supabase/functions/_shared/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest, PublishContext } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const candidate = JSON.parse(readFileSync("drafts/malay-cms-continuation-20261019/candidates-v1.json", "utf8")) as {
  taskId: string; manifestSha256: string; rowCount: number; fieldCount: number;
  languageReview: { status: string }; entries: Array<Row & { table: string; id: string; slug: string; changedFields: string[]; patch: Row }>;
};
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value as Row).sort().map((key) => [key, stable((value as Row)[key])]))
  : value ?? null;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const manifestFor = () => candidate.entries.map((entry) => ({
  id: entry.id, slug: entry.slug, contentType: "translation_patch", taskId: candidate.taskId,
  actionId: `publish-malay-${entry.table}-${String(entry.id).slice(0, 8)}`,
  candidateVersion: `malay-cms-continuation-v1-${String(entry.id).slice(0, 8)}`,
  scope: `flashcast.com.my:${entry.table}/${entry.id}:${entry.changedFields.join(",")}:malay-v1`,
  changedFields: entry.changedFields, desiredFieldsSha256: entry.desiredFieldsSha256,
  baselineFieldsSha256: entry.baselineFieldsSha256, rollbackFieldsSha256: entry.rollbackFieldsSha256,
  expectedUpdatedAt: entry.expectedUpdatedAt, versionField: entry.versionField, table: entry.table,
  baselineProjectionFields: entry.baselineProjectionFields, rollbackAllowed: false,
}));

const rowVersion = "2026-10-19T08:00:00.123456+00:00";
const savedVersion = "2026-10-19T08:01:00.123456+00:00";
const demoPatch = { alt_ms: "Ruang tamu selepas pengubahsuaian", title_ms: "Pengubahsuaian ruang tamu" };
const demoRow: Row = { id: "11111111-2222-4333-8444-555555555555", slug: "living-room", updated_at: rowVersion,
  status: "published", title_en: "Living Room Renovation", alt_ms: null, title_ms: null };
const demoTarget: ManagedTarget = {
  ...(() => {
    const changedFields = ["alt_ms", "title_ms"];
    const baselineProjectionFields = ["alt_ms", "id", "slug", "status", "title_en", "title_ms", "updated_at"];
    const baseline = Object.fromEntries(baselineProjectionFields.map((field) => [field, demoRow[field] ?? null]));
    return { id: demoRow.id as string, slug: demoRow.slug as string, contentType: "translation_patch" as const,
      taskId: "fc-malay-contract-test", actionId: "publish-malay-contract-test", candidateVersion: "malay-contract-test-v1",
      scope: "flashcast.com.my:services/demo:alt_ms,title_ms:contract-test", changedFields, baselineProjectionFields,
      expectedUpdatedAt: rowVersion, versionField: "updated_at" as const, table: "services",
      desiredFieldsSha256: digest(demoPatch), baselineFieldsSha256: digest(baseline),
      rollbackFieldsSha256: digest(Object.fromEntries(changedFields.map((field) => [field, null]))), rollbackAllowed: false };
  })(),
};
const testContext: PublishContext = { role: "content_editor", authMode: "managed-github", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  workflowSha: "a".repeat(40), runId: 12345, runAttempt: 1,
} };
const demoInput = (overrides: Partial<ContentPublishRequest> = {}): ContentPublishRequest => ({
  contentType: "translation_patch", mode: "publish", record: { id: demoTarget.id, slug: demoTarget.slug, ...demoPatch },
  expectedUpdatedAt: rowVersion, ownerApproved: true, explicitExecution: true,
  approvalId: "owner-authorized-malay-cms-completion-20261019",
  managedPermit: { permitId: "11111111-1111-4111-8111-111111111111", taskId: demoTarget.taskId!,
    actionId: demoTarget.actionId!, operation: "publish", scope: demoTarget.scope!, candidateVersion: demoTarget.candidateVersion! },
  ...overrides,
});

function fakeClient(initial: Row = demoRow, race = false) {
  let row = { ...initial };
  const writes: Row[] = [];
  const filters: Array<[string, unknown, "eq" | "is"]> = [];
  const rpcCalls: string[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null;
      const predicates: Array<[string, unknown, "eq" | "is"]> = [];
      const result = async () => {
        if (!patch) return { data: { ...row }, error: null };
        filters.push(...predicates);
        if (race || predicates.some(([field, value, op]) => op === "is" ? row[field] !== value : row[field] !== value)) {
          return { data: null, error: null };
        }
        writes.push({ ...patch });
        row = { ...row, ...patch, updated_at: savedVersion };
        return { data: { ...row }, error: null };
      };
      const builder = {
        select() { return builder; },
        eq(field: string, value: unknown) { predicates.push([field, value, "eq"]); return builder; },
        is(field: string, value: null) { predicates.push([field, value, "is"]); return builder; },
        update(value: Row) { patch = value; return builder; },
        insert() { return builder; },
        maybeSingle: result,
        single: result,
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
    async rpc(name: string) { rpcCalls.push(name); return { data: [{}], error: null }; },
  };
  return { client: client as unknown as ContentPublishClient, writes, filters, rpcCalls, row: () => row };
}

describe("Malay CMS continuation candidate", () => {
  it("locks exactly 231 rows and 926 previously empty Malay fields to one manifest", () => {
    expect(candidate.rowCount).toBe(231);
    expect(candidate.fieldCount).toBe(926);
    expect(candidate.entries).toHaveLength(231);
    expect(candidate.entries.reduce((sum, entry) => sum + entry.changedFields.length, 0)).toBe(926);
    expect(candidate.languageReview.status).toBe("reviewed-final-static-qa");
    expect(new Set(candidate.entries.map((entry) => entry.id)).size).toBe(231);
    expect(candidate.manifestSha256).toBe(MALAY_TRANSLATION_MANIFEST_SHA256);
    expect(digest(manifestFor())).toBe(candidate.manifestSha256);
    expect(MALAY_TRANSLATION_TARGETS).toHaveLength(231);
    for (const entry of candidate.entries) {
      expect(entry.changedFields.length).toBeGreaterThan(0);
      expect(entry.changedFields.every((field) => field.endsWith("_ms"))).toBe(true);
      expect(Object.keys(entry.patch).sort()).toEqual([...entry.changedFields].sort());
      const nonempty = (value: unknown): boolean => value !== null && value !== undefined
        && (typeof value === "string" ? value.trim().length > 0
          : Array.isArray(value) ? value.length > 0
            : typeof value === "object" ? Object.keys(value as Row).length > 0
              : true);
      expect(Object.values(entry.patch).every(nonempty)).toBe(true);
      expect(digest(entry.patch)).toBe(entry.desiredFieldsSha256);
      expect(digest(Object.fromEntries(entry.changedFields.map((field) => [field, null])))).toBe(entry.rollbackFieldsSha256);
      expect(entry.versionField === "updated_at" || (entry.table === "project_images" && entry.versionField === "created_at")).toBe(true);
    }
  });

  it("keeps published Malay copy clean of known source-language and machine-translation artifacts", () => {
    const forbidden = [/\b(?:Penutup|Kulit|Sampul|Cover) projek\b/i, /\b(?:a 2026|Landed|countertop|material|office|pantry|program)\b/i,
      /Bagaimana boleh FLASH CAST tolong/i, /Apa yang perlu termasuk penyerahan/i, /ringkasan penyimpanan/i];
    for (const entry of candidate.entries) for (const value of Object.values(entry.patch)) {
      const text = String(value).replace(/<[^>]*>/g, " ").replace(/https?:\/\/[^\s"')]+/g, " ");
      for (const pattern of forbidden) expect(text).not.toMatch(pattern);
      expect(text).not.toMatch(/<\s*script\b|\bon[a-z]+\s*=|javascript\s*:|data\s*:\s*text\/html/i);
      for (const match of String(value).matchAll(/href=["']([^"']+)["']/gi)) {
        expect(match[1].startsWith("/ms") || match[1].startsWith("https://")).toBe(true);
      }
    }
  });
});

describe("protected Malay translation publisher", () => {
  it("previews without writes and uses exact row version plus blank Malay field guards", async () => {
    const fake = fakeClient();
    const preview = await publishMalayTranslationPatch({ ...demoInput(), mode: "dry-run", managedPermit: undefined,
      ownerApproved: undefined, explicitExecution: undefined, approvalId: undefined }, fake.client, testContext, "dry-run", demoTarget);
    expect(preview.body.performed_write).toBe(false);
    expect(preview.body.payload_preview).toEqual(demoPatch);
    expect(fake.writes).toHaveLength(0);
    expect(fake.rpcCalls).toHaveLength(0);

    const published = await publishMalayTranslationPatch(demoInput(), fake.client, testContext, "publish", demoTarget);
    expect(published.body.performed_write).toBe(true);
    expect(published.body.saved_id).toBe(demoTarget.id);
    expect(fake.writes).toEqual([demoPatch]);
    expect(fake.filters).toContainEqual(["id", demoTarget.id, "eq"]);
    expect(fake.filters).toContainEqual(["updated_at", rowVersion, "eq"]);
    expect(fake.filters).toContainEqual(["alt_ms", null, "is"]);
    expect(fake.filters).toContainEqual(["title_ms", null, "is"]);
    expect(fake.rpcCalls).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    expect(fake.row().title_en).toBe(demoRow.title_en);
  });

  it.each([
    candidate.entries.find((entry) => entry.table === "cms_pages" && entry.slug === "/")!,
    candidate.entries.find((entry) => entry.table === "site_pages" && entry.slug === "/projects")!,
    candidate.entries.find((entry) => entry.table === "cms_sections" && entry.slug === "process_step_1")!,
  ])("selects a registered row using its exact key $table/$slug", async (entry) => {
    const target = MALAY_TRANSLATION_TARGETS.find((item) => item.id === entry.id)!;
    const query = {
      select() { return query; }, eq() { return query; }, is() { return query; },
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      insert() { return query; }, update() { return query; },
    };
    const client = { from: () => query, rpc: async () => ({ data: [], error: null }) } as unknown as ContentPublishClient;
    const result = await publishContent({
      contentType: "translation_patch", mode: "dry-run", record: { id: target.id, slug: target.slug, ...entry.patch },
      nextStatus: "published", expectedUpdatedAt: target.expectedUpdatedAt,
      managedCandidate: { taskId: target.taskId, actionId: target.actionId, operation: "publish", scope: target.scope, candidateVersion: target.candidateVersion },
    }, client, testContext);
    expect(result.status).toBe(404);
  });

  it("rejects non-empty fields, altered payloads, missing OIDC and wrong owner approval before writing", async () => {
    const variants: Array<{ row?: Row; input?: ContentPublishRequest; context?: PublishContext }> = [
      { row: { ...demoRow, title_ms: "已填写" } },
      { input: { ...demoInput(), record: { ...demoInput().record!, title_ms: "未审查内容" } } },
      { input: { ...demoInput(), approvalId: "wrong-approval" } },
      { context: { ...testContext, managedIdentity: undefined } },
      { input: { ...demoInput(), expectedUpdatedAt: savedVersion } },
    ];
    for (const variant of variants) {
      const fake = fakeClient(variant.row || demoRow);
      const result = await publishMalayTranslationPatch(variant.input || demoInput(), fake.client, variant.context || testContext, "publish", demoTarget);
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(fake.writes).toHaveLength(0);
      expect(fake.rpcCalls).toHaveLength(0);
    }
  });

  it("guards project image rows by the full scalar baseline because they lack updated_at", async () => {
    const imageRow: Row = { id: demoRow.id, project_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", created_at: rowVersion,
      alt_ms: null, alt_en: "Project image", sort_order: 2, enabled: true };
    const target: ManagedTarget = { ...demoTarget, table: "project_images", changedFields: ["alt_ms"], versionField: "created_at",
      expectedUpdatedAt: rowVersion, baselineProjectionFields: ["id", "project_id", "created_at", "alt_ms", "alt_en", "sort_order", "enabled"] };
    const fake = fakeClient(imageRow);
    await updateMalayTranslationAtVersion(fake.client, target, rowVersion, imageRow, { alt_ms: "Imej projek" });
    expect(fake.filters).toContainEqual(["created_at", rowVersion, "eq"]);
    expect(fake.filters).toContainEqual(["alt_en", "Project image", "eq"]);
    expect(fake.filters).toContainEqual(["sort_order", 2, "eq"]);
    expect(fake.filters).toContainEqual(["enabled", true, "eq"]);
    expect(fake.filters).toContainEqual(["alt_ms", null, "is"]);
  });
});
