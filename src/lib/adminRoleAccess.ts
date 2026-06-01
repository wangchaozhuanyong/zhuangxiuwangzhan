import type { AdminRole } from "@/pages/admin/AdminAuthProvider";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "超级管理员",
  content_editor: "内容编辑",
  lead_manager: "线索客服",
  viewer: "只读查看",
};

export const ADMIN_ROLE_GROUPS = {
  all: ["super_admin", "content_editor", "lead_manager", "viewer"],
  contentRead: ["super_admin", "content_editor", "viewer"],
  contentWrite: ["super_admin", "content_editor"],
  leadRead: ["super_admin", "lead_manager", "viewer"],
  leadWrite: ["super_admin", "lead_manager"],
  system: ["super_admin"],
} satisfies Record<string, AdminRole[]>;

export type AdminAllowedRoles = readonly AdminRole[];

export const getAdminRoleLabel = (role: AdminRole | null | undefined) =>
  role ? ADMIN_ROLE_LABELS[role] || role : "未识别角色";

export const getAdminAllowedRoleText = (allowedRoles: AdminAllowedRoles) =>
  allowedRoles.map((role) => getAdminRoleLabel(role)).join("、");

export const canAdminRoleAccess = (role: AdminRole | null | undefined, allowedRoles?: AdminAllowedRoles) =>
  !allowedRoles || Boolean(role && allowedRoles.includes(role));
