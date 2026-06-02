import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileCheck2,
  FileSearch,
  FileText,
  FolderKanban,
  Globe2,
  Home,
  Image,
  Images,
  Languages,
  LayoutDashboard,
  MapPinned,
  MessageSquareText,
  Newspaper,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Star,
  UserCog,
  Users,
  WandSparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AdminLang } from "@/lib/adminLocale";
import { ADMIN_ROLE_GROUPS, type AdminAllowedRoles } from "@/lib/adminRoleAccess";

export type AdminCopy = {
  dashboard: string;
  todayTasks: string;
  contentHealth: string;
  publishCenter: string;
  englishCenter: string;
  groupWorkspace: string;
  groupWebsite: string;
  groupBusiness: string;
  groupCustomers: string;
  groupMediaSeo: string;
  groupSystem: string;
  home: string;
  cmsBuilder: string;
  pages: string;
  about: string;
  faqs: string;
  beforeAfter: string;
  brandLogos: string;
  services: string;
  projects: string;
  blog: string;
  materials: string;
  testimonials: string;
  serviceAreas: string;
  landingPages: string;
  leads: string;
  quoteRequests: string;
  leadReports: string;
  media: string;
  seo: string;
  sitemap: string;
  users: string;
  websiteSettings: string;
  translationJobs: string;
  notificationSettings: string;
  systemHealth: string;
  systemLogs: string;
  backToWebsite: string;
  seedRunning: string;
  seedDone: (inserted: number, updated: number) => string;
  seedError: (message: string) => string;
  signOut: string;
  brand: string;
  title: string;
  subtitle: string;
  menu: string;
  collapseNav: string;
  expandNav: string;
  language: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  contentReady: string;
  currentPage: string;
};

export type NavItem = {
  key: keyof AdminCopy;
  path: string;
  icon: LucideIcon;
  allowedRoles?: AdminAllowedRoles;
};

export type NavGroup = {
  key: keyof AdminCopy;
  icon: LucideIcon;
  items: NavItem[];
};

