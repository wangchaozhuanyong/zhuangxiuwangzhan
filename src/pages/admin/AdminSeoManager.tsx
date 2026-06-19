import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { Button } from "@/components/ui/button";
import {
  adminSeoGuidanceByTableText,
  adminSeoIssueLabels,
  adminSeoManagerText,
  adminSeoStrategyCards,
  adminSeoTechnicalFileText,
  adminSeoTechnicalWorkflowText,
} from "@/i18n/adminSeoManagerText";
import { adminStatusLabel, getAdminLang } from "@/lib/adminLocale";
import { type AdminSeoAuditRow, useAdminSeoAudit } from "@/lib/adminSeoAudit";
import { formatUserFacingError } from "@/lib/userFacingText";

type IssueCategory = "zh" | "geo" | "ai" | "technical" | "en";

type AuditIssue = {
  label: string;
  category: IssueCategory;
};

type CheckedSeoRow = AdminSeoAuditRow & {
  issues: AuditIssue[];
};

const zhGeoTerms = ["吉隆坡", "雪兰莪", "巴生谷", "马来西亚", "Kuala Lumpur", "Selangor", "Klang Valley", "KL"];
const pageTables = new Set(["site_pages", "cms_pages"]);
const geoRequiredTables = new Set(["site_pages", "cms_pages", "services", "service_areas", "landing_pages"]);
const zhDescriptionMin = 55;
const enDescriptionMin = 80;
const zhTitleMax = 40;
const enTitleMax = 70;

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
type AdminSeoIssueLabelKey = keyof typeof adminSeoIssueLabels;
type AdminSeoLanguage = keyof typeof adminSeoManagerText[AdminSeoManagerTextKey];

const emptySeoRows: NonNullable<ReturnType<typeof useAdminSeoAudit>["data"]> = [];

const localizedIssueLabel = (key: AdminSeoIssueLabelKey, language: AdminSeoLanguage) => adminSeoIssueLabels[key][language];

const readText = (row: AdminSeoAuditRow, key: keyof AdminSeoAuditRow) => String(row[key] || "").trim();
const hasChinese = (value: string) => /[\u4e00-\u9fff]/.test(value);
const hasGeoSignal = (value: string) => zhGeoTerms.some((term) => value.toLowerCase().includes(term.toLowerCase()));
const hasField = (row: AdminSeoAuditRow, key: keyof AdminSeoAuditRow) => Object.prototype.hasOwnProperty.call(row, key);
const addIssue = (issues: AuditIssue[], category: IssueCategory, label: string) => issues.push({ category, label });

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

    <section className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-lg font-semibold">{A("currentBoundaryTitle")}</h2>
      <p className="mt-2 text-sm">{A("currentBoundaryDescription")}</p>
    </section>
  </div>
  );
};

