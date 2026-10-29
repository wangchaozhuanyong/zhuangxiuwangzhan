// One approved wardrobe body delta. No credentials or runtime company-project dependency.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const BUILTIN_WARDROBE_TARGET_NAME = "builtin-wardrobe-layout-content-zh-20261014-v1";
// The immutable package keeps its original CAS; the binding below protects the current full41 row.
const originalCandidateUpdatedAt = "2026-10-10T16:08:22.003433+00:00";
const binding = {
  "taskId": "fc-20261014-builtin-wardrobe-layout-cms-publication-v1",
  "actionId": "publish-builtin-wardrobe-layout-20261014-v1",
  "candidateVersion": "two-quality-pages-20261014-v1",
  "qaEvidenceVersion": "two-quality-pages-20261014-v1",
  "actionClass": "cms_write",
  "scope": "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71:content_zh",
  "recordId": "b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
  "slug": "builtin",
  "contentType": "service",
  "table": "services",
  "keyField": "id",
  "exactPatchOnly": true,
  "rollbackAllowed": false,
  "requiresParentRun": true,
  "expectedUpdatedAt": "2026-10-19T13:38:58.669156+00:00",
  "status": "published",
  "baselineProjectionFields": [
    "alt_en",
    "alt_ms",
    "alt_zh",
    "common_projects_en",
    "common_projects_ms",
    "common_projects_zh",
    "content_en",
    "content_ms",
    "content_zh",
    "created_at",
    "excerpt_en",
    "excerpt_ms",
    "excerpt_zh",
    "faqs_en",
    "faqs_ms",
    "faqs_zh",
    "id",
    "image_url",
    "process_steps_en",
    "process_steps_ms",
    "process_steps_zh",
    "scope_items_en",
    "scope_items_ms",
    "scope_items_zh",
    "seo_description_en",
    "seo_description_ms",
    "seo_description_zh",
    "seo_title_en",
    "seo_title_ms",
    "seo_title_zh",
    "slug",
    "sort_order",
    "status",
    "suitable_for_en",
    "suitable_for_ms",
    "suitable_for_zh",
    "title_en",
    "title_ms",
    "title_zh",
    "updated_at",
    "version"
  ],
  "baselineFieldsSha256": "eb83ce810a081c29fb3a1463c939aedb5b70767afd7ac8f3b90d3f80011c6ed1",
  "desiredFieldsSha256": "ac15ee387764d4a7420edc106cc2b078b3f28ce273d608664cf18ef00ec57e83",
  "rollbackFieldsSha256": "1d40ca43cd2b1e0ccfaee66a6c75e762c0e5c24e89c964839a38e20b2f4b1af2",
  "changedFields": [
    "content_zh"
  ],
  "retainedProjectionFields": [
    "alt_en",
    "alt_ms",
    "alt_zh",
    "common_projects_en",
    "common_projects_ms",
    "common_projects_zh",
    "content_en",
    "content_ms",
    "created_at",
    "excerpt_en",
    "excerpt_ms",
    "excerpt_zh",
    "faqs_en",
    "faqs_ms",
    "faqs_zh",
    "id",
    "image_url",
    "process_steps_en",
    "process_steps_ms",
    "process_steps_zh",
    "scope_items_en",
    "scope_items_ms",
    "scope_items_zh",
    "seo_description_en",
    "seo_description_ms",
    "seo_description_zh",
    "seo_title_en",
    "seo_title_ms",
    "seo_title_zh",
    "slug",
    "sort_order",
    "status",
    "suitable_for_en",
    "suitable_for_ms",
    "suitable_for_zh",
    "title_en",
    "title_ms",
    "title_zh"
  ],
  "retainedFieldsSha256": "a9af893ab394b19e293cedc1d34568ab65c0411236fca339eed00526e1483bc4",
  "sourceCandidatePath": "drafts/publishing/fc-20261014-builtin-wardrobe-layout-cms-publication-v1/builtin.typed-preview-input.json",
  "sourceCandidateSha256": "09dea94387fd851e2684ce2b9cf0abe8f98d671f9f321b0b2257816ab0ac9f78",
  "sourceProvenanceSha256": "c3963750644d81cf06da8a9c75c37d46da042deaddc4aedb8c3f16bbf176f699",
  "publicPaths": [
    {
      "path": "/zh/services/builtin",
      "expected": "全屋定制与定制家具｜衣柜、电视柜、收纳柜｜FLASH CAST",
      "requiredPhrases": [
        "衣柜设计与布局规划",
        "先整理需要悬挂、折叠及放入抽屉的物品",
        "30 公里",
        "/zh/quote"
      ],
      "strictMetadataTitle": true
    },
    {
      "path": "/en/services/builtin",
      "expected": "Custom Built-In Furniture & Wardrobes | FLASH CAST",
      "strictMetadataTitle": true
    }
  ]
};
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = value => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export function readBuiltinWardrobeCandidate(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== binding.sourceCandidateSha256) {
    throw new Error("Wardrobe candidate package hash differs.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema_version !== 1 || source.task_id !== binding.taskId || source.action_id !== binding.actionId
    || source.candidate_version !== binding.candidateVersion || source.scope !== binding.scope
    || source.record_id !== binding.recordId || source.slug !== binding.slug
    || source.expected_updated_at !== originalCandidateUpdatedAt
    || digest(source.changed_fields) !== digest(binding.changedFields)
    || digest(Object.keys(source.desired_fields || {}).sort()) !== digest(binding.changedFields)
    || digest(source.desired_fields) !== binding.desiredFieldsSha256
    || digest(source.source_provenance) !== binding.sourceProvenanceSha256) {
    throw new Error("Wardrobe identity, provenance or one-field payload differs.");
  }
  return freeze({ ...binding, desiredFields: source.desired_fields });
}
export const lockedBuiltinWardrobeCandidates = freeze({
  [BUILTIN_WARDROBE_TARGET_NAME]: readBuiltinWardrobeCandidate(readFileSync(resolve(process.cwd(), binding.sourceCandidatePath))),
});
