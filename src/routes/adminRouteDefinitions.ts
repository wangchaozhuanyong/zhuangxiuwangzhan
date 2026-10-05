import { matchPath } from "react-router-dom";
import { ADMIN_ROLE_GROUPS, type AdminAllowedRoles } from "@/lib/adminRoleAccess";

// Route binding, menu links and speculative module loading share these finite descriptors.
// Authentication and actual authorization stay in AdminAuthProvider/AdminRoute/AdminRoleGate.
export const ADMIN_BASE_PATH = "/admin";

const pageLoaders = {
  dashboard: () => import("@/pages/admin/AdminDashboard"),
  contentHealth: () => import("@/pages/admin/AdminContentHealth"),
  publishCenter: () => import("@/pages/admin/AdminPublishCenter"),
  englishCenter: () => import("@/pages/admin/AdminEnglishCenter"),
  cmsBuilder: () => import("@/pages/admin/AdminCmsBuilder"),
  contentEditor: () => import("@/pages/admin/AdminContentEditor"),
  notificationSettings: () => import("@/pages/admin/AdminNotificationSettings"),
  translationJobs: () => import("@/pages/admin/AdminTranslationJobs"),
  websiteSettings: () => import("@/pages/admin/AdminWebsiteSettings"),
  leadList: () => import("@/pages/admin/AdminLeadList"),
  leadDetail: () => import("@/pages/admin/AdminLeadDetail"),
  quoteList: () => import("@/pages/admin/AdminQuoteList"),
  quoteDetail: () => import("@/pages/admin/AdminQuoteDetail"),
  leadReports: () => import("@/pages/admin/AdminLeadReports"),
  serviceList: () => import("@/pages/admin/AdminServiceList"),
  serviceEditor: () => import("@/pages/admin/AdminServiceEditor"),
  projectList: () => import("@/pages/admin/AdminProjectList"),
  projectEditor: () => import("@/pages/admin/AdminProjectEditor"),
  materialList: () => import("@/pages/admin/AdminMaterialList"),
  materialEditor: () => import("@/pages/admin/AdminMaterialEditor"),
  promotionsEditor: () => import("@/pages/admin/AdminPromotionsEditor"),
  blogList: () => import("@/pages/admin/AdminBlogList"),
  blogEditor: () => import("@/pages/admin/AdminBlogEditor"),
  mediaLibrary: () => import("@/pages/admin/AdminMediaLibrary"),
  seoManager: () => import("@/pages/admin/AdminSeoManager"),
  users: () => import("@/pages/admin/AdminUsers"),
  systemLogs: () => import("@/pages/admin/AdminSystemLogs"),
  systemHealth: () => import("@/pages/admin/AdminSystemHealth"),
  homeEditor: () => import("@/pages/admin/AdminHomeEditor"),
  aboutEditor: () => import("@/pages/admin/AdminAboutEditor"),
  pages: () => import("@/pages/admin/AdminSimpleCms"),
};

function defineRoute<Path extends string, Module>(path: Path, load: () => Promise<Module>, allowedRoles: AdminAllowedRoles) {
  return { path, fullPath: `${ADMIN_BASE_PATH}/${path}`, load, allowedRoles };
}

