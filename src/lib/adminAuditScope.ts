export type AdminAuditScope = "active" | "published" | "draft" | "archived" | "all_records";

export const adminAuditScopes: AdminAuditScope[] = ["active", "published", "draft", "archived", "all_records"];

export const resolveAdminAuditScope = (value: string): AdminAuditScope =>
  adminAuditScopes.includes(value as AdminAuditScope) ? value as AdminAuditScope : "active";

export const matchesAdminAuditScope = (status: string | undefined, scope: AdminAuditScope): boolean => {
  if (status === "error") return false;
  if (scope === "all_records") return true;
  if (scope === "active") return status !== "archived";
  return status === scope;
};
