import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "drafts/publishing/fc-20261015-industry-keywords-site-coverage-plan-v1/frozen-wardrobe15-single-row-candidate.json";
const sourceSha256 = "9c690a27592778516a93202053089b4680ada605d317767279b095624bb2b06c";
const taskId = "fc-20261015-industry-keywords-site-coverage-plan-v1";
const businessScope = "project:flashcast:industry-keywords-site-coverage-plan:v1";
const identities = {"builtin":"b401a610-a4dc-4a0b-a7e0-efcac6c81d71"};
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// The historical full rows lock the candidate; PUB still needs fresh server CAS and its own permit.
export function readWardrobe15BuiltinCandidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) {
    throw new Error("WARDROBE15 frozen single-row source bytes differ.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema !== "wardrobe15-builtin-two-field-frozen-source/v1" || source.task_id !== taskId
      || source.business_scope !== businessScope || source.execution_department !== "publishing"
      || source.registration_grants_write_authority !== false || source.entries.length !== 1) {
    throw new Error("WARDROBE15 original task, scope or executor differs.");
  }
  return freeze(Object.fromEntries(source.entries.map(entry => {
    const target = entry.runtime_target;
    const before = entry.before;
    const name = "wardrobe15-builtin-5507da74-cms-v1";
    const prior = Object.fromEntries(target.changedFields.map(field => [field, before[field]]));
    const retained = Object.fromEntries(target.retainedProjectionFields.map(field => [field, before[field]]));
    if (target.id !== identities[target.slug] || target.taskId !== taskId || target.candidateVersion !== name
        || target.actionId !== `publish-${name}` || target.table !== "services" || target.contentType !== "service"
        || target.scope !== `flashcast.com.my:services:${target.id}:content_en,content_zh`
        || digest(target.changedFields) !== digest(["content_en", "content_zh"])
        || digest(Object.keys(entry.desired).sort()) !== digest([...target.changedFields].sort())
        || Object.keys(before).length !== 41 || target.baselineProjectionFields.length !== 41
        || target.retainedProjectionFields.length !== 37
        || target.retainedProjectionFields.filter(field => field.endsWith("_ms")).length !== 11
        || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
        || before.updated_at !== target.expectedUpdatedAt || entry.baseline_is_current_CAS !== false
        || digest(before) !== target.baselineFieldsSha256 || digest(entry.desired) !== target.desiredFieldsSha256
        || digest(prior) !== target.rollbackFieldsSha256 || digest(retained) !== target.retainedFieldsSha256
        || entry.forward_tuple.action_id !== target.actionId || entry.forward_tuple.scope !== target.scope
        || entry.conditional_inverse.action_id !== `rollback-${name}`
        || entry.conditional_inverse.requiresParentRun !== true || target.requiresParentRun !== true
        || target.rollbackAllowed !== true || entry.conditional_inverse.parentPermitId !== null
        || entry.conditional_inverse.parentRunId !== null || entry.conditional_inverse.saved_updated_at !== null) {
      throw new Error("WARDROBE15 exact identity, full41, two-field digest or protected37/MS11 differs.");
    }
    const publicPaths = entry.public_paths;
    return [name, {
      ...target, recordId: target.id, actionClass: "cms_write", keyField: "id", status: "published",
      exactPatchOnly: true, desiredFields: entry.desired, sourceCandidatePath: sourcePath,
      sourceCandidateSha256: sourceSha256, qaEvidenceVersion: name,
      publicPaths, rollbackPublicPaths: publicPaths,
    }];
  })));
}

export const lockedWardrobe15BuiltinCandidates = readWardrobe15BuiltinCandidates(readFileSync(resolve(process.cwd(), sourcePath)));
