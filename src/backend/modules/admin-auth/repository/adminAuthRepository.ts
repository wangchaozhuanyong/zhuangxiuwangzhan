import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type AdminBackendRole = "super_admin" | "content_editor" | "lead_manager" | "viewer";

export type AdminMfaState = {
  currentLevel: string | null;
  verifiedTotpFactorId: string | null;
  unverifiedTotpFactorIds: string[];
};

export type AdminTotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export const hasAdminAuthBackendConfig = () => isSupabaseConfigured;

export async function getCurrentAdminSession() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInAdminWithPassword(email: string, password: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

export async function signOutAdminSession() {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
  return true;
}

export async function getCurrentAdminRoleStatus() {
  const supabase = requireSupabase();
  const [{ data: isAdmin, error }, { data: adminRole, error: roleError }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("admin_role"),
  ]);

  return {
    isAdmin: !error && Boolean(isAdmin),
    role: !roleError && adminRole ? (adminRole as AdminBackendRole) : null,
  };
}

export async function getCurrentAdminIdentityStatus() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("is_admin_identity");
  if (error) throw error;
  return Boolean(data);
}

export async function getCurrentAdminMfaState(): Promise<AdminMfaState> {
  const supabase = requireSupabase();
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (assuranceError) throw assuranceError;
  if (factorsError) throw factorsError;

  return {
    currentLevel: assurance?.currentLevel || null,
    verifiedTotpFactorId: factors?.totp[0]?.id || null,
    unverifiedTotpFactorIds:
      factors?.all
        .filter((factor) => factor.factor_type === "totp" && factor.status === "unverified")
        .map((factor) => factor.id) || [],
  };
}

export async function removeAdminMfaFactor(factorId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

export async function enrollAdminTotpFactor(): Promise<AdminTotpEnrollment> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "FLASH CAST Admin",
    issuer: "FLASH CAST Admin",
  });
  if (error) throw error;

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyAdminTotpFactor(factorId: string, code: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
  return true;
}

export function subscribeAdminAuthStateChange(callback: () => void) {
  const supabase = requireSupabase();
  const { data: listener } = supabase.auth.onAuthStateChange(callback);

  return () => listener.subscription.unsubscribe();
}
