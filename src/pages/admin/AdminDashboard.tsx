import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    title: "Operations Workspace",
    body: "Track enquiries, quotes, content health, and translation issues from one place.",
    recentLeads: "Recent Leads",
    recentQuotes: "Recent Quote Requests",
    quickActions: "Quick Actions",
    empty: "No records yet.",
    cards: [
      { key: "newLeads", label: "New Leads", href: "/admin/leads" },
      { key: "pendingQuotes", label: "Pending Quotes", href: "/admin/quotes" },
      { key: "staleLeads", label: "24h Unfollowed Leads", href: "/admin/leads" },
      { key: "failedTranslations", label: "Failed Translations", href: "/admin/content/translation_jobs" },
      { key: "projects", label: "Published Projects", href: "/admin/projects" },
      { key: "services", label: "Published Services", href: "/admin/services" },
      { key: "blog", label: "Published Blog Posts", href: "/admin/blog" },
      { key: "seoMissing", label: "Missing SEO Fields", href: "/admin/seo" },
    ],
    actions: [
      { label: "New Project", href: "/admin/projects/new" },
      { label: "New Service", href: "/admin/services/new" },
      { label: "New Blog", href: "/admin/blog/new" },
      { label: "Upload Image", href: "/admin/media" },
      { label: "View New Leads", href: "/admin/leads" },
      { label: "Set WhatsApp", href: "/admin/settings" },
    ],
  },
  zh: {
    title: "运营工作台",
    body: "集中查看询盘、报价、内容健康度和翻译异常。",
    recentLeads: "最近线索",
    recentQuotes: "最近报价请求",
    quickActions: "快捷入口",
    empty: "暂无记录。",
    cards: [
      { key: "newLeads", label: "新线索", href: "/admin/leads" },
      { key: "pendingQuotes", label: "待处理报价", href: "/admin/quotes" },
      { key: "staleLeads", label: "24 小时未跟进", href: "/admin/leads" },
      { key: "failedTranslations", label: "翻译失败任务", href: "/admin/content/translation_jobs" },
      { key: "projects", label: "已发布案例", href: "/admin/projects" },
      { key: "services", label: "已发布服务", href: "/admin/services" },
      { key: "blog", label: "已发布博客", href: "/admin/blog" },
      { key: "seoMissing", label: "SEO 缺失项", href: "/admin/seo" },
    ],
    actions: [
      { label: "新建案例", href: "/admin/projects/new" },
      { label: "新建服务", href: "/admin/services/new" },
      { label: "新建博客", href: "/admin/blog/new" },
      { label: "上传图片", href: "/admin/media" },
      { label: "查看新线索", href: "/admin/leads" },
      { label: "设置 WhatsApp", href: "/admin/settings" },
    ],
  },
};

const AdminDashboard = () => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    void Promise.all([
      supabase!.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase!.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase!.from("leads").select("*", { count: "exact", head: true }).eq("status", "new").lt("created_at", since),
      supabase!.from("translation_jobs").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase!.from("projects").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase!.from("services").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase!.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase!.from("services").select("*", { count: "exact", head: true }).or("seo_title_zh.is.null,seo_description_zh.is.null"),
      supabase!.from("leads").select("id,name,phone,status,created_at,source_path").order("created_at", { ascending: false }).limit(10),
      supabase!.from("quote_requests").select("id,customer_name,customer_phone,status,created_at,project_type").order("created_at", { ascending: false }).limit(10),
    ]).then(([newLeads, pendingQuotes, staleLeads, failedTranslations, projects, services, blog, seoMissing, leads, quotes]) => {
      setCounts({
        newLeads: newLeads.count || 0,
        pendingQuotes: pendingQuotes.count || 0,
        staleLeads: staleLeads.count || 0,
        failedTranslations: failedTranslations.count || 0,
        projects: projects.count || 0,
        services: services.count || 0,
        blog: blog.count || 0,
        seoMissing: seoMissing.count || 0,
      });
      setRecentLeads(leads.data || []);
      setRecentQuotes(quotes.data || []);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {t.cards.map((card) => (
          <Link key={card.key} to={card.href} className="rounded-xl border border-border bg-card p-5 hover-lift">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{counts[card.key] ?? "-"}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{t.recentLeads}</h2>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link key={lead.id} to={`/admin/leads/${lead.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{lead.name || "Lead"} · {lead.phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">{lead.status} · {lead.source_path || "-"}</span>
              </Link>
            ))}
            {recentLeads.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{t.recentQuotes}</h2>
          <div className="space-y-3">
            {recentQuotes.map((quote) => (
              <Link key={quote.id} to={`/admin/quotes/${quote.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{quote.customer_name || "Quote"} · {quote.customer_phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">{quote.status} · {quote.project_type || "-"}</span>
              </Link>
            ))}
            {recentQuotes.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
          </div>
        </div>
      </div>

      <div id="tasks" className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-xl font-bold">{t.quickActions}</h2>
        <div className="flex flex-wrap gap-3">
          {t.actions.map((action) => (
            <Button key={action.href} asChild variant="outline">
              <Link to={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
