import { MANAGED_TARGETS, findManagedTarget, managedAction } from "./managed-targets.ts";
import { samePgTimestamp } from "./managed-timestamp.ts";
import type { ContentPublishClient } from "./types.ts";
import { PAID_FOUR_CURRENT_TARGETS } from "../_shared/paid-four-current-targets.ts";

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
  parentRunId?: number;
  githubActorId: number;
  githubWorkflowSha: string;
  qaReceiptId: string;
  operationsDecisionId: string;
  policyDecisionId: string;
  issuerEvidenceSha256: string;
  expiresAt: string;
};

export async function issueManagedPermit(client: ContentPublishClient, input: ManagedPermitIssue, now = Date.now()) {
  const target = findManagedTarget(MANAGED_TARGETS, input.recordId, input.slug, input);
  const action = target && managedAction(target, input.operation);
  const expires = Date.parse(input.expiresAt);
  if (!target || !action || !["publish", "rollback"].includes(input.operation)
      || (input.operation === "rollback" && target.rollbackAllowed === false)
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
  if (target.baselineProjectionFields && (input.operation === "publish"
      ? !samePgTimestamp(input.expectedUpdatedAt, target.expectedUpdatedAt)
        || input.payloadSha256 !== target.desiredFieldsSha256
      : !target.rollbackFieldsSha256 || input.payloadSha256 !== target.rollbackFieldsSha256)) {
    throw new Error("Exact frozen target version or changed-fields payload digest is invalid");
  }

  let parentId: string | null = null;
  let rollbackPayloadSha256: string | null = null;
  if (input.operation === "publish") {
    if (!input.rollbackPayloadSha256 || !SHA256.test(input.rollbackPayloadSha256)
        || (target.rollbackFieldsSha256 && input.rollbackPayloadSha256 !== target.rollbackFieldsSha256)
        || input.parentPermitId || input.parentRunId !== undefined) {
      throw new Error("Publish requires the exact independently restorable prior payload digest");
    }
    rollbackPayloadSha256 = input.rollbackPayloadSha256;
  } else {
    if (!input.parentPermitId || !UUID.test(input.parentPermitId) || input.rollbackPayloadSha256) {
      throw new Error("Rollback requires a distinct completed publish permit");
    }
    if ((target.contentType === "blog" || target.requiresParentRun)
        && (!Number.isSafeInteger(input.parentRunId) || Number(input.parentRunId) <= 0)) {
      throw new Error("Managed rollback requires the exact completed parent run ID");
    }
    const { data: rawParent, error: parentError } = await client.from("managed_cms_release_permits")
      .select("*").eq("permit_id", input.parentPermitId).maybeSingle();
    const parent = rawParent as Record<string, unknown> | null;
    if (parentError || !parent || parent.status !== "completed" || parent.operation !== "publish"
        || parent.task_id !== input.taskId || parent.record_id !== input.recordId || parent.slug !== input.slug
        || parent.scope !== input.scope || parent.candidate_version !== target.candidateVersion
        || ((target.contentType === "blog" || target.requiresParentRun) && Number(parent.github_run_id) !== input.parentRunId)
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

export type ManagedPermitLookup = {
  controlAction: "lookup";
  taskId: string;
  actionId: string;
  candidateVersion: string;
  scope: string;
  recordId: string;
  slug: string;
};

/** Discover permits only for an exact registered object in its original task.
 * Old action/version/scope are returned as facts, never relabelled as this action.
 */
export async function readManagedPermitHistory(client: ContentPublishClient, input: ManagedPermitLookup) {
  const keys = ["actionId", "candidateVersion", "controlAction", "recordId", "scope", "slug", "taskId"];
  const target = PAID_FOUR_CURRENT_TARGETS.find(value => value.id === input.recordId && value.slug === input.slug);
  if (!target || input.controlAction !== "lookup" || Object.keys(input).sort().join() !== keys.join()
      || input.taskId !== target.taskId || input.actionId !== target.actionId
      || input.candidateVersion !== target.candidateVersion || input.scope !== target.scope) {
    throw new Error("Exact registered four-row permit lookup tuple required");
  }
  const { data, error } = await client.from("managed_cms_release_permits")
    .select("permit_id,status,operation,task_id,action_id,candidate_version,scope,record_id,slug,github_run_id,github_run_attempt,saved_id,saved_updated_at")
    .eq("task_id", target.taskId).eq("record_id", target.id).eq("slug", target.slug).limit(26);
  if (error || !Array.isArray(data)) throw new Error("Permit namespace lookup failed; original effects remain unknown");
  const matches = data as Array<Record<string, unknown>>;
  if (matches.some(row => row.task_id !== target.taskId || row.record_id !== target.id || row.slug !== target.slug
      || typeof row.action_id !== "string" || !row.action_id || typeof row.candidate_version !== "string" || !row.candidate_version
      || typeof row.scope !== "string" || !row.scope || typeof row.permit_id !== "string" || !UUID.test(row.permit_id))) {
    throw new Error("Permit lookup returned an unexpected identity; original effects remain unknown");
  }
  return {
    performed_write: false, taskId: target.taskId, actionId: target.actionId, candidateVersion: target.candidateVersion,
    recordId: target.id, slug: target.slug, scope: target.scope,
    auditStatus: matches.length > 25 ? "INCOMPLETE_TOO_MANY_MATCHES" : matches.length ? "MATCHES_OBSERVED" : "NO_ORIGINAL_TASK_OBJECT_RECORDS",
    completeForOriginalTaskObject: matches.length <= 25,
    historicalOrOtherNamespaceEffects: "UNKNOWN",
    permits: matches.slice(0, 25).map(row => ({ permitId: row.permit_id, status: row.status, operation: row.operation,
      actionId: row.action_id, candidateVersion: row.candidate_version, scope: row.scope,
      matchesRequestedNamespace: row.action_id === target.actionId && row.candidate_version === target.candidateVersion && row.scope === target.scope,
      githubRunId: row.github_run_id, githubRunAttempt: row.github_run_attempt,
      savedId: row.saved_id, savedUpdatedAt: row.saved_updated_at })),
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
