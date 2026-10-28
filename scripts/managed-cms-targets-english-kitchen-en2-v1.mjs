import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const sourcePath = "drafts/publishing/fc-20261011-english-kitchen-actual-publication-goal-v1/frozen-current-english-kitchen-en2-candidate.json";
const sourceSha256 = "de0a46edf4d5505cfc11c57eb343cf75374fb59c76ca3fddcb04e5dba26454f5";
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export function readEnglishKitchenEn2Candidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) throw new Error("EN2 frozen current source bytes differ.");
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema !== "english-kitchen-en2-full41-frozen-source/v1" || source.task_id !== "fc-20261011-english-kitchen-actual-publication-goal-v1"
      || source.business_scope !== "cms:services:kitchen:english-two-fields:publication:v1" || source.execution_department !== "publishing"
      || source.registration_grants_write_authority !== false || source.entries.length !== 1) throw new Error("EN2 original source identity differs.");
  const entry = source.entries[0], target = entry.runtime_target, before = entry.before;
  const prior = Object.fromEntries(target.changedFields.map(field => [field, before[field]]));
  const retained = Object.fromEntries(target.retainedProjectionFields.map(field => [field, before[field]]));
  if (entry.cli_namespace !== "english-kitchen-en2-exact-v1" || target.taskId !== "fc-20261011-english-kitchen-actual-publication-goal-v1"
      || target.actionId !== "save-kitchen-english-two-fields-v1" || target.candidateVersion !== "publishing-english-kitchen-en2-actual-publication-v1-20261011"
      || target.id !== "ce4156db-9034-42c8-ba29-b35724ea7d6d" || target.slug !== "kitchen"
      || target.table !== "services" || target.contentType !== "service"
      || target.scope !== `flashcast.com.my:services:${target.id}:title_en,excerpt_en`
      || digest(target.changedFields) !== digest(["title_en", "excerpt_en"])
      || digest(Object.keys(entry.desired).sort()) !== digest(["excerpt_en", "title_en"])
      || Object.keys(before).length !== 41 || target.baselineProjectionFields.length !== 41
      || target.retainedProjectionFields.length !== 37 || target.retainedProjectionFields.filter(f => f.endsWith("_ms")).length !== 11
      || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
      || before.updated_at !== target.expectedUpdatedAt || entry.baseline_is_current_CAS !== false
      || digest(before) !== target.baselineFieldsSha256 || digest(entry.desired) !== target.desiredFieldsSha256
      || digest(prior) !== target.rollbackFieldsSha256 || digest(retained) !== target.retainedFieldsSha256
      || target.rollbackAllowed !== false || entry.inverse_authorized !== false
      || entry.forward_tuple.scope !== target.scope || entry.forward_tuple.action_id !== target.actionId) throw new Error("EN2 exact full41/37/MS11, original action/version or forward-only bounds differ.");
  return freeze({ ["english-kitchen-en2-exact-v1"]: { ...target, recordId: target.id, keyField: "id", actionClass: "cms_write", status: "published",
    exactPatchOnly: true, desiredFields: entry.desired, sourceCandidatePath: sourcePath, sourceCandidateSha256: sourceSha256,
    qaEvidenceVersion: "publishing-english-kitchen-en2-actual-publication-v1-20261011", publicPaths: entry.public_paths, rollbackPublicPaths: [] } });
}
export const lockedEnglishKitchenEn2Candidates = readEnglishKitchenEn2Candidates(readFileSync(resolve(process.cwd(), sourcePath)));
