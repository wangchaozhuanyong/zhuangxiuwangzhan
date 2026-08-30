import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getAdminMfaState,
  getAdminRoleStatus,
  getAdminSession,
  hasAdminAuthConfig,
  onAdminAuthStateChange,
  type AdminRole,
} from "@/backend/modules/admin-auth/service/adminAuthService";

type AdminAuthState = "checking" | "signed-in" | "signed-out" | "mfa-required" | "denied";
export type { AdminRole };

type AdminAuthContextValue = {
  state: AdminAuthState;
  isSupabaseConfigured: boolean;
  userId: string | null;
  role: AdminRole | null;
  isSuperAdmin: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminAuthState>("checking");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const roleRef = useRef<AdminRole | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);

  const applyRole = (nextRole: AdminRole | null) => {
    roleRef.current = nextRole;
    setRole(nextRole);
  };

  useEffect(() => {
    if (!hasAdminAuthConfig()) {
      setState("denied");
      return;
    }

    let active = true;

    const check = async () => {
      try {
        const session = await getAdminSession();
        if (!active) return;

        if (!session) {
          lastSessionIdRef.current = null;
          setUserId(null);
          applyRole(null);
          setState("signed-out");
          return;
        }

        if (lastSessionIdRef.current === session.access_token && roleRef.current) {
          setState((prev) => (prev === "checking" ? "signed-in" : prev));
          return;
        }

        lastSessionIdRef.current = session.access_token;
        setUserId(session.user.id);
        const mfaState = await getAdminMfaState();
        if (!active) return;
        if (mfaState.currentLevel !== "aal2") {
          applyRole(null);
          setState("mfa-required");
          return;
        }

        const { isAdmin, role: adminRole } = await getAdminRoleStatus();
        if (!active) return;
        if (isAdmin && adminRole) {
          applyRole(adminRole);
          setState("signed-in");
          return;
        }

        applyRole(null);
        setState("denied");
      } catch {
        if (!active) return;
        lastSessionIdRef.current = null;
        setUserId(null);
        applyRole(null);
        setState("denied");
      }
    };

    void check();

    const unsubscribe = onAdminAuthStateChange(() => {
      setState("checking");
      void check();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ state, isSupabaseConfigured: hasAdminAuthConfig(), userId, role, isSuperAdmin: role === "super_admin" }),
    [state, userId, role],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