const buildRowIssues = (row: AdminSeoAuditRow, language: AdminSeoLanguage): AuditIssue[] => {
  const issues: AuditIssue[] = [];
  const zhTitle = readText(row, "seo_title_zh");
  const zhDescription = readText(row, "seo_description_zh");
  const zhKeywords = readText(row, "seo_keywords_zh");
  const enTitle = readText(row, "seo_title_en");
  const enDescription = readText(row, "seo_description_en");
  const geoText = [zhTitle, zhDescription, zhKeywords, readText(row, "title_zh"), readText(row, "path"), readText(row, "slug")].join(" ");
  const image = readText(row, "image_url") || readText(row, "cover_image_url") || readText(row, "hero_image_url");

  if (row.error) addIssue(issues, "technical", formatUserFacingError(row.error, language));
  if (!zhTitle) addIssue(issues, "zh", localizedIssueLabel("missingZhTitle", language));
  if (zhTitle && !hasChinese(zhTitle)) addIssue(issues, "zh", localizedIssueLabel("zhTitleNoChinese", language));
  if (zhTitle.length > zhTitleMax) addIssue(issues, "zh", localizedIssueLabel("zhTitleTooLong", language));
  if (!zhDescription) addIssue(issues, "zh", localizedIssueLabel("missingZhDescription", language));
  if (zhDescription && !hasChinese(zhDescription)) addIssue(issues, "zh", localizedIssueLabel("zhDescriptionNoChinese", language));
  if (zhDescription && zhDescription.length < zhDescriptionMin) addIssue(issues, "zh", localizedIssueLabel("zhDescriptionTooShort", language));
  if (pageTables.has(row.table) && !zhKeywords) addIssue(issues, "zh", localizedIssueLabel("missingZhKeywords", language));
  if (geoRequiredTables.has(row.table) && !hasGeoSignal(geoText)) addIssue(issues, "geo", localizedIssueLabel("missingGeoTerms", language));
  if (zhDescription && !/[，。、；：,.]/.test(zhDescription)) addIssue(issues, "ai", localizedIssueLabel("zhDescriptionWeakAi", language));
  if (image && hasField(row, "alt_zh") && !readText(row, "alt_zh")) addIssue(issues, "ai", localizedIssueLabel("missingImageAltZh", language));
  if (!pageTables.has(row.table) && !row.slug) addIssue(issues, "technical", localizedIssueLabel("missingSlug", language));
  if (!enTitle) addIssue(issues, "en", localizedIssueLabel("missingEnTitle", language));
  if (enTitle.length > enTitleMax) addIssue(issues, "en", localizedIssueLabel("enTitleTooLong", language));
  if (!enDescription) addIssue(issues, "en", localizedIssueLabel("missingEnDescription", language));
  if (enDescription && enDescription.length < enDescriptionMin) addIssue(issues, "en", localizedIssueLabel("enDescriptionTooShort", language));

  return issues;
};

