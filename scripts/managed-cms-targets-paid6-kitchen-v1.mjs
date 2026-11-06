import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { withCompanyBrandSuffix } from "./lib/publisher-public-readback.mjs";

const sourcePath = "drafts/publishing/fc-20261017-six-keyword-matching-original-resume-v1/frozen-paid6-kitchen-channel-source.json";
const sourceSha256 = "5112ce20684ce396c958930ad30b2b74dc5a03f0d37721e1c2fb1823c7020df1";
const name = "paid6-kitchen-content-zh-native-save-v1";
const taskId = "fc-20261017-six-keyword-matching-original-resume-v1";
const scope = "flashcast.com.my:services/kitchen:content_zh:six-keyword-message-repair";
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// This dated full41 carrier is an immutable source, never an execution CAS or a permit.
export function readPaid6KitchenCandidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) {
    throw new Error("PAID6 Kitchen source bytes differ.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  const target = source.runtime_target, before = source.before, inverse = source.conditional_inverse;
  const retained = Object.fromEntries(target.retainedProjectionFields.map(field => [field, before[field]]));
  if (source.schema !== "original-professional-CMS-increment-WEB-loading-input/v1" || source.task_id !== taskId
      || source.business_scope !== "project:flashcast:original-six-keyword-source-resume:v1"
      || target.id !== "ce4156db-9034-42c8-ba29-b35724ea7d6d" || target.slug !== "kitchen"
      || target.taskId !== taskId || target.actionId !== name || target.candidateVersion !== name
      || target.table !== "services" || target.contentType !== "service" || target.scope !== scope
      || digest(target.changedFields) !== digest(["content_zh"]) || digest(Object.keys(source.desired)) !== digest(["content_zh"])
      || Object.keys(before).length !== 41 || digest(Object.keys(before).sort()) !== digest([...target.baselineProjectionFields].sort())
      || target.retainedProjectionFields.length !== 38 || target.retainedProjectionFields.filter(field => field.endsWith("_ms")).length !== 11
      || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
      || before.updated_at !== target.expectedUpdatedAt || source.baseline_only_not_execution_CAS !== true
      || digest(before) !== target.baselineFieldsSha256 || digest(source.desired) !== target.desiredFieldsSha256
      || digest({ content_zh: before.content_zh }) !== target.rollbackFieldsSha256 || digest(retained) !== target.retainedFieldsSha256
      || source.forward_tuple.action_id !== name || source.forward_tuple.scope !== scope || source.forward_tuple.execution_department !== "publishing"
      || inverse.action_id !== `rollback-${name}` || inverse.candidate_version !== `${name}-rollback-v1`
      || digest(inverse.restore_only_original_field) !== target.rollbackFieldsSha256
      || inverse.requiresParentRun !== true || target.requiresParentRun !== true || target.rollbackAllowed !== true
      || inverse.parentPermitId !== null || inverse.parentRunId !== null || inverse.saved_updated_at !== null
      || source.new_permission_issued !== false || source.remote_loaded !== false || source.production_READY !== false || source.CMS_Save !== 0) {
    throw new Error("PAID6 Kitchen exact original identity, one-field digest or full41/stable38/MS11 differs.");
  }
  const publicPaths = ["en", "zh", "ms"].map(language => ({
    path: `/${language}/services/kitchen`,
    expected: withCompanyBrandSuffix(before[`seo_title_${language}`], { brandName: "FLASH CAST", companyName: "FLASH CAST SDN. BHD." }),
    strictMetadataTitle: true,
    ...(language === "zh" ? { requiredPhrases: ["厨房橱柜内部设计：先安排收纳，再确定柜体", "咨询厨房收纳方案"] } : {}),
  }));
  const rollbackPublicPaths = publicPaths.map(({ requiredPhrases: _forwardOnly, ...page }) => page);
  return freeze({ [name]: {
    ...target, recordId: target.id, actionClass: "cms_write", keyField: "id", status: "published",
    exactPatchOnly: true, desiredFields: source.desired, sourceCandidatePath: sourcePath,
    sourceCandidateSha256: sourceSha256, qaEvidenceVersion: name, publicPaths, rollbackPublicPaths,
  } });
}

export const lockedPaid6KitchenCandidates = readPaid6KitchenCandidates(readFileSync(resolve(process.cwd(), sourcePath)));
