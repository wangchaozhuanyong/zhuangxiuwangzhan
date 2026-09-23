import { MANAGED_TARGETS, managedAction } from "./managed-targets.ts";
import { samePgTimestamp } from "./managed-timestamp.ts";
import type { ContentPublishClient } from "./types.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const SHA1 = /^[0-9a-f]{40}$/;
const REF = /^[A-Za-z0-9_.:-]{8,180}$/;
const WORKFLOW_REF = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const REPOSITORY_ID = 1248188229;

export type ManagedPermitIssue = {
  permitId: string;
  taskId: string;
  actionId: string;
  actionClass: "cms_write";
  operation: "publish" | "rollback";
  scope: string;
  candidateVersion: string;
  recordId: string;
  slug: string;
  expectedUpdatedAt: string;
  payloadSha256: string;
  rollbackPayloadSha256?: string;
  parentPermitId?: string;
  githubActorId: number;
  githubWorkflowSha: string;
  qaReceiptId: string;
  operationsDecisionId: string;
  policyDecisionId: string;
  issuerEvidenceSha256: string;
  expiresAt: string;
};

export async function issueManagedPermit(client: ContentPublishClient, input: ManagedPermitIssue, now = Date.now()) {
  const target = MANAGED_TARGETS.find((item) => item.id === input.recordId && item.slug === input.slug);
  const action = target && managedAction(target, input.operation);
  const expires = Date.parse(input.expiresAt);
  if (!target || !action || !["publish", "rollback"].includes(input.operation)
      || !UUID.test(input.permitId) || input.actionClass !== "cms_write"
      || input.taskId !== action.taskId || input.actionId !== action.actionId
      || input.scope !== action.scope || input.candidateVersion !== action.candidateVersion
      || !input.expectedUpdatedAt || !Number.isFinite(Date.parse(input.expectedUpdatedAt))
      || !SHA256.test(input.payloadSha256) || !SHA256.test(input.issuerEvidenceSha256)
      || !SHA1.test(input.githubWorkflowSha) || !Number.isSafeInteger(input.githubActorId) || input.githubActorId <= 0
      || ![input.qaReceiptId, input.operationsDecisionId, input.policyDecisionId].every((id) => REF.test(id))
      || !Number.isFinite(expires) || expires <= now || expires > now + 15 * 60_000) {
    throw new Error("Managed permit identity, evidence, or short expiry is invalid");
  }

  let parentId: string | null = null;
  let rollbackPayloadSha256: string | null = null;
  if (input.operation === "publish") {
    if (!input.rollbackPayloadSha256 || !SHA256.test(input.rollbackPayloadSha256) || input.parentPermitId) {
      throw new Error("Publish requires the exact independently restorable prior payload digest");
    }
    rollbackPayloadSha256 = input.rollbackPayloadSha256;
  } else {
    if (!input.parentPermitId || !UUID.test(input.parentPermitId) || input.rollbackPayloadSha256) {
      throw new Error("Rollback requires a distinct completed publish permit");
    }
    const { data: rawParent, error: parentError } = await client.from("managed_cms_release_permits")
      .select("*").eq("permit_id", input.parentPermitId).maybeSingle();
    const parent = rawParent as Record<string, unknown> | null;
    if (parentError || !parent || parent.status !== "completed" || parent.operation !== "publish"
        || parent.task_id !== input.taskId || parent.record_id !== input.recordId || parent.slug !== input.slug
        || parent.scope !== input.scope || parent.candidate_version !== target.candidateVersion
        || parent.rollback_payload_sha256 !== input.payloadSha256
        || !samePgTimestamp(parent.saved_updated_at, input.expectedUpdatedAt)) {
      throw new Error("Rollback does not restore the completed candidate's exact prior version");
    }
    parentId = input.parentPermitId;
  }

  const { data, error } = await client.from("managed_cms_release_permits").insert({
    permit_id: input.permitId,
    task_id: input.taskId,
    action_id: input.actionId,
    action_class: input.actionClass,
    operation: input.operation,
    scope: input.scope,
    candidate_version: input.candidateVersion,
    record_id: input.recordId,
    slug: input.slug,
    expected_updated_at: input.expectedUpdatedAt,
    payload_sha256: input.payloadSha256,
    rollback_payload_sha256: rollbackPayloadSha256,
    parent_permit_id: parentId,
    github_repository_id: REPOSITORY_ID,
    github_workflow_ref: WORKFLOW_REF,
    github_workflow_sha: input.githubWorkflowSha,
    github_actor_id: input.githubActorId,
    github_run_id: null,
    github_run_attempt: null,
    qa_receipt_id: input.qaReceiptId,
    operations_decision_id: input.operationsDecisionId,
    policy_decision_id: input.policyDecisionId,
    issuer_evidence_sha256: input.issuerEvidenceSha256,
    expires_at: input.expiresAt,
    status: "issued",
  }).select("*").single();
  if (error || !data) throw new Error(`Managed permit insert failed: ${error?.message || "no row"}`);
  return { permitId: input.permitId, status: "issued", operation: input.operation, expiresAt: input.expiresAt };
}

export async function readManagedPermit(client: ContentPublishClient, permitId: string) {
  if (!UUID.test(permitId)) throw new Error("Invalid permit ID");
  const { data, error } = await client.from("managed_cms_release_permits").select("*").eq("permit_id", permitId).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as Record<string, unknown> | null;
  if (!row) return null;
  return {
    permitId, status: row.status, operation: row.operation,
    taskId: row.task_id, actionId: row.action_id, candidateVersion: row.candidate_version,
    githubRunId: row.github_run_id, githubRunAttempt: row.github_run_attempt,
    savedId: row.saved_id, savedUpdatedAt: row.saved_updated_at,
  };
}

export async function revokeManagedPermit(client: ContentPublishClient, permitId: string) {
  if (!UUID.test(permitId)) throw new Error("Invalid permit ID");
  const { data, error } = await client.rpc("revoke_managed_cms_release_permit", { p_permit_id: permitId });
  if (error || !Array.isArray(data) || data.length !== 1) {
    throw new Error("Only issued or claimed permits may be revoked");
  }
  return { permitId, status: "revoked" };
}
