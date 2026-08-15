const requiredEnvironment = [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_PAGES_PROJECT_NAME",
];

const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingEnvironment.length > 0) {
  console.error(
    `[verify-cloudflare-pages-token] Missing environment: ${missingEnvironment.join(", ")}`,
  );
  process.exit(1);
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN.trim();
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME.trim();
const apiBaseUrl = "https://api.cloudflare.com/client/v4";

const requestCloudflare = async (path, description) => {
  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "request failed";
    throw new Error(`${description} could not reach Cloudflare: ${reason}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${description} returned an invalid response (HTTP ${response.status})`);
  }

  if (!response.ok || payload?.success !== true) {
    const errorCodes = Array.isArray(payload?.errors)
      ? payload.errors.map((error) => error?.code).filter(Boolean).join(", ")
      : "";
    const codeSuffix = errorCodes ? `; Cloudflare codes: ${errorCodes}` : "";
    throw new Error(`${description} failed (HTTP ${response.status}${codeSuffix})`);
  }

  return payload.result;
};

try {
  const token = await requestCloudflare(
    `/accounts/${encodeURIComponent(accountId)}/tokens/verify`,
    "Account token verification",
  );

  if (token?.status !== "active") {
    throw new Error(`Account token is not active (status: ${token?.status || "unknown"})`);
  }

  const project = await requestCloudflare(
    `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`,
    "Pages project access check",
  );

  if (project?.name !== projectName) {
    throw new Error("Pages project access check returned an unexpected project");
  }

  console.log(
    `[verify-cloudflare-pages-token] OK: token active and Pages project "${projectName}" accessible.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown verification error";
  console.error(`[verify-cloudflare-pages-token] ${message}`);
  process.exit(1);
}
