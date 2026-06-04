import {
  getCurrentAdminRoleStatus,
  getCurrentAdminSession,
  hasAdminAuthBackendConfig,
  signInAdminWithPassword,
  signOutAdminSession,
  subscribeAdminAuthStateChange,
  type AdminBackendRole,
} from "@/backend/modules/admin-auth/repository/adminAuthRepository";

export type AdminRole = AdminBackendRole;

export const hasAdminAuthConfig = hasAdminAuthBackendConfig;

export function getAdminSession() {
  return getCurrentAdminSession();
}

export function signInAdmin(email: string, password: string) {
  return signInAdminWithPassword(email, password);
}

export function signOutAdmin() {
  return signOutAdminSession();
}

export function getAdminRoleStatus() {
  return getCurrentAdminRoleStatus();
}

export function onAdminAuthStateChange(callback: () => void) {
  return subscribeAdminAuthStateChange(callback);
}
