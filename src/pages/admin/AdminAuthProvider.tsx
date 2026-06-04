import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getAdminRoleStatus,
  getAdminSession,
  hasAdminAuthConfig,
  onAdminAuthStateChange,
  type AdminRole,
} from "@/backend/modules/admin-auth/service/adminAuthService";

type AdminAuthState = "checking" | "signed-in" | "signed-out" | "denied";
export type { AdminRole };

type AdminAuthContextValue = {
  state: AdminAuthState;
  isSupabaseConfigured: boolean;
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
      const session = await getAdminSession();
      if (!active) return;

      if (!session) {
        lastSessionIdRef.current = null;
        applyRole(null);
        setState("signed-out");
        return;
      }

      if (lastSessionIdRef.current === session.access_token && roleRef.current) {
        setState((prev) => (prev === "checking" ? "signed-in" : prev));
        return;
      }

      lastSessionIdRef.current = session.access_token;
      const { isAdmin, role: adminRole } = await getAdminRoleStatus();
      if (!active) return;
      if (isAdmin) {
        applyRole(adminRole || "super_admin");
        setState("signed-in");
      } else {
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
    () => ({ state, isSupabaseConfigured: hasAdminAuthConfig(), role, isSuperAdmin: role === "super_admin" }),
    [state, role],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
