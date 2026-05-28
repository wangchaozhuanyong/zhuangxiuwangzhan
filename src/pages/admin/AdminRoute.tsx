import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthState = "checking" | "signed-in" | "signed-out" | "denied";

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("signed-in");
      return;
    }

    let active = true;

    const check = async () => {
      const { data } = await supabase!.auth.getSession();
      if (!active) return;

      if (!data.session) {
        setAuthState("signed-out");
        return;
      }

      const { data: isAdmin, error } = await supabase!.rpc("is_admin");
      if (!active) return;
      setAuthState(!error && isAdmin ? "signed-in" : "denied");
    };

    void check();

    const { data: listener } = supabase!.auth.onAuthStateChange(() => {
      void check();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) return <>{children}</>;

  if (authState === "checking") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">正在检查管理员状态...</p>
        </div>
      </main>
    );
  }
  if (authState === "signed-out") return <Navigate to="/admin" replace />;
  if (authState === "denied") return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default AdminRoute;

