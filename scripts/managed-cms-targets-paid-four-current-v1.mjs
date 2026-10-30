import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "drafts/paid-four-content-zh-channel-20261030-v1/frozen-four-row-candidates.json";
const sourceSha256 = "99d627e9f75dc1d51effa80fdce17fa364601f6748c7ac5b23b2c410396dc7e2";
const taskId = "fc-20260920-google-ads-rm100-budget-plan";
const identities = {
  design: ["0af89b93-8938-4a98-ba65-6525fbbe92c1", "21a1a1ad2a3b66a30ac7b011"],
  kitchen: ["ce4156db-9034-42c8-ba29-b35724ea7d6d", "621f604c3a2e460c60b61438"],
  "shop-renovation": ["32f5374f-9919-41ea-80c7-00b5ac917532", "0f31548d5b630ef286d45894"],
  "office-renovation": ["a87541ac-1cba-4f1a-972d-428dccdbcc0f", "18538003e7a4ec9d9c54533b"],
};
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// Only the original four exact content_zh contributions; this creates no authority.
export function readPaidFourCurrentCandidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) throw new Error("Four-row frozen source bytes differ.");
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema !== "paid-four-content-zh-full41-current-stage-frozen-source/v1" || source.task_id !== taskId
      || source.business_owner !== "paid-growth-data" || source.execution_department !== "publishing"
      || source.registration_grants_write_authority !== false || source.entries.length !== 4
      || source.original_candidate_sha256 !== "2a47c39c4b6349c55c83130bec81f3309d67fb8af5a0ced02523b8d674f994e6"
      || source.execution_metadata_event !== "bcffa7d9-e7ad-40f6-b6de-db2b90ded472"
      || source.execution_metadata_source.sha256 !== "e52769d4a792e085aed9977a5b03cf75c19e4aa5b3815fe3bfdee03cb32f7ea8") {
    throw new Error("Four-row original source lineage differs.");
  }
  const seen = new Set();
  return freeze(Object.fromEntries(source.entries.map(entry => {
    const target = entry.runtime_target, before = entry.before;
    const identity = identities[target.slug];
    const name = identity && `current-stage-source-${identity[1]}`;
    const fields = Object.keys(before).sort();
    const retained = fields.filter(field => !["content_zh", "created_at", "updated_at", "version"].includes(field));
    if (!identity || seen.has(target.slug) || target.id !== identity[0] || target.taskId !== taskId
        || entry.cli_namespace !== name || target.candidateVersion !== name
        || target.actionId !== `current-stage-cms-${identity[1]}` || target.table !== "services" || target.contentType !== "service"
        || target.scope !== `flashcast.com.my:services:${target.id}:content_zh`
        || digest(target.changedFields) !== digest(["content_zh"]) || digest(Object.keys(entry.desired)) !== digest(["content_zh"])
        || fields.length !== 41 || retained.length !== 37 || retained.filter(field => field.endsWith("_ms")).length !== 11
        || digest(fields) !== digest(target.baselineProjectionFields) || digest(retained) !== digest(target.retainedProjectionFields)
        || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
        || before.updated_at !== target.expectedUpdatedAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}[+-]\d{2}:\d{2}$/.test(before.updated_at)
        || digest(before) !== target.baselineFieldsSha256 || digest(entry.desired) !== target.desiredFieldsSha256
        || digest({ content_zh: before.content_zh }) !== target.rollbackFieldsSha256
        || digest(Object.fromEntries(retained.map(field => [field, before[field]]))) !== target.retainedFieldsSha256
        || createHash("sha256").update(before.content_zh).digest("hex") !== entry.content_before_sha256
        || createHash("sha256").update(entry.desired.content_zh).digest("hex") !== entry.content_desired_sha256
        || !entry.desired.content_zh.startsWith(before.content_zh) || entry.desired.content_zh === before.content_zh
        || target.rollbackAllowed !== false || target.requiresParentRun !== true || entry.inverse_authorized !== false
        || entry.baseline_is_current_CAS !== false || entry.original_key_effect !== "UNKNOWN") {
      throw new Error("Four-row exact identity, full41/MS11, digests or forward-only bounds differ.");
    }
    seen.add(target.slug);
    return [name, { ...target, recordId: target.id, keyField: "id", actionClass: "cms_write", status: "published",
      exactPatchOnly: true, desiredFields: entry.desired, sourceCandidatePath: sourcePath, sourceCandidateSha256: sourceSha256,
      qaEvidenceVersion: name, publicPaths: entry.public_paths, rollbackPublicPaths: [] }];
  })));
}

export const lockedPaidFourCurrentCandidates = readPaidFourCurrentCandidates(readFileSync(resolve(process.cwd(), sourcePath)));

// For the existing protected issuer control endpoint, never a permit or direct DB query.
export function buildPaidFourPermitLookup(namespace) {
  const target = lockedPaidFourCurrentCandidates[namespace];
  if (!target) throw new Error("Exact registered four-row namespace required.");
  const { taskId, actionId, candidateVersion, scope, slug, recordId } = target;
  return { controlAction: "lookup", taskId, actionId, candidateVersion, scope, slug, recordId };
}
