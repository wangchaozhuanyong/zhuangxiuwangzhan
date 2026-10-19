import assert from "node:assert/strict";
import test from "node:test";
import {
  githubOidcTokenExpiresAt,
  githubOidcTokenNeedsRefresh,
  isExpiredUnclaimedPermitForTarget,
} from "./malay-publish-runtime.mjs";

const jwt = (exp) => `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;

test("OIDC refresh guard uses a two-minute safety window", () => {
  const token = jwt(1_800_000_000);
  assert.equal(githubOidcTokenExpiresAt(token), 1_800_000_000);
  assert.equal(githubOidcTokenNeedsRefresh(token, 1_799_999_000_000), false);
  assert.equal(githubOidcTokenNeedsRefresh(token, 1_799_999_879_000), false);
  assert.equal(githubOidcTokenNeedsRefresh(token, 1_799_999_880_000), true);
  assert.equal(githubOidcTokenNeedsRefresh(token, 1_800_000_001_000), true);
});

test("OIDC expiry parsing rejects malformed or non-expiring tokens", () => {
  assert.throws(() => githubOidcTokenExpiresAt("not-a-jwt"), /format/);
  assert.throws(() => githubOidcTokenExpiresAt(jwt("soon")), /expiry/);
});

test("only an exact expired and unclaimed issued permit is revocable", () => {
  const target = {
    id: "5580c9cb-eef1-4ae6-9172-450b091ccb9a",
    slug: "approval",
    taskId: "fc-20261019-malay-cms-completion-v1",
    actionId: "publish-malay-cms_content_entries-5580c9cb",
    candidateVersion: "malay-cms-continuation-v1-5580c9cb",
    scope: "flashcast.com.my:cms_content_entries/5580c9cb-eef1-4ae6-9172-450b091ccb9a:content_ms,data_ms,excerpt_ms,title_ms:malay-v1",
    desiredFieldsSha256: "d".repeat(64),
    rollbackFieldsSha256: "b".repeat(64),
    expectedUpdatedAt: "2026-05-30T06:59:02.880827+00:00",
  };
  const permit = {
    status: "issued", operation: "publish", task_id: target.taskId,
    action_id: target.actionId, scope: target.scope, candidate_version: target.candidateVersion,
    record_id: target.id, slug: target.slug, payload_sha256: target.desiredFieldsSha256,
    rollback_payload_sha256: target.rollbackFieldsSha256, expected_updated_at: target.expectedUpdatedAt,
    github_run_id: null, github_run_attempt: null, expires_at: "2026-10-19T12:00:00.000Z",
  };
  const now = Date.parse("2026-10-19T13:00:00.000Z");
  const sameTimestamp = (left, right) => left === right;
  assert.equal(isExpiredUnclaimedPermitForTarget(permit, target, now, sameTimestamp), true);
  assert.equal(isExpiredUnclaimedPermitForTarget({ ...permit, expires_at: "2026-10-19T14:00:00Z" }, target, now, sameTimestamp), false);
  assert.equal(isExpiredUnclaimedPermitForTarget({ ...permit, status: "claimed" }, target, now, sameTimestamp), false);
  assert.equal(isExpiredUnclaimedPermitForTarget({ ...permit, github_run_id: 39254399470 }, target, now, sameTimestamp), false);
  assert.equal(isExpiredUnclaimedPermitForTarget({ ...permit, scope: "other-scope" }, target, now, sameTimestamp), false);
  assert.equal(isExpiredUnclaimedPermitForTarget({ ...permit, expected_updated_at: "2026-05-30T06:59:02.880828+00:00" }, target, now, sameTimestamp), false);
});
