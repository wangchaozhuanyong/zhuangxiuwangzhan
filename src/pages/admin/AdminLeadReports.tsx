import { ClipboardList, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";
import { useAdminLeadReport } from "@/lib/adminQueries";
import { getAdminLang } from "@/lib/adminLocale";
import {
  normalizeAdminLeadReportPeriod,
  type AdminLeadReportPeriod,
  type LeadFunnelStage,
  type LeadProjectTypeSummary,
  type LeadSourceSummary,
} from "@/lib/adminLeadReports";

const copy = {
  en: {
    title: "Lead Source Report",
    description: "Read-only view for enquiry sources, quote performance, and renovation conversion funnel.",
    helpText: "This report uses existing leads and quote requests. It does not change customer data.",
    sourceTitle: "Source Performance",
    funnelTitle: "Renovation Conversion Funnel",
    projectTypeTitle: "Project Type Breakdown",
    empty: "No enquiries or quote requests in this period.",
    viewLeads: "View Leads",
    viewQuotes: "View Quotes",
    period: {
      "30d": "Last 30 days",
      "90d": "Last 90 days",
      all: "All time",
    },
    totals: {
      submitted: "Total Submissions",
      leads: "Contact Leads",
      quotes: "Quote Requests",
      won: "Won Projects",
      closeRate: "Close Rate",
      wonValue: "Estimated Won Value",
    },
    table: {
      source: "Source",
      total: "Total",
      leads: "Leads",
      quotes: "Quotes",
      quoted: "Quoted",
      won: "Won",
      closeRate: "Close Rate",
      value: "Value",
      projectType: "Project Type",
    },
    note: "Funnel rule: submitted means all enquiries and quote requests; contacted includes contacted / site visit / quoted / won; quoted includes quoted and accepted / converted; won includes accepted quote requests and converted leads.",
  },
  zh: {
    title: "线索来源报表",
    description: "只读查看客户从哪里来、哪些页面带来报价、装修项目从咨询到成交的漏斗。",
    helpText: "这个报表只读取现有客户咨询和报价请求，不会修改客户数据。",
    sourceTitle: "来源表现",
    funnelTitle: "装修项目成交漏斗",
    projectTypeTitle: "项目类型拆分",
    empty: "这个时间范围内还没有咨询或报价请求。",
    viewLeads: "查看咨询",
    viewQuotes: "查看报价",
    period: {
      "30d": "近30天",
      "90d": "近90天",
      all: "全部时间",
    },
    totals: {
      submitted: "总提交数",
      leads: "客户咨询",
      quotes: "报价请求",
      won: "已成交项目",
      closeRate: "成交率",
      wonValue: "预估成交额",
    },
    table: {
      source: "来源",
      total: "总数",
      leads: "咨询",
      quotes: "报价",
      quoted: "已报价",
      won: "成交",
      closeRate: "成交率",
      value: "金额",
      projectType: "项目类型",
    },
    note: "漏斗口径：已提交 = 咨询 + 报价请求；已联系包含已联系、已上门、已报价、已成交；已报价包含已报价、已接受、已成交；已成交包含 accepted 报价和 converted 咨询。",
  },
};

const periods: AdminLeadReportPeriod[] = ["30d", "90d", "all"];

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatMoney = (value: number, language: "zh" | "en") =>
  new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const FunnelStageRow = ({ stage }: { stage: LeadFunnelStage }) => (
  <div className="rounded-lg border border-border p-4">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="font-medium">{stage.label}</span>
      <span className="text-sm text-muted-foreground">
        {stage.count} · {formatPercent(stage.rate)}
      </span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, Math.round(stage.rate * 100))}%` }} />
    </div>
  </div>
);

const SourceTable = ({
  rows,
  language,
}: {
  rows: LeadSourceSummary[];
  language: "zh" | "en";
}) => {
  const t = copy[language].table;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <article key={row.key} className="space-y-3 p-4">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="truncate text-xs text-muted-foreground">{row.sourcePath || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t.total}</span><p className="font-medium">{row.total}</p></div>
              <div><span className="text-muted-foreground">{t.leads}</span><p className="font-medium">{row.leads}</p></div>
              <div><span className="text-muted-foreground">{t.quotes}</span><p className="font-medium">{row.quotes}</p></div>
              <div><span className="text-muted-foreground">{t.quoted}</span><p className="font-medium">{row.quoted}</p></div>
              <div><span className="text-muted-foreground">{t.won}</span><p className="font-medium">{row.won}</p></div>
              <div><span className="text-muted-foreground">{t.closeRate}</span><p className="font-medium">{formatPercent(row.closeRate)}</p></div>
              <div className="col-span-2"><span className="text-muted-foreground">{t.value}</span><p className="font-medium">{formatMoney(row.wonValue || row.quotedValue, language)}</p></div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t.source}</th>
              <th className="px-4 py-3 font-semibold">{t.total}</th>
              <th className="px-4 py-3 font-semibold">{t.leads}</th>
              <th className="px-4 py-3 font-semibold">{t.quotes}</th>
              <th className="px-4 py-3 font-semibold">{t.quoted}</th>
              <th className="px-4 py-3 font-semibold">{t.won}</th>
              <th className="px-4 py-3 font-semibold">{t.closeRate}</th>
              <th className="px-4 py-3 font-semibold">{t.value}</th>
            </tr>
          </thead>
          <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border">
              <td className="max-w-[320px] px-4 py-3">
                <p className="font-medium">{row.label}</p>
                <p className="truncate text-xs text-muted-foreground">{row.sourcePath || "-"}</p>
              </td>
              <td className="px-4 py-3">{row.total}</td>
              <td className="px-4 py-3">{row.leads}</td>
              <td className="px-4 py-3">{row.quotes}</td>
              <td className="px-4 py-3">{row.quoted}</td>
              <td className="px-4 py-3">{row.won}</td>
              <td className="px-4 py-3">{formatPercent(row.closeRate)}</td>
              <td className="px-4 py-3">{formatMoney(row.wonValue || row.quotedValue, language)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProjectTypeTable = ({
  rows,
  language,
}: {
  rows: LeadProjectTypeSummary[];
  language: "zh" | "en";
}) => {
  const t = copy[language].table;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <article key={row.key} className="space-y-3 p-4">
            <p className="font-medium">{row.label}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t.total}</span><p className="font-medium">{row.total}</p></div>
              <div><span className="text-muted-foreground">{t.quotes}</span><p className="font-medium">{row.quotes}</p></div>
              <div><span className="text-muted-foreground">{t.won}</span><p className="font-medium">{row.won}</p></div>
              <div><span className="text-muted-foreground">{t.closeRate}</span><p className="font-medium">{formatPercent(row.closeRate)}</p></div>
              <div className="col-span-2"><span className="text-muted-foreground">{t.value}</span><p className="font-medium">{formatMoney(row.quotedValue, language)}</p></div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t.projectType}</th>
              <th className="px-4 py-3 font-semibold">{t.total}</th>
              <th className="px-4 py-3 font-semibold">{t.quotes}</th>
              <th className="px-4 py-3 font-semibold">{t.won}</th>
              <th className="px-4 py-3 font-semibold">{t.closeRate}</th>
              <th className="px-4 py-3 font-semibold">{t.value}</th>
            </tr>
          </thead>
          <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{row.label}</td>
              <td className="px-4 py-3">{row.total}</td>
              <td className="px-4 py-3">{row.quotes}</td>
              <td className="px-4 py-3">{row.won}</td>
              <td className="px-4 py-3">{formatPercent(row.closeRate)}</td>
              <td className="px-4 py-3">{formatMoney(row.quotedValue, language)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function AdminLeadReports() {
  const language = getAdminLang();
  const t = copy[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const period = normalizeAdminLeadReportPeriod(searchParams.get("period"));
  const { data, error, isFetching } = useAdminLeadReport({ period, language });
  const report = data;

  const setPeriod = (nextPeriod: AdminLeadReportPeriod) => {
    const next = new URLSearchParams(searchParams);
    if (nextPeriod === "90d") next.delete("period");
    else next.set("period", nextPeriod);
    setSearchParams(next, { replace: true });
  };

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText={t.helpText}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/leads">
                <Users className="mr-2 h-4 w-4" />
                {t.viewLeads}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/quotes">
                <ClipboardList className="mr-2 h-4 w-4" />
                {t.viewQuotes}
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {periods.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={period === item ? "default" : "outline"}
            onClick={() => setPeriod(item)}
          >
            {t.period[item]}
          </Button>
        ))}
      </div>

      {errorMessage && <div className="rounded-lg border border-border bg-card p-4 text-sm">{errorMessage}</div>}

      {report && report.totals.submitted > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <AdminStatCard label={t.totals.submitted} value={report.totals.submitted} helpText={t.note} />
            <AdminStatCard label={t.totals.leads} value={report.totals.leads} href="/admin/leads" />
            <AdminStatCard label={t.totals.quotes} value={report.totals.quotes} href="/admin/quotes" />
            <AdminStatCard label={t.totals.won} value={report.totals.won} />
            <AdminStatCard label={t.totals.closeRate} value={formatPercent(report.totals.closeRate)} />
            <AdminStatCard label={t.totals.wonValue} value={formatMoney(report.totals.wonValue, language)} />
          </div>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold">{t.funnelTitle}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t.note}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {report.funnel.map((stage) => (
                <FunnelStageRow key={stage.key} stage={stage} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-bold">{t.sourceTitle}</h2>
            <SourceTable rows={report.sourceRows} language={language} />
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-bold">{t.projectTypeTitle}</h2>
            <ProjectTypeTable rows={report.projectTypeRows} language={language} />
          </section>
        </>
      ) : (
        <AdminEmptyState
          title={isFetching ? (language === "zh" ? "正在加载报表..." : "Loading report...") : t.empty}
          description={language === "zh" ? "有客户提交咨询或报价后，这里会自动生成来源和成交漏斗。" : "Once enquiries or quotes are submitted, source and funnel data will appear here."}
        />
      )}
    </div>
  );
}
