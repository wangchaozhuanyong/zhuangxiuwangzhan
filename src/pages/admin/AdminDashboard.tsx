import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminContentHealth, useAdminDashboardStats } from "@/lib/adminQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { ga4PagesReportUrl, isAnalyticsEnabled } from "@/lib/analytics";
import { adminStatusLabel, getAdminLang } from "@/lib/adminLocale";
import { buildAdminWorkflowHref } from "@/lib/adminLeadWorkflow";
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
      { key: "todayLeads", label: "Today's New Leads", href: buildAdminWorkflowHref("/admin/leads", { filter: "today" }) },
      { key: "newLeads", label: "New Leads", href: buildAdminWorkflowHref("/admin/leads", { status: "new" }) },
      { key: "pendingQuotes", label: "Pending Quotes", href: buildAdminWorkflowHref("/admin/quotes", { status: "pending" }) },
      { key: "toQuote", label: "To Quote", href: buildAdminWorkflowHref("/admin/quotes", { filter: "to_quote" }) },
      { key: "dueLeadFollowUps", label: "Lead Follow-ups Due", href: buildAdminWorkflowHref("/admin/leads", { filter: "due_followups" }) },
      { key: "dueQuoteFollowUps", label: "Quote Follow-ups Due", href: buildAdminWorkflowHref("/admin/quotes", { filter: "due_followups" }) },
      { key: "staleLeads", label: "24h Unhandled Leads", href: buildAdminWorkflowHref("/admin/leads", { filter: "stale24" }) },
      { key: "staleQuotes", label: "24h Unhandled Quotes", href: buildAdminWorkflowHref("/admin/quotes", { filter: "stale24" }) },
      { key: "monthLeads", label: "Leads This Month", href: "/admin/leads" },
      { key: "monthQuotes", label: "Quotes This Month", href: "/admin/quotes" },
      { key: "failedTranslations", label: "Failed English Generation", href: "/admin/content/translation_jobs" },
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
      { label: "Lead Reports", href: "/admin/lead-reports" },
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
      { key: "todayLeads", label: "今日新咨询", help: "今天提交到后台的新客户咨询数量。", href: buildAdminWorkflowHref("/admin/leads", { filter: "today" }) },
      { key: "newLeads", label: "新咨询", help: "还没有处理过的客户咨询数量。", href: buildAdminWorkflowHref("/admin/leads", { status: "new" }) },
      { key: "pendingQuotes", label: "待处理报价", help: "已经收到、但还在等待处理的报价请求数量。", href: buildAdminWorkflowHref("/admin/quotes", { status: "pending" }) },
      { key: "toQuote", label: "待报价", help: "需要尽快整理并回复客户的报价请求数量。", href: buildAdminWorkflowHref("/admin/quotes", { filter: "to_quote" }) },
      { key: "dueLeadFollowUps", label: "待跟进咨询", help: "已经到跟进时间、今天应该优先处理的客户咨询。", href: buildAdminWorkflowHref("/admin/leads", { filter: "due_followups" }) },
      { key: "dueQuoteFollowUps", label: "待跟进报价", help: "已经到跟进时间、需要继续回复的报价请求。", href: buildAdminWorkflowHref("/admin/quotes", { filter: "due_followups" }) },
      { key: "staleLeads", label: "24小时未处理咨询", help: "超过 24 小时仍是新咨询的记录。", href: buildAdminWorkflowHref("/admin/leads", { filter: "stale24" }) },
      { key: "staleQuotes", label: "24小时未处理报价", help: "超过 24 小时仍待处理的报价请求。", href: buildAdminWorkflowHref("/admin/quotes", { filter: "stale24" }) },
      { key: "monthLeads", label: "本月咨询数", help: "本月累计收到的客户咨询数量。", href: "/admin/leads" },
      { key: "monthQuotes", label: "本月报价数", help: "本月累计收到的报价请求数量。", href: "/admin/quotes" },
      { key: "failedTranslations", label: "英文生成失败", help: "需要重试或修正的自动英文生成记录数量。", href: "/admin/content/translation_jobs" },
      { key: "projects", label: "已发布案例", help: "已经发布到前台的案例数量。", href: "/admin/projects" },
      { key: "services", label: "已发布服务", help: "已经发布到前台的服务数量。", href: "/admin/services" },
      { key: "blog", label: "已发布博客", help: "已经发布到前台的博客数量。", href: "/admin/blog" },
      { key: "seoMissing", label: "搜索优化缺失项", help: "还没补齐的 SEO 字段数量。", href: "/admin/seo" },
    ],
    actions: [
      { label: "新建案例", href: "/admin/projects/new" },
      { label: "新建服务", href: "/admin/services/new" },
      { label: "新建博客", href: "/admin/blog/new" },
      { label: "上传图片", href: "/admin/media" },
      { label: "查看新咨询", href: "/admin/leads" },
      { label: "查看线索报表", href: "/admin/lead-reports" },
      { label: "设置 WhatsApp", href: "/admin/settings" },
    ],
  },
};

