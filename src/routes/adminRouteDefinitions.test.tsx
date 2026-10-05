import { act, isValidElement, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createRoutesFromElements, MemoryRouter, Outlet, Routes, type RouteObject } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminRoutes } from "@/routes/adminRoutes";
import { adminRouteDefinitions, getAdminRouteDefinition } from "@/routes/adminRouteDefinitions";
import { navGroups } from "@/lib/adminLayoutConfig";
import { ADMIN_ROLE_GROUPS, type AdminAllowedRoles } from "@/lib/adminRoleAccess";
import AdminRoleGate from "@/components/admin/AdminRoleGate";

const auth = vi.hoisted(() => ({ role: "super_admin" }));
vi.mock("@/pages/admin/AdminAuthProvider", () => ({
  default: ({ children }: { children: ReactNode }) => children,
  useAdminAuth: () => ({ role: auth.role }),
}));
vi.mock("@/pages/admin/AdminRoute", () => ({ default: () => <Outlet /> }));
vi.mock("@/pages/admin/AdminLayout", () => ({ default: () => <Outlet /> }));
vi.mock("@/pages/admin/AdminMaterialList", () => ({ default: ({ furnitureMode }: { furnitureMode?: boolean }) => <div data-testid="material-list" data-furniture={String(furnitureMode)}>List</div> }));
vi.mock("@/pages/admin/AdminMaterialEditor", () => ({ default: ({ furnitureMode }: { furnitureMode?: boolean }) => <div data-testid="material-editor" data-furniture={String(furnitureMode)}>Editor</div> }));
vi.mock("@/pages/admin/AdminSimpleCms", () => ({ default: ({ module }: { module: string }) => <div data-testid="simple-cms" data-module={module}>CMS</div> }));

// Freeze the old route-to-role contract independently of the new registry.
const previousRoutes: Array<[string, keyof typeof ADMIN_ROLE_GROUPS]> = [
  ["dashboard", "all"],
  ["content-health", "contentRead"],
  ["publish-center", "contentWrite"],
  ["english-center", "contentWrite"],
  ["cms", "contentWrite"],
  ["settings", "system"],
  ["leads", "leadRead"],
  ["leads/:id", "leadRead"],
  ["quotes", "leadRead"],
  ["quotes/:id", "leadRead"],
  ["lead-reports", "leadRead"],
  ["home", "contentWrite"],
  ["pages", "contentWrite"],
  ["about", "contentWrite"],
  ["faqs", "contentWrite"],
  ["before-after", "contentWrite"],
  ["brand-partners", "contentWrite"],
  ["services", "contentWrite"],
  ["services/new", "contentWrite"],
  ["services/:id", "contentWrite"],
  ["projects", "contentWrite"],
  ["projects/new", "contentWrite"],
  ["projects/:id", "contentWrite"],
  ["materials", "contentWrite"],
  ["materials/new", "contentWrite"],
  ["materials/:id", "contentWrite"],
  ["furniture", "contentWrite"],
  ["furniture/new", "contentWrite"],
  ["furniture/:id", "contentWrite"],
  ["promotions", "contentWrite"],
  ["blog", "contentWrite"],
  ["blog/new", "contentWrite"],
  ["blog/:id", "contentWrite"],
  ["media", "contentWrite"],
  ["seo", "contentWrite"],
  ["users", "system"],
  ["notifications", "system"],
  ["system-health", "system"],
  ["system-logs", "system"],
  ["content/translation_jobs", "contentWrite"],
  ["content/translation_jobs/:id", "contentWrite"],
  ["content/:type/:id?", "contentWrite"],
];
const previousMenu: Array<[string, string, keyof typeof ADMIN_ROLE_GROUPS]> = [
  ["dashboard", "/admin/dashboard", "all"],
  ["contentHealth", "/admin/content-health", "contentRead"],
  ["publishCenter", "/admin/publish-center", "contentWrite"],
  ["englishCenter", "/admin/english-center", "contentWrite"],
  ["home", "/admin/home", "contentWrite"],
  ["cmsBuilder", "/admin/cms", "contentWrite"],
  ["pages", "/admin/pages", "contentWrite"],
  ["about", "/admin/about", "contentWrite"],
  ["faqs", "/admin/faqs", "contentWrite"],
  ["testimonials", "/admin/content/testimonials", "contentWrite"],
  ["brandLogos", "/admin/brand-partners", "contentWrite"],
  ["beforeAfter", "/admin/before-after", "contentWrite"],
  ["services", "/admin/services", "contentWrite"],
  ["projects", "/admin/projects", "contentWrite"],
  ["materials", "/admin/materials", "contentWrite"],
  ["furniture", "/admin/furniture", "contentWrite"],
  ["promotions", "/admin/promotions", "contentWrite"],
  ["blog", "/admin/blog", "contentWrite"],
  ["serviceAreas", "/admin/content/service_areas", "contentWrite"],
  ["landingPages", "/admin/content/landing_pages", "contentWrite"],
  ["leads", "/admin/leads", "leadRead"],
  ["quoteRequests", "/admin/quotes", "leadRead"],
  ["leadReports", "/admin/lead-reports", "leadRead"],
  ["media", "/admin/media", "contentWrite"],
  ["seo", "/admin/seo", "contentWrite"],
  ["sitemap", "/admin/seo#sitemap", "contentWrite"],
  ["websiteSettings", "/admin/settings", "system"],
  ["notificationSettings", "/admin/notifications", "system"],
  ["systemHealth", "/admin/system-health", "system"],
  ["systemLogs", "/admin/system-logs", "system"],
  ["translationJobs", "/admin/content/translation_jobs", "contentWrite"],
  ["users", "/admin/users", "system"],
 ];

