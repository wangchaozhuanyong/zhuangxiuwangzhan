const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
const AUDIENCE = "api://flashcast-managed-cms-publish";
const REPOSITORY = "wangchaozhuanyong/zhuangxiuwangzhan";
const REPOSITORY_ID = "1248188229";
const WORKFLOW_REF = `${REPOSITORY}/.github/workflows/content-publish-approved.yml@refs/heads/main`;

export type GithubRunIdentity = {
  repositoryId: number;
  actorId: number;
  workflowRef: string;
  runId: number;
  runAttempt: number;
  workflowSha: string;
};

const decodeBase64Url = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid GitHub OIDC encoding");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const decodeJson = (value: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid GitHub OIDC JSON");
  return parsed as Record<string, unknown>;
};

export async function verifyGithubOidcToken(
  token: string,
  options: { fetcher?: typeof fetch; nowSeconds?: number } = {},
): Promise<GithubRunIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 12000) throw new Error("Invalid GitHub OIDC token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson(encodedHeader);
  const claims = decodeJson(encodedPayload);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new Error("Unsupported GitHub OIDC signing key");
  }

  const response = await (options.fetcher || fetch)(JWKS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("GitHub OIDC JWKS unavailable");
  const jwks: unknown = await response.json();
  const keys = jwks && typeof jwks === "object" && "keys" in jwks ? (jwks as { keys?: unknown }).keys : null;
  if (!Array.isArray(keys)) throw new Error("Invalid GitHub OIDC JWKS");
  const jwk = keys.find((key) => key && typeof key === "object" && key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
  if (!jwk) throw new Error("GitHub OIDC signing key not found");
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signingInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signatureValid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" }, publicKey, decodeBase64Url(encodedSignature), signingInput,
  );
  if (!signatureValid) throw new Error("Invalid GitHub OIDC signature");

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = Number(claims.exp);
  const iat = Number(claims.iat);
  const nbf = Number(claims.nbf ?? iat);
  if (!Number.isInteger(exp) || !Number.isInteger(iat) || !Number.isInteger(nbf)
      || exp <= now || iat > now + 60 || nbf > now + 60 || exp - iat > 600) {
    throw new Error("GitHub OIDC token expired or invalid time window");
  }
  if (claims.iss !== ISSUER || claims.aud !== AUDIENCE || claims.repository !== REPOSITORY
      || String(claims.repository_id) !== REPOSITORY_ID || claims.ref !== "refs/heads/main"
      || claims.workflow_ref !== WORKFLOW_REF || claims.event_name !== "workflow_dispatch"
      || typeof claims.jti !== "string" || !claims.jti) {
    throw new Error("GitHub OIDC workflow identity mismatch");
  }
  const runId = Number(claims.run_id);
  const runAttempt = Number(claims.run_attempt);
  const actorId = Number(claims.actor_id);
  const workflowSha = String(claims.workflow_sha || "");
  if (!Number.isSafeInteger(runId) || runId <= 0 || !Number.isSafeInteger(runAttempt) || runAttempt <= 0
      || !Number.isSafeInteger(actorId) || actorId <= 0
      || !/^[0-9a-f]{40}$/.test(workflowSha)) {
    throw new Error("Invalid GitHub OIDC run identity");
  }
  return { repositoryId: Number(REPOSITORY_ID), actorId, workflowRef: WORKFLOW_REF, runId, runAttempt, workflowSha };
}
