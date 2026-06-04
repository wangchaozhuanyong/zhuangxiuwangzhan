import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminContentHealth } from "@/lib/adminContentHealth";
import { useAdminDashboardStats } from "@/lib/adminDashboardQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { ga4PagesReportUrl, isAnalyticsEnabled } from "@/lib/analytics";
import { adminStatusLabel, getAdminLang } from "@/lib/adminLocale";
import { buildAdminWorkflowHref } from "@/lib/adminLeadWorkflow";
import { adminDashboardActions, adminDashboardCards, adminDashboardText } from "@/i18n/adminDashboardText";
import { translateProjectType } from "@/i18n/displayLabels";
import { formatSourcePath } from "@/lib/userFacingText";

type AdminDashboardTextKey = keyof typeof adminDashboardText;
type AdminDashboardCardKey = (typeof adminDashboardCards)[number]["key"];

const A = (key: AdminDashboardTextKey) => adminDashboardText[key][getAdminLang()];

const cardHrefs: Record<AdminDashboardCardKey, string> = {
  todayLeads: buildAdminWorkflowHref("/admin/leads", { filter: "today" }),
  newLeads: buildAdminWorkflowHref("/admin/leads", { status: "new" }),
  pendingQuotes: buildAdminWorkflowHref("/admin/quotes", { status: "pending" }),
  toQuote: buildAdminWorkflowHref("/admin/quotes", { filter: "to_quote" }),
  dueLeadFollowUps: buildAdminWorkflowHref("/admin/leads", { filter: "due_followups" }),
  dueQuoteFollowUps: buildAdminWorkflowHref("/admin/quotes", { filter: "due_followups" }),
  staleLeads: buildAdminWorkflowHref("/admin/leads", { filter: "stale24" }),
  staleQuotes: buildAdminWorkflowHref("/admin/quotes", { filter: "stale24" }),
  monthLeads: "/admin/leads",
  monthQuotes: "/admin/quotes",
  failedTranslations: "/admin/content/translation_jobs",
  projects: "/admin/projects",
  services: "/admin/services",
  blog: "/admin/blog",
  seoMissing: "/admin/seo",
};

const AdminDashboard = () => {
  const lang = getAdminLang();
  const [loadHealthCards, setLoadHealthCards] = useState(false);
  const { data } = useAdminDashboardStats();
  const { data: healthItems = [] } = useAdminContentHealth({ enabled: loadHealthCards });
  const counts = data?.counts ?? {};
  const healthValue = (value: number) => (loadHealthCards ? value : "…");
  const contentIssues = healthItems.filter((item) => item.issues.length > 0).length;
  const missingEnglish = healthItems.filter((item) => item.missingEnglish.length > 0).length;
  const draftContent = healthItems.filter((item) => item.status === "draft").length;

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
        title={A("title")}
        description={A("body")}
        helpText={A("helpText")}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/media">{A("uploadImage")}</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AdminStatCard
          label={A("contentHealth")}
          value={healthValue(contentIssues)}
          href="/admin/content-health"
          helpText={A("contentHealthHelp")}
        />
        <AdminStatCard
          label={A("publishCenter")}
          value={healthValue(draftContent)}
          href="/admin/publish-center"
          helpText={A("publishCenterHelp")}
        />
        <AdminStatCard
          label={A("englishCenter")}
          value={healthValue(missingEnglish)}
          href="/admin/english-center"
          helpText={A("englishCenterHelp")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminDashboardCards.map((card) => (
          <AdminStatCard key={card.key} label={card.label[lang]} value={counts[card.key] ?? "-"} href={cardHrefs[card.key]} helpText={card.help[lang]} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{A("recentLeads")}</h2>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link key={lead.id} to={`/admin/leads/${lead.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{lead.name || A("leadFallback")} · {lead.phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">
                  {adminStatusLabel("leads", lead.status || "new")} · {formatSourcePath(lead.source_path, lang)}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && (
              <AdminEmptyState
                title={A("empty")}
                description={A("emptyLeadsDescription")}
                action={
                  <Button asChild variant="outline">
                    <Link to="/admin/leads">{A("viewLeads")}</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">{A("recentQuotes")}</h2>
          <div className="space-y-3">
            {recentQuotes.map((quote) => (
              <Link key={quote.id} to={`/admin/quotes/${quote.id}`} className="block rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{quote.customer_name || A("quoteFallback")} · {quote.customer_phone || "-"}</span>
                <span className="block text-xs text-muted-foreground">
                  {adminStatusLabel("quote_requests", quote.status || "pending")}
                  {quote.project_type ? ` · ${translateProjectType(quote.project_type, lang)}` : ""}
                  {quote.source_path ? ` · ${formatSourcePath(quote.source_path, lang)}` : ""}
                </span>
              </Link>
            ))}
            {recentQuotes.length === 0 && (
              <AdminEmptyState
                title={A("empty")}
                description={A("emptyQuotesDescription")}
                action={
                  <Button asChild variant="outline">
                    <Link to="/admin/quotes">{A("viewQuotes")}</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      <div id="tasks" className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold">{A("quickActions")}</h2>
        <div data-admin-card-actions className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={ga4PagesReportUrl} target="_blank" rel="noopener noreferrer">
              {A("ga4ActionLabel")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          {adminDashboardActions.map((action) => (
            <Button key={action.href} asChild variant="outline">
              <Link to={action.href}>{action.label[lang]}</Link>
            </Button>
          ))}
        </div>
        {!isAnalyticsEnabled && <p className="mt-3 text-xs leading-5 text-muted-foreground">{A("ga4SetupHint")}</p>}
      </div>
    </>
  );
};

export default AdminDashboard;
