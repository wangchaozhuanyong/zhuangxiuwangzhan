import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";

const cards = [
  { label: "New Leads", table: "leads", href: "/admin/content/leads" },
  { label: "Quote Requests", table: "quote_requests", href: "/admin/content/quote_requests" },
  { label: "Projects", table: "projects", href: "/admin/content/projects" },
  { label: "Blog Posts", table: "blog_posts", href: "/admin/content/blog_posts" },
  { label: "Materials", table: "materials", href: "/admin/content/materials" },
  { label: "Landing Pages", table: "landing_pages", href: "/admin/content/landing_pages" },
  { label: "Translation Jobs", table: "translation_jobs", href: "/admin/content/translation_jobs" },
  { label: "Notifications", table: "notification_settings", href: "/admin/notifications" },
];

const AdminDashboard = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void Promise.all(
      cards.map(async (card) => {
        const { count } = await supabase!.from(card.table).select("*", { count: "exact", head: true });
        return [card.table, count || 0] as const;
      }),
    ).then((entries) => setCounts(Object.fromEntries(entries)));
  }, []);

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.table} to={card.href} className="rounded-xl border border-border bg-card p-5 hover-lift">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{counts[card.table] ?? "-"}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold mb-2">Bilingual content workflow</h2>
        <p className="text-muted-foreground mb-4">
          Admins write Chinese content first. Saving content can trigger the translation Edge Function, then English can be reviewed, regenerated, or edited manually.
        </p>
        <Button asChild><Link to="/admin/content/projects">Manage content</Link></Button>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
