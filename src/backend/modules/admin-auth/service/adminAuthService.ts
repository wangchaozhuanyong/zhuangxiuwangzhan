import {
  enrollAdminTotpFactor,
  getCurrentAdminIdentityStatus,
  getCurrentAdminMfaState,
  getCurrentAdminRoleStatus,
  getCurrentAdminSession,
  hasAdminAuthBackendConfig,
  removeAdminMfaFactor,
  signInAdminWithPassword,
  signOutAdminSession,
  subscribeAdminAuthStateChange,
  verifyAdminTotpFactor,
  type AdminBackendRole,
  type AdminTotpEnrollment,
} from "@/backend/modules/admin-auth/repository/adminAuthRepository";
import { decideAdminMfaStep } from "@/backend/modules/admin-auth/service/adminMfaPolicy";

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

export type AdminMfaFlow =
  | { step: "signed-out" }
  | { step: "denied" }
  | { step: "complete" }
  | { step: "challenge"; factorId: string }
  | { step: "enroll"; enrollment: AdminTotpEnrollment };

export async function getAdminMfaState() {
  return getCurrentAdminMfaState();
}

export async function prepareAdminMfaFlow(): Promise<AdminMfaFlow> {
  const session = await getCurrentAdminSession();
  if (!session) return { step: "signed-out" };

  const isAdminIdentity = await getCurrentAdminIdentityStatus();
  const mfaState = await getCurrentAdminMfaState();
  const decision = decideAdminMfaStep({
    hasSession: true,
    isAdminIdentity,
    currentLevel: mfaState.currentLevel,
    verifiedTotpFactorId: mfaState.verifiedTotpFactorId,
  });

  if (decision === "denied") return { step: "denied" };
  if (decision === "complete") return { step: "complete" };
  if (decision === "challenge" && mfaState.verifiedTotpFactorId) {
    return { step: "challenge", factorId: mfaState.verifiedTotpFactorId };
  }

  for (const factorId of mfaState.unverifiedTotpFactorIds) {
    await removeAdminMfaFactor(factorId);
  }

  return { step: "enroll", enrollment: await enrollAdminTotpFactor() };
}

export function verifyAdminMfa(factorId: string, code: string) {
  return verifyAdminTotpFactor(factorId, code);
}
