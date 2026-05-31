import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AdminAuthState = "checking" | "signed-in" | "signed-out" | "denied";
export type AdminRole = "super_admin" | "content_editor" | "lead_manager" | "viewer";

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
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState("denied");
      return;
    }

    let active = true;

    const check = async () => {
      const { data } = await supabase!.auth.getSession();
      if (!active) return;

      const session = data.session;
      if (!session) {
        lastSessionIdRef.current = null;
        setRole(null);
        setState("signed-out");
        return;
      }

      if (lastSessionIdRef.current === session.access_token) {
        setState((prev) => (prev === "checking" ? "signed-in" : prev));
        return;
      }

      lastSessionIdRef.current = session.access_token;
      const [{ data: isAdmin, error }, { data: adminRole, error: roleError }] = await Promise.all([
        supabase!.rpc("is_admin"),
        supabase!.rpc("admin_role"),
      ]);
      if (!active) return;
      if (!error && Boolean(isAdmin)) {
        setRole(!roleError && adminRole ? (adminRole as AdminRole) : "super_admin");
        setState("signed-in");
      } else {
        setRole(null);
        setState("denied");
      }
    };

    void check();

    const { data: listener } = supabase!.auth.onAuthStateChange(() => {
      setState("checking");
      void check();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ state, isSupabaseConfigured, role, isSuperAdmin: role === "super_admin" }),
    [state, role],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
