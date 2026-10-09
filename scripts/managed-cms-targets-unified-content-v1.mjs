// Backend-only reviewed successor inputs; CMS baselines and credentials are not packaged.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const bindings = {
  "design-body-faq-unified-20261009-v1": {
    "taskId": "fc-unified-release-continuation-20261009",
    "actionId": "publish-design-body-faq-unified-20261009-v1",
    "candidateVersion": "design-body-faq-unified-20261009-v1",
    "contentType": "service",
    "table": "services",
    "recordId": "0af89b93-8938-4a98-ba65-6525fbbe92c1",
    "slug": "design",
    "scope": "flashcast.com.my:services:0af89b93-8938-4a98-ba65-6525fbbe92c1:content_en,content_zh,faqs_en,faqs_zh",
    "expectedUpdatedAt": "2026-09-24T16:55:25.345204+00:00",
    "changedFields": [
      "content_en",
      "content_zh",
      "faqs_en",
      "faqs_zh"
    ],
    "desiredFieldsSha256": "cc86fb6efa12a41424b94b90aa8c9797586a110bf02b2367b9758300791300c9",
    "baselineFieldsSha256": "9821e118581f20ed58289191fe0cefb30a3525cadc9e3ef9d1caa59146e3932d",
    "rollbackFieldsSha256": "43b4a51a79786c6211ee5cc550184445b83f7c20c7f5afb0a38dfefb23fa8b52",
    "actionClass": "cms_write",
    "status": "published",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": false,
    "requiresParentRun": true,
    "qaEvidenceVersion": "design-body-faq-unified-20261009-v1",
    "baselineProjectionFields": [
      "alt_en",
      "alt_zh",
      "common_projects_en",
      "common_projects_zh",
      "content_en",
      "content_zh",
      "created_at",
      "excerpt_en",
      "excerpt_zh",
      "faqs_en",
      "faqs_zh",
      "id",
      "image_url",
      "process_steps_en",
      "process_steps_zh",
      "scope_items_en",
      "scope_items_zh",
      "seo_description_en",
      "seo_description_zh",
      "seo_title_en",
      "seo_title_zh",
      "slug",
      "sort_order",
      "status",
      "suitable_for_en",
      "suitable_for_zh",
      "title_en",
      "title_zh",
      "updated_at",
      "version"
    ],
    "retainedProjectionFields": [
      "alt_en",
      "alt_zh",
      "common_projects_en",
      "common_projects_zh",
      "created_at",
      "excerpt_en",
      "excerpt_zh",
      "id",
      "image_url",
      "process_steps_en",
      "process_steps_zh",
      "scope_items_en",
      "scope_items_zh",
      "seo_description_en",
      "seo_description_zh",
      "seo_title_en",
      "seo_title_zh",
      "slug",
      "sort_order",
      "status",
      "suitable_for_en",
      "suitable_for_zh",
      "title_en",
      "title_zh"
    ],
    "retainedFieldsSha256": "606e981faf87eb9a1f0ad52ea89d8838cfdc7b97c08768f4105e7586c8bad00f",
    "sourceCandidatePath": "drafts/seo/fc-20261009-unified-protected-cms-bindings-v1/design.json",
    "sourceCandidateSha256": "76f78e0db496d05e6a0d9ab7e5056efde7b3d105d610da1054d8adf35c8d56f3",
    "sourceProvenanceSha256": "0a8063a41effb7220cd0876a081288f48f50ced6abdac776b7ef77bb26f352ce",
    "rollbackRecordPath": "backups/fc-20260927-cms-native-admission-contract-v1/design-framework-cms-content-v4-baseline.json",
    "rollbackRecordSha256": "88f7dc9073f77742298882187676627f2ba5df5dcb21d7c3478e186e41b3510b",
    "publicPaths": [
      {
        "path": "/en/services/design",
        "expected": "Interior Design Kuala Lumpur | FLASH CAST"
      },
      {
        "path": "/zh/services/design",
        "expected": "吉隆坡室内设计与空间规划｜住宅与商业设计施工衔接"
      }
    ]
  },
  "bathroom-body-step-unified-20261009-v1": {
    "taskId": "fc-unified-release-continuation-20261009",
    "actionId": "publish-bathroom-body-step-unified-20261009-v1",
    "candidateVersion": "bathroom-body-step-unified-20261009-v1",
    "contentType": "service",
    "table": "services",
    "recordId": "0f294e6d-2e2c-4f13-a93f-096728ccc6af",
    "slug": "bathroom",
    "scope": "flashcast.com.my:services:0f294e6d-2e2c-4f13-a93f-096728ccc6af:content_en,content_zh,process_steps_en,process_steps_zh",
    "expectedUpdatedAt": "2026-09-24T14:58:51.371384+00:00",
    "changedFields": [
      "content_en",
      "content_zh",
      "process_steps_en",
      "process_steps_zh"
    ],
    "desiredFieldsSha256": "62ce06334d86dd4340dbac6ac31bb152a0195b5ae555acbfec2cdb86516ab2e0",
    "baselineFieldsSha256": "4334688f5814f90e3f2f70b16d3f09ec0cca841b95e779cc3318df58cc04a758",
    "rollbackFieldsSha256": "dcabfe7ce153aeb8b733bd6403fc937dec8e5e2b3bb5272f74b789f69ce23376",
    "actionClass": "cms_write",
    "status": "published",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": false,
    "requiresParentRun": true,
    "qaEvidenceVersion": "bathroom-body-step-unified-20261009-v1",
    "baselineProjectionFields": [
      "alt_en",
      "alt_zh",
      "common_projects_en",
      "common_projects_zh",
      "content_en",
      "content_zh",
      "created_at",
      "excerpt_en",
      "excerpt_zh",
      "faqs_en",
      "faqs_zh",
      "id",
      "image_url",
      "process_steps_en",
      "process_steps_zh",
      "scope_items_en",
      "scope_items_zh",
      "seo_description_en",
      "seo_description_zh",
      "seo_title_en",
      "seo_title_zh",
      "slug",
      "sort_order",
      "status",
      "suitable_for_en",
      "suitable_for_zh",
      "title_en",
      "title_zh",
      "updated_at",
      "version"
    ],
    "retainedProjectionFields": [
      "alt_en",
      "alt_zh",
      "common_projects_en",
      "common_projects_zh",
      "created_at",
      "excerpt_en",
      "excerpt_zh",
      "faqs_en",
      "faqs_zh",
      "id",
      "image_url",
      "scope_items_en",
      "scope_items_zh",
      "seo_description_en",
      "seo_description_zh",
      "seo_title_en",
      "seo_title_zh",
      "slug",
      "sort_order",
      "status",
      "suitable_for_en",
      "suitable_for_zh",
      "title_en",
      "title_zh"
    ],
    "retainedFieldsSha256": "ff0be3eabbe731ccd13b9060fa8e4a9db2d977518bbbc02bcce6c2d171856110",
    "sourceCandidatePath": "drafts/seo/fc-20261009-unified-protected-cms-bindings-v1/bathroom.json",
    "sourceCandidateSha256": "d8ba155d5e6b073271ab482652fdffb80202664aaf5a8cd786d79dfdefa34f7a",
    "sourceProvenanceSha256": "3a9c370232378610731bd40855560efb3d9816da9a952cd36de64fc34bb31a4d",
    "rollbackRecordPath": "backups/fc-20260927-cms-native-admission-contract-v1/bathroom-initial-framework-body-v1-baseline.json",
    "rollbackRecordSha256": "a93c329bbdf12dd2e9a088a70d04830bc61a0fb69018d6a060ae9c97c379bc31",
    "publicPaths": [
      {
        "path": "/en/services/bathroom",
        "expected": "Bathroom Renovation Malaysia | FLASH CAST"
      },
      {
        "path": "/zh/services/bathroom",
        "expected": "浴室装修与防水工程｜吉隆坡、雪兰莪 Bathroom Renovation"
      }
    ]
  }
};
const stableValue = (value) => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])])) : value ?? null;
const digest = (value) => createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
const freeze = (value) => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

