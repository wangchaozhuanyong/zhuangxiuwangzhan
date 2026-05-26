import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    cards: [
      { label: "New Leads", table: "leads", href: "/admin/content/leads" },
      { label: "Quote Requests", table: "quote_requests", href: "/admin/content/quote_requests" },
      { label: "Projects", table: "projects", href: "/admin/content/projects" },
      { label: "Blog Posts", table: "blog_posts", href: "/admin/content/blog_posts" },
      { label: "Materials", table: "materials", href: "/admin/content/materials" },
      { label: "Landing Pages", table: "landing_pages", href: "/admin/content/landing_pages" },
      { label: "Translation Jobs", table: "translation_jobs", href: "/admin/content/translation_jobs" },
      { label: "Notifications", table: "notification_settings", href: "/admin/notifications" },
    ],
    title: "Bilingual content workflow",
    body: "Admins write Chinese content first. Saving content can trigger the translation Edge Function, then English can be reviewed, regenerated, or edited manually.",
    manage: "Manage content",
  },
  zh: {
    cards: [
      { label: "新线索", table: "leads", href: "/admin/content/leads" },
      { label: "报价请求", table: "quote_requests", href: "/admin/content/quote_requests" },
      { label: "装修案例", table: "projects", href: "/admin/content/projects" },
      { label: "博客文章", table: "blog_posts", href: "/admin/content/blog_posts" },
      { label: "材料库", table: "materials", href: "/admin/content/materials" },
      { label: "落地页", table: "landing_pages", href: "/admin/content/landing_pages" },
      { label: "翻译任务", table: "translation_jobs", href: "/admin/content/translation_jobs" },
      { label: "通知设置", table: "notification_settings", href: "/admin/notifications" },
    ],
    title: "双语内容流程",
    body: "建议先编辑中文内容。保存后可触发翻译函数生成英文，再由管理员审核、重新生成或手动修改。",
    manage: "管理内容",
  },
};

const AdminDashboard = () => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void Promise.all(
      t.cards.map(async (card) => {
        const { count } = await supabase!.from(card.table).select("*", { count: "exact", head: true });
        return [card.table, count || 0] as const;
      }),
    ).then((entries) => setCounts(Object.fromEntries(entries)));
  }, [t.cards]);

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {t.cards.map((card) => (
          <Link key={card.table} to={card.href} className="rounded-xl border border-border bg-card p-5 hover-lift">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{counts[card.table] ?? "-"}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold mb-2">{t.title}</h2>
        <p className="text-muted-foreground mb-4">
          {t.body}
        </p>
        <Button asChild><Link to="/admin/content/projects">{t.manage}</Link></Button>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
