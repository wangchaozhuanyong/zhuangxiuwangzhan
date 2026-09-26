import { describe, expect, it } from "vitest";
import { issueManagedPermit, revokeManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import { MANAGED_AREAS, MANAGED_BLOGS, MANAGED_SERVICES } from "../../supabase/functions/content-publish/managed-targets.ts";

const now = Date.parse("2026-09-21T12:00:00Z");
const base = {
  permitId: "11111111-1111-4111-8111-111111111111",
  taskId: "fc-20260920-builtin-whole-house-custom-v1",
  actionId: "publish-builtin-whole-house-custom-v1",
  actionClass: "cms_write" as const,
  operation: "publish" as const,
  scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
  candidateVersion: "builtin-whole-house-custom-v1",
  recordId: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
  slug: "builtin",
  expectedUpdatedAt: "2026-08-30T10:55:12.151465+00:00",
  payloadSha256: "a".repeat(64),
  rollbackPayloadSha256: "b".repeat(64),
  githubActorId: 98765,
  githubWorkflowSha: "c".repeat(40),
  qaReceiptId: "qa-receipt-12345",
  operationsDecisionId: "ops-decision-12345",
  policyDecisionId: "pol-decision-12345",
  issuerEvidenceSha256: "d".repeat(64),
  expiresAt: "2026-09-21T12:10:00Z",
};

const clientFor = (parent?: Record<string, unknown>) => {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from() {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        maybeSingle: async () => ({ data: parent || null, error: null }),
        insert(row: Record<string, unknown>) { inserted.push(row); return builder; },
        single: async () => ({ data: inserted.at(-1), error: null }),
      };
      return builder;
    },
    rpc: async () => ({ data: [], error: null }),
  };
  return { client: client as unknown as ContentPublishClient, inserted };
};