export const readUnifiedContentCandidate = (name, bytes) => {
  if (!Object.hasOwn(bindings, name)) throw new Error("Unknown unified publisher candidate.");
  const binding = bindings[name];
  if (createHash("sha256").update(bytes).digest("hex") !== binding.sourceCandidateSha256) {
    throw new Error("Unified publisher package hash differs.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schema_version !== 1 || source.task_id !== binding.taskId || source.action_id !== binding.actionId
      || source.candidate_version !== binding.candidateVersion || source.scope !== binding.scope
      || source.record_id !== binding.recordId || source.slug !== binding.slug
      || source.expected_updated_at !== binding.expectedUpdatedAt
      || digest(source.changed_fields) !== digest(binding.changedFields)
      || digest(Object.keys(source.desired_fields || {}).sort()) !== digest([...binding.changedFields].sort())
      || digest(source.desired_fields) !== binding.desiredFieldsSha256
      || digest(source.source_provenance) !== binding.sourceProvenanceSha256) {
    throw new Error("Unified publisher identity, source or exact payload differs.");
  }
  return freeze({ ...binding, desiredFields: source.desired_fields });
};

export const lockedUnifiedContentCandidates = freeze(Object.fromEntries(Object.entries(bindings).map(([name, binding]) => [
  name, readUnifiedContentCandidate(name, readFileSync(resolve(process.cwd(), binding.sourceCandidatePath))),
])));
