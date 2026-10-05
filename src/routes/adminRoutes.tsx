import { lazy } from "react";
import { Link, Navigate, Route } from "react-router-dom";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminRoleGate from "@/components/admin/AdminRoleGate";
import AdminLanguagePage from "@/components/admin/AdminLanguagePage";
import { Button } from "@/components/ui/button";
import { adminRouteText } from "@/i18n/adminRouteText";
import { useAdminLang } from "@/lib/adminLocale";
import type { AdminAllowedRoles } from "@/lib/adminRoleAccess";
import { adminRouteDefinitions } from "@/routes/adminRouteDefinitions";
import AdminRoute from "@/pages/admin/AdminRoute";
import AdminAuthProvider from "@/pages/admin/AdminAuthProvider";

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(adminRouteDefinitions.dashboard.load);
const AdminContentHealth = lazy(adminRouteDefinitions.contentHealth.load);
const AdminPublishCenter = lazy(adminRouteDefinitions.publishCenter.load);
const AdminEnglishCenter = lazy(adminRouteDefinitions.englishCenter.load);
const AdminCmsBuilder = lazy(adminRouteDefinitions.cmsBuilder.load);
const AdminContentEditor = lazy(adminRouteDefinitions.contentEditor.load);
const AdminNotificationSettings = lazy(adminRouteDefinitions.notificationSettings.load);
const AdminTranslationJobs = lazy(adminRouteDefinitions.translationJobs.load);
const AdminWebsiteSettings = lazy(adminRouteDefinitions.websiteSettings.load);
const AdminLeadList = lazy(adminRouteDefinitions.leadList.load);
const AdminLeadDetail = lazy(adminRouteDefinitions.leadDetail.load);
const AdminQuoteList = lazy(adminRouteDefinitions.quoteList.load);
const AdminQuoteDetail = lazy(adminRouteDefinitions.quoteDetail.load);
const AdminLeadReports = lazy(adminRouteDefinitions.leadReports.load);
const AdminServiceList = lazy(adminRouteDefinitions.serviceList.load);
const AdminServiceEditor = lazy(adminRouteDefinitions.serviceEditorNew.load);
const AdminProjectList = lazy(adminRouteDefinitions.projectList.load);
const AdminProjectEditor = lazy(adminRouteDefinitions.projectEditorNew.load);
const AdminMaterialList = lazy(adminRouteDefinitions.materialList.load);
const AdminMaterialEditor = lazy(adminRouteDefinitions.materialEditorNew.load);
const AdminFurnitureList = lazy(() => adminRouteDefinitions.furnitureList.load().then((module) => ({ default: () => <module.default furnitureMode /> })));
const AdminFurnitureEditor = lazy(() => adminRouteDefinitions.furnitureEditorNew.load().then((module) => ({ default: () => <module.default furnitureMode /> })));
const AdminPromotionsEditor = lazy(adminRouteDefinitions.promotionsEditor.load);
const AdminBlogList = lazy(adminRouteDefinitions.blogList.load);
const AdminBlogEditor = lazy(adminRouteDefinitions.blogEditorNew.load);
const AdminMediaLibrary = lazy(adminRouteDefinitions.mediaLibrary.load);
const AdminSeoManager = lazy(adminRouteDefinitions.seoManager.load);
const AdminUsers = lazy(adminRouteDefinitions.users.load);
const AdminSystemLogs = lazy(adminRouteDefinitions.systemLogs.load);
const AdminSystemHealth = lazy(adminRouteDefinitions.systemHealth.load);
const AdminHomeEditor = lazy(adminRouteDefinitions.homeEditor.load);
const AdminAboutEditor = lazy(adminRouteDefinitions.aboutEditor.load);
const AdminPages = lazy(() => adminRouteDefinitions.pages.load().then((module) => ({ default: () => <module.default module="site_pages" /> })));
const AdminFaqs = lazy(() => adminRouteDefinitions.faqs.load().then((module) => ({ default: () => <module.default module="faqs" /> })));
const AdminBeforeAfter = lazy(() => adminRouteDefinitions.beforeAfter.load().then((module) => ({ default: () => <module.default module="before_after_items" /> })));
const AdminBrandPartners = lazy(() => adminRouteDefinitions.brandPartners.load().then((module) => ({ default: () => <module.default module="brand_partners" /> })));