export const NAV_EXPANDED_KEY = "flashcast_admin_nav_expanded_groups";
export const NAV_COLLAPSED_KEY = "flashcast_admin_nav_collapsed";
export const ADMIN_ENTRY_RE = /\/assets\/index-[^"']+\.js/;
export const ADMIN_BUILD_VERSION = String(import.meta.env.VITE_APP_VERSION || "local").slice(0, 7);
export const BUILD_CHECK_INTERVAL_MS = 60 * 1000;
export const ADMIN_TITLE_SUFFIX = "FLASH CAST 后台管理";

export const getCurrentAdminEntry = () => {
  const current = Array.from(document.scripts)
    .map((script) => script.getAttribute("src") || "")
    .find((src) => src.includes("/assets/index-"));
  return current ? current.replace(window.location.origin, "") : "";
};

export const copy: Record<AdminLang, AdminCopy> = {
  en: {
    dashboard: "Dashboard",
    todayTasks: "Today's Tasks",
    contentHealth: "Content Health",
    publishCenter: "Publish Center",
    englishCenter: "English Center",
    groupWorkspace: "Workspace",
    groupWebsite: "Website Content",
    groupBusiness: "Business Content",
    groupCustomers: "Customers",
    groupMediaSeo: "Media & SEO/GEO",
    groupSystem: "System",
    home: "Home Page",
    cmsBuilder: "CMS Builder",
    pages: "Page Content",
    about: "About Us",
    faqs: "常见问题",
    beforeAfter: "Before / After",
    brandLogos: "品牌合作",
    services: "Services",
    projects: "Projects",
    blog: "Blog",
    materials: "Materials",
    testimonials: "Testimonials",
    serviceAreas: "Service Areas",
    landingPages: "Landing Pages",
    leads: "Leads",
    quoteRequests: "Quote Requests",
    leadReports: "Lead Reports",
    media: "Media Library",
    seo: "SEO / GEO Settings",
    sitemap: "Sitemap / Robots / llms.txt",
    users: "Admin Users",
    websiteSettings: "Website Settings",
    translationJobs: "Translation Records",
    notificationSettings: "Notification Settings",
    systemHealth: "System Health",
    systemLogs: "System Logs",
    backToWebsite: "View website",
    seedRunning: "Checking default CMS content...",
    seedDone: (inserted, updated) => `Default CMS content ready. Added ${inserted}, filled ${updated}.`,
    seedError: (message) => `Default CMS content sync failed: ${message}`,
    signOut: "Sign out",
    brand: "FLASH CAST Admin",
    title: "Content & Lead Management",
    subtitle: "Manage website content, enquiries, media, SEO/GEO and settings.",
    menu: "Open admin menu",
    collapseNav: "Collapse navigation",
    expandNav: "Expand navigation",
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    contentReady: "Content status",
    currentPage: "Current page",
  },
  zh: {
    dashboard: "总览",
    todayTasks: "今日待办",
    contentHealth: "内容健康检查",
    publishCenter: "发布中心",
    englishCenter: "英文生成中心",
    groupWorkspace: "工作区",
    groupWebsite: "网站内容",
    groupBusiness: "业务内容",
    groupCustomers: "客户管理",
    groupMediaSeo: "媒体与 SEO/GEO",
    groupSystem: "系统设置",
    home: "首页管理",
    cmsBuilder: "通用页面搭建",
    pages: "页面内容",
    about: "关于我们",
    faqs: "常见问题",
    beforeAfter: "改造前后",
    brandLogos: "品牌合作",
    services: "服务项目",
    projects: "装修案例",
    blog: "博客",
    materials: "材料库",
    testimonials: "客户评价",
    serviceAreas: "服务区域",
    landingPages: "落地页",
    leads: "客户咨询",
    quoteRequests: "报价请求",
    leadReports: "线索报表",
    media: "媒体库",
    seo: "SEO/GEO 设置",
    sitemap: "站点地图 / Robots / llms.txt",
    users: "管理员账户",
    websiteSettings: "网站基础设置",
    translationJobs: "翻译记录",
    notificationSettings: "通知设置",
    systemHealth: "系统健康",
    systemLogs: "系统日志",
    backToWebsite: "查看网站",
    seedRunning: "正在检查后台默认内容...",
    seedDone: (inserted, updated) => `后台默认内容已就绪：新增 ${inserted} 条，补齐 ${updated} 条。`,
    seedError: (message) => `后台默认内容同步失败：${message}`,
    signOut: "退出登录",
    brand: "FLASH CAST 后台",
    title: "内容与咨询管理",
    subtitle: "管理网站内容、客户咨询、媒体素材、SEO/GEO 和系统设置。",
    menu: "打开后台菜单",
    collapseNav: "收起导航",
    expandNav: "展开导航",
    language: "语言",
    theme: "主题",
    lightTheme: "浅色",
    darkTheme: "深色",
    contentReady: "内容状态",
    currentPage: "当前页面",
  },
};

export const navGroups: NavGroup[] = [
  {
    key: "groupWorkspace",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", path: "/admin/dashboard", icon: BarChart3, allowedRoles: ADMIN_ROLE_GROUPS.all },
      { key: "contentHealth", path: "/admin/content-health", icon: FileCheck2, allowedRoles: ADMIN_ROLE_GROUPS.contentRead },
      { key: "publishCenter", path: "/admin/publish-center", icon: Rocket, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "englishCenter", path: "/admin/english-center", icon: WandSparkles, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
    ],
  },
  {
    key: "groupWebsite",
    icon: Globe2,
    items: [
      { key: "home", path: "/admin/home", icon: Home, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "cmsBuilder", path: "/admin/cms", icon: LayoutDashboard, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "pages", path: "/admin/pages", icon: FileText, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "about", path: "/admin/about", icon: Building2, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "faqs", path: "/admin/faqs", icon: MessageSquareText, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "testimonials", path: "/admin/content/testimonials", icon: Star, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "brandLogos", path: "/admin/brand-partners", icon: Sparkles, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "beforeAfter", path: "/admin/before-after", icon: Images, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
    ],
  },
  {
    key: "groupBusiness",
    icon: BriefcaseBusiness,
    items: [
      { key: "services", path: "/admin/services", icon: Wrench, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "projects", path: "/admin/projects", icon: FolderKanban, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "materials", path: "/admin/materials", icon: BookOpen, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "blog", path: "/admin/blog", icon: Newspaper, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "serviceAreas", path: "/admin/content/service_areas", icon: MapPinned, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "landingPages", path: "/admin/content/landing_pages", icon: Globe2, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
    ],
  },
  {
    key: "groupCustomers",
    icon: Users,
    items: [
      { key: "leads", path: "/admin/leads", icon: Users, allowedRoles: ADMIN_ROLE_GROUPS.leadRead },
      { key: "quoteRequests", path: "/admin/quotes", icon: ClipboardList, allowedRoles: ADMIN_ROLE_GROUPS.leadRead },
      { key: "leadReports", path: "/admin/lead-reports", icon: BarChart3, allowedRoles: ADMIN_ROLE_GROUPS.leadRead },
    ],
  },
  {
    key: "groupMediaSeo",
    icon: Image,
    items: [
      { key: "media", path: "/admin/media", icon: Image, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "seo", path: "/admin/seo", icon: Search, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "sitemap", path: "/admin/seo#sitemap", icon: FileSearch, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
    ],
  },
  {
    key: "groupSystem",
    icon: Settings,
    items: [
      { key: "websiteSettings", path: "/admin/settings", icon: Settings, allowedRoles: ADMIN_ROLE_GROUPS.system },
      { key: "notificationSettings", path: "/admin/notifications", icon: Bell, allowedRoles: ADMIN_ROLE_GROUPS.system },
      { key: "systemHealth", path: "/admin/system-health", icon: Activity, allowedRoles: ADMIN_ROLE_GROUPS.system },
      { key: "systemLogs", path: "/admin/system-logs", icon: ScrollText, allowedRoles: ADMIN_ROLE_GROUPS.system },
      { key: "translationJobs", path: "/admin/content/translation_jobs", icon: Languages, allowedRoles: ADMIN_ROLE_GROUPS.contentWrite },
      { key: "users", path: "/admin/users", icon: UserCog, allowedRoles: ADMIN_ROLE_GROUPS.system },
    ],
  },
];

export const readNavCollapsed = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

export const readExpandedGroups = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NAV_EXPANDED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Object.fromEntries(parsed.map((key) => [key, true]));
  } catch {
    return {};
  }
};

const normalizeHash = (hash: string) => hash.replace(/^#/, "");
const navItems = navGroups.flatMap((group) => group.items);

const hasExactHashNavItem = (pathname: string, hash: string) => {
  const activeHash = normalizeHash(hash);
  if (!activeHash) return false;
  return navItems.some((item) => {
    const [path, fragment] = item.path.split("#");
    return path === pathname && fragment === activeHash;
  });
};

export const isAdminNavItemActive = (itemPath: string, pathname: string, hash: string) => {
  const [path, fragment] = itemPath.split("#");
  if (pathname !== path && !(!fragment && pathname.startsWith(`${path}/`))) return false;
  if (fragment) return normalizeHash(hash) === fragment;
  return !hasExactHashNavItem(pathname, hash);
};

export const ensureAdminFormAccessibility = (root: ParentNode = document, force = false) => {
  if (typeof document === "undefined") return;
  let fieldIndex = 0;
  const fieldSelector = "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select";
  const scope = root instanceof Document ? root.querySelector("main") : root;
  if (!scope) return;
  const fields = Array.from(scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(fieldSelector));

  fields.forEach((field) => {
    if (!force && field.dataset.adminA11yChecked === "1") return;
    const hasAccessibleName = Boolean(field.labels?.length || field.getAttribute("aria-label") || field.getAttribute("aria-labelledby"));
    if (hasAccessibleName) {
      field.dataset.adminA11yChecked = "1";
      return;
    }

    const parent = field.parentElement;
    let label: HTMLLabelElement | null = null;
    let cursor = field.previousElementSibling;
    while (cursor && !label) {
      if (cursor instanceof HTMLLabelElement) label = cursor;
      cursor = cursor.previousElementSibling;
    }
    label = label || parent?.querySelector("label:not([for])") || null;

    const labelText = label?.textContent?.replace(/\s+/g, " ").trim();
    const fallbackLabel = labelText || field.getAttribute("placeholder") || field.getAttribute("name") || "后台表单字段";

    if (label) {
      if (!field.id) {
        field.id = `admin-field-${Date.now().toString(36)}-${fieldIndex}`;
      }
      label.htmlFor = field.id;
    }
    field.setAttribute("aria-label", fallbackLabel);
    field.dataset.adminA11yChecked = "1";
    fieldIndex += 1;
  });
};

export const getAdminActiveNavHelp = (activeNavKey: keyof AdminCopy, adminLang: AdminLang) => {
  const zh = adminLang === "zh";
  switch (activeNavKey) {
    case "dashboard":
      return zh ? "先看咨询、报价和内容状态，再决定今天优先处理什么。" : "Start with enquiries, quotes, and content health.";
    case "contentHealth":
      return zh ? "这里集中检查缺英文、缺 SEO、缺图片和必填缺失。" : "Check missing English, SEO, images, and required fields.";
    case "publishCenter":
      return zh ? "这里集中查看草稿、已发布、归档和发布前风险。" : "Review drafts, published content, archives, and pre-publish risks.";
    case "englishCenter":
      return zh ? "这里扫描缺英文内容，并批量发起自动英文生成。" : "Find missing English content and run automatic generation in batches.";
    case "home":
      return zh ? "这里管理首页首屏按钮、流程、常见问题和底部行动引导。" : "Manage the homepage hero buttons, process, FAQ, and CTA blocks.";
    case "cmsBuilder":
    case "pages":
      return zh ? "这里管理页面结构、模块和页面级内容。" : "Manage page structure, modules, and page-level content.";
    case "about":
      return zh ? "这里管理关于我们页面的各个区块。" : "Manage the About page sections.";
    case "services":
    case "projects":
    case "materials":
    case "blog":
      return zh ? "这里管理前台业务内容的标题、图片、正文和发布状态。" : "Manage titles, images, content, and publish state for public business pages.";
    case "leads":
      return zh ? "这里查看客户咨询，并记录跟进、电话和备注。" : "Review enquiries and record follow-ups, calls, and notes.";
    case "quoteRequests":
      return zh ? "这里查看报价请求，并填写报价和处理状态。" : "Review quote requests and fill in pricing and status.";
    case "leadReports":
      return zh ? "这里看线索来源、报价表现和装修项目成交漏斗。" : "Review lead sources, quote performance, and renovation conversion funnel.";
    case "media":
      return zh ? "这里集中管理上传图片、用途分类和图片说明。" : "Manage uploaded images, usage categories, and image alt text.";
    case "seo":
    case "sitemap":
      return zh ? "这里检查中文 SEO/GEO、站点地图、Robots 和 AI 可读文件。" : "Check SEO/GEO fields, sitemap, Robots, and AI-readable files.";
    case "websiteSettings":
      return zh ? "这里管理公司联系方式、品牌图标和默认 SEO/GEO 兜底文案。" : "Manage company contact info, brand assets, and default SEO/GEO fallback content.";
    case "notificationSettings":
      return zh ? "这里设置 Telegram 通知、测试消息和维护提醒。" : "Set up Telegram alerts, test messages, and maintenance reminders.";
    case "translationJobs":
      return zh ? "这里查看自动生成英文的记录和失败原因，不在这里直接编辑正文。" : "Review automatic English generation records and errors. Edit the actual content in its own editor.";
    case "users":
      return zh ? "这里管理后台白名单、角色和启用状态。" : "Manage the admin whitelist, roles, and active status.";
    case "systemHealth":
      return zh ? "这里检查后台、数据库、存储、日志和备份流程是否正常。" : "Check admin service, database, storage, logs, and backup flow.";
    case "systemLogs":
      return zh ? "这里查看后台和前台的关键错误日志。" : "Review critical logs from the admin and public site.";
    default:
      return zh ? "这里管理当前页面对应的内容。" : "Manage the content for the current page.";
  }
};
