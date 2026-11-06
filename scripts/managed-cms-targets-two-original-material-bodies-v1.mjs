import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const sourcePath = "drafts/publishing/fc-20261014-two-original-materials-exact-body-publication-v1/frozen-current-two-material-body-candidates.json";
const sourceSha256 = "e19bc7520d717db835cd0a9ea1c8154d36cf52f99fef4ef859719e76c9e94e85";
const task = "fc-20261014-two-original-materials-exact-body-publication-v1";
const identities = {"sintered-stone-grey":"00db44f6-c26a-4140-b12d-601d9fbaedf7","solid-surface-warm-white":"1bce8dd6-26b5-443b-990b-7e7d6bc9147a"};
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export function readTwoOriginalMaterialBodyCandidates(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== sourceSha256) throw new Error("Two original material frozen source bytes differ.");
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema !== "two-original-material-bodies-full59-frozen-source/v1" || source.task_id !== task
      || source.execution_department !== "publishing" || source.registration_grants_write_authority !== false
      || source.entries.length !== 2 || new Set(source.entries.map(e => e.runtime_target.id)).size !== 2) throw new Error("Original material task/executor/two-row source differs.");
  return freeze(Object.fromEntries(source.entries.map(entry => {
    const t = entry.runtime_target, b = entry.before;
    const prior = Object.fromEntries(t.changedFields.map(f => [f, b[f]]));
    const retained = Object.fromEntries(t.retainedProjectionFields.map(f => [f, b[f]]));
    if (t.id !== identities[t.slug] || t.taskId !== task || t.table !== "materials" || t.contentType !== "material"
        || entry.cli_namespace !== `two-original-material-body-${t.slug}` || t.actionId !== `save-${t.slug}-bilingual-body-v1`
        || t.candidateVersion !== `publishing-${t.slug}-exact-bilingual-body-v1-20261014`
        || t.scope !== `flashcast.com.my:materials/${t.id}:content_en,content_zh`
        || digest(t.changedFields) !== digest(["content_en", "content_zh"])
        || digest(Object.keys(entry.desired).sort()) !== digest(["content_en", "content_zh"])
        || Object.keys(b).length !== 59 || t.baselineProjectionFields.length !== 59
        || t.retainedProjectionFields.length !== 55 || t.retainedProjectionFields.filter(f => f.endsWith("_ms")).length !== 13
        || b.id !== t.id || b.slug !== t.slug || b.status !== "published" || b.updated_at !== t.expectedUpdatedAt
        || entry.baseline_is_current_CAS !== false || digest(b) !== t.baselineFieldsSha256
        || digest(entry.desired) !== t.desiredFieldsSha256 || digest(prior) !== t.rollbackFieldsSha256
        || digest(retained) !== t.retainedFieldsSha256 || t.rollbackAllowed !== false || entry.inverse_authorized !== false
        || entry.forward_tuple.action_id !== t.actionId || entry.forward_tuple.scope !== t.scope) throw new Error("Original material identity/full59/protected55/MS13/forward-only bytes differ.");
    return [entry.cli_namespace, { ...t, recordId:t.id, keyField:"id", actionClass:"cms_write", status:"published",
      exactPatchOnly:true, desiredFields:entry.desired, sourceCandidatePath:sourcePath, sourceCandidateSha256:sourceSha256,
      qaEvidenceVersion:t.candidateVersion, publicPaths:entry.public_paths, rollbackPublicPaths:[] }];
  })));
}
export const lockedTwoOriginalMaterialBodyCandidates = readTwoOriginalMaterialBodyCandidates(readFileSync(resolve(process.cwd(), sourcePath)));
