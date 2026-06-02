import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { adminStatusLabel } from "@/lib/adminLocale";
import { type AdminSeoAuditRow, useAdminSeoAudit } from "@/lib/adminSeoAudit";

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

const strategyCards = [
  {
    title: "中文 SEO 优先",
    body: "中文标题和描述不要只翻译英文，要直接写给华语客户看，讲清服务、地点、适合对象和下一步。",
    example: "例：吉隆坡厨房装修 | 橱柜定制与旧厨房翻新 | FLASH CAST",
  },
  {
    title: "GEO 地区信号",
    body: "每个重要页面至少带一个真实服务地区，例如吉隆坡、雪兰莪或巴生谷，让本地搜索和 AI 摘要更容易判断服务范围。",
    example: "描述里写：服务吉隆坡、雪兰莪与巴生谷，适合公寓、排屋、办公室和店铺装修。",
  },
  {
    title: "AI 可读内容",
    body: "GEO 也要照顾 AI 搜索摘要。页面要有清楚的服务范围、适合项目、流程、材料、报价条件和 FAQ，不要只放宣传口号。",
    example: "描述里保留“报价需根据现场、尺寸、材料和审批要求确认”这类事实边界。",
  },
];

const technicalFiles = [
  {
    title: "sitemap.xml",
    path: "/sitemap.xml",
    source: "scripts/generate-sitemap.mjs",
    description: "提交给 Google、Bing 和 AI 搜索入口的公开页面清单。",
    check: "只收录正式的 /zh 和 /en 页面，不能有重复地址、旧地址或带参数的地址。",
  },
  {
    title: "robots.txt",
    path: "/robots.txt",
    source: "public/robots.txt",
    description: "告诉搜索引擎哪些页面可以抓取，哪些后台页面必须屏蔽。",
    check: "必须屏蔽 /admin，同时保留 sitemap.xml 和 llms.txt 的公开入口。",
  },
  {
    title: "llms.txt",
    path: "/llms.txt",
    source: "scripts/generate-llms.mjs",
    description: "给 AI 搜索和摘要系统读取的站点说明和标准链接列表。",
    check: "必须包含公司身份、Sitemap 地址和 Canonical URL List。",
  },
];

const technicalWorkflow = [
  {
    title: "生成",
    command: "npm.cmd run generate:sitemap",
    detail: "单独重新生成 sitemap.xml。正式 build 前也会自动生成 sitemap、seo-manifest 和 llms.txt。",
  },
  {
    title: "验证",
    command: "node scripts/verify-seo-html.mjs",
    detail: "检查 sitemap、robots、llms、canonical、结构化数据和中英文路径是否一致。",
  },
  {
    title: "发布",
    command: "npm.cmd run build",
    detail: "构建时会先执行 SEO 技术文件生成流程，生成后的文件进入 public 输出。",
  },
];

const guidanceByTable: Record<string, { title: string; formula: string; mustInclude: string }> = {
  site_pages: {
    title: "页面级内容",
    formula: "地区 + 页面主题 + 核心服务 | FLASH CAST",
    mustInclude: "中文 SEO 标题、中文描述、中文关键词、前台路径、图片中文说明。",
  },
  cms_pages: {
    title: "CMS 页面",
    formula: "地区 + 页面主题 + 核心服务 | FLASH CAST",
    mustInclude: "CMS 页面会覆盖旧页面内容，必须同步中文 SEO、GEO 地区词、关键词和真实前台路径。",
  },
  services: {
    title: "服务项目",
    formula: "地区 + 服务名称 + 典型场景 | FLASH CAST",
    mustInclude: "服务类型、适合对象、吉隆坡/雪兰莪/巴生谷、报价或咨询下一步。",
  },
  projects: {
    title: "装修案例",
    formula: "地区 + 空间类型 + 完成结果 | FLASH CAST 案例",
    mustInclude: "案例地点、空间类型、施工范围、材料或结果亮点。",
  },
  materials: {
    title: "材料库",
    formula: "材料名称 + 适用空间 + 装修材料 | FLASH CAST",
    mustInclude: "材料用途、适合空间、维护或预算提示、马来西亚装修语境。",
  },
  blog_posts: {
    title: "博客文章",
    formula: "客户问题 + 马来西亚/吉隆坡装修指南 | FLASH CAST",
    mustInclude: "问题答案、适用地区、决策建议、内部链接方向。",
  },
  service_areas: {
    title: "服务地区",
    formula: "地区名 + 装修服务 + 常见项目 | FLASH CAST",
    mustInclude: "具体城市/区域、常见房型或商业空间、本地审批或施工注意点。",
  },
  landing_pages: {
    title: "SEO 落地页",
    formula: "地区 + 高意向服务词 + 可咨询动作 | FLASH CAST",
    mustInclude: "高意向关键词、服务范围、适合人群、案例/FAQ/报价入口。",
  },
};

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