describe("protected managed CMS permit issuer", () => {
  it.each([...MANAGED_SERVICES.slice(-3).filter((target) => target.rollbackAllowed !== false), ...MANAGED_AREAS, ...MANAGED_BLOGS])(
    "binds a distinct publish and rollback permit to $slug", async (target) => {
      const publish = { ...base, taskId: target.taskId, actionId: target.actionId,
        candidateVersion: target.candidateVersion, recordId: target.id, slug: target.slug, scope: target.scope };
      const issued = clientFor();
      await expect(issueManagedPermit(issued.client, publish, now)).resolves.toMatchObject({ operation: "publish" });
      const rollback = { ...publish, permitId: "22222222-2222-4222-8222-222222222222",
        actionId: `rollback-${target.candidateVersion}`,
        candidateVersion: `${target.candidateVersion}-rollback-v1`, operation: "rollback" as const,
        expectedUpdatedAt: "2026-09-21T12:01:00Z", payloadSha256: base.rollbackPayloadSha256,
        rollbackPayloadSha256: undefined, parentPermitId: base.permitId,
        parentRunId: target.contentType === "blog" || target.requiresParentRun ? 12345 : undefined };
      const parent = { status: "completed", operation: "publish", task_id: target.taskId,
        record_id: target.id, slug: target.slug, scope: target.scope,
        candidate_version: target.candidateVersion, rollback_payload_sha256: base.rollbackPayloadSha256,
        saved_updated_at: rollback.expectedUpdatedAt, github_run_id: 12345 };
      await expect(issueManagedPermit(clientFor(parent).client, rollback, now))
        .resolves.toMatchObject({ operation: "rollback" });
      await expect(issueManagedPermit(clientFor({ ...parent, record_id: "22222222-2222-4222-8222-222222222222" }).client, rollback, now))
        .rejects.toThrow(/prior version/);
      if (target.contentType === "blog" || target.requiresParentRun) {
        await expect(issueManagedPermit(clientFor(parent).client, { ...rollback, parentRunId: undefined }, now))
          .rejects.toThrow(/completed parent run ID/);
        await expect(issueManagedPermit(clientFor(parent).client, { ...rollback, parentRunId: 12344 }, now))
          .rejects.toThrow(/prior version/);
        const otherBlog = MANAGED_BLOGS.find((blog) => blog.id !== target.id)!;
        await expect(issueManagedPermit(clientFor({ ...parent, record_id: otherBlog.id, slug: otherBlog.slug }).client,
          rollback, now)).rejects.toThrow(/prior version/);
      }
    },
  );
  it.each(MANAGED_SERVICES.filter((target) => target.rollbackAllowed === false))(
    "refuses to re-expose an unverified old image for $slug", async (target) => {
      const rollback = { ...base, taskId: target.taskId, recordId: target.id, slug: target.slug,
        scope: target.scope, actionId: `rollback-${target.candidateVersion}`,
        candidateVersion: `${target.candidateVersion}-rollback-v1`, operation: "rollback" as const,
        parentPermitId: base.permitId, parentRunId: 12345, rollbackPayloadSha256: undefined };
      const { client, inserted } = clientFor();
      await expect(issueManagedPermit(client, rollback, now)).rejects.toThrow(/identity/);
      expect(inserted).toHaveLength(0);
    },
  );
  it("issues an exact short-lived unbound publish permit", async () => {
    const { client, inserted } = clientFor();
    const result = await issueManagedPermit(client, base, now);
    expect(result.status).toBe("issued");
    expect(inserted[0]).toMatchObject({
      task_id: base.taskId, action_id: base.actionId, scope: base.scope,
      rollback_payload_sha256: base.rollbackPayloadSha256, github_actor_id: 98765,
      github_run_id: null, github_run_attempt: null, status: "issued",
    });
  });

  it.each([
    { taskId: "other" }, { actionId: "other" }, { scope: "flashcast.com.my:wrong" },
    { candidateVersion: "other" }, { recordId: "11111111-1111-4111-8111-111111111111" },
    { qaReceiptId: "" }, { policyDecisionId: "free text" },
    { expiresAt: "2026-09-21T12:30:00Z" }, { githubActorId: 0 },
    { rollbackPayloadSha256: undefined },
  ])("rejects an invalid issued permit %o", async (changes) => {
    const { client, inserted } = clientFor();
    await expect(issueManagedPermit(client, { ...base, ...changes }, now)).rejects.toThrow();
    expect(inserted).toHaveLength(0);
  });

  it("only issues a rollback of the exact completed prior version", async () => {
    const rollback = {
      ...base, permitId: "22222222-2222-4222-8222-222222222222",
      operation: "rollback" as const, actionId: "rollback-builtin-whole-house-custom-v1",
      candidateVersion: "builtin-whole-house-custom-v1-rollback-v1",
      expectedUpdatedAt: "2026-09-21T12:01:00Z", payloadSha256: base.rollbackPayloadSha256,
      rollbackPayloadSha256: undefined, parentPermitId: base.permitId,
    };
    const parent = { status: "completed", operation: "publish", task_id: base.taskId,
      record_id: base.recordId, slug: base.slug, scope: base.scope,
      candidate_version: base.candidateVersion, rollback_payload_sha256: base.rollbackPayloadSha256,
      saved_updated_at: rollback.expectedUpdatedAt };
    const { client, inserted } = clientFor(parent);
    await expect(issueManagedPermit(client, rollback, now)).resolves.toMatchObject({ status: "issued", operation: "rollback" });
    expect(inserted[0].parent_permit_id).toBe(base.permitId);
    const stale = clientFor({ ...parent, saved_updated_at: "older" });
    await expect(issueManagedPermit(stale.client, rollback, now)).rejects.toThrow(/prior version/);
    expect(stale.inserted).toHaveLength(0);
  });

  it("refuses to revoke a permit after a write starts", async () => {
    const client = { rpc: async () => ({ data: [], error: null }) } as unknown as ContentPublishClient;
    await expect(revokeManagedPermit(client, base.permitId)).rejects.toThrow(/Only issued or claimed/);
  });
});
