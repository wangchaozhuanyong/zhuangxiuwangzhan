export type ManagedTarget = {
  id: string;
  slug: string;
  contentType: "service" | "service_area" | "blog";
  taskId: string;
  actionId: string;
  candidateVersion: string;
  scope: string;
  changedFields?: readonly string[];
  desiredFieldsSha256?: string;
  baselineFieldsSha256?: string;
};

// Each target is a fixed CMS row and original content task. New candidates pin exact changed fields.
export const MANAGED_SERVICES: readonly ManagedTarget[] = [
  { id: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71", slug: "builtin", contentType: "service", taskId: "fc-20260920-builtin-whole-house-custom-v1", actionId: "publish-builtin-whole-house-custom-v1", candidateVersion: "builtin-whole-house-custom-v1", scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71" },
  { id: "0d947129-0595-43ef-baa1-0fd9d8b870e6", slug: "renovation", contentType: "service", taskId: "fc-20260920-en-renovation-owner-publish-v2", actionId: "publish-en-renovation-owner-cms-v2", candidateVersion: "en-renovation-owner-cms-v2", scope: "flashcast.com.my:/en/services/renovation:service:renovation:english-content-fields" },
  { id: "32f5374f-9919-41ea-80c7-00b5ac917532", slug: "shop-renovation", contentType: "service", taskId: "fc-20260921-seo-pg002-shop-candidate-v1", actionId: "publish-pg002-shop-cms-v1", candidateVersion: "pg002-shop-cms-v1", scope: "flashcast.com.my:services/32f5374f-9919-41ea-80c7-00b5ac917532" },
  { id: "ce4156db-9034-42c8-ba29-b35724ea7d6d", slug: "kitchen", contentType: "service", taskId: "fc-20260924-seo-owner-implementation-v1", actionId: "publish-kitchen-r1-cms-row-20260924-v1", candidateVersion: "kitchen-r1-cms-row-20260924-v1", scope: "flashcast.com.my:services/ce4156db-9034-42c8-ba29-b35724ea7d6d", changedFields: ["faqs_zh", "faqs_en"], desiredFieldsSha256: "c55475b2c97f913e631d457556a6743ce2ddf57e3589d61cd63614b31d1af89f" },
  { id: "0af89b93-8938-4a98-ba65-6525fbbe92c1", slug: "design", contentType: "service", taskId: "fc-20260924-seo-owner-implementation-v1", actionId: "publish-design-r1-cms-row-20260924-v1", candidateVersion: "design-r1-cms-row-20260924-v1", scope: "flashcast.com.my:services/0af89b93-8938-4a98-ba65-6525fbbe92c1", changedFields: ["content_zh", "content_en", "faqs_zh", "faqs_en"], desiredFieldsSha256: "43b4a51a79786c6211ee5cc550184445b83f7c20c7f5afb0a38dfefb23fa8b52" },
  { id: "0f294e6d-2e2c-4f13-a93f-096728ccc6af", slug: "bathroom", contentType: "service", taskId: "fc-20260924-org-017-bathroom-faq-rework-v3", actionId: "org-017-bathroom-faq-parity-reconcile-v4", candidateVersion: "org-017-bathroom-faq-parity-reconciliation-v4", scope: "flashcast.com.my:services/0f294e6d-2e2c-4f13-a93f-096728ccc6af:faqs_en,faqs_zh", changedFields: ["faqs_zh", "faqs_en"], desiredFieldsSha256: "f39d92eda1447c558c42c2ab07878ba75b712c1355a65b7d5c07b4edcdc96f5d" },
  { id: "a87541ac-1cba-4f1a-972d-428dccdbcc0f", slug: "office-renovation", contentType: "service", taskId: "fc-20260925-organic-owner-implementation-wave2", actionId: "update-office-renovation-service-bilingual-content-v1", candidateVersion: "office-service-scope-r1-v1", scope: "flashcast.com.my:services/a87541ac-1cba-4f1a-972d-428dccdbcc0f:content_en,content_zh", changedFields: ["content_en", "content_zh"], baselineFieldsSha256: "a0788f5f36fb9a5458be7b9d57f82e91cd21115a731efe52585b027ef5fe1104", desiredFieldsSha256: "86b6463ea0747f33e45f6a6ea53ea34b5d2e36e60939e0df4c10c585abdb1d19" },
];

