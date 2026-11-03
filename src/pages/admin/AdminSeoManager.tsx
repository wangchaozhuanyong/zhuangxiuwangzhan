import { useAdminListingState } from "@/hooks/useAdminListingState";
import { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";
import {
  adminSeoGuidanceByTableText,
  adminSeoIssueLabels,
  adminSeoManagerText,
  adminSeoStrategyCards,
  adminSeoTechnicalFileText,
  adminSeoTechnicalWorkflowText,
} from "@/i18n/adminSeoManagerText";
import { adminStatusLabel, getAdminLang, useAdminLang } from "@/lib/adminLocale";
import { adminSeoPageTables, checkAdminSeoRows, useAdminSeoAudit } from "@/lib/adminSeoAudit";
import { adminAuditScopes, matchesAdminAuditScope, resolveAdminAuditScope } from "@/lib/adminAuditScope";
import { adminAuditScopeText } from "@/i18n/adminAuditScopeText";
import { formatUserFacingError } from "@/lib/userFacingText";

const strategyCardKeys = ["zhFirst", "geoSignal", "aiReadable"] as const;

const technicalFiles = [
  {
    key: "sitemap",
    title: "sitemap.xml",
    path: "/sitemap.xml",
    source: "scripts/generate-sitemap.mjs",
  },
  {
    key: "robots",
    title: "robots.txt",
    path: "/robots.txt",
    source: "public/robots.txt",
  },
  {
    key: "llms",
    title: "llms.txt",
    path: "/llms.txt",
    source: "scripts/generate-llms.mjs",
  },
] as const;

const technicalWorkflow = [
  {
    key: "generate",
    command: "npm.cmd run generate:sitemap",
  },
  {
    key: "verify",
    command: "node scripts/verify-seo-html.mjs",
  },
  {
    key: "publish",
    command: "npm.cmd run build",
  },
] as const;

type AdminSeoManagerTextKey = keyof typeof adminSeoManagerText;

const emptySeoRows: NonNullable<ReturnType<typeof useAdminSeoAudit>["data"]> = [];

const getChinesePreviewUrl = (frontPath: string) => {
  if (!frontPath || frontPath === "/") return "/zh";
  if (frontPath.startsWith("http")) return frontPath;
  const normalized = frontPath.startsWith("/") ? frontPath : `/${frontPath}`;
  return normalized.startsWith("/zh/") || normalized === "/zh" ? normalized : `/zh${normalized}`;
};

const AdminSeoTechnicalFiles = () => {
  const language = getAdminLang();
  const A = (key: AdminSeoManagerTextKey) => adminSeoManagerText[key][language];
  const fileText = adminSeoTechnicalFileText[language];
  const workflowText = adminSeoTechnicalWorkflowText[language];

  return (
  <div className="space-y-6">
    <AdminPageHeader
      title={A("technicalPageTitle")}
      description={A("technicalPageDescription")}
      helpText={A("technicalPageHelp")}
      actions={
        <div data-admin-mobile-actions className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link to="/admin/seo">{A("backSeo")}</Link>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer">
              {A("openSitemap")}
            </a>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a href="/robots.txt" target="_blank" rel="noreferrer">
              {A("openRobots")}
            </a>
          </Button>
        </div>
      }
    />

    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{A("publicFilesTitle")}</h2>
        <p className="text-sm text-muted-foreground">{A("publicFilesDescription")}</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {technicalFiles.map((file) => (
          <article key={file.path} className="rounded-lg border border-border/70 bg-muted/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{file.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{file.source}</p>
              </div>
              <Button asChild type="button" variant="outline" size="sm">
                <a href={file.path} target="_blank" rel="noreferrer">
                  {A("view")}
                </a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{fileText[file.key].description}</p>
            <p className="mt-3 rounded-md bg-background/70 p-3 text-xs text-foreground/80">{fileText[file.key].check}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{A("workflowTitle")}</h2>
        <p className="text-sm text-muted-foreground">{A("workflowDescription")}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {technicalWorkflow.map((step, index) => (
          <div key={step.key} className="rounded-lg border border-border/70 bg-muted/25 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">
                  {index + 1}. {workflowText[step.key].title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{workflowText[step.key].detail}</p>
              </div>
              <code className="rounded-md bg-background px-3 py-2 text-xs text-foreground">{step.command}</code>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl border p-5 admin-tone-warning">
      <h2 className="text-lg font-semibold">{A("currentBoundaryTitle")}</h2>
      <p className="mt-2 text-sm">{A("currentBoundaryDescription")}</p>
    </section>
  </div>
  );
};

const AdminSeoAuditView = () => {
  const language = useAdminLang();
  const A = useCallback((key: AdminSeoManagerTextKey): string => adminSeoManagerText[key][language], [language]);
  const formatA = useCallback(
    (key: AdminSeoManagerTextKey, values: Record<string, string>): string =>
      Object.entries(values).reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key)),
    [A],
  );
  const strategyCards = strategyCardKeys.map((key) => adminSeoStrategyCards[language][key]);
  const guidanceByTable = adminSeoGuidanceByTableText[language];
  const { data, isLoading, isFetching, isInitialError, error, refreshError, refetch } = useAdminSeoAudit();
  const rows = data ?? emptySeoRows;
  const list = useAdminListingState();
  const status = list.filter("status");
  const scope = resolveAdminAuditScope(list.filter("scope"));
  const sourceErrors = useMemo(() => rows.filter((row) => row.error || row.status === "error"), [rows]);
  const records = useMemo(() => rows.filter((row) => !row.error && row.status !== "error"), [rows]);
  const checkedRows = useMemo(
    () => checkAdminSeoRows(records.filter((row) => matchesAdminAuditScope(row.status, scope))),
    [records, scope],
  );
  const complete = data !== undefined && sourceErrors.length === 0;
  const summary = useMemo(() => ({
    total: checkedRows.length,
    missing: checkedRows.filter((row) => row.issues.some((issue) => issue.severity === "missing")).length,
    suggestions: checkedRows.filter((row) => row.issues.some((issue) => issue.severity === "suggestion")).length,
    errors: checkedRows.filter((row) => row.issues.some((issue) => issue.severity === "error")).length,
    ok: checkedRows.filter((row) => row.issues.length === 0).length,
  }), [checkedRows]);
  const stat = (value: number) => complete ? value : "…";
  const filtered = checkedRows.filter((row) => {
    if (status === "missing") return row.issues.some((issue) => issue.severity === "missing");
    if (status === "suggestions") return row.issues.some((issue) => issue.severity === "suggestion");
    if (status === "errors") return row.issues.some((issue) => issue.severity === "error");
    if (status === "zh" || status === "geo" || status === "ai") return row.issues.some((issue) => issue.category === status);
    if (status === "ok") return row.issues.length === 0;
    return true;
  });
  const severityLabels = {
    missing: A("severityMissing"),
    suggestion: A("severitySuggestion"),
    error: A("severityError"),
  };

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <AdminPageHeader
        title={A("auditPageTitle")}
        description={A("auditPageDescription")}
        helpText={A("auditPageHelp")}
        actions={
          <div className="flex min-w-0 flex-wrap gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link to="/admin/seo#sitemap">{A("sitemapRobots")}</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? A("refreshing") : A("refresh")}
            </Button>
            <select
              value={scope}
              onChange={(event) => list.setFilter("scope", event.target.value)}
              aria-label={adminAuditScopeText.scopeLabel[language]}
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-auto"
            >
              {adminAuditScopes.map((value) => <option key={value} value={value}>{adminAuditScopeText[value][language]}</option>)}
            </select>
            <select
              value={status}
              onChange={(event) => list.setFilter("status", event.target.value)}
              aria-label={A("filterLabel")}
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="all">{A("filterAll")}</option>
              <option value="missing">{A("filterMissing")}</option>
              <option value="suggestions">{A("filterSuggestions")}</option>
              <option value="errors">{A("filterErrors")}</option>
              <option value="zh">{A("filterZh")}</option>
              <option value="geo">{A("filterGeo")}</option>
              <option value="ai">{A("filterAi")}</option>
              <option value="ok">{A("filterOk")}</option>
            </select>
          </div>
        }
      />
      {isInitialError && <AdminAlert tone="error">{formatUserFacingError(error, language)}</AdminAlert>}
      {refreshError && <AdminAlert tone="warning">{formatUserFacingError(refreshError, language)}</AdminAlert>}
      {sourceErrors.length > 0 && (
        <AdminAlert tone="warning">
          {formatA("incompleteSources", { sources: sourceErrors.map((row) => row.source.label).join(language === "zh" ? "、" : ", ") })}
        </AdminAlert>
      )}
      {isLoading ? (
        <AdminLoadingState label={A("loading")} />
      ) : (
        <>
          {data === undefined && !isInitialError && <AdminAlert>{A("unconfirmed")}</AdminAlert>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label={A("checkContent")} value={stat(summary.total)} />
            <AdminStatCard label={A("missing")} value={stat(summary.missing)} helpText={A("missingHelp")} />
            <AdminStatCard label={A("suggestions")} value={stat(summary.suggestions)} helpText={A("suggestionsHelp")} />
            <AdminStatCard label={A("configurationIssues")} value={stat(summary.errors)} helpText={A("errorsHelp")} />
            <AdminStatCard label={A("passed")} value={stat(summary.ok)} helpText={A("noAlertsHelp")} />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{adminAuditScopeText.recordNotice[language]}</p>
            {complete && <p>{formatA("archivedSummary", {
              total: String(records.length),
              archived: String(records.filter((row) => row.status === "archived").length),
            })}</p>}
          </div>
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {strategyCards.map((card) => (
                <div key={card.title} className="min-w-0 rounded-lg border border-border/70 bg-muted/30 p-4">
                  <h2 className="font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                  <p className="mt-3 text-xs text-foreground/75">{card.example}</p>
                </div>
              ))}
            </div>
          </section>
          {isFetching && <AdminAlert>{A("loading")}</AdminAlert>}
          <div className="space-y-3">
            {filtered.map((row) => {
              const isPageTable = adminSeoPageTables.has(row.table);
              const editUrl = isPageTable ? row.source.route : `${row.source.route}/${row.id}`;
              const frontPath = isPageTable ? String(row.path || row.source.front || "/") : row.slug ? `${row.source.front}/${row.slug}` : row.source.front;
              const frontUrl = frontPath.includes(":") ? null : getChinesePreviewUrl(frontPath);
              const guidance = guidanceByTable[row.table];
              return (
                <article key={`${row.table}-${row.id}`} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{row.title_zh || row.title_en || row.name || row.page_key || row.slug || row.source.label}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {row.source.label} · {row.path || row.slug || "-"} · {adminStatusLabel("default", row.status || "-")}
                      </p>
                      {guidance && (
                        <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">{formatA("guidanceFormula", { title: guidance.title, formula: guidance.formula })}</p>
                          <p className="mt-1">{formatA("guidanceMustInclude", { mustInclude: guidance.mustInclude })}</p>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.issues.length ? row.issues.map((issue) => (
                          <span
                            key={issue.key}
                            className={`max-w-full break-words rounded-full px-2 py-1 text-xs ${issue.severity === "suggestion" ? "admin-tone-warning" : "admin-tone-error"}`}
                          >
                            {severityLabels[issue.severity]} · {adminSeoIssueLabels[issue.key][language]}
                          </span>
                        )) : (
                          <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">{A("seoGeoPassed")}</span>
                        )}
                      </div>
                    </div>
                    <div data-admin-card-actions className="flex shrink-0 flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={editUrl} aria-disabled={isFetching} onClick={(event) => { if (isFetching) event.preventDefault(); }}>{A("edit")}</Link>
                      </Button>
                      {frontUrl && <Button asChild size="sm" variant="outline"><Link to={frontUrl}>{A("chineseFrontendPage")}</Link></Button>}
                    </div>
                  </div>
                </article>
              );
            })}
            {complete && filtered.length === 0 && <AdminEmptyState title={A("emptyTitle")} description={A("emptyDescription")} />}
          </div>
        </>
      )}
    </div>
  );
};

const AdminSeoManager = () => {
  const location = useLocation();
  const isSitemapView = location.hash === "#sitemap";

  return isSitemapView ? <AdminSeoTechnicalFiles /> : <AdminSeoAuditView />;
};

export default AdminSeoManager;
