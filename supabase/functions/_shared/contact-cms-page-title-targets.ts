import type { ManagedTarget } from "./managed-targets.ts";

// One original Contact row, three titles; no legacy page or section writes.
export const CONTACT_CMS_PAGE_TITLE_TARGETS: readonly ManagedTarget[] = [
  {
    "id": "4c328eda-a21d-4c34-bd5a-895d90122b23",
    "slug": "contact",
    "contentType": "site_page",
    "table": "cms_pages",
    "taskId": "fc-20261019-contact-conversion-malay-followthrough-v1",
    "actionId": "contact-conversion-first-batch-content-save",
    "candidateVersion": "contact-three-locale-title-4c328eda-cms-v1",
    "scope": "flashcast.com.my:cms_pages:4c328eda-a21d-4c34-bd5a-895d90122b23:title_zh,title_en,title_ms",
    "changedFields": [
      "title_zh",
      "title_en",
      "title_ms"
    ],
    "baselineProjectionFields": [
      "created_at",
      "created_by",
      "deleted_at",
      "id",
      "page_key",
      "path",
      "published_at",
      "seo_description_en",
      "seo_description_ms",
      "seo_description_zh",
      "seo_keywords_en",
      "seo_keywords_ms",
      "seo_keywords_zh",
      "seo_title_en",
      "seo_title_ms",
      "seo_title_zh",
      "sort_order",
      "status",
      "title_en",
      "title_ms",
      "title_zh",
      "updated_at",
      "updated_by",
      "version"
    ],
    "baselineFieldsSha256": "5517664fde299aa6c4e667f5d3bd0f13bfc8eccbe810b8bd56d5aed8aa615e27",
    "desiredFieldsSha256": "b31fef3d37b58527d902c50f809c22d593e741999a8bb0028f2829a452633005",
    "rollbackFieldsSha256": "5c5c6478b476604dd3683df4bae19a9b84e727fce89072e7ddbcf94835f597a1",
    "expectedUpdatedAt": "2026-10-19T13:34:37.637764+00:00",
    "retainedProjectionFields": [
      "created_at",
      "created_by",
      "deleted_at",
      "id",
      "page_key",
      "path",
      "published_at",
      "seo_description_en",
      "seo_description_ms",
      "seo_description_zh",
      "seo_keywords_en",
      "seo_keywords_ms",
      "seo_keywords_zh",
      "seo_title_en",
      "seo_title_ms",
      "seo_title_zh",
      "sort_order",
      "status",
      "updated_by"
    ],
    "retainedFieldsSha256": "5ddc3d5b4bb89a6384b71043275d1c513c0f602b44244a4221b3735fce6a3089",
    "rollbackAllowed": true,
    "requiresParentRun": true
  }
];
