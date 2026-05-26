import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const nav = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Hero Slides", path: "/admin/content/hero_slides" },
  { label: "Services", path: "/admin/content/services" },
  { label: "Projects", path: "/admin/content/projects" },
  { label: "Blog", path: "/admin/content/blog_posts" },
  { label: "Materials", path: "/admin/content/materials" },
  { label: "Testimonials", path: "/admin/content/testimonials" },
  { label: "Service Areas", path: "/admin/content/service_areas" },
  { label: "Landing Pages", path: "/admin/content/landing_pages" },
  { label: "Leads", path: "/admin/content/leads" },
  { label: "Quote Requests", path: "/admin/content/quote_requests" },
  { label: "Translation Jobs", path: "/admin/content/translation_jobs" },
  { label: "Notification Settings", path: "/admin/notifications" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out" | "denied">("checking");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("signed-in");
      return;
    }

    let active = true;
    void supabase!.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        setAuthState("signed-out");
        return;
      }

      void supabase!.rpc("is_admin").then(({ data: isAdmin, error }) => {
        if (active) setAuthState(!error && isAdmin ? "signed-in" : "denied");
      });
    });

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthState("signed-out");
        return;
      }

      void supabase!.rpc("is_admin").then(({ data: isAdmin, error }) => {
        setAuthState(!error && isAdmin ? "signed-in" : "denied");
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">Supabase is not configured</h1>
          <p className="text-muted-foreground mb-4">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment to enable the admin panel.
          </p>
          <Button asChild><Link to="/en">Back to website</Link></Button>
        </div>
      </main>
    );
  }

  if (authState === "checking") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking admin session...</p>
        </div>
      </main>
    );
  }

  if (authState === "signed-out") {
    return <Navigate to="/admin" replace />;
  }

  if (authState === "denied") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">Admin access required</h1>
          <p className="text-muted-foreground mb-5">
            Your account is signed in, but it is not listed as a FLASH CAST admin.
          </p>
          <Button
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted pt-16">
      <div className="border-b border-border bg-background">
        <div className="container-narrow flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">FLASH CAST Admin</p>
            <h1 className="font-display text-2xl font-bold">Content & Lead Management</h1>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
      <div className="container-narrow grid gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-3 h-fit">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminLayout;
