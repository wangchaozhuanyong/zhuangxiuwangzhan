import { describe, it, expect } from 'vitest';
import { publishContent } from '../../supabase/functions/content-publish/service.ts';
import { readCandidates, assertBaseline, assertEnvironment } from '../../scripts/publish-c4-service-seo.mjs';
import { withPublishedLinkTargets } from '../test/helpers/publishedLinkTargets';
import type { ContentPublishClient, ContentPublishRequest, PublishContext } from '../../supabase/functions/content-publish/types.ts';

type Row = Record<string, unknown>;
const candidates = readCandidates();
const context: PublishContext = { role: 'content_editor', authMode: 'cron', managedIdentity: {
  repositoryId: 1248188229, actorId: 98765,
  workflowRef: 'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main',
  workflowSha: 'a'.repeat(40), runId: 12345, runAttempt: 1,
} };
function transport(initial: Row) {
  let row = structuredClone(initial);
  const writes: Row[] = [], calls: string[] = [];
  const client = {
    from(table: string) {
      if (table === 'admin_audit_logs') return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null;
      const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (patch) {
          if (filters.some(([k, v]) => row[k] !== v)) return { data: null, error: null };
          writes.push(patch); row = { ...row, ...patch, updated_at: '2026-11-18T05:00:00+00:00', version: Number(row.version) + 1 };
        }
        return { data: structuredClone(row), error: null };
      };
      const builder = {
        select() { return builder; }, eq(k: string, v: unknown) { filters.push([k, v]); return builder; },
        is(k: string, v: unknown) { filters.push([k, v]); return builder; },
        update(p: Row) { patch = p; return builder; }, insert() { throw Error('Content insert forbidden'); },
        maybeSingle: result, single: result,
        then(resolve: (v: unknown) => unknown) { return Promise.resolve({ data: [], error: null }).then(resolve); },
      };
      return builder;
    },
    async rpc(name: string) { calls.push(name); return { data: [{}], error: null }; },
  };
  return { client: withPublishedLinkTargets(client as unknown as ContentPublishClient), writes, calls, row: () => row };
}
const request = (c: typeof candidates[number]['c'], mode: 'publish' | 'dry-run' = 'publish'): ContentPublishRequest => {
  const result = { ...c.dryRunRequest, mode, ownerApproved: mode === 'publish', explicitExecution: mode === 'publish',
    approvalId: 'owner-approved-c4-four-service-seo-20261118' };
  if (mode === 'publish') {
    result.managedPermit = { ...result.managedCandidate, permitId: '11111111-1111-4111-8111-111111111111' };
    delete result.managedCandidate;
  }
  return result;
};

describe('owner-approved C4 exact SEO publication', () => {
  it.each(candidates)('$t.slug previews without mutation and publishes exactly four SEO columns', async ({ t, c }) => {
    const db = transport(c.before);
    const preview = await publishContent(request(c, 'dry-run'), db.client, context);
    expect(preview.body).toMatchObject({ ok: true, dry_run: true, payload_preview: c.desired });
    expect(db.writes).toHaveLength(0); expect(db.calls).toHaveLength(0);
    const result = await publishContent(request(c), db.client, context);
    expect(result.body).toMatchObject({ ok: true, dry_run: false, saved_id: t.id });
    expect(db.writes).toHaveLength(1); expect(db.writes[0]).toEqual(c.desired);
    for (const field of t.retainedProjectionFields) expect(db.row()[field]).toEqual(c.before[field]);
    expect(db.calls).toEqual(['claim_managed_cms_release_permit', 'begin_managed_cms_release_write', 'finish_managed_cms_release_write']);
  });
  it.each(candidates)('$t.slug rejects modified copy, unrelated body changes, version drift and missing approval before a write', async ({ c }) => {
    for (const change of [
      (r: ContentPublishRequest) => { r.record = { ...r.record, seo_title_en: 'Unreviewed title' }; },
      (r: ContentPublishRequest) => { r.record = { ...r.record, content_en: 'Unreviewed body' }; },
      (r: ContentPublishRequest) => { r.expectedUpdatedAt = '2026-11-18T00:00:00Z'; },
      (r: ContentPublishRequest) => { r.ownerApproved = false; },
      (r: ContentPublishRequest) => { r.managedPermit = { ...r.managedPermit!, scope: 'different-scope' }; },
    ]) {
      const db = transport(c.before), r = request(c); change(r);
      expect((await publishContent(r, db.client, context)).body.ok).not.toBe(true);
      expect(db.writes).toHaveLength(0); expect(db.calls).toHaveLength(0);
    }
  });
  it('refuses execution outside the exact approved workflow and rejects a stale baseline', () => {
    expect(() => assertEnvironment({}, 'a'.repeat(40))).toThrow();
    const { t, c } = candidates[0];
    expect(() => assertBaseline(t, { ...c.before, updated_at: '2026-11-18T00:00:00Z' })).toThrow();
    expect(() => assertBaseline(t, { ...c.before, title_en: 'Changed elsewhere' })).toThrow();
    expect(candidates[3].c.desired.seo_title_zh).toContain('图测');
    expect(candidates).toHaveLength(4);
  });
});
