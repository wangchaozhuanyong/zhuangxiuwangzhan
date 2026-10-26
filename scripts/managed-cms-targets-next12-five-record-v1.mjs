import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "drafts/publishing/fc-20261016-industry-keyword-next-twelve-pages-v1/frozen-next12-five-row-candidates.json";
const sourceSha256 = "94e1056fa007fba85567e90fcfd591c0be016a7642be01a3ec79ac245a1de22a";
const taskId = "fc-20261016-industry-keyword-next-twelve-pages-v1";
const businessScope = "project:flashcast:industry-keyword-next-twelve-pages:v1";
const identities = {
  "warehouse": "1fab3adb-aa8c-4aab-9c30-8931152cdc91",
  "bathroom": "0f294e6d-2e2c-4f13-a93f-096728ccc6af",
  "flooring": "22782cff-239c-45ec-8075-9deaa5932269",
  "artistic-coating": "d862312d-d5f3-4bb7-9bf0-137ed71c87be",
  "approval": "912750be-05ad-40e5-b20a-d1e5c33f232f"
};
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// The historical full rows lock the candidate; PUB still needs fresh server CAS and its own permit.
export function readNext12FiveRecordCandidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) {
    throw new Error("NEXT12 frozen two-row source bytes differ.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema !== "next12-five-record-ten-field-frozen-source/v1" || source.task_id !== taskId
      || source.business_scope !== businessScope || source.execution_department !== "publishing"
      || source.registration_grants_write_authority !== false || source.entries.length !== 5) {
    throw new Error("NEXT12 original task, scope or executor differs.");
  }
  return freeze(Object.fromEntries(source.entries.map(entry => {
    const target = entry.runtime_target;
    const before = entry.before;
    const name = `next12-${target.slug}-fbe13ee7-cms-v1`;
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
      throw new Error("NEXT12 exact identity, full41, two-field digest or protected37/MS11 differs.");
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

export const lockedNext12FiveRecordCandidates = readNext12FiveRecordCandidates(readFileSync(resolve(process.cwd(), sourcePath)));