const withRoleGate = (element: JSX.Element, allowedRoles: AdminAllowedRoles) => (
  <AdminLanguagePage>
    <AdminRoleGate allowedRoles={allowedRoles}><AdminLanguagePage>{element}</AdminLanguagePage></AdminRoleGate>
  </AdminLanguagePage>
);

const AdminNotFound = () => {
  const text = adminRouteText[useAdminLang()];

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
        <Route path={adminRouteDefinitions.dashboard.path} element={withRoleGate(<AdminDashboard />, adminRouteDefinitions.dashboard.allowedRoles)} />
        <Route path={adminRouteDefinitions.contentHealth.path} element={withRoleGate(<AdminContentHealth />, adminRouteDefinitions.contentHealth.allowedRoles)} />
        <Route path={adminRouteDefinitions.publishCenter.path} element={withRoleGate(<AdminPublishCenter />, adminRouteDefinitions.publishCenter.allowedRoles)} />
        <Route path={adminRouteDefinitions.englishCenter.path} element={withRoleGate(<AdminEnglishCenter />, adminRouteDefinitions.englishCenter.allowedRoles)} />
        <Route path={adminRouteDefinitions.cmsBuilder.path} element={withRoleGate(<AdminCmsBuilder />, adminRouteDefinitions.cmsBuilder.allowedRoles)} />
        <Route path={adminRouteDefinitions.websiteSettings.path} element={withRoleGate(<AdminWebsiteSettings />, adminRouteDefinitions.websiteSettings.allowedRoles)} />
        <Route path={adminRouteDefinitions.leadList.path} element={withRoleGate(<AdminLeadList />, adminRouteDefinitions.leadList.allowedRoles)} />
        <Route path={adminRouteDefinitions.leadDetail.path} element={withRoleGate(<AdminLeadDetail />, adminRouteDefinitions.leadDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.quoteList.path} element={withRoleGate(<AdminQuoteList />, adminRouteDefinitions.quoteList.allowedRoles)} />
        <Route path={adminRouteDefinitions.quoteDetail.path} element={withRoleGate(<AdminQuoteDetail />, adminRouteDefinitions.quoteDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.leadReports.path} element={withRoleGate(<AdminLeadReports />, adminRouteDefinitions.leadReports.allowedRoles)} />
        <Route path={adminRouteDefinitions.homeEditor.path} element={withRoleGate(<AdminHomeEditor />, adminRouteDefinitions.homeEditor.allowedRoles)} />
        <Route path={adminRouteDefinitions.pages.path} element={withRoleGate(<AdminPages />, adminRouteDefinitions.pages.allowedRoles)} />
        <Route path={adminRouteDefinitions.aboutEditor.path} element={withRoleGate(<AdminAboutEditor />, adminRouteDefinitions.aboutEditor.allowedRoles)} />
        <Route path={adminRouteDefinitions.faqs.path} element={withRoleGate(<AdminFaqs />, adminRouteDefinitions.faqs.allowedRoles)} />
        <Route path={adminRouteDefinitions.beforeAfter.path} element={withRoleGate(<AdminBeforeAfter />, adminRouteDefinitions.beforeAfter.allowedRoles)} />
        <Route path={adminRouteDefinitions.brandPartners.path} element={withRoleGate(<AdminBrandPartners />, adminRouteDefinitions.brandPartners.allowedRoles)} />
        <Route path={adminRouteDefinitions.serviceList.path} element={withRoleGate(<AdminServiceList />, adminRouteDefinitions.serviceList.allowedRoles)} />
        <Route path={adminRouteDefinitions.serviceEditorNew.path} element={withRoleGate(<AdminServiceEditor />, adminRouteDefinitions.serviceEditorNew.allowedRoles)} />
        <Route path={adminRouteDefinitions.serviceEditorDetail.path} element={withRoleGate(<AdminServiceEditor />, adminRouteDefinitions.serviceEditorDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.projectList.path} element={withRoleGate(<AdminProjectList />, adminRouteDefinitions.projectList.allowedRoles)} />
        <Route path={adminRouteDefinitions.projectEditorNew.path} element={withRoleGate(<AdminProjectEditor />, adminRouteDefinitions.projectEditorNew.allowedRoles)} />
        <Route path={adminRouteDefinitions.projectEditorDetail.path} element={withRoleGate(<AdminProjectEditor />, adminRouteDefinitions.projectEditorDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.materialList.path} element={withRoleGate(<AdminMaterialList />, adminRouteDefinitions.materialList.allowedRoles)} />
        <Route path={adminRouteDefinitions.materialEditorNew.path} element={withRoleGate(<AdminMaterialEditor />, adminRouteDefinitions.materialEditorNew.allowedRoles)} />
        <Route path={adminRouteDefinitions.materialEditorDetail.path} element={withRoleGate(<AdminMaterialEditor />, adminRouteDefinitions.materialEditorDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.furnitureList.path} element={withRoleGate(<AdminFurnitureList />, adminRouteDefinitions.furnitureList.allowedRoles)} />
        <Route path={adminRouteDefinitions.furnitureEditorNew.path} element={withRoleGate(<AdminFurnitureEditor />, adminRouteDefinitions.furnitureEditorNew.allowedRoles)} />
        <Route path={adminRouteDefinitions.furnitureEditorDetail.path} element={withRoleGate(<AdminFurnitureEditor />, adminRouteDefinitions.furnitureEditorDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.promotionsEditor.path} element={withRoleGate(<AdminPromotionsEditor />, adminRouteDefinitions.promotionsEditor.allowedRoles)} />
        <Route path={adminRouteDefinitions.blogList.path} element={withRoleGate(<AdminBlogList />, adminRouteDefinitions.blogList.allowedRoles)} />
        <Route path={adminRouteDefinitions.blogEditorNew.path} element={withRoleGate(<AdminBlogEditor />, adminRouteDefinitions.blogEditorNew.allowedRoles)} />
        <Route path={adminRouteDefinitions.blogEditorDetail.path} element={withRoleGate(<AdminBlogEditor />, adminRouteDefinitions.blogEditorDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.mediaLibrary.path} element={withRoleGate(<AdminMediaLibrary />, adminRouteDefinitions.mediaLibrary.allowedRoles)} />
        <Route path={adminRouteDefinitions.seoManager.path} element={withRoleGate(<AdminSeoManager />, adminRouteDefinitions.seoManager.allowedRoles)} />
        <Route path={adminRouteDefinitions.users.path} element={withRoleGate(<AdminUsers />, adminRouteDefinitions.users.allowedRoles)} />
        <Route path={adminRouteDefinitions.notificationSettings.path} element={withRoleGate(<AdminNotificationSettings />, adminRouteDefinitions.notificationSettings.allowedRoles)} />
        <Route path={adminRouteDefinitions.systemHealth.path} element={withRoleGate(<AdminSystemHealth />, adminRouteDefinitions.systemHealth.allowedRoles)} />
        <Route path={adminRouteDefinitions.systemLogs.path} element={withRoleGate(<AdminSystemLogs />, adminRouteDefinitions.systemLogs.allowedRoles)} />
        <Route path={adminRouteDefinitions.translationJobs.path} element={withRoleGate(<AdminTranslationJobs />, adminRouteDefinitions.translationJobs.allowedRoles)} />
        <Route path={adminRouteDefinitions.translationJobsDetail.path} element={withRoleGate(<AdminTranslationJobs />, adminRouteDefinitions.translationJobsDetail.allowedRoles)} />
        <Route path={adminRouteDefinitions.contentEditor.path} element={withRoleGate(<AdminContentEditor />, adminRouteDefinitions.contentEditor.allowedRoles)} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Route>
    <Route path="/admin/content/leads" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/leads/:id" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/quote_requests" element={<Navigate to="/admin/quotes" replace />} />
    <Route path="/admin/content/quote_requests/:id" element={<Navigate to="/admin/quotes" replace />} />
  </>
);