const AdminDashboard = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const [loadHealthCards, setLoadHealthCards] = useState(false);
  const { data } = useAdminDashboardStats();
  const { data: healthItems = [] } = useAdminContentHealth({ enabled: loadHealthCards });
  const counts = data?.counts ?? {};
  const healthValue = (value: number) => (loadHealthCards ? value : "…");
  const contentIssues = healthItems.filter((item) => item.issues.length > 0).length;
  const missingEnglish = healthItems.filter((item) => item.missingEnglish.length > 0).length;
  const draftContent = healthItems.filter((item) => item.status === "draft").length;
  const ga4ActionLabel = lang === "zh" ? "GA4 页面访问统计" : "GA4 Page Views";
  const ga4SetupHint =
    lang === "zh"
      ? "提示：还没填写 VITE_GA_MEASUREMENT_ID 时，按钮仍会打开 GA4；上线前填好后才会正式记录访问量。"
      : "Tip: the button still opens GA4 before VITE_GA_MEASUREMENT_ID is set; tracking starts after the ID is configured.";

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadHealthCards(true), 900);
    return () => window.clearTimeout(timer);
  }, []);
  const recentLeads = (data?.recentLeads ?? []) as Array<{
    id: string;
    name?: string;
    phone?: string;
    status?: string;
    source_path?: string;
    next_follow_up_at?: string | null;
  }>;
  const recentQuotes = (data?.recentQuotes ?? []) as Array<{
    id: string;
    customer_name?: string;
    customer_phone?: string;
    status?: string;
    project_type?: string;
    source_path?: string;
    next_follow_up_at?: string | null;
  }>;

  return (
    <>
      <AdminPageHeader
        title={t.title}
        description={t.body}
        helpText="这里是后台总览，先看咨询和报价，再看内容、翻译和搜索优化是否正常。"
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/media">上传图片</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AdminStatCard
          label="内容健康检查"
          value={healthValue(contentIssues)}
          href="/admin/content-health"
          helpText="集中查看缺英文、缺 SEO、缺图片和必填缺失。数字越低越好。"
        />
        <AdminStatCard
          label="发布中心"
          value={healthValue(draftContent)}
          href="/admin/publish-center"
          helpText="集中查看草稿、已发布、归档和发布前风险。"
        />
        <AdminStatCard
          label="英文生成中心"
          value={healthValue(missingEnglish)}
          href="/admin/english-center"
          helpText="集中扫描缺英文内容，并支持批量自动生成英文。"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {t.cards.map((card) => (
          <AdminStatCard key={card.key} label={card.label} value={counts[card.key] ?? "-"} href={card.href} helpText={card.help} />
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
                  {quote.source_path ? ` · ${quote.source_path}` : ""}
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
          <Button asChild variant="outline">
            <a href={ga4PagesReportUrl} target="_blank" rel="noopener noreferrer">
              {ga4ActionLabel}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {t.actions.map((action) => (
            <Button key={action.href} asChild variant="outline">
              <Link to={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
        {!isAnalyticsEnabled && <p className="mt-3 text-xs leading-5 text-muted-foreground">{ga4SetupHint}</p>}
      </div>
    </>
  );
};

export default AdminDashboard;
