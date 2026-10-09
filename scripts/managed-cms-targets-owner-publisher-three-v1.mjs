// Backend-only successor inputs. No credentials or before-record payloads are packaged.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const bindings = {
  "v17-owner-publisher-native-preparation-v2-20261007": {
    "taskId": "fc-20260928-keyword-page-answer-implementation-v1",
    "candidateVersion": "v17-owner-publisher-native-preparation-v2-20261007",
    "qaEvidenceVersion": "v17-owner-publisher-native-preparation-v2-20261007",
    "actionId": "publish-v17-owner-publisher-native-preparation-v2-20261007",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services:49276c4c-6f3d-42e3-8c4b-84b1b2c17a3a:faqs_en,faqs_zh",
    "recordId": "49276c4c-6f3d-42e3-8c4b-84b1b2c17a3a",
    "slug": "old-house",
    "contentType": "service",
    "table": "services",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": false,
    "expectedUpdatedAt": "2026-06-08T07:45:35.480828+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "status",
      "version",
      "updated_at",
      "faqs_zh",
      "faqs_en",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "scope_items_zh",
      "scope_items_en",
      "process_steps_zh",
      "process_steps_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "baselineFieldsSha256": "cc27f87d98e1c3bedaf517fdbe0a8d5ab703b3ba655f05b225a451d12e4e4ee8",
    "desiredFieldsSha256": "56891d2e9c49d90e665734354d752ac058c028128ef969da9db25c217a6e8f94",
    "rollbackFieldsSha256": "3a31d956abc417dc0fe04fb3328fff83cdb7202fbe15f8224b1f87bfd5c84af1",
    "changedFields": [
      "faqs_en",
      "faqs_zh"
    ],
    "sourceCandidatePath": "drafts/seo/fc-20261007-publisher-three-designated-binding-v1/v17.json",
    "sourceCandidateSha256": "b524eb494f8d35a4e592c044287959b2aa66e48e798f2d610874773b19e3a8eb",
    "originalFrozenSourcePath": "logs/handoffs/fc-20260928-keyword-page-answer-implementation-v1/native-bind-20261004-2000/v17-oldhouse/normalized-cms-candidate.json",
    "originalFrozenSourceSha256": "36cc6a6cf86ce4bac0478c0266a1443d09490729db885f0ca6cdf237ab5c5efc",
    "rollbackRecordPath": "backups/fc-20261007-owner-publisher-execution-takeover-v1/three-native-preparation-v1-20261007/v17-before-backup.json",
    "rollbackRecordSha256": "10d204bad7649c74a8da9774a6a777a5d0d1faf6e86c3b6fc6b639810dc46795",
    "rollbackPackagePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v17/rollback-plan.json",
    "rollbackPackageSha256": "ee434cf0bcafc8149bf817c8f32987f20573f90bd85dd04f19f3447b8687ecf8",
    "publicPaths": [
      {
        "path": "/en/services/old-house",
        "expected": "What counts as before-and-after evidence for an old-house renovation?"
      },
      {
        "path": "/zh/services/old-house",
        "expected": "怎样确认旧屋翻新前后对比属于真实完工证据？"
      }
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "status",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "scope_items_zh",
      "scope_items_en",
      "process_steps_zh",
      "process_steps_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "retainedFieldsSha256": "2e8c4496296b8207cae1745c7aaf56f371246e031f5ac7c0be67966a680549b4",
    "producerSourceCandidatePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v17/cms-content-candidate.json",
    "producerSourceCandidateSha256": "84dc43809179627bb811068d686eed60eb683b05838dab62b497f19d82342ca0"
  },
  "v18-owner-publisher-native-preparation-v2-20261007": {
    "taskId": "fc-20260928-keyword-page-answer-implementation-v1",
    "candidateVersion": "v18-owner-publisher-native-preparation-v2-20261007",
    "qaEvidenceVersion": "v18-owner-publisher-native-preparation-v2-20261007",
    "actionId": "publish-v18-owner-publisher-native-preparation-v2-20261007",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:blog_posts:cf594080-7230-4d77-83ac-0be55dfb3b9d:content_en,content_zh",
    "recordId": "cf594080-7230-4d77-83ac-0be55dfb3b9d",
    "slug": "renovation-quotation-checklist-malaysia",
    "contentType": "blog",
    "table": "blog_posts",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": false,
    "expectedUpdatedAt": "2026-09-25T20:54:18.773194+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "status",
      "version",
      "updated_at",
      "content_zh",
      "content_en",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "cover_image_url",
      "alt_zh",
      "alt_en",
      "published_at",
      "category",
      "tags",
      "sort_order"
    ],
    "baselineFieldsSha256": "ae53dcc1a90fee545ee189a3ce8cde1a1d755f27cefdd1c41accedcaf0513d0a",
    "desiredFieldsSha256": "0b63be321e97797d65df2dcbf123279b5aec0e43f1929bafd97c1e589d2acbea",
    "rollbackFieldsSha256": "5b86bcfae21a0bbe685a2cf133428a8a86b190ab5900f9fa8bf29af4f9d52fee",
    "changedFields": [
      "content_en",
      "content_zh"
    ],
    "sourceCandidatePath": "drafts/seo/fc-20261007-publisher-three-designated-binding-v1/v18.json",
    "sourceCandidateSha256": "a3a165b5d605c4075e05341beebafacb51ddc19e9254e0c91a9dd540ffe7f0ba",
    "originalFrozenSourcePath": "logs/handoffs/fc-20260928-keyword-page-answer-implementation-v1/native-bind-20261004-2000/v18-checklist/normalized-cms-candidate.json",
    "originalFrozenSourceSha256": "967ea19600f9dcc223b8d88daa3ad8849017d35b718e3a9870a41e9cd32b13eb",
    "rollbackRecordPath": "backups/fc-20261007-owner-publisher-execution-takeover-v1/three-native-preparation-v1-20261007/v18-before-backup.json",
    "rollbackRecordSha256": "eded0df85dd19823ca3a2b1bda4cb8a74659b48689fcdee63212492ca5583766",
    "rollbackPackagePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v18/rollback-plan.json",
    "rollbackPackageSha256": "8ae40d6978a91de59e8786447e6bb9830bdd852fd95243b591ffd05d3bf2a17d",
    "publicPaths": [
      {
        "path": "/en/blog/renovation-quotation-checklist-malaysia",
        "expected": "Malaysia Renovation Quotation Checklist",
        "renderedRequiredPhrases": ["Before comparing quotations: a project checklist"]
      },
      {
        "path": "/zh/blog/renovation-quotation-checklist-malaysia",
        "expected": "马来西亚装修报价单要看什么",
        "renderedRequiredPhrases": ["比较报价前：先核对整体项目步骤"]
      }
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "status",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "cover_image_url",
      "alt_zh",
      "alt_en",
      "published_at",
      "category",
      "tags",
      "sort_order"
    ],
    "retainedFieldsSha256": "f9567fe044a9f8123e1069e2d3a0e692f4a51d207c018cefdbd543cf111970ea",
    "producerSourceCandidatePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v18/cms-content-candidate.json",
    "producerSourceCandidateSha256": "0d3dbaec1c183979e58969dfced524b104f08c92800123c0ea545b8f9f73b02e"
  },
  "v20-owner-publisher-native-preparation-v2-20261007": {
    "taskId": "fc-20260928-keyword-page-answer-implementation-v1",
    "candidateVersion": "v20-owner-publisher-native-preparation-v2-20261007",
    "qaEvidenceVersion": "v20-owner-publisher-native-preparation-v2-20261007",
    "actionId": "publish-v20-owner-publisher-native-preparation-v2-20261007",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services:0af89b93-8938-4a98-ba65-6525fbbe92c1:faqs_en,faqs_zh",
    "recordId": "0af89b93-8938-4a98-ba65-6525fbbe92c1",
    "slug": "design",
    "contentType": "service",
    "table": "services",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": false,
    "expectedUpdatedAt": "2026-09-24T16:55:25.345204+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "status",
      "version",
      "updated_at",
      "faqs_zh",
      "faqs_en",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "scope_items_zh",
      "scope_items_en",
      "process_steps_zh",
      "process_steps_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "baselineFieldsSha256": "5356b7c855efa2cc68973556ffb3ac6017aaf167025d7223773101b5da9f5d68",
    "desiredFieldsSha256": "0fc23b7d728f9a715cf2f1142feaa549e49d3a218f968486b3147878dfb6c7eb",
    "rollbackFieldsSha256": "17fa4ffffcc155496337da6f2e10ac0ebd84d488f4e14351e7346c6bce8630b9",
    "changedFields": [
      "faqs_en",
      "faqs_zh"
    ],
    "sourceCandidatePath": "drafts/seo/fc-20261007-publisher-three-designated-binding-v1/v20.json",
    "sourceCandidateSha256": "0fb2320bfc079f8038ca17a903c836ae23f5ea37192baf804ee756274d44da4e",
    "originalFrozenSourcePath": "drafts/seo/fc-20260928-keyword-page-answer-implementation-v1/v20-design-semantic-delta-source-binding-20261005-v1/normalized-cms-candidate.json",
    "originalFrozenSourceSha256": "e546cbec5ba6965c58cbda1498082681e20cce98636c4abe67065ca5e29fb4c9",
    "rollbackRecordPath": "backups/fc-20261007-owner-publisher-execution-takeover-v1/three-native-preparation-v1-20261007/v20-before-backup.json",
    "rollbackRecordSha256": "11e376752d473e3798b84f748407b862e9bac9841ee2067a1366d53a5cd43444",
    "rollbackPackagePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v20/rollback-plan.json",
    "rollbackPackageSha256": "465ee7062830e345e38d15632ab3fa9c28d061cbf5d835e5a94033b3adae9aa1",
    "publicPaths": [
      {
        "path": "/en/services/design",
        "expected": "What should I confirm about interior design drawing deliverables?"
      },
      {
        "path": "/zh/services/design",
        "expected": "确认室内设计图纸交付前，应先问清什么？"
      }
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "status",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "scope_items_zh",
      "scope_items_en",
      "process_steps_zh",
      "process_steps_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "retainedFieldsSha256": "8f079351ad38ad880829e7e46f9dda322e60c796d60af3535ed2309274ba2d46",
    "producerSourceCandidatePath": "drafts/publishing/fc-20261007-publisher-three-rollback-projection-rework-v1/three-native-preparation-v2-20261007/v20/cms-content-candidate.json",
    "producerSourceCandidateSha256": "58b554e334381fbbc37da2b10b30a25edafa3db709f2c6d5c071308f4193130b"
  }
};
const root = process.cwd();
const stableValue = (value) => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])])) : value ?? null;
const digest = (value) => createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
const freeze = (value) => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