const flatten = (routes: RouteObject[]): RouteObject[] => routes.flatMap((route) => [route, ...flatten(route.children || [])]);
const roleGate = (node: ReactNode): AdminAllowedRoles | undefined => {
  if (!isValidElement<{ children?: ReactNode; allowedRoles?: AdminAllowedRoles }>(node)) return undefined;
  if (node.type === AdminRoleGate) return node.props.allowedRoles;
  return roleGate(node.props.children);
};
afterEach(() => { auth.role = "super_admin"; });

describe("shared admin route metadata", () => {
  it("retains every protected path and role contract in the actual route elements", () => {
    const routes = flatten(createRoutesFromElements(adminRoutes));
    expect(Object.values(adminRouteDefinitions)).toHaveLength(previousRoutes.length);
    for (const [path, group] of previousRoutes) {
      const route = routes.find((entry) => entry.path === path);
      expect(route, path).toBeDefined();
      expect(roleGate(route?.element), path).toEqual(ADMIN_ROLE_GROUPS[group]);
    }
  });

  it("retains menu order, links, hash targets and role visibility", () => {
    expect(navGroups.flatMap((group) => group.items.map((item) => [item.key, item.path, item.allowedRoles])))
      .toEqual(previousMenu.map(([key, path, group]) => [key, path, ADMIN_ROLE_GROUPS[group]]));
    for (const group of navGroups) for (const item of group.items) {
      expect(getAdminRouteDefinition(item.path)?.allowedRoles, item.path).toEqual(item.allowedRoles);
      expect(getAdminRouteDefinition(item.path)?.load, item.path).toBeTypeOf("function");
    }
  });

  it("preloads the existing furniture modules and resolves specific editors before generic content", () => {
    expect(getAdminRouteDefinition("/admin/furniture")?.load).toBe(adminRouteDefinitions.materialList.load);
    expect(getAdminRouteDefinition("/admin/furniture/new")?.load).toBe(adminRouteDefinitions.materialEditorNew.load);
    expect(getAdminRouteDefinition("/admin/furniture/fixture-id")?.load).toBe(adminRouteDefinitions.materialEditorDetail.load);
    expect(getAdminRouteDefinition("/admin/leads/fixture-id")?.load).toBe(adminRouteDefinitions.leadDetail.load);
    expect(getAdminRouteDefinition("/admin/content/translation_jobs/fixture-id")?.load).toBe(adminRouteDefinitions.translationJobsDetail.load);
    expect(getAdminRouteDefinition("/admin/seo#sitemap")).toBe(adminRouteDefinitions.seoManager);
    expect(getAdminRouteDefinition("/admin/unknown")).toBeUndefined();
  });

  it.each([
    ["/admin/furniture", "material-list", "data-furniture", "true"],
    ["/admin/furniture/new", "material-editor", "data-furniture", "true"],
    ["/admin/pages", "simple-cms", "data-module", "site_pages"],
    ["/admin/faqs", "simple-cms", "data-module", "faqs"],
  ])("retains lazy wrapper props at %s", async (path, testId, attribute, value) => {
    const container = document.createElement("div"); document.body.appendChild(container); const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Suspense fallback="Pending"><Routes>{adminRoutes}</Routes></Suspense></MemoryRouter>));
      expect(container.querySelector(`[data-testid="${testId}"]`)?.getAttribute(attribute)).toBe(value);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("still blocks a viewer from a content editor route through the real role gate", async () => {
    auth.role = "viewer";
    const container = document.createElement("div"); document.body.appendChild(container); const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={["/admin/furniture"]}><Suspense fallback="Pending"><Routes>{adminRoutes}</Routes></Suspense></MemoryRouter>));
      expect(container.querySelector('[data-testid="material-list"]')).toBeNull();
      expect(container.textContent).toContain("只读查看");
      expect(container.querySelector('a[href="/admin/dashboard"]')).not.toBeNull();
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
