export type ManagedTarget = {
  id: string;
  slug: string;
  contentType: "service" | "service_area";
  taskId: string;
  actionId: string;
  candidateVersion: string;
  scope: string;
  changedFields?: readonly string[];
  desiredFieldsSha256?: string;
};

// Each target is a fixed CMS row and original content task. New candidates pin exact changed fields.
export const MANAGED_SERVICES: readonly ManagedTarget[] = [
  { id: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71", slug: "builtin", contentType: "service", taskId: "fc-20260920-builtin-whole-house-custom-v1", actionId: "publish-builtin-whole-house-custom-v1", candidateVersion: "builtin-whole-house-custom-v1", scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71" },
  { id: "0d947129-0595-43ef-baa1-0fd9d8b870e6", slug: "renovation", contentType: "service", taskId: "fc-20260920-en-renovation-owner-publish-v2", actionId: "publish-en-renovation-owner-cms-v2", candidateVersion: "en-renovation-owner-cms-v2", scope: "flashcast.com.my:/en/services/renovation:service:renovation:english-content-fields" },
  { id: "32f5374f-9919-41ea-80c7-00b5ac917532", slug: "shop-renovation", contentType: "service", taskId: "fc-20260921-seo-pg002-shop-candidate-v1", actionId: "publish-pg002-shop-cms-v1", candidateVersion: "pg002-shop-cms-v1", scope: "flashcast.com.my:services/32f5374f-9919-41ea-80c7-00b5ac917532" },
  { id: "ce4156db-9034-42c8-ba29-b35724ea7d6d", slug: "kitchen", contentType: "service", taskId: "fc-20260924-seo-owner-implementation-v1", actionId: "publish-kitchen-r1-cms-row-20260924-v1", candidateVersion: "kitchen-r1-cms-row-20260924-v1", scope: "flashcast.com.my:services/ce4156db-9034-42c8-ba29-b35724ea7d6d", changedFields: ["faqs_zh", "faqs_en"], desiredFieldsSha256: "c55475b2c97f913e631d457556a6743ce2ddf57e3589d61cd63614b31d1af89f" },
  { id: "0af89b93-8938-4a98-ba65-6525fbbe92c1", slug: "design", contentType: "service", taskId: "fc-20260924-seo-owner-implementation-v1", actionId: "publish-design-r1-cms-row-20260924-v1", candidateVersion: "design-r1-cms-row-20260924-v1", scope: "flashcast.com.my:services/0af89b93-8938-4a98-ba65-6525fbbe92c1", changedFields: ["content_zh", "content_en", "faqs_zh", "faqs_en"], desiredFieldsSha256: "43b4a51a79786c6211ee5cc550184445b83f7c20c7f5afb0a38dfefb23fa8b52" },
  { id: "0f294e6d-2e2c-4f13-a93f-096728ccc6af", slug: "bathroom", contentType: "service", taskId: "fc-20260924-org-017-bathroom-faq-rework-v3", actionId: "org-017-bathroom-faq-parity-reconcile-v4", candidateVersion: "org-017-bathroom-faq-parity-reconciliation-v4", scope: "flashcast.com.my:services/0f294e6d-2e2c-4f13-a93f-096728ccc6af:faqs_en,faqs_zh", changedFields: ["faqs_zh", "faqs_en"], desiredFieldsSha256: "f39d92eda1447c558c42c2ab07878ba75b712c1355a65b7d5c07b4edcdc96f5d" },
];

export const MANAGED_AREAS: readonly ManagedTarget[] = [
  { id: "e2e461b7-3bb8-4206-817a-7f830824b8ac", slug: "selangor", contentType: "service_area", taskId: "fc-20260923-selangor-public-fact-risk-v1", actionId: "publish-selangor-service-area-r1-v4", candidateVersion: "selangor-r1-cms-row-20260923-v4", scope: "flashcast.com.my:selangor-service-area-fact-risk-v1", changedFields: ["content_zh", "content_en", "property_types"], desiredFieldsSha256: "c7a38650e07d81047a67aa43433564096cb3176ac99a9e29b960f71ee1db923e" },
];

export const MANAGED_TARGETS: readonly ManagedTarget[] = [...MANAGED_SERVICES, ...MANAGED_AREAS];

export const managedAction = (target: ManagedTarget, operation: "publish" | "rollback") => ({
  taskId: target.taskId,
  actionId: operation === "publish" ? target.actionId : `rollback-${target.candidateVersion}`,
  candidateVersion: operation === "publish" ? target.candidateVersion : `${target.candidateVersion}-rollback-v1`,
  scope: target.scope,
});
