import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANAGED_TARGETS, findManagedTarget } from "../../supabase/functions/content-publish/managed-targets.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import { targetConfigs, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";

const names = ["org026-warehouse-media-r1-v6", "org026-office-renovation-media-r1-v6"];
const locked = names.map(name => targetConfigs[name].lockedCandidate);
const oldAction = "org026-service-media-cms-fields-r1-v4";
const oldVersion = "service-media-fields-r1-v5";
const migration = readFileSync("supabase/migrations/20260921194000_managed_cms_release_permits.sql", "utf8");

describe("two unsaved service rows have exact, independent managed actions", () => {
  it("uses the unchanged partial unique index in a real local SQLite engine", () => {
    // This executes real INSERT/UNIQUE failures, not an always-successful Supabase mock.
    // SQLite verifies this text-key/predicate subset only, not deployed Postgres/RLS/RPC state.
    const sql = migration.match(/create unique index if not exists managed_cms_release_permits_active_action_idx[\s\S]*?;/)?.[0];
    expect(sql).toBeDefined();
    const result = JSON.parse(execFileSync("python3", ["-c", String.raw`
import json, sqlite3, sys
x = json.load(sys.stdin)
db = sqlite3.connect(':memory:')
db.execute('create table managed_cms_release_permits (task_id text not null, action_id text not null, candidate_version text not null, record_id text not null, scope text not null, status text not null)')
db.execute(x['sql'].replace('public.managed_cms_release_permits', 'managed_cms_release_permits'))
def insert(row, status='issued'):
    db.execute('insert into managed_cms_release_permits values (?,?,?,?,?,?)', (row['taskId'],row['actionId'],row['candidateVersion'],row['recordId'],row['scope'],status))
def rejected(row):
    try:
        insert(row)
    except sqlite3.IntegrityError:
        return True
    raise AssertionError('Expected unique constraint failure')
builtin=x['builtin']
insert(builtin, 'completed')
for row in x['rows']:
    insert(row)
results={'two_distinct_rows_inserted':True, 'same_row_replay_rejected':all(rejected(row) for row in x['rows'])}
results['old_shared_key_rejected_with_completed_builtin']=all(rejected(dict(row, actionId=builtin['actionId'],candidateVersion=builtin['candidateVersion'])) for row in x['rows'])
for status in ('issued','claimed','writing','completed','uncertain'):
    row=dict(x['rows'][0],actionId='test-status-'+status)
    insert(row,status)
    assert rejected(row)
results['all_nonrevoked_statuses_block_replay']=True
row=dict(x['rows'][0], actionId='test-revoked-only')
insert(row,'revoked')
insert(row)
results['existing_revoked_predicate_preserved']=True
results['engine']='sqlite3'
results['index_sql']=x['sql']
results['builtin_completed_preserved']=db.execute("select count(*) from managed_cms_release_permits where record_id=? and status='completed'",(builtin['recordId'],)).fetchone()[0]==1
print(json.dumps(results))
`], { input: JSON.stringify({ sql, rows: locked,
      builtin: targetConfigs["org026-builtin-media-r1-v5"].lockedCandidate }), encoding: "utf8" }));
    expect(result).toMatchObject({ engine: "sqlite3", two_distinct_rows_inserted: true,
      same_row_replay_rejected: true, old_shared_key_rejected_with_completed_builtin: true,
      all_nonrevoked_statuses_block_replay: true, existing_revoked_predicate_preserved: true,
      builtin_completed_preserved: true });
    expect(new Set(locked.map(row => [row.taskId, row.actionId, row.candidateVersion].join("/"))).size).toBe(2);
  });

  it.each(names)("pins inherited media bytes and refuses shared identity for %s", name => {
    const current = targetConfigs[name].lockedCandidate;
    const original = JSON.parse(readFileSync(current.originalSourceCandidatePath, "utf8"));
    const prior = original.items.find((item: { slug: string }) => item.slug === current.slug);
    expect(current.taskId).toBe(original.task_id);
    expect(current.changedFields).toEqual(prior.allowed_fields);
    expect(current.desiredFields).toEqual(Object.fromEntries(Object.entries(prior.field_diff)
      .map(([key, value]) => [key, (value as { after: unknown }).after])));
    expect(current.desiredFieldsSha256).toBe(stableDigest(current.desiredFields));
    expect(current.priorQaEvidenceVersion).toBe(oldVersion);
    expect(current.qaEvidenceVersion).toBe(current.candidateVersion);
    expect(createHash("sha256").update(readFileSync(current.originalSourceCandidatePath)).digest("hex"))
      .toBe(current.originalSourceCandidateSha256);
    expect(targetConfigs[name.replace("r1-v6", "r1-v5")]).toBeUndefined();
    const permit = { ...current, operation: "publish" as const };
    expect(findManagedTarget(MANAGED_TARGETS, current.recordId, current.slug, permit)).toBeDefined();
    expect(findManagedTarget(MANAGED_TARGETS, current.recordId, current.slug,
      { ...permit, actionId: oldAction, candidateVersion: oldVersion })).toBeUndefined();
    expect(findManagedTarget(MANAGED_TARGETS, current.recordId, current.slug,
      { ...permit, scope: locked.find(row => row.slug !== current.slug).scope })).toBeUndefined();
  });

  it.each(names)("issuer rejects stale shared action/version before a database insert for %s", async name => {
    const row = targetConfigs[name].lockedCandidate;
    const inserted: unknown[] = [];
    const client = { from() { return { insert(value: unknown) { inserted.push(value); return this; },
      select() { return this; }, single: async () => ({ data: inserted.at(-1), error: null }) }; } } as unknown as ContentPublishClient;
    const now = Date.parse("2026-09-26T12:00:00Z");
    const request = { ...row, permitId: "11111111-1111-4111-8111-111111111111", actionClass: "cms_write" as const,
      operation: "publish" as const, payloadSha256: row.desiredFieldsSha256,
      rollbackPayloadSha256: row.baselineFieldsSha256,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40),
      qaReceiptId: "test-qa-receipt", operationsDecisionId: "test-ops-decision", policyDecisionId: "test-policy-decision",
      issuerEvidenceSha256: "b".repeat(64), expiresAt: "2026-09-26T12:10:00Z" };
    await expect(issueManagedPermit(client, { ...request, actionId: oldAction, candidateVersion: oldVersion }, now))
      .rejects.toThrow(/identity/);
    expect(inserted).toHaveLength(0);
    await expect(issueManagedPermit(client, request, now)).resolves.toMatchObject({ status: "issued" });
    expect(inserted).toHaveLength(1);
  });
});
