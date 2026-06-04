import { lazy } from "react";
import { Link, Navigate, Route } from "react-router-dom";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRoleGate from "@/components/admin/AdminRoleGate";
import { Button } from "@/components/ui/button";
import { adminRouteText } from "@/i18n/adminRouteText";
import { getAdminLang } from "@/lib/adminLocale";
import { ADMIN_ROLE_GROUPS, type AdminAllowedRoles } from "@/lib/adminRoleAccess";
import AdminRoute from "@/pages/admin/AdminRoute";
import AdminAuthProvider from "@/pages/admin/AdminAuthProvider";

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminContentHealth = lazy(() => import("@/pages/admin/AdminContentHealth"));
const AdminPublishCenter = lazy(() => import("@/pages/admin/AdminPublishCenter"));
const AdminEnglishCenter = lazy(() => import("@/pages/admin/AdminEnglishCenter"));
const AdminCmsBuilder = lazy(() => import("@/pages/admin/AdminCmsBuilder"));
const AdminContentEditor = lazy(() => import("@/pages/admin/AdminContentEditor"));
const AdminNotificationSettings = lazy(() => import("@/pages/admin/AdminNotificationSettings"));
const AdminTranslationJobs = lazy(() => import("@/pages/admin/AdminTranslationJobs"));
const AdminWebsiteSettings = lazy(() => import("@/pages/admin/AdminWebsiteSettings"));
const AdminLeadList = lazy(() => import("@/pages/admin/AdminLeadList"));
const AdminLeadDetail = lazy(() => import("@/pages/admin/AdminLeadDetail"));
const AdminQuoteList = lazy(() => import("@/pages/admin/AdminQuoteList"));
const AdminQuoteDetail = lazy(() => import("@/pages/admin/AdminQuoteDetail"));
const AdminLeadReports = lazy(() => import("@/pages/admin/AdminLeadReports"));
const AdminServiceList = lazy(() => import("@/pages/admin/AdminServiceList"));
const AdminServiceEditor = lazy(() => import("@/pages/admin/AdminServiceEditor"));
const AdminProjectList = lazy(() => import("@/pages/admin/AdminProjectList"));
const AdminProjectEditor = lazy(() => import("@/pages/admin/AdminProjectEditor"));
const AdminMaterialList = lazy(() => import("@/pages/admin/AdminMaterialList"));
const AdminMaterialEditor = lazy(() => import("@/pages/admin/AdminMaterialEditor"));
const AdminBlogList = lazy(() => import("@/pages/admin/AdminBlogList"));
const AdminBlogEditor = lazy(() => import("@/pages/admin/AdminBlogEditor"));
const AdminMediaLibrary = lazy(() => import("@/pages/admin/AdminMediaLibrary"));
const AdminSeoManager = lazy(() => import("@/pages/admin/AdminSeoManager"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSystemLogs = lazy(() => import("@/pages/admin/AdminSystemLogs"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/AdminSystemHealth"));
const AdminHomeEditor = lazy(() => import("@/pages/admin/AdminHomeEditor"));
const AdminAboutEditor = lazy(() => import("@/pages/admin/AdminAboutEditor"));
const AdminPages = lazy(() => import("@/pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="site_pages" /> })));
const AdminFaqs = lazy(() => import("@/pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="faqs" /> })));
const AdminBeforeAfter = lazy(() => import("@/pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="before_after_items" /> })));
const AdminBrandPartners = lazy(() => import("@/pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="brand_partners" /> })));

const withRoleGate = (element: JSX.Element, allowedRoles: AdminAllowedRoles) => (
  <AdminRoleGate allowedRoles={allowedRoles}>{element}</AdminRoleGate>
);

const AdminNotFound = () => {
  const text = adminRouteText[getAdminLang()];

  return (
    <div className="space-y-5">
      <AdminPageHeader title={text.notFoundTitle} description={text.notFoundDescription} />
      <AdminEmptyState
        title={text.notFoundNextTitle}
        description={text.notFoundNextDescription}
        action={
          <Button asChild className="rounded-lg">
            <Link to="/admin/dashboard">{text.backDashboard}</Link>
          </Button>
        }
      />
    </div>
  );
};

export const adminRoutes = (
  <>
    <Route path="/admin" element={<AdminLogin />} />
    <Route
      element={
        <AdminAuthProvider>
          <AdminRoute />
        </AdminAuthProvider>
      }
    >
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={withRoleGate(<AdminDashboard />, ADMIN_ROLE_GROUPS.all)} />
        <Route path="content-health" element={withRoleGate(<AdminContentHealth />, ADMIN_ROLE_GROUPS.contentRead)} />
        <Route path="publish-center" element={withRoleGate(<AdminPublishCenter />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="english-center" element={withRoleGate(<AdminEnglishCenter />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="cms" element={withRoleGate(<AdminCmsBuilder />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="settings" element={withRoleGate(<AdminWebsiteSettings />, ADMIN_ROLE_GROUPS.system)} />
        <Route path="leads" element={withRoleGate(<AdminLeadList />, ADMIN_ROLE_GROUPS.leadRead)} />
        <Route path="leads/:id" element={withRoleGate(<AdminLeadDetail />, ADMIN_ROLE_GROUPS.leadRead)} />
        <Route path="quotes" element={withRoleGate(<AdminQuoteList />, ADMIN_ROLE_GROUPS.leadRead)} />
        <Route path="quotes/:id" element={withRoleGate(<AdminQuoteDetail />, ADMIN_ROLE_GROUPS.leadRead)} />
        <Route path="lead-reports" element={withRoleGate(<AdminLeadReports />, ADMIN_ROLE_GROUPS.leadRead)} />
        <Route path="home" element={withRoleGate(<AdminHomeEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="pages" element={withRoleGate(<AdminPages />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="about" element={withRoleGate(<AdminAboutEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="faqs" element={withRoleGate(<AdminFaqs />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="before-after" element={withRoleGate(<AdminBeforeAfter />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="brand-partners" element={withRoleGate(<AdminBrandPartners />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="services" element={withRoleGate(<AdminServiceList />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="services/new" element={withRoleGate(<AdminServiceEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="services/:id" element={withRoleGate(<AdminServiceEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="projects" element={withRoleGate(<AdminProjectList />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="projects/new" element={withRoleGate(<AdminProjectEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="projects/:id" element={withRoleGate(<AdminProjectEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="materials" element={withRoleGate(<AdminMaterialList />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="materials/new" element={withRoleGate(<AdminMaterialEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="materials/:id" element={withRoleGate(<AdminMaterialEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="blog" element={withRoleGate(<AdminBlogList />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="blog/new" element={withRoleGate(<AdminBlogEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="blog/:id" element={withRoleGate(<AdminBlogEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="media" element={withRoleGate(<AdminMediaLibrary />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="seo" element={withRoleGate(<AdminSeoManager />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="users" element={withRoleGate(<AdminUsers />, ADMIN_ROLE_GROUPS.system)} />
        <Route path="notifications" element={withRoleGate(<AdminNotificationSettings />, ADMIN_ROLE_GROUPS.system)} />
        <Route path="system-health" element={withRoleGate(<AdminSystemHealth />, ADMIN_ROLE_GROUPS.system)} />
        <Route path="system-logs" element={withRoleGate(<AdminSystemLogs />, ADMIN_ROLE_GROUPS.system)} />
        <Route path="content/translation_jobs" element={withRoleGate(<AdminTranslationJobs />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="content/translation_jobs/:id" element={withRoleGate(<AdminTranslationJobs />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="content/:type/:id?" element={withRoleGate(<AdminContentEditor />, ADMIN_ROLE_GROUPS.contentWrite)} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Route>
    <Route path="/admin/content/leads" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/leads/:id" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/quote_requests" element={<Navigate to="/admin/quotes" replace />} />
    <Route path="/admin/content/quote_requests/:id" element={<Navigate to="/admin/quotes" replace />} />
  </>
);
