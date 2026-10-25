import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const binding = {
  "id": "73142986-7a86-453e-8843-75d1239879ad",
  "slug": "built-in-cabinet-cost-malaysia",
  "contentType": "blog",
  "table": "blog_posts",
  "taskId": "fc-20261025-seo-index-evidence-and-release-followthrough-v1",
  "actionId": "publish-seo-cabinet-two-anchors-8520112a-v1",
  "candidateVersion": "seo-cabinet-two-anchors-8520112a-v1",
  "scope": "flashcast.com.my:blog_posts:73142986-7a86-453e-8843-75d1239879ad:content_en,content_zh",
  "changedFields": [
    "content_en",
    "content_zh"
  ],
  "baselineProjectionFields": [
    "alt_en",
    "alt_ms",
    "alt_zh",
    "category",
    "content_en",
    "content_ms",
    "content_zh",
    "cover_image_url",
    "created_at",
    "excerpt_en",
    "excerpt_ms",
    "excerpt_zh",
    "id",
    "published_at",
    "seo_description_en",
    "seo_description_ms",
    "seo_description_zh",
    "seo_title_en",
    "seo_title_ms",
    "seo_title_zh",
    "slug",
    "sort_order",
    "status",
    "tags",
    "title_en",
    "title_ms",
    "title_zh",
    "updated_at",
    "version"
  ],
  "baselineFieldsSha256": "02abda7530e39afdf78e8eb97f7c8701d895cc4049407a8bdac02a2745e67b8e",
  "desiredFieldsSha256": "33be85aa539f387b05d137278eb51b369c0f69d7419f612c32588c67d66c97cb",
  "rollbackFieldsSha256": "04829c856bea29419d4c6a7d26e29e48a1fe5f57440403abc4c57a672138f6df",
  "expectedUpdatedAt": "2026-10-18T15:10:14.544707+00:00",
  "retainedProjectionFields": [
    "alt_en",
    "alt_ms",
    "alt_zh",
    "category",
    "content_ms",
    "cover_image_url",
    "created_at",
    "excerpt_en",
    "excerpt_ms",
    "excerpt_zh",
    "id",
    "published_at",
    "seo_description_en",
    "seo_description_ms",
    "seo_description_zh",
    "seo_title_en",
    "seo_title_ms",
    "seo_title_zh",
    "slug",
    "sort_order",
    "status",
    "tags",
    "title_en",
    "title_ms",
    "title_zh"
  ],
  "retainedFieldsSha256": "07e096b91615267bceee31c9053c461f67100fe41c2fc158cf665a9c87832602",
  "rollbackAllowed": true,
  "requiresParentRun": true,
  "recordId": "73142986-7a86-453e-8843-75d1239879ad",
  "keyField": "id",
  "status": "published",
  "exactPatchOnly": true,
  "sourceCandidatePath": "drafts/publishing/fc-20261025-seo-index-evidence-and-release-followthrough-v1/frozen-cabinet-two-anchors.json",
  "sourceCandidateSha256": "80e5c05062703b46f59ff697d03a3cce37aebc4878d4135e3182b422df3bf7ec",
  "qaEvidenceVersion": "seo-cabinet-two-anchors-8520112a-v1",
  "publicPaths": [
    {
      "path": "/zh/blog/built-in-cabinet-cost-malaysia",
      "expected": "马来西亚定制内嵌柜价格指南",
      "strictMetadataTitle": true
    },
    {
      "path": "/en/blog/built-in-cabinet-cost-malaysia",
      "expected": "Built-In Cabinet Cost in Malaysia",
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
export function readSeoCabinetTwoAnchorCandidate(bytes) {
  if (createHash("sha256").update(bytes).digest("hex") !== binding.sourceCandidateSha256) {
    throw new Error("Cabinet two-anchor source bytes differ.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  const before = source.before;
  const prior = Object.fromEntries(binding.changedFields.map(field => [field, before[field]]));
  const retained = Object.fromEntries(binding.retainedProjectionFields.map(field => [field, before[field]]));
  if (source.schema !== "seo-cabinet-two-anchor-frozen-source/v1" || source.task_id !== binding.taskId
      || source.business_scope !== "project:flashcast:seo-index-evidence-release:20261025:v1"
      || source.forward_tuple.action_id !== binding.actionId || source.forward_tuple.scope !== binding.scope
      || source.forward_tuple.record_id !== binding.recordId || source.forward_tuple.candidate_version !== binding.candidateVersion
      || source.conditional_inverse.action_id !== `rollback-${binding.candidateVersion}`
      || source.baseline_is_current_CAS !== false || Object.keys(before).length !== 29
      || before.id !== binding.recordId || before.slug !== binding.slug || before.status !== binding.status
      || before.updated_at !== binding.expectedUpdatedAt || digest(before) !== binding.baselineFieldsSha256
      || digest(source.desired) !== binding.desiredFieldsSha256 || digest(prior) !== binding.rollbackFieldsSha256
      || digest(retained) !== binding.retainedFieldsSha256
      || digest(Object.keys(source.desired).sort()) !== digest([...binding.changedFields].sort())) {
    throw new Error("Cabinet identity, frozen row, two fields or retained digest differs.");
  }
  for (const item of source.insertions) {
    const fragment = item.inserted_HTML_exactly_from_original_C1_input;
    const field = item.field;
    const language = field === "content_en" ? "en" : field === "content_zh" ? "zh" : null;
    if (!language || !fragment.includes(`href="/${language}/services/builtin"`)
        || source.desired[field].split(fragment).length !== 2
        || source.desired[field].replace(fragment, "") !== before[field]) {
      throw new Error("Cabinet approved matching-language insertion differs.");
    }
  }
  return freeze({ ...binding, desiredFields: source.desired });
}
export const lockedSeoCabinetTwoAnchorCandidates = freeze({
  [binding.candidateVersion]: readSeoCabinetTwoAnchorCandidate(readFileSync(resolve(process.cwd(), binding.sourceCandidatePath))),
});
