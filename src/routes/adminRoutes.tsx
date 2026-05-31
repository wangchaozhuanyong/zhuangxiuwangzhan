import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
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
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="content-health" element={<AdminContentHealth />} />
        <Route path="publish-center" element={<AdminPublishCenter />} />
        <Route path="english-center" element={<AdminEnglishCenter />} />
        <Route path="cms" element={<AdminCmsBuilder />} />
        <Route path="settings" element={<AdminWebsiteSettings />} />
        <Route path="leads" element={<AdminLeadList />} />
        <Route path="leads/:id" element={<AdminLeadDetail />} />
        <Route path="quotes" element={<AdminQuoteList />} />
        <Route path="quotes/:id" element={<AdminQuoteDetail />} />
        <Route path="home" element={<AdminHomeEditor />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="about" element={<AdminAboutEditor />} />
        <Route path="faqs" element={<AdminFaqs />} />
        <Route path="before-after" element={<AdminBeforeAfter />} />
        <Route path="brand-partners" element={<AdminBrandPartners />} />
        <Route path="services" element={<AdminServiceList />} />
        <Route path="services/new" element={<AdminServiceEditor />} />
        <Route path="services/:id" element={<AdminServiceEditor />} />
        <Route path="projects" element={<AdminProjectList />} />
        <Route path="projects/new" element={<AdminProjectEditor />} />
        <Route path="projects/:id" element={<AdminProjectEditor />} />
        <Route path="materials" element={<AdminMaterialList />} />
        <Route path="materials/new" element={<AdminMaterialEditor />} />
        <Route path="materials/:id" element={<AdminMaterialEditor />} />
        <Route path="blog" element={<AdminBlogList />} />
        <Route path="blog/new" element={<AdminBlogEditor />} />
        <Route path="blog/:id" element={<AdminBlogEditor />} />
        <Route path="media" element={<AdminMediaLibrary />} />
        <Route path="seo" element={<AdminSeoManager />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="notifications" element={<AdminNotificationSettings />} />
        <Route path="system-health" element={<AdminSystemHealth />} />
        <Route path="system-logs" element={<AdminSystemLogs />} />
        <Route path="content/translation_jobs" element={<AdminTranslationJobs />} />
        <Route path="content/translation_jobs/:id" element={<AdminTranslationJobs />} />
        <Route path="content/:type/:id?" element={<AdminContentEditor />} />
      </Route>
    </Route>
    <Route path="/admin/content/leads" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/leads/:id" element={<Navigate to="/admin/leads" replace />} />
    <Route path="/admin/content/quote_requests" element={<Navigate to="/admin/quotes" replace />} />
    <Route path="/admin/content/quote_requests/:id" element={<Navigate to="/admin/quotes" replace />} />
  </>
);