const AdminSeoTechnicalFiles = () => (
  <div className="space-y-6">
    <AdminPageHeader
      title="站点地图 / Robots / llms.txt"
      description="检查公开搜索入口文件，确认搜索引擎和 AI 摘要系统能读到正确页面。"
      helpText="这个页面是技术文件状态页，不是普通内容编辑器。sitemap.xml 和 llms.txt 由脚本生成，robots.txt 是固定规则文件；改规则前要先确认会不会影响搜索收录。"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link to="/admin/seo">返回 SEO 检查</Link>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer">
              打开 sitemap.xml
            </a>
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a href="/robots.txt" target="_blank" rel="noreferrer">
              打开 robots.txt
            </a>
          </Button>
        </div>
      }
    />

    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">公开技术文件</h2>
        <p className="text-sm text-muted-foreground">这些文件直接影响搜索引擎抓取、AI 摘要读取和后台页面屏蔽。</p>
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
                  查看
                </a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{file.description}</p>
            <p className="mt-3 rounded-md bg-background/70 p-3 text-xs text-foreground/80">{file.check}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">生成和验证流程</h2>
        <p className="text-sm text-muted-foreground">后台目前负责查看和跳转，文件内容由仓库脚本生成，避免人工改漏页面。</p>
      </div>
      <div className="mt-4 grid gap-3">
        {technicalWorkflow.map((step, index) => (
          <div key={step.title} className="rounded-lg border border-border/70 bg-muted/25 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              </div>
              <code className="rounded-md bg-background px-3 py-2 text-xs text-foreground">{step.command}</code>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-lg font-semibold">当前边界</h2>
      <p className="mt-2 text-sm">
        这里不是新增页面入口，也不是可视化编辑 sitemap 的地方。它的作用是把 sitemap、robots、llms.txt 的入口和生成规则集中到一个独立后台页面，避免和 SEO 内容检查混在一起。
      </p>
    </section>
  </div>
);

const buildRowIssues = (row: AdminSeoAuditRow): AuditIssue[] => {
  const issues: AuditIssue[] = [];
  const zhTitle = readText(row, "seo_title_zh");
  const zhDescription = readText(row, "seo_description_zh");
  const zhKeywords = readText(row, "seo_keywords_zh");
  const enTitle = readText(row, "seo_title_en");
  const enDescription = readText(row, "seo_description_en");
  const geoText = [zhTitle, zhDescription, zhKeywords, readText(row, "title_zh"), readText(row, "path"), readText(row, "slug")].join(" ");
  const image = readText(row, "image_url") || readText(row, "cover_image_url") || readText(row, "hero_image_url");

  if (row.error) addIssue(issues, "technical", String(row.error));
  if (!zhTitle) addIssue(issues, "zh", "缺中文 SEO 标题");
  if (zhTitle && !hasChinese(zhTitle)) addIssue(issues, "zh", "中文标题没有中文词");
  if (zhTitle.length > zhTitleMax) addIssue(issues, "zh", "中文标题偏长，建议压缩");
  if (!zhDescription) addIssue(issues, "zh", "缺中文 SEO 描述");
  if (zhDescription && !hasChinese(zhDescription)) addIssue(issues, "zh", "中文描述没有中文词");
  if (zhDescription && zhDescription.length < zhDescriptionMin) addIssue(issues, "zh", "中文描述偏短");
  if (pageTables.has(row.table) && !zhKeywords) addIssue(issues, "zh", "缺中文 SEO 关键词");
  if (geoRequiredTables.has(row.table) && !hasGeoSignal(geoText)) addIssue(issues, "geo", "缺吉隆坡/雪兰莪等 GEO 地区词");
  if (zhDescription && !/[，。、；：,.]/.test(zhDescription)) addIssue(issues, "ai", "中文描述太像短句，AI 摘要信息量弱");
  if (image && hasField(row, "alt_zh") && !readText(row, "alt_zh")) addIssue(issues, "ai", "图片缺中文说明 alt");
  if (!pageTables.has(row.table) && !row.slug) addIssue(issues, "technical", "缺链接标识");
  if (!enTitle) addIssue(issues, "en", "缺英文 SEO 标题");
  if (enTitle.length > enTitleMax) addIssue(issues, "en", "英文标题偏长，建议压缩");
  if (!enDescription) addIssue(issues, "en", "缺英文 SEO 描述");
  if (enDescription && enDescription.length < enDescriptionMin) addIssue(issues, "en", "英文描述偏短");

  return issues;
};

const AdminSeoAuditView = () => {
  const { data: rows = [], isFetching, isError, error, refetch } = useAdminSeoAudit();
  const [status, setStatus] = useState("all");

  const checkedRows = useMemo<CheckedSeoRow[]>(() => rows.map((row) => ({ ...row, issues: buildRowIssues(row) })), [rows]);

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
        return duplicate ? { ...row, issues: [...row.issues, { category: "technical", label: "链接标识重复" }] } : row;
      }),
    [checkedRows, duplicateSlugs],
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
    ? (error instanceof Error ? error.message : String(error))
    : isFetching
      ? "正在加载 SEO / GEO 数据..."
      : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SEO / GEO 中文优化管理"
        description="检查中文标题、描述、关键词、地区信号、图片说明和 AI 可读摘要，重点保证中文页面不是英文 SEO 的附属品。"
        helpText="SEO 主要照顾传统搜索结果；GEO 这里同时指生成式搜索摘要和本地地区信号。后台检查只提示风险，最终仍要人工确认文案自然、准确、不夸大。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link to="/admin/seo#sitemap">站点地图 / Robots</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "刷新中..." : "刷新"}
            </Button>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">全部</option>
              <option value="missing">只看缺失</option>
              <option value="zh">中文 SEO 问题</option>
              <option value="geo">GEO 地区问题</option>
              <option value="ai">AI 可读问题</option>
              <option value="ok">只看通过</option>
            </select>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">检查内容</p>
          <p className="mt-1 text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">有缺失</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{summary.missing}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">中文 SEO</p>
          <p className="mt-1 text-2xl font-bold">{summary.zh}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">GEO 地区</p>
          <p className="mt-1 text-2xl font-bold">{summary.geo}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">通过</p>
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

      {loadMessage && <p className="rounded-lg bg-muted p-3 text-sm">{loadMessage}</p>}

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
                      <p className="font-medium text-foreground">{guidance.title} 写法：{guidance.formula}</p>
                      <p className="mt-1">必须交代：{guidance.mustInclude}</p>
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
                      <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">SEO / GEO 通过</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={editUrl}>编辑</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to={frontUrl}>中文前台页</Link></Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

const AdminSeoManager = () => {
  const location = useLocation();
  const isSitemapView = location.hash === "#sitemap";

  return isSitemapView ? <AdminSeoTechnicalFiles /> : <AdminSeoAuditView />;
};

export default AdminSeoManager;
