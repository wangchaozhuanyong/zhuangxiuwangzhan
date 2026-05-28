import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AdminAuthState = "checking" | "signed-in" | "signed-out" | "denied";

type AdminAuthContextValue = {
  state: AdminAuthState;
  isSupabaseConfigured: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminAuthState>("checking");
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
        setState("signed-out");
        return;
      }

      if (lastSessionIdRef.current === session.access_token) {
        setState((prev) => (prev === "checking" ? "signed-in" : prev));
        return;
      }

      lastSessionIdRef.current = session.access_token;
      const { data: isAdmin, error } = await supabase!.rpc("is_admin");
      if (!active) return;
      setState(!error && Boolean(isAdmin) ? "signed-in" : "denied");
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
    () => ({ state, isSupabaseConfigured }),
    [state],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

