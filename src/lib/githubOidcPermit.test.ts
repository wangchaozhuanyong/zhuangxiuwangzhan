import { generateKeyPairSync, sign, webcrypto } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { verifyGithubOidcToken } from "../../supabase/functions/content-publish/github-oidc.ts";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-github-key", use: "sig", alg: "RS256" };
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const now = 1_800_000_000;
const validClaims = {
  iss: "https://token.actions.githubusercontent.com",
  aud: "api://flashcast-managed-cms-publish",
  repository: "wangchaozhuanyong/zhuangxiuwangzhan",
  repository_id: "1248188229",
  ref: "refs/heads/main",
  workflow_ref: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  workflow_sha: "a".repeat(40),
  event_name: "workflow_dispatch",
  run_id: "12345",
  run_attempt: "1",
  actor_id: "98765",
  jti: "unique-token",
  iat: now - 30,
  nbf: now - 30,
  exp: now + 240,
};

const tokenFor = (claims: Record<string, unknown>) => {
  const input = `${encode({ alg: "RS256", typ: "JWT", kid: "test-github-key" })}.${encode(claims)}`;
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
};
const fetcher = vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }));

describe("managed CMS GitHub OIDC verification", () => {
  beforeAll(() => vi.stubGlobal("crypto", webcrypto));
  afterAll(() => vi.unstubAllGlobals());

  it("accepts a signed exact main workflow run", async () => {
    const result = await verifyGithubOidcToken(tokenFor(validClaims), { fetcher, nowSeconds: now });
    expect(result).toEqual({ repositoryId: 1248188229, actorId: 98765, workflowRef: validClaims.workflow_ref,
      runId: 12345, runAttempt: 1, workflowSha: "a".repeat(40) });
  });

  it.each([
    { repository_id: "other-repo" },
    { ref: "refs/heads/feature" },
    { workflow_ref: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/other.yml@refs/heads/main" },
    { event_name: "pull_request" },
    { aud: "other-audience" },
    { run_id: "0" },
    { run_attempt: "0" },
    { actor_id: "0" },
  ])("rejects a signed token with wrong run or trust claim: %o", async (changes) => {
    await expect(verifyGithubOidcToken(tokenFor({ ...validClaims, ...changes }), { fetcher, nowSeconds: now }))
      .rejects.toThrow();
  });

  it("rejects a forged payload and an expired token", async () => {
    const valid = tokenFor(validClaims);
    const [header, , signature] = valid.split(".");
    const forged = `${header}.${encode({ ...validClaims, repository_id: "1" })}.${signature}`;
    await expect(verifyGithubOidcToken(forged, { fetcher, nowSeconds: now })).rejects.toThrow(/signature/);
    await expect(verifyGithubOidcToken(tokenFor({ ...validClaims, exp: now - 1 }), { fetcher, nowSeconds: now }))
      .rejects.toThrow(/expired/);
  });
});
