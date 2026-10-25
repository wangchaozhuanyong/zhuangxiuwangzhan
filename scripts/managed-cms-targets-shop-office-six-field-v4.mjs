// Frozen public CMS rows and approved V4 deltas; no dependency on the controller checkout.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const sourcePath = "drafts/publishing/fc-20261025-shop-office-existing-six-and-five-implementation-release-v1/frozen-two-row-candidates.json";
const sourceSha256 = "b4d30f0ec821b3e8a8f7643de6820e2a7c1c66927474f81c3e7ef6cd1b0649bc";
// Keep the packaged business scope intact and bind only these two permit targets to the site.
const executionScope = "flashcast.com.my:shop-office:existing-six-fields-and-five-blocks:20261025:v1";
const bytes = readFileSync(resolve(process.cwd(), sourcePath));
if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) throw new Error("Shop/office frozen input differs.");
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const source = JSON.parse(bytes.toString("utf8"));
export const lockedShopOfficeSixFieldCandidates = freeze(Object.fromEntries(source.entries.map(entry => {
  const target = entry.runtime_target;
  const before = entry.before;
  const prior = Object.fromEntries(target.changedFields.map(field => [field, before[field]]));
  const retained = Object.fromEntries(target.retainedProjectionFields.map(field => [field, before[field]]));
  if (digest(before) !== target.baselineFieldsSha256 || digest(entry.desired) !== target.desiredFieldsSha256
      || digest(prior) !== target.rollbackFieldsSha256 || digest(retained) !== target.retainedFieldsSha256
      || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
      || before.updated_at !== target.expectedUpdatedAt || target.taskId !== source.task_id) {
    throw new Error("Shop/office identity, complete baseline, retained fields or exact delta differs.");
  }
  return [target.candidateVersion, {
    ...target, scope: executionScope, recordId: target.id, actionClass: "cms_write", keyField: "id", status: "published",
    // Explicit recovery extension; the packaged original forward tuple remains intact.
    rollbackAllowed: true, requiresParentRun: true,
    exactPatchOnly: true, desiredFields: entry.desired, sourceCandidatePath: sourcePath,
    sourceCandidateSha256: sourceSha256, qaEvidenceVersion: target.candidateVersion,
    publicPaths: ["zh", "en"].map(language => ({ path: `/${language}/services/${target.slug}`,
      expected: before[`seo_title_${language}`], strictMetadataTitle: true })),
  }];
})));
