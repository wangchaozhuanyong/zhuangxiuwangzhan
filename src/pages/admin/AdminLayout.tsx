import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
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
  LogOut,
  MapPinned,
  Menu,
  MessageSquareText,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  UserCog,
  Users,
  WandSparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import AdminConfirmProvider from "@/components/admin/AdminConfirmProvider";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import {
  adminPublicSitePath,
  applyAdminTheme,
  clearAdminTheme,
  getAdminLang,
  getAdminTheme,
  setAdminLang,
  setAdminTheme,
  type AdminLang,
  type AdminTheme,
} from "@/lib/adminLocale";
import { useAdminDefaultContentSeed } from "@/lib/adminDefaultContent";
import { ADMIN_ROLE_GROUPS, canAdminRoleAccess, type AdminAllowedRoles } from "@/lib/adminRoleAccess";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";

type AdminCopy = {
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

type NavItem = {
  key: keyof AdminCopy;
  path: string;
  icon: LucideIcon;
  allowedRoles?: AdminAllowedRoles;
};

type NavGroup = {
  key: keyof AdminCopy;
  icon: LucideIcon;
  items: NavItem[];
};

const NAV_EXPANDED_KEY = "flashcast_admin_nav_expanded_groups";
const NAV_COLLAPSED_KEY = "flashcast_admin_nav_collapsed";
const ADMIN_ENTRY_RE = /\/assets\/index-[^"']+\.js/;
const ADMIN_BUILD_VERSION = String(import.meta.env.VITE_APP_VERSION || "local").slice(0, 7);
const BUILD_CHECK_INTERVAL_MS = 60 * 1000;

const getCurrentAdminEntry = () => {
  const current = Array.from(document.scripts)
    .map((script) => script.getAttribute("src") || "")
    .find((src) => src.includes("/assets/index-"));
  return current ? current.replace(window.location.origin, "") : "";
};

const copy: Record<AdminLang, AdminCopy> = {
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
    groupMediaSeo: "Media & SEO",
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
    seo: "SEO Settings",
    sitemap: "站点地图 / Robots",
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
    subtitle: "Manage website content, enquiries, media, SEO and settings.",
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
    groupMediaSeo: "媒体与搜索优化",
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
    seo: "SEO 设置",
    sitemap: "站点地图 / Robots",
    users: "管理员账户",
    websiteSettings: "网站基础设置",
    translationJobs: "翻译记录",
    notificationSettings: "通知设置",
    systemHealth: "系统健康",
    systemLogs: "\u7cfb\u7edf\u65e5\u5fd7",
    backToWebsite: "查看网站",
    seedRunning: "正在检查后台默认内容...",
    seedDone: (inserted, updated) => `后台默认内容已就绪：新增 ${inserted} 条，补齐 ${updated} 条。`,
    seedError: (message) => `后台默认内容同步失败：${message}`,
    signOut: "退出登录",
    brand: "FLASH CAST 后台",
    title: "内容与咨询管理",
    subtitle: "管理网站内容、客户咨询、媒体素材、SEO 和系统设置。",
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


const navGroups: NavGroup[] = [
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

const readNavCollapsed = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
};

const readExpandedGroups = () => {
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
const ADMIN_TITLE_SUFFIX = "FLASH CAST 后台管理";

const hasExactHashNavItem = (pathname: string, hash: string) => {
  const activeHash = normalizeHash(hash);
  if (!activeHash) return false;
  return navItems.some((item) => {
    const [path, fragment] = item.path.split("#");
    return path === pathname && fragment === activeHash;
  });
};

const isAdminNavItemActive = (itemPath: string, pathname: string, hash: string) => {
  const [path, fragment] = itemPath.split("#");
  if (pathname !== path && !(!fragment && pathname.startsWith(`${path}/`))) return false;
  if (fragment) return normalizeHash(hash) === fragment;
  return !hasExactHashNavItem(pathname, hash);
};

const ensureAdminFormAccessibility = () => {
  if (typeof document === "undefined") return;
  let fieldIndex = 0;
  const fields = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "main input:not([type='hidden']):not([type='submit']):not([type='button']), main textarea, main select",
    ),
  );

  fields.forEach((field) => {
    const hasAccessibleName = Boolean(field.labels?.length || field.getAttribute("aria-label") || field.getAttribute("aria-labelledby"));
    if (hasAccessibleName) return;

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
    fieldIndex += 1;
  });
};

const ControlButton = ({
  active,
  children,
  onClick,
  label,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "h-10 min-w-10 rounded-full px-3 text-xs font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground",
    )}
  >
    {children}
  </button>
);

const AdminLayout = () => {
  const location = useLocation();
  const { role } = useAdminAuth();
  const [adminLang, setAdminLangState] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => readNavCollapsed());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => readExpandedGroups());
  const seedSummary = useAdminDefaultContentSeed({ enabled: location.pathname === "/admin/dashboard" });
  const lastBuildCheckAtRef = useRef(0);
  const t = copy[adminLang];

  useEffect(() => {
    let cancelled = false;

    const checkFreshBuild = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastBuildCheckAtRef.current < BUILD_CHECK_INTERVAL_MS) return;
      lastBuildCheckAtRef.current = now;

      try {
        const response = await fetch(`/admin?version_check=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const html = await response.text();
        const latestEntry = html.match(ADMIN_ENTRY_RE)?.[0] || "";
        const currentEntry = getCurrentAdminEntry();

        if (!cancelled && latestEntry && currentEntry && latestEntry !== currentEntry) {
          window.location.reload();
        }
      } catch {
        // Keep the admin usable if the lightweight version check fails.
      }
    };

    void checkFreshBuild(true);
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void checkFreshBuild();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const copyText = useMemo(
    () => (key: keyof AdminCopy) => {
      const value = t[key];
      return typeof value === "string" ? value : String(key);
    },
    [t],
  );

  const visibleNavGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canAdminRoleAccess(role, item.allowedRoles)),
        }))
        .filter((group) => group.items.length > 0),
    [role],
  );

  const activeGroupKeys = useMemo(
    () =>
      visibleNavGroups
        .filter((group) => group.items.some((item) => item.path.split("#")[0] === location.pathname))
        .map((group) => group.key),
    [location.pathname, visibleNavGroups],
  );

  useEffect(() => {
    applyAdminTheme(theme, adminLang);
    setAdminTheme(theme);

    return () => clearAdminTheme();
  }, [theme, adminLang]);

  useEffect(() => {
    if (!activeGroupKeys.length) return;
    setExpandedGroups({ [activeGroupKeys[0]]: true });
  }, [activeGroupKeys]);

  useEffect(() => {
    const keys = Object.entries(expandedGroups)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
    window.localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(keys));
  }, [expandedGroups]);

  useEffect(() => {
    window.localStorage.setItem(NAV_COLLAPSED_KEY, navCollapsed ? "1" : "0");
  }, [navCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  const activeNavLabel = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isAdminNavItemActive(item.path, location.pathname, location.hash)) return copyText(item.key);
      }
    }
    return copyText("title");
  }, [copyText, location.hash, location.pathname]);

  const activeNavKey = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isAdminNavItemActive(item.path, location.pathname, location.hash)) return item.key;
      }
    }
    return "dashboard" as const;
  }, [location.hash, location.pathname]);

  useEffect(() => {
    document.title = `${activeNavLabel} | ${ADMIN_TITLE_SUFFIX}`;
  }, [activeNavLabel]);

  useEffect(() => {
    ensureAdminFormAccessibility();
    const main = document.querySelector("main");
    if (!main) return;
    const observer = new MutationObserver(() => ensureAdminFormAccessibility());
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.hash, adminLang]);

  const activeNavHelp = useMemo(() => {
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
        return zh ? "这里检查搜索优化字段、站点地图和 Robots 设置。" : "Check SEO fields, sitemap, and Robots settings.";
      case "websiteSettings":
        return zh ? "这里管理公司联系方式、品牌图标和默认 SEO。" : "Manage company contact info, brand assets, and default SEO.";
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
  }, [activeNavKey, adminLang]);

  const websitePath = adminPublicSitePath(adminLang);

  const changeLanguage = (nextLanguage: AdminLang) => {
    setAdminLang(nextLanguage);
    setAdminLangState(nextLanguage);
  };

  const NavLink = ({ item, compact }: { item: NavItem; compact: boolean }) => {
    const isActive = isAdminNavItemActive(item.path, location.pathname, location.hash);
    const label = copyText(item.key);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        title={label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex min-h-10 min-w-0 items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-semibold transition-colors",
          isActive
            ? "border border-accent/25 bg-accent/15 text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          compact && "mx-auto h-10 w-10 justify-center px-0",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-sidebar-foreground/58 group-hover:text-sidebar-accent-foreground")} />
        <span className={cn("truncate", compact && "sr-only")}>{label}</span>
      </Link>
    );
  };

  const Nav = ({ variant }: { variant: "desktop" | "mobile" }) => {
    const compact = variant === "desktop" && navCollapsed;
    return (
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
          variant === "desktop" ? "border-r transition-[width] duration-200" : "w-full",
          variant === "desktop" && (compact ? "w-[76px]" : "w-[280px]"),
        )}
      >
        <div className={cn("flex min-h-[76px] items-center gap-3 border-b border-sidebar-border px-4", compact && "justify-center px-3")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-wide text-primary-foreground">
            FC
          </div>
          <div className={cn("min-w-0 flex-1", compact && "sr-only")}>
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{t.brand}</p>
                <p className="truncate text-sm font-semibold text-sidebar-foreground">{t.title}</p>
                <p className="mt-1 truncate text-[10px] font-semibold text-sidebar-foreground/45">v{ADMIN_BUILD_VERSION}</p>
              </div>
          {variant === "desktop" && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={navCollapsed ? t.expandNav : t.collapseNav}
              title={navCollapsed ? t.expandNav : t.collapseNav}
              className={cn("h-9 w-9 shrink-0 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", compact && "hidden")}
              onClick={() => setNavCollapsed((value) => !value)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {variant === "desktop" && compact && (
          <div className="border-b border-sidebar-border px-3 py-3">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t.expandNav}
              title={t.expandNav}
              className="h-10 w-10 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setNavCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <nav className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-4", compact ? "space-y-4" : "space-y-2.5")} aria-label={t.menu}>
          {visibleNavGroups.map((group) => {
            const groupLabel = copyText(group.key);
            const GroupIcon = group.icon;
            const isExpanded = Boolean(expandedGroups[group.key]);

            if (compact) {
              return (
                <div key={group.key} className="space-y-1 border-t border-sidebar-border/70 pt-4 first:border-t-0 first:pt-0">
                  <p className="sr-only">{groupLabel}</p>
                  {group.items.map((item) => (
                    <NavLink key={item.path} item={item} compact />
                  ))}
                </div>
              );
            }

            return (
              <div
                key={group.key}
                className={cn(
                  "rounded-xl border border-transparent transition-colors",
                  isExpanded && "border-sidebar-border bg-sidebar-accent/35 p-1.5",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isExpanded && "bg-sidebar text-sidebar-foreground shadow-sm",
                  )}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedGroups((prev) => {
                      if (prev[group.key]) return {};
                      return { [group.key]: true };
                    })
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{groupLabel}</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                {isExpanded && (
                  <div className="ml-5 mt-1.5 space-y-1 border-l border-sidebar-border pl-2">
                    {group.items.map((item) => (
                      <NavLink key={item.path} item={item} compact={false} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminConfirmProvider />
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
          <Nav variant="desktop" />
        </div>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg lg:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] max-w-[88vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                    <SheetTitle className="sr-only">{t.brand}</SheetTitle>
                    <SheetDescription className="sr-only">{t.subtitle}</SheetDescription>
                    <Nav variant="mobile" />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t.currentPage}</p>
                  <div className="flex items-center gap-2 truncate text-base font-semibold leading-6 sm:text-lg">
                    <span className="truncate">{activeNavLabel}</span>
                    <AdminHelpTip text={activeNavHelp} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="hidden min-h-12 items-center gap-1 rounded-full border border-border bg-muted/60 p-1 sm:inline-flex" aria-label={t.language}>
                  <ControlButton active={adminLang === "zh"} label="中文" onClick={() => changeLanguage("zh")}>
                    中
                  </ControlButton>
                  <ControlButton active={adminLang === "en"} label="英文" onClick={() => changeLanguage("en")}>
                    EN
                  </ControlButton>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  aria-label={theme === "dark" ? t.lightTheme : t.darkTheme}
                  title={theme === "dark" ? t.lightTheme : t.darkTheme}
                  onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <Button asChild variant="outline" className="hidden h-10 rounded-lg px-4 md:inline-flex">
                  <Link to={websitePath}>
                    <ExternalLink className="h-4 w-4" />
                    {t.backToWebsite}
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg px-3 sm:px-4"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    window.location.href = "/admin";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.signOut}</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
              {seedSummary.status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {t.seedError(seedSummary.error || "Unknown error")}
                </div>
              )}

              <Suspense
                fallback={
                  <div className="space-y-4">
                    <Skeleton className="h-9 w-64 max-w-full" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                  </div>
                }
              >
                <div key={adminLang} className="min-w-0 [&_a.inline-flex]:min-h-10 [&_button]:min-h-10">
                  <Outlet />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
