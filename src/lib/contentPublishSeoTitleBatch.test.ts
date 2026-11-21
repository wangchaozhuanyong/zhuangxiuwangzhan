import { describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { CMS_SEO_TITLE_CANDIDATES, CMS_SEO_TITLE_APPROVAL_ID } from "../../supabase/functions/_shared/cms-seo-title-targets.ts";

const identity = { repositoryId: 1248188229, actorId: 12, runId: 10001, runAttempt: 1, workflowSha: "a".repeat(40),
  workflowRef:"wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main" };
const context = { role: "content_editor", managedIdentity: identity };
const selectionFor = (target: typeof CMS_SEO_TITLE_CANDIDATES[number]["target"]) => ({
  taskId: target.taskId, actionId: target.actionId, scope: target.scope,
  candidateVersion: target.candidateVersion, operation: "publish" as const,
});
function previewFor({target, titles}: typeof CMS_SEO_TITLE_CANDIDATES[number]) {
  const key = target.contentType === "site_page" ? "page_key" : "slug";
  return { contentType:target.contentType, mode:"dry-run", nextStatus:"published", expectedUpdatedAt:target.expectedUpdatedAt,
    approvalId:CMS_SEO_TITLE_APPROVAL_ID, record:{ id:target.id, [key]:target.slug, ...titles },
    managedCandidate:selectionFor(target) } satisfies ContentPublishRequest;
}
type Row = Record<string, unknown>;

function database(before: Row) {
  const row = { ...before, content_en:"Original published body", version:1 };
  const writes: { table:string; payload:Row; filters:[string, unknown][] }[] = [];
  const audits: string[] = [];
  let claimed = false;
  const rpc = vi.fn(async (name: string) => {
    if (name === "claim_managed_cms_release_permit") {
      if (claimed) return { data:[], error:null };
      claimed = true;
    }
    return { data:[{}], error:null };
  });
  const client = {
    from(table: string) {
      const filters: [string,unknown][] = [];
      let patch: Row | undefined;
      const query = {
        select() { return query; },
        eq(field: string, value: unknown) { filters.push([field,value]); return query; },
        update(value: Row) { patch = value; return query; },
        async insert() { audits.push(table); return { error:null }; },
        async maybeSingle() {
          if (!filters.every(([k,v]) => (row as Row)[k] === v)) return { data:null, error:null };
          if (patch) {
            writes.push({ table, payload:patch, filters });
            Object.assign(row, patch, { updated_at:"2026-11-21T23:59:55.340123+00:00", version:2 });
          }
          return { data:{...row}, error:null };
        },
      };
      return query;
    },
    rpc,
  } as unknown as ContentPublishClient;
  return { client, row, writes, audits, rpc };
}
const bilingual = CMS_SEO_TITLE_CANDIDATES.find(x => Object.keys(x.titles).length === 2)!;

describe("fixed CMS SEO title batch", () => {
  it("previews the exact 51 titles on 40 records and makes no writes or claims", async () => {
    expect(CMS_SEO_TITLE_CANDIDATES).toHaveLength(40);
    expect(CMS_SEO_TITLE_CANDIDATES.flatMap(x => x.paths)).toHaveLength(51);
    for (const candidate of CMS_SEO_TITLE_CANDIDATES) {
      const db = database(candidate.before);
      const result = await publishContent(previewFor(candidate), db.client, context);
      expect(result.body, candidate.target.slug).toMatchObject({ ok:true, performed_write:false, payload_preview:candidate.titles });
      expect(db.writes).toEqual([]);
      expect(db.rpc).not.toHaveBeenCalled();
    }
  });

  it("rejects changes to any other field, stale timestamps, altered titles and missing approval", async () => {
    const preview = previewFor(bilingual);
    const first = Object.keys(bilingual.titles)[0];
    const db = database(bilingual.before);
    for (const request of [
      { ...preview, record:{ ...preview.record, content_en:"Different body" } },
      { ...preview, record:{ ...preview.record, [first]:"Unreviewed headline" } },
      { ...preview, expectedUpdatedAt:"2026-11-20T12:00:00+00:00" },
      { ...preview, approvalId:"unregistered" },
    ]) expect((await publishContent(request, db.client, context)).body.ok).toBe(false);
    expect((await publishContent(preview, db.client, {role:"content_editor"})).body.ok).toBe(false);
    expect(db.writes).toEqual([]);
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("claims a single permit and uses row version CAS to publish only the approved titles", async () => {
    const db = database(bilingual.before);
    const preview = previewFor(bilingual);
    const request = { ...preview, mode:"publish", ownerApproved:true, explicitExecution:true,
      managedPermit:{ ...preview.managedCandidate, permitId:"11111111-1111-4111-8111-111111111111" } } satisfies ContentPublishRequest;
    expect((await publishContent({ ...request, ownerApproved:false }, db.client, context)).status).toBe(403);
    expect((await publishContent(request, db.client, context)).body).toMatchObject({ ok:true, performed_write:true });
    expect(db.writes).toEqual([{ table:bilingual.target.table, payload:bilingual.titles,
      filters:[["id", bilingual.target.id], ["updated_at", bilingual.target.expectedUpdatedAt]] }]);
    expect(db.row.content_en).toBe("Original published body");
    expect(db.audits).toEqual(["admin_audit_logs"]);
    expect(db.rpc.mock.calls.map(([name]) => name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    expect((await publishContent(request, db.client, context)).status).toBe(409);
    expect(db.writes).toHaveLength(1);
  });
});
