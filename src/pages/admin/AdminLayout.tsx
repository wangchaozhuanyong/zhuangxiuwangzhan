import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Settings, Inbox, Globe, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    groupDashboard: "Dashboard",
    groupContent: "Content",
    groupLeads: "Leads",
    groupSettings: "Settings",
    dashboard: "Overview",
    home: "Home Sections",
    faqs: "FAQ",
    testimonials: "Testimonials",
    brandPartners: "Brand Partners",
    beforeAfter: "Before / After",
    services: "Services",
    projects: "Projects",
    materials: "Materials",
    blog: "Blog",
    landingPages: "Landing Pages",
    leads: "Leads",
    quoteRequests: "Quote Requests",
    media: "Media Library",
    seo: "SEO Settings",
    users: "Admin Users",
    websiteSettings: "Website Settings",
    notificationSettings: "Notification Settings",
    translationJobs: "Translation Jobs",
    signOut: "Sign out",
    brand: "FLASH CAST Admin",
    title: "Content & Lead Management",
    searchPlaceholder: "Search modules...",
  },
  zh: {
    groupDashboard: "仪表盘",
    groupContent: "内容管理",
    groupLeads: "线索与表单",
    groupSettings: "设置",
    dashboard: "概览",
    home: "首页内容",
    faqs: "FAQ",
    testimonials: "客户评价",
    brandPartners: "品牌合作",
    beforeAfter: "Before / After",
    services: "服务项目",
    projects: "装修案例",
    materials: "材料库",
    blog: "博客",
    landingPages: "落地页",
    leads: "线索",
    quoteRequests: "报价请求",
    media: "媒体库",
    seo: "SEO 设置",
    users: "管理员账号",
    websiteSettings: "网站基础设置",
    notificationSettings: "通知设置",
    translationJobs: "翻译任务",
    signOut: "退出登录",
    brand: "FLASH CAST 后台",
    title: "内容与线索管理",
    searchPlaceholder: "搜索模块...",
  },
};

const navGroups = [
  {
    key: "groupDashboard",
    icon: LayoutDashboard,
    items: [{ key: "dashboard", path: "/admin/dashboard" }],
  },
  {
    key: "groupContent",
    icon: FileText,
    items: [
      { key: "home", path: "/admin/home" },
      { key: "faqs", path: "/admin/faqs" },
      { key: "testimonials", path: "/admin/content/testimonials" },
      { key: "brandPartners", path: "/admin/brand-partners" },
      { key: "beforeAfter", path: "/admin/before-after" },
      { key: "services", path: "/admin/services" },
      { key: "projects", path: "/admin/projects" },
      { key: "materials", path: "/admin/materials" },
      { key: "blog", path: "/admin/blog" },
      { key: "landingPages", path: "/admin/content/landing_pages" },
    ],
  },
  {
    key: "groupLeads",
    icon: Inbox,
    items: [
      { key: "leads", path: "/admin/leads" },
      { key: "quoteRequests", path: "/admin/quotes" },
    ],
  },
  {
    key: "groupSettings",
    icon: Settings,
    items: [
      { key: "websiteSettings", path: "/admin/settings" },
      { key: "media", path: "/admin/media" },
      { key: "seo", path: "/admin/seo" },
      { key: "translationJobs", path: "/admin/content/translation_jobs" },
      { key: "notificationSettings", path: "/admin/notifications" },
      { key: "users", path: "/admin/users" },
    ],
  },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];

  return (
    <SidebarProvider defaultOpen={true} className="bg-muted">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-2">
          <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Globe className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{t.brand}</div>
              <div className="truncate text-xs text-sidebar-foreground/70">{t.title}</div>
            </div>
          </div>
          <div className="px-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
              <Input
                aria-label={t.searchPlaceholder}
                placeholder={t.searchPlaceholder}
                className="h-8 bg-background pl-8"
              />
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <SidebarGroup key={group.key}>
                <SidebarGroupLabel className="gap-2">
                  <GroupIcon className="h-4 w-4" />
                  <span>{t[group.key as keyof typeof t]}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const itemPath = item.path.split("#")[0];
                      const isActive = location.pathname === itemPath;
                      const label = t[item.key as keyof typeof t] as string;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                            <Link to={item.path}>
                              <span className="truncate">{label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-muted">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-5">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{t.title}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            {t.signOut}
          </Button>
        </header>

        <div className="min-w-0 flex-1 px-3 py-5 md:px-5">
          <section className="min-w-0">{children}</section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminLayout;
