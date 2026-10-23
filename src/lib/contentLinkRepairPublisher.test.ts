import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { CONTENT_LINK_REPAIR_TARGETS, CONTENT_LINK_REPAIR_MANIFEST_SHA256, CONTENT_LINK_REPAIR_APPROVAL_ID } from "../../supabase/functions/_shared/content-link-repair-targets.ts";
import { withPublishedLinkTargets } from "../test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest, PublishContext } from "../../supabase/functions/content-publish/types.ts";
type Row = Record<string, unknown>;
const candidate = JSON.parse(readFileSync("drafts/content-link-repair-20261024/candidates-v1.json", "utf8"));
const source = { replacements: candidate.hrefReplacements };
const savedVersion = "2026-10-24T11:00:00.123456+00:00";
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value as Row).sort().map(key => [key, stable((value as Row)[key])])) : value ?? null;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const testContext: PublishContext = { role: "content_editor", authMode: "managed-github", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  workflowSha: "a".repeat(40), runId: 12345, runAttempt: 1,
} };
function fakeClient(initial: Row, race = false) {
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
  return { client: withPublishedLinkTargets(client as unknown as ContentPublishClient), writes, filters, rpcCalls, row: () => row };
}


const request = (index: number, mode: "dry-run" | "publish" = "publish"): ContentPublishRequest => {
  const target = CONTENT_LINK_REPAIR_TARGETS[index], entry = candidate.entries[index];
  const selection = { taskId: target.taskId, actionId: target.actionId, scope: target.scope, candidateVersion: target.candidateVersion, operation: "publish" as const };
  return { contentType: "translation_patch", mode, record: { id: target.id, slug: target.slug, ...entry.patch },
    expectedUpdatedAt: target.expectedUpdatedAt, ownerApproved: true, explicitExecution: true,
    approvalId: CONTENT_LINK_REPAIR_APPROVAL_ID,
    ...(mode === "dry-run" ? { managedCandidate: selection } : { managedPermit: { ...selection, permitId: "11111111-1111-4111-8111-111111111111" } }) };
};
describe("exact existing Malay link corrections", () => {
  it("locks 10 rows and 12 href-only changes to their original text and versions", () => {
    expect(CONTENT_LINK_REPAIR_TARGETS).toHaveLength(10);
    expect(digest(CONTENT_LINK_REPAIR_TARGETS)).toBe(CONTENT_LINK_REPAIR_MANIFEST_SHA256);
    expect(candidate.entries.reduce((sum: number, e: {repairs: number}) => sum + e.repairs, 0)).toBe(12);
    candidate.entries.forEach((e: {baseline: Row; patch: Row; desiredFieldsSha256: string}, index: number) => {
      const original = String(e.baseline.content_ms);
      const expected = original.replace(/(href\s*=\s*["'])([^"']+)(["'])/gi, (all, before, href, after) =>
        source.replacements[href] ? before + source.replacements[href] + after : all);
      expect(e.patch).toEqual({content_ms: expected});
      expect(digest(e.baseline)).toBe(CONTENT_LINK_REPAIR_TARGETS[index].baselineFieldsSha256);
      expect(digest(e.patch)).toBe(e.desiredFieldsSha256);
    });
  });
  it.each(CONTENT_LINK_REPAIR_TARGETS.map((target, index) => ({slug:target.slug,index})))("previews and publishes $slug through exact original-text CAS", async ({index}) => {
    const f = fakeClient(candidate.entries[index].baseline);
    const dry = await publishContent(request(index,"dry-run"),f.client,testContext);
    expect(dry.body).toMatchObject({ok:true,performed_write:false}); expect(f.writes).toEqual([]);
    const result = await publishContent(request(index),f.client,testContext);
    expect(result.body).toMatchObject({ok:true,performed_write:true,saved_id:CONTENT_LINK_REPAIR_TARGETS[index].id});
    expect(f.writes).toEqual([candidate.entries[index].patch]);
    expect(f.filters).toContainEqual(["content_ms",candidate.entries[index].baseline.content_ms,"eq"]);
    expect(f.filters).toContainEqual(["updated_at",candidate.entries[index].expectedUpdatedAt,"eq"]);
  });
  it("rejects a racing write and changes to text, fields, approval or baseline", async () => {
    for (const variant of ["race","baseline","payload","field","approval"]) {
      const f = fakeClient({...candidate.entries[0].baseline,...(variant === "baseline" ? {content_ms:"Changed concurrently"}: {})}, variant === "race");
      const input = request(0);
      if (variant === "payload") input.record!.content_ms += " extra text";
      if (variant === "field") input.record!.title_ms = "Other edit";
      if (variant === "approval") input.approvalId = "unrelated-approval";
      const result = await publishContent(input,f.client,testContext);
      expect(result.body.ok,variant).toBe(false); expect(f.writes,variant).toEqual([]);
    }
  });
});