export const readOwnerPublisherThreeCandidate = (name, bytes) => {
  const binding = bindings[name];
  if (!Object.hasOwn(bindings, name) || !binding) throw new Error("Unknown designated publisher candidate.");
  if (createHash("sha256").update(bytes).digest("hex") !== binding.sourceCandidateSha256) {
    throw new Error("Designated publisher package hash differs.");
  }
  const source = JSON.parse(bytes.toString("utf8"));
  const fields = Object.keys(source.desired_fields || {}).sort();
  if (source.schema_version !== 1 || source.task_id !== binding.taskId || source.candidate_version !== binding.candidateVersion
      || JSON.stringify(fields) !== JSON.stringify([...binding.changedFields].sort())
      || digest(source.desired_fields) !== binding.desiredFieldsSha256
      || source.source_provenance.preparation_candidate.path !== binding.producerSourceCandidatePath
      || source.source_provenance.preparation_candidate.sha256 !== binding.producerSourceCandidateSha256
      || source.source_provenance.original_frozen_candidate.path !== binding.originalFrozenSourcePath
      || source.source_provenance.original_frozen_candidate.sha256 !== binding.originalFrozenSourceSha256) {
    throw new Error("Designated publisher identity, source or exact payload differs.");
  }
  return freeze({ ...binding, desiredFields: source.desired_fields });
};

export const lockedOwnerPublisherThreeCandidates = freeze(Object.fromEntries(Object.entries(bindings).map(([name, binding]) => [
  name, readOwnerPublisherThreeCandidate(name, readFileSync(resolve(root, binding.sourceCandidatePath))),
])));
