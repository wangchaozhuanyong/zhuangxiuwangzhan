import type { ManagedTarget } from "./managed-targets.ts";

const changedFields = ["content_en","content_ms","content_zh"];
const baselineProjectionFields = [
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
];
const retainedProjectionFields = baselineProjectionFields.filter((field) =>
  field !== "updated_at" && field !== "version" && !changedFields.includes(field));

// Only these three existing blog records and the reviewed body bytes are admitted.
const rows = [
  {
    "id": "3fa4ff63-1ee6-4b7c-8f32-792c948c8545",
    "slug": "kitchen-cabinet-price-malaysia",
    "expectedUpdatedAt": "2026-10-19T12:48:07.04359+00:00",
    "baselineFieldsSha256": "958aa73912e8d5f13a5f8557c60a5febf499f924acbad5c3603721b168e60ec4",
    "desiredFieldsSha256": "2282037ee9f0917e98d242f4a2f90868f1aec8d399619775db0a8df72d2e25a3",
    "rollbackFieldsSha256": "c8cbe3cc361b917a6cf90405e74e4cc78d1c075eb21693b779650836e030619d",
    "retainedFieldsSha256": "d42129f523da423e68288623eae9d285ec1e3980e97e78f87df46131e2419b55"
  },
  {
    "id": "73142986-7a86-453e-8843-75d1239879ad",
    "slug": "built-in-cabinet-cost-malaysia",
    "expectedUpdatedAt": "2026-10-26T00:27:50.532834+00:00",
    "baselineFieldsSha256": "1f3be07e329762d5a98cff5626c438ba586c75715ecbcc0f040729b99b8b851e",
    "desiredFieldsSha256": "777ac0591996158e8736eaa3ec65538b405c72684d031f1cc9bcf934ebed02d3",
    "rollbackFieldsSha256": "9fc91c0204a8bc8e48eb2f3546cda72f1360f008f75d04dbc0d9cc7e4b9a60bc",
    "retainedFieldsSha256": "8ce83032c99818165b8649620b279636699affcf5b655c80830b08981dc793aa"
  },
  {
    "id": "bf690bf8-fbc3-41aa-9ce1-161fdddda184",
    "slug": "custom-wardrobe-price-malaysia",
    "expectedUpdatedAt": "2026-10-19T12:48:32.910909+00:00",
    "baselineFieldsSha256": "fd210b207bd084fe2b747a372172fb9e1d7e3279f9cb62f3b43bb6976c2d7f88",
    "desiredFieldsSha256": "4e7d05ababcf4c8c4dc1acba508443dbc1a6d80e517c770507e27ef0b08a6c1e",
    "rollbackFieldsSha256": "4c05b19a7352fe7801cbf7a3a2d3a8738d3a98e98e6f75a787c08277677a2574",
    "retainedFieldsSha256": "f84f2d9808d0b77b58fb44c4397d7d4bdba7197a7eed0514911db48324195bc6"
  }
];
export const CABINET_PRICE_TARGETS: readonly ManagedTarget[] = rows.map((row) => {
  const candidateVersion = `c2-cabinet-prices-${row.id.slice(0, 8)}-20261121-v1`;
  return {
    ...row,
    contentType: "blog",
    table: "blog_posts",
    taskId: "fc-20261121-c2-cabinet-market-prices",
    actionId: `publish-${candidateVersion}`,
    candidateVersion,
    scope: `flashcast.com.my:blog_posts/${row.id}:${changedFields.join(",")}`,
    changedFields,
    baselineProjectionFields,
    retainedProjectionFields,
    versionField: "updated_at",
    rollbackAllowed: true,
    requiresParentRun: true,
  };
});
