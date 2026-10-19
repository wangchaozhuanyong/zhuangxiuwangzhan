export function githubOidcTokenExpiresAt(token) {
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3) throw new Error("Invalid GitHub OIDC token format");
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid GitHub OIDC token payload");
  }
  const expiresAt = Number(payload.exp);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
    throw new Error("GitHub OIDC token has no valid expiry");
  }
  return expiresAt;
}

export function githubOidcTokenNeedsRefresh(token, nowMs = Date.now(), safetyWindowMs = 120_000) {
  return githubOidcTokenExpiresAt(token) * 1000 - nowMs <= safetyWindowMs;
}

export function isExpiredUnclaimedPermitForTarget(permit, target, nowMs = Date.now(), sameTimestamp) {
  const expiresAt = Date.parse(permit?.expires_at);
  const exactVersion = typeof sameTimestamp === "function"
    ? sameTimestamp(permit?.expected_updated_at, target.expectedUpdatedAt)
    : permit?.expected_updated_at === target.expectedUpdatedAt;
  return permit?.status === "issued"
    && permit.operation === "publish"
    && permit.task_id === target.taskId
    && permit.action_id === target.actionId
    && permit.scope === target.scope
    && permit.candidate_version === target.candidateVersion
    && permit.record_id === target.id
    && permit.slug === target.slug
    && permit.payload_sha256 === target.desiredFieldsSha256
    && permit.rollback_payload_sha256 === target.rollbackFieldsSha256
    && exactVersion
    && permit.github_run_id == null
    && permit.github_run_attempt == null
    && Number.isFinite(expiresAt)
    && expiresAt <= nowMs;
}