const AdminSeoAuditView = () => {
  const language = getAdminLang();
  const A = useCallback((key: AdminSeoManagerTextKey): string => adminSeoManagerText[key][language], [language]);
  const formatA = useCallback(
    (key: AdminSeoManagerTextKey, values: Record<string, string>): string =>
      Object.entries(values).reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key)),
    [A],
  );
  const strategyCards = strategyCardKeys.map((key) => adminSeoStrategyCards[language][key]);
  const guidanceByTable = adminSeoGuidanceByTableText[language];
  const { data, isFetching, isError, error, refetch } = useAdminSeoAudit();
  const rows = data ?? emptySeoRows;
  const initialLoading = isFetching && !data;
  const [status, setStatus] = useState("all");

  const checkedRows = useMemo<CheckedSeoRow[]>(() => rows.map((row) => ({ ...row, issues: buildRowIssues(row, language) })), [language, rows]);

  const duplicateSlugs = useMemo(() => {
    const seen = new Map<string, number>();
    checkedRows.forEach((row) => {
      if (row.slug) seen.set(`${row.table}:${row.slug}`, (seen.get(`${row.table}:${row.slug}`) || 0) + 1);
    });
    return seen;
  }, [checkedRows]);

  const rowsWithDuplicates = useMemo<CheckedSeoRow[]>(
    () =>
      checkedRows.map((row) => {
        const duplicate = row.slug && (duplicateSlugs.get(`${row.table}:${row.slug}`) || 0) > 1;
        return duplicate ? { ...row, issues: [...row.issues, { category: "technical", label: A("duplicateSlug") }] } : row;
      }),
    [A, checkedRows, duplicateSlugs],
  );

  const summary = useMemo(() => {
    const hasCategory = (row: CheckedSeoRow, category: IssueCategory) => row.issues.some((issue) => issue.category === category);
    return {
      total: rowsWithDuplicates.length,
      missing: rowsWithDuplicates.filter((row) => row.issues.length > 0).length,
      zh: rowsWithDuplicates.filter((row) => hasCategory(row, "zh")).length,
      geo: rowsWithDuplicates.filter((row) => hasCategory(row, "geo")).length,
      ai: rowsWithDuplicates.filter((row) => hasCategory(row, "ai")).length,
      ok: rowsWithDuplicates.filter((row) => row.issues.length === 0).length,
    };
  }, [rowsWithDuplicates]);

  const filtered = rowsWithDuplicates.filter((row) => {
    if (status === "missing") return row.issues.length > 0;
    if (status === "zh") return row.issues.some((issue) => issue.category === "zh");
    if (status === "geo") return row.issues.some((issue) => issue.category === "geo");
    if (status === "ai") return row.issues.some((issue) => issue.category === "ai");
    if (status === "ok") return row.issues.length === 0;
    return true;
  });

  const loadMessage = isError
    ? formatUserFacingError(error, language)
    : isFetching
      ? A("loading")
      : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("auditPageTitle")}
        description={A("auditPageDescription")}
        helpText={A("auditPageHelp")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link to="/admin/seo#sitemap">{A("sitemapRobots")}</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? A("refreshing") : A("refresh")}
            </Button>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label={A("filterLabel")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">{A("filterAll")}</option>
              <option value="missing">{A("filterMissing")}</option>
              <option value="zh">{A("filterZh")}</option>
              <option value="geo">{A("filterGeo")}</option>
              <option value="ai">{A("filterAi")}</option>
              <option value="ok">{A("filterOk")}</option>
            </select>
          </div>
        }
      />

      {initialLoading ? (
        <AdminLoadingState label={A("loading")} />
      ) : (
      <>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{A("checkContent")}</p>
          <p className="mt-1 text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{A("missing")}</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{summary.missing}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{A("zhSeo")}</p>
          <p className="mt-1 text-2xl font-bold">{summary.zh}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{A("geoRegion")}</p>
          <p className="mt-1 text-2xl font-bold">{summary.geo}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{A("passed")}</p>
          <p className="mt-1 text-2xl font-bold text-accent">{summary.ok}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {strategyCards.map((card) => (
            <div key={card.title} className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <h2 className="font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              <p className="mt-3 text-xs text-foreground/75">{card.example}</p>
            </div>
          ))}
        </div>
      </section>

      {loadMessage && <AdminAlert tone={isError ? "error" : "info"}>{loadMessage}</AdminAlert>}

      <div className="space-y-3">
        {filtered.map((row) => {
          const rowRecord = row as typeof row & { path?: string; page_key?: string };
          const isPageTable = pageTables.has(row.table);
          const editUrl = isPageTable ? row.source.route : `${row.source.route}/${row.id}`;
          const frontPath = isPageTable ? String(rowRecord.path || row.source.front || "/") : row.slug ? `${row.source.front}/${row.slug}` : row.source.front;
          const frontUrl = getChinesePreviewUrl(frontPath);
          const guidance = guidanceByTable[row.table];

          return (
            <article key={`${row.table}-${row.id || row.error}`} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.title_zh || row.title_en || row.name || rowRecord.page_key || row.slug || row.source.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.source.label} · {rowRecord.path || row.slug || "-"} · {adminStatusLabel("default", row.status || "-")}
                  </p>
                  {guidance && (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{formatA("guidanceFormula", { title: guidance.title, formula: guidance.formula })}</p>
                      <p className="mt-1">{formatA("guidanceMustInclude", { mustInclude: guidance.mustInclude })}</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.issues.length ? (
                      row.issues.map((issue) => (
                        <span key={`${issue.category}-${issue.label}`} className={`rounded-full px-2 py-1 text-xs ${issue.category === "geo" ? "bg-amber-500/10 text-amber-700" : issue.category === "ai" ? "bg-sky-500/10 text-sky-700" : issue.category === "en" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                          {issue.label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">{A("seoGeoPassed")}</span>
                    )}
                  </div>
                </div>
                <div data-admin-card-actions className="flex shrink-0 gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={editUrl}>{A("edit")}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to={frontUrl}>{A("chineseFrontendPage")}</Link></Button>
                </div>
              </div>
            </article>
          );
        })}
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
