export const DEFAULT_PRODUCTION_BRANCH = "main";

const GENERATED_RELEASE_ARTIFACT_FILES = new Set([
  "functions/seo-manifest.json",
  "public/llms.txt",
  "public/seo-manifest.json",
  "public/sitemap.xml",
]);

export function isGeneratedReleaseArtifactPath(value) {
  const filePath = normalize(value).replaceAll("\\", "/");
  return GENERATED_RELEASE_ARTIFACT_FILES.has(filePath) || filePath.startsWith("public/images/_responsive/");
}

const normalize = (value) => String(value || "").trim();
const normalizeSha = (value) => normalize(value).toLowerCase();

export function validateProductionReleaseState({
  expectedBranch = DEFAULT_PRODUCTION_BRANCH,
  sourceBranch,
  sourceSha,
  checkedOutSha,
  dirty = false,
  requireRemote = false,
  remoteSha = "",
}) {
  const issues = [];
  const branch = normalize(sourceBranch);
  const expected = normalize(expectedBranch) || DEFAULT_PRODUCTION_BRANCH;
  const releaseSha = normalizeSha(sourceSha);
  const headSha = normalizeSha(checkedOutSha);
  const upstreamSha = normalizeSha(remoteSha);

  if (branch !== expected) {
    issues.push(`Production releases must come from "${expected}"; received "${branch || "(detached or unknown)"}".`);
  }

  if (!/^[0-9a-f]{40}$/.test(releaseSha)) {
    issues.push("The release source SHA must be a full 40-character Git commit SHA.");
  }

  if (!/^[0-9a-f]{40}$/.test(headSha)) {
    issues.push("The checked-out Git SHA could not be resolved.");
  } else if (releaseSha && releaseSha !== headSha) {
    issues.push(`The checked-out SHA (${headSha}) does not match the requested release SHA (${releaseSha}).`);
  }

  if (dirty) {
    issues.push("The Git working tree is dirty. Commit the complete change set before any production release.");
  }

  if (requireRemote) {
    if (!/^[0-9a-f]{40}$/.test(upstreamSha)) {
      issues.push(`The remote "${expected}" SHA could not be verified.`);
    } else if (headSha && upstreamSha !== headSha) {
      issues.push(`Local HEAD (${headSha}) is not the same commit as origin/${expected} (${upstreamSha}). Push or update the production branch first.`);
    }
  }

  return issues;
}