export const MANAGED_AREAS: readonly ManagedTarget[] = [
  { id: "e2e461b7-3bb8-4206-817a-7f830824b8ac", slug: "selangor", contentType: "service_area", taskId: "fc-20260923-selangor-public-fact-risk-v1", actionId: "publish-selangor-service-area-r1-v4", candidateVersion: "selangor-r1-cms-row-20260923-v4", scope: "flashcast.com.my:selangor-service-area-fact-risk-v1", changedFields: ["content_zh", "content_en", "property_types"], desiredFieldsSha256: "c7a38650e07d81047a67aa43433564096cb3176ac99a9e29b960f71ee1db923e" },
];

export const MANAGED_BLOGS: readonly ManagedTarget[] = [
  { id: "3fa4ff63-1ee6-4b7c-8f32-792c948c8545", slug: "kitchen-cabinet-price-malaysia", contentType: "blog", taskId: "fc-20260925-organic-query-page-completion-v1", actionId: "update-kitchen-cabinet-cost-existing-blog-v1", candidateVersion: "kitchen-cabinet-cost-r1-v1", scope: "flashcast.com.my:blog_posts/3fa4ff63-1ee6-4b7c-8f32-792c948c8545", changedFields: ["content_en", "content_zh", "seo_description_zh"], baselineFieldsSha256: "50b0c1510443cb59996e12117ad374ede0f279b4d1658cacb74d43d014f47704", desiredFieldsSha256: "4bca36e72073660d3328e6241cb3128c97b2c4a0230a17d2a5a2645726cf755f" },
  { id: "cf594080-7230-4d77-83ac-0be55dfb3b9d", slug: "renovation-quotation-checklist-malaysia", contentType: "blog", taskId: "fc-20260925-existing-page-content-gap-v1", actionId: "update-renovation-quotation-existing-blog-links-v1", candidateVersion: "renovation-quotation-links-r1-v1", scope: "flashcast.com.my:blog_posts/cf594080-7230-4d77-83ac-0be55dfb3b9d", changedFields: ["content_zh", "content_en"], baselineFieldsSha256: "ff1530642c3b9ffdfb1b68119a6339979e9e32361823d2a567e0ae45f0aeeda0", desiredFieldsSha256: "5b86bcfae21a0bbe685a2cf133428a8a86b190ab5900f9fa8bf29af4f9d52fee" },
  { id: "190d319c-b027-4730-ab34-df5010f4acc0", slug: "office-renovation-checklist-malaysia", contentType: "blog", taskId: "fc-20260925-existing-page-content-gap-v1", actionId: "update-office-checklist-existing-blog-links-v1", candidateVersion: "office-checklist-links-r1-v1", scope: "flashcast.com.my:blog_posts/190d319c-b027-4730-ab34-df5010f4acc0", changedFields: ["content_zh", "content_en"], baselineFieldsSha256: "d7f1dbdeed1fc155938ce2e89b4c20e7e520824cedaaa8138996a4cfc44bc094", desiredFieldsSha256: "9d12eb08dcdff33ef99b6de885d34b03f2c1f3e46eaf39d22b8391f99894f8bf" },
];

export const MANAGED_TARGETS: readonly ManagedTarget[] = [...MANAGED_SERVICES, ...MANAGED_AREAS, ...MANAGED_BLOGS];

export const managedAction = (target: ManagedTarget, operation: "publish" | "rollback") => ({
  taskId: target.taskId,
  actionId: operation === "publish" ? target.actionId : `rollback-${target.candidateVersion}`,
  candidateVersion: operation === "publish" ? target.candidateVersion : `${target.candidateVersion}-rollback-v1`,
  scope: target.scope,
});
