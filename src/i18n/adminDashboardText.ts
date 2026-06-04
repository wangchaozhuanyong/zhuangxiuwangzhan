export const adminDashboardText = {
  title: { en: "Operations Workspace", zh: "运营工作台" },
  body: {
    en: "Track enquiries, quotes, content health, and translation issues from one place.",
    zh: "集中查看咨询、报价、内容健康度和翻译异常。",
  },
  helpText: {
    en: "This is the backend overview. Start with enquiries and quotes, then check whether content, translations, and search optimization are healthy.",
    zh: "这里是后台总览，先看咨询和报价，再看内容、翻译和搜索优化是否正常。",
  },
  recentLeads: { en: "Recent Leads", zh: "最近咨询" },
  recentQuotes: { en: "Recent Quote Requests", zh: "最近报价请求" },
  quickActions: { en: "Quick Actions", zh: "快捷入口" },
  empty: { en: "No records yet.", zh: "暂无记录。" },
  uploadImage: { en: "Upload Image", zh: "上传图片" },
  contentHealth: { en: "Content health check", zh: "内容健康检查" },
  contentHealthHelp: {
    en: "Check missing English, SEO, images, and required fields in one place. Lower is better.",
    zh: "集中查看缺英文、缺 SEO、缺图片和必填缺失。数字越低越好。",
  },
  publishCenter: { en: "Publish center", zh: "发布中心" },
  publishCenterHelp: {
    en: "Check drafts, published items, archived items, and pre-publish risks in one place.",
    zh: "集中查看草稿、已发布、归档和发布前风险。",
  },
  englishCenter: { en: "English generation center", zh: "英文生成中心" },
  englishCenterHelp: {
    en: "Scan content missing English and generate English in batches automatically.",
    zh: "集中扫描缺英文内容，并支持批量自动生成英文。",
  },
  leadFallback: { en: "Lead", zh: "咨询" },
  quoteFallback: { en: "Quote request", zh: "报价请求" },
  emptyLeadsDescription: {
    en: "New contact form submissions will appear here.",
    zh: "当有新联系表单提交后会显示在这里。",
  },
  viewLeads: { en: "View leads", zh: "查看咨询" },
  emptyQuotesDescription: {
    en: "New quote form submissions will appear here.",
    zh: "当有新报价表单提交后会显示在这里。",
  },
  viewQuotes: { en: "View quotes", zh: "查看报价" },
  ga4ActionLabel: { en: "GA4 Page Views", zh: "GA4 页面访问统计" },
  ga4SetupHint: {
    en: "Tip: the button still opens GA4 before VITE_GA_MEASUREMENT_ID is set; tracking starts after the ID is configured.",
    zh: "提示：还没填写 VITE_GA_MEASUREMENT_ID 时，按钮仍会打开 GA4；上线前填好后才会正式记录访问量。",
  },
} as const;

export const adminDashboardCards = [
  {
    key: "todayLeads",
    label: { en: "Today's New Leads", zh: "今日新咨询" },
    help: { en: "New customer enquiries submitted to the backend today.", zh: "今天提交到后台的新客户咨询数量。" },
  },
  {
    key: "newLeads",
    label: { en: "New Leads", zh: "新咨询" },
    help: { en: "Customer enquiries that have not been handled yet.", zh: "还没有处理过的客户咨询数量。" },
  },
  {
    key: "pendingQuotes",
    label: { en: "Pending Quotes", zh: "待处理报价" },
    help: { en: "Quote requests received but still waiting for handling.", zh: "已经收到、但还在等待处理的报价请求数量。" },
  },
  {
    key: "toQuote",
    label: { en: "To Quote", zh: "待报价" },
    help: { en: "Quote requests that should be organized and replied to soon.", zh: "需要尽快整理并回复客户的报价请求数量。" },
  },
  {
    key: "dueLeadFollowUps",
    label: { en: "Lead Follow-ups Due", zh: "待跟进咨询" },
    help: { en: "Customer enquiries whose follow-up time has arrived and should be handled first today.", zh: "已经到跟进时间、今天应该优先处理的客户咨询。" },
  },
  {
    key: "dueQuoteFollowUps",
    label: { en: "Quote Follow-ups Due", zh: "待跟进报价" },
    help: { en: "Quote requests whose follow-up time has arrived and need another reply.", zh: "已经到跟进时间、需要继续回复的报价请求。" },
  },
  {
    key: "staleLeads",
    label: { en: "24h Unhandled Leads", zh: "24小时未处理咨询" },
    help: { en: "Records that are still new enquiries after more than 24 hours.", zh: "超过 24 小时仍是新咨询的记录。" },
  },
  {
    key: "staleQuotes",
    label: { en: "24h Unhandled Quotes", zh: "24小时未处理报价" },
    help: { en: "Quote requests that are still pending after more than 24 hours.", zh: "超过 24 小时仍待处理的报价请求。" },
  },
  {
    key: "monthLeads",
    label: { en: "Leads This Month", zh: "本月咨询数" },
    help: { en: "Total customer enquiries received this month.", zh: "本月累计收到的客户咨询数量。" },
  },
  {
    key: "monthQuotes",
    label: { en: "Quotes This Month", zh: "本月报价数" },
    help: { en: "Total quote requests received this month.", zh: "本月累计收到的报价请求数量。" },
  },
  {
    key: "failedTranslations",
    label: { en: "Failed English Generation", zh: "英文生成失败" },
    help: { en: "Automatic English generation records that need retrying or fixing.", zh: "需要重试或修正的自动英文生成记录数量。" },
  },
  {
    key: "projects",
    label: { en: "Published Projects", zh: "已发布案例" },
    help: { en: "Projects already published to the public frontend.", zh: "已经发布到前台的案例数量。" },
  },
  {
    key: "services",
    label: { en: "Published Services", zh: "已发布服务" },
    help: { en: "Services already published to the public frontend.", zh: "已经发布到前台的服务数量。" },
  },
  {
    key: "blog",
    label: { en: "Published Blog Posts", zh: "已发布博客" },
    help: { en: "Blog posts already published to the public frontend.", zh: "已经发布到前台的博客数量。" },
  },
  {
    key: "seoMissing",
    label: { en: "Missing SEO Fields", zh: "搜索优化缺失项" },
    help: { en: "SEO fields that have not been completed yet.", zh: "还没补齐的 SEO 字段数量。" },
  },
] as const;

export const adminDashboardActions = [
  { label: { en: "New Project", zh: "新建案例" }, href: "/admin/projects/new" },
  { label: { en: "New Service", zh: "新建服务" }, href: "/admin/services/new" },
  { label: { en: "New Blog", zh: "新建博客" }, href: "/admin/blog/new" },
  { label: { en: "Upload Image", zh: "上传图片" }, href: "/admin/media" },
  { label: { en: "View New Leads", zh: "查看新咨询" }, href: "/admin/leads" },
  { label: { en: "Lead Reports", zh: "查看线索报表" }, href: "/admin/lead-reports" },
  { label: { en: "Set WhatsApp", zh: "设置 WhatsApp" }, href: "/admin/settings" },
] as const;
