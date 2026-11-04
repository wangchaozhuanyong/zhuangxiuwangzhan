import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "drafts/publishing/fc-20261016-industry-keyword-next-eight-pages-v1/frozen-next8-renovation-zh05971-candidate.json";
const sourceSha256 = "6c28d881f14d82d8fafd42c4d6c831487127b1a0808969c733d91b0c0e6b5e9e";
const name = "next8-renovation-zh-05971-67e79c93-cms-v1";
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

// Source-only registration is provenance, never an issuer contract or fresh execution CAS.
export function readNext8RenovationZh05971Candidate(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) {
    throw new Error("NEXT8 ZH05971 frozen source bytes differ.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  const target = source.runtime_target;
  const before = source.before;
  const retained = Object.fromEntries(target.retainedProjectionFields.map(field => [field, before[field]]));
  if (source.schema !== "next8-renovation-zh05971-single-field-frozen-source/v1"
      || source.task_id !== "fc-20261016-industry-keyword-next-eight-pages-v1"
      || source.business_scope !== "project:flashcast:industry-keyword-next-eight-pages:v1"
      || source.execution_department !== "publishing" || source.registration_grants_write_authority !== false
      || source.source_event_id !== "032f02d8-0a09-4434-a7d6-65742f4f6090"
      || source.source_registration.sha256 !== "793d3c39e9d589a417752ac1b2b4975648d8a3aba75332a9cfaa101b806987ee"
      || source.issuer_contract !== null || source.baseline_is_current_CAS !== false
      || target.id !== "0d947129-0595-43ef-baa1-0fd9d8b870e6" || target.slug !== "renovation"
      || target.table !== "services" || target.contentType !== "service" || target.taskId !== source.task_id
      || target.candidateVersion !== name || target.actionId !== `publish-${name}`
      || target.scope !== `flashcast.com.my:services:${target.id}:content_zh`
      || digest(target.changedFields) !== digest(["content_zh"])
      || digest(Object.keys(source.desired)) !== digest(["content_zh"])
      || digest(Object.keys(source.inverse_values)) !== digest(["content_zh"])
      || Object.keys(before).length !== 41 || target.baselineProjectionFields.length !== 41
      || digest([...target.baselineProjectionFields].sort()) !== digest(Object.keys(before).sort())
      || digest(target.retainedProjectionFields) !== digest(target.baselineProjectionFields.filter(
        field => !["content_zh", "updated_at", "version"].includes(field)))
      || target.retainedProjectionFields.length !== 38
      || target.retainedProjectionFields.filter(field => field.endsWith("_ms")).length !== 11
      || before.id !== target.id || before.slug !== target.slug || before.status !== "published"
      || target.expectedUpdatedAt !== before.updated_at || digest(before) !== target.baselineFieldsSha256
      || digest(source.desired) !== target.desiredFieldsSha256
      || digest(source.inverse_values) !== target.rollbackFieldsSha256
      || source.inverse_values.content_zh !== before.content_zh
      || digest(retained) !== target.retainedFieldsSha256
      || target.rollbackAllowed !== false || target.requiresParentRun !== true
      || source.conditional_inverse.inverse_issued_or_allowed !== false
      || ["required_own_completed_forward_permit_id", "required_own_completed_forward_run_id",
        "required_actual_postSaveCAS", "required_actual_postSaveVersion", "required_new_independent_inverse_permission"]
        .some(field => source.conditional_inverse[field] !== null)) {
    throw new Error("NEXT8 ZH05971 exact source, single field or protected38/MS11 differs.");
  }
  return freeze({ [name]: {
    ...target, recordId: target.id, actionClass: "cms_write", keyField: "id", status: "published",
    exactPatchOnly: true, desiredFields: source.desired, sourceCandidatePath: sourcePath,
    sourceCandidateSha256: sourceSha256, sourceRegistration: source.source_registration,
    sourceEventId: source.source_event_id, qaEvidenceVersion: name,
    publicPaths: source.public_paths, rollbackPublicPaths: source.public_paths,
  } });
}

export const lockedNext8RenovationZh05971Candidate = readNext8RenovationZh05971Candidate(
  readFileSync(resolve(process.cwd(), sourcePath)),
);
