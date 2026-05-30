import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminDashboardStats } from "@/lib/adminQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { adminStatusLabel, getAdminLang } from "@/lib/adminLocale";
import { translateProjectType } from "@/i18n/displayLabels";

const copy = {
  en: {
    title: "Operations Workspace",
    body: "Track enquiries, quotes, content health, and translation issues from one place.",
    recentLeads: "Recent Leads",
    recentQuotes: "Recent Quote Requests",
    quickActions: "Quick Actions",
    empty: "No records yet.",
    cards: [
      { key: "todayLeads", label: "Today's New Leads", href: "/admin/leads" },
      { key: "newLeads", label: "New Leads", href: "/admin/leads" },
      { key: "pendingQuotes", label: "Pending Quotes", href: "/admin/quotes" },
      { key: "toQuote", label: "To Quote", href: "/admin/quotes" },
      { key: "dueFollowUps", label: "Follow-ups Due", href: "/admin/leads" },
      { key: "staleLeads", label: "24h Unfollowed Leads", href: "/admin/leads" },
      { key: "monthLeads", label: "Leads This Month", href: "/admin/leads" },
      { key: "monthQuotes", label: "Quotes This Month", href: "/admin/quotes" },
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
    body: "集中查看咨询、报价、内容健康度和翻译异常。",
    recentLeads: "最近咨询",
    recentQuotes: "最近报价请求",
    quickActions: "快捷入口",
    empty: "暂无记录。",
    cards: [
      { key: "todayLeads", label: "今日新咨询", href: "/admin/leads" },
      { key: "newLeads", label: "新咨询", href: "/admin/leads" },
      { key: "pendingQuotes", label: "待处理报价", href: "/admin/quotes" },
      { key: "toQuote", label: "待报价", href: "/admin/quotes" },
      { key: "dueFollowUps", label: "今日待跟进咨询", href: "/admin/leads" },
      { key: "staleLeads", label: "24 小时未跟进咨询", href: "/admin/leads" },
      { key: "monthLeads", label: "本月咨询数", href: "/admin/leads" },
      { key: "monthQuotes", label: "本月报价数", href: "/admin/quotes" },
      { key: "failedTranslations", label: "翻译失败任务", href: "/admin/content/translation_jobs" },
      { key: "projects", label: "已发布案例", href: "/admin/projects" },
      { key: "services", label: "已发布服务", href: "/admin/services" },
      { key: "blog", label: "已发布博客", href: "/admin/blog" },
      { key: "seoMissing", label: "搜索优化缺失项", href: "/admin/seo" },
    ],
    actions: [
      { label: "新建案例", href: "/admin/projects/new" },
      { label: "新建服务", href: "/admin/services/new" },
      { label: "新建博客", href: "/admin/blog/new" },
      { label: "上传图片", href: "/admin/media" },
      { label: "查看新咨询", href: "/admin/leads" },
      { label: "设置 WhatsApp", href: "/admin/settings" },
    ],
  },
};

const AdminDashboard = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const { data } = useAdminDashboardStats();
  const counts = data?.counts ?? {};
  const recentLeads = (data?.recentLeads ?? []) as Array<{
    id: string;
    name?: string;
    phone?: string;
    status?: string;
    source_path?: string;
  }>;
  const recentQuotes = (data?.recentQuotes ?? []) as Array<{
    id: string;
    customer_name?: string;
    customer_phone?: string;
    status?: string;
    project_type?: string;
  }>;

  return (
    <>
      <AdminPageHeader
        title={t.title}
        description={t.body}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/media">上传图片</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {t.cards.map((card) => (
          <AdminStatCard key={card.key} label={card.label} value={counts[card.key] ?? "-"} href={card.href} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{t.recentLeads}</h2>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link key={lead.id} to={`/admin/leads/${lead.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{lead.name || "咨询"} · {lead.phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">
                  {adminStatusLabel("leads", lead.status || "new")} · {lead.source_path || "-"}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && (
              <AdminEmptyState
                title={t.empty}
                description="当有新联系表单提交后会显示在这里。"
                action={
                  <Button asChild variant="outline">
                    <Link to="/admin/leads">查看咨询</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{t.recentQuotes}</h2>
          <div className="space-y-3">
            {recentQuotes.map((quote) => (
              <Link key={quote.id} to={`/admin/quotes/${quote.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{quote.customer_name || "报价请求"} · {quote.customer_phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">
                  {adminStatusLabel("quote_requests", quote.status || "pending")}
                  {quote.project_type ? ` · ${translateProjectType(quote.project_type, lang)}` : ""}
                </span>
              </Link>
            ))}
            {recentQuotes.length === 0 && (
              <AdminEmptyState
                title={t.empty}
                description="当有新报价表单提交后会显示在这里。"
                action={
                  <Button asChild variant="outline">
                    <Link to="/admin/quotes">查看报价</Link>
                  </Button>
                }
              />
            )}
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
    </>
  );
};

export default AdminDashboard;
