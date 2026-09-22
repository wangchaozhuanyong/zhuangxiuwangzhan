// Only these three already-reviewed CMS records may use the R3 permit path.
export const MANAGED_SERVICES = [
  { id: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71", slug: "builtin", taskId: "fc-20260920-builtin-whole-house-custom-v1", actionId: "publish-builtin-whole-house-custom-v1", candidateVersion: "builtin-whole-house-custom-v1", scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71" },
  { id: "0d947129-0595-43ef-baa1-0fd9d8b870e6", slug: "renovation", taskId: "fc-20260920-en-renovation-owner-publish-v2", actionId: "publish-en-renovation-owner-cms-v2", candidateVersion: "en-renovation-owner-cms-v2", scope: "flashcast.com.my:/en/services/renovation:service:renovation:english-content-fields" },
  { id: "32f5374f-9919-41ea-80c7-00b5ac917532", slug: "shop-renovation", taskId: "fc-20260921-seo-pg002-shop-candidate-v1", actionId: "publish-pg002-shop-cms-v1", candidateVersion: "pg002-shop-cms-v1", scope: "flashcast.com.my:services/32f5374f-9919-41ea-80c7-00b5ac917532" },
] as const;

export const managedAction = (target: typeof MANAGED_SERVICES[number], operation: "publish" | "rollback") => ({
  taskId: target.taskId,
  actionId: operation === "publish" ? target.actionId : `rollback-${target.candidateVersion}`,
  candidateVersion: operation === "publish" ? target.candidateVersion : `${target.candidateVersion}-rollback-v1`,
  scope: target.scope,
});