export const adminRouteDefinitions = {
  dashboard: defineRoute("dashboard", pageLoaders.dashboard, ADMIN_ROLE_GROUPS.all),
  contentHealth: defineRoute("content-health", pageLoaders.contentHealth, ADMIN_ROLE_GROUPS.contentRead),
  publishCenter: defineRoute("publish-center", pageLoaders.publishCenter, ADMIN_ROLE_GROUPS.contentWrite),
  englishCenter: defineRoute("english-center", pageLoaders.englishCenter, ADMIN_ROLE_GROUPS.contentWrite),
  cmsBuilder: defineRoute("cms", pageLoaders.cmsBuilder, ADMIN_ROLE_GROUPS.contentWrite),
  websiteSettings: defineRoute("settings", pageLoaders.websiteSettings, ADMIN_ROLE_GROUPS.system),
  leadList: defineRoute("leads", pageLoaders.leadList, ADMIN_ROLE_GROUPS.leadRead),
  leadDetail: defineRoute("leads/:id", pageLoaders.leadDetail, ADMIN_ROLE_GROUPS.leadRead),
  quoteList: defineRoute("quotes", pageLoaders.quoteList, ADMIN_ROLE_GROUPS.leadRead),
  quoteDetail: defineRoute("quotes/:id", pageLoaders.quoteDetail, ADMIN_ROLE_GROUPS.leadRead),
  leadReports: defineRoute("lead-reports", pageLoaders.leadReports, ADMIN_ROLE_GROUPS.leadRead),
  homeEditor: defineRoute("home", pageLoaders.homeEditor, ADMIN_ROLE_GROUPS.contentWrite),
  pages: defineRoute("pages", pageLoaders.pages, ADMIN_ROLE_GROUPS.contentWrite),
  aboutEditor: defineRoute("about", pageLoaders.aboutEditor, ADMIN_ROLE_GROUPS.contentWrite),
  faqs: defineRoute("faqs", pageLoaders.pages, ADMIN_ROLE_GROUPS.contentWrite),
  beforeAfter: defineRoute("before-after", pageLoaders.pages, ADMIN_ROLE_GROUPS.contentWrite),
  brandPartners: defineRoute("brand-partners", pageLoaders.pages, ADMIN_ROLE_GROUPS.contentWrite),
  serviceList: defineRoute("services", pageLoaders.serviceList, ADMIN_ROLE_GROUPS.contentWrite),
  serviceEditorNew: defineRoute("services/new", pageLoaders.serviceEditor, ADMIN_ROLE_GROUPS.contentWrite),
  serviceEditorDetail: defineRoute("services/:id", pageLoaders.serviceEditor, ADMIN_ROLE_GROUPS.contentWrite),
  projectList: defineRoute("projects", pageLoaders.projectList, ADMIN_ROLE_GROUPS.contentWrite),
  projectEditorNew: defineRoute("projects/new", pageLoaders.projectEditor, ADMIN_ROLE_GROUPS.contentWrite),
  projectEditorDetail: defineRoute("projects/:id", pageLoaders.projectEditor, ADMIN_ROLE_GROUPS.contentWrite),
  materialList: defineRoute("materials", pageLoaders.materialList, ADMIN_ROLE_GROUPS.contentWrite),
  materialEditorNew: defineRoute("materials/new", pageLoaders.materialEditor, ADMIN_ROLE_GROUPS.contentWrite),
  materialEditorDetail: defineRoute("materials/:id", pageLoaders.materialEditor, ADMIN_ROLE_GROUPS.contentWrite),
  furnitureList: defineRoute("furniture", pageLoaders.materialList, ADMIN_ROLE_GROUPS.contentWrite),
  furnitureEditorNew: defineRoute("furniture/new", pageLoaders.materialEditor, ADMIN_ROLE_GROUPS.contentWrite),
  furnitureEditorDetail: defineRoute("furniture/:id", pageLoaders.materialEditor, ADMIN_ROLE_GROUPS.contentWrite),
  promotionsEditor: defineRoute("promotions", pageLoaders.promotionsEditor, ADMIN_ROLE_GROUPS.contentWrite),
  blogList: defineRoute("blog", pageLoaders.blogList, ADMIN_ROLE_GROUPS.contentWrite),
  blogEditorNew: defineRoute("blog/new", pageLoaders.blogEditor, ADMIN_ROLE_GROUPS.contentWrite),
  blogEditorDetail: defineRoute("blog/:id", pageLoaders.blogEditor, ADMIN_ROLE_GROUPS.contentWrite),
  mediaLibrary: defineRoute("media", pageLoaders.mediaLibrary, ADMIN_ROLE_GROUPS.contentWrite),
  seoManager: defineRoute("seo", pageLoaders.seoManager, ADMIN_ROLE_GROUPS.contentWrite),
  users: defineRoute("users", pageLoaders.users, ADMIN_ROLE_GROUPS.system),
  notificationSettings: defineRoute("notifications", pageLoaders.notificationSettings, ADMIN_ROLE_GROUPS.system),
  systemHealth: defineRoute("system-health", pageLoaders.systemHealth, ADMIN_ROLE_GROUPS.system),
  systemLogs: defineRoute("system-logs", pageLoaders.systemLogs, ADMIN_ROLE_GROUPS.system),
  translationJobs: defineRoute("content/translation_jobs", pageLoaders.translationJobs, ADMIN_ROLE_GROUPS.contentWrite),
  translationJobsDetail: defineRoute("content/translation_jobs/:id", pageLoaders.translationJobs, ADMIN_ROLE_GROUPS.contentWrite),
  contentEditor: defineRoute("content/:type/:id?", pageLoaders.contentEditor, ADMIN_ROLE_GROUPS.contentWrite),
};

export const getAdminRouteDefinition = (pathname: string) => {
  const path = pathname.split("#")[0] || pathname;
  return Object.values(adminRouteDefinitions).find((definition) => matchPath({ path: definition.fullPath, end: true }, path));
};

export const getAdminContentPath = (type: string) =>
  adminRouteDefinitions.contentEditor.fullPath.replace("/:type/:id?", `/${type}`);
