import { act, type ComponentProps, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSiteSettings, useSiteSettingsReadiness } from "@/hooks/useSiteSettings";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { adminServiceEditorText } from "@/i18n/adminServiceEditorText";
import { adminProjectEditorText } from "@/i18n/adminProjectEditorText";
import { adminBlogEditorText } from "@/i18n/adminBlogEditorText";
import { adminMaterialEditorText } from "@/i18n/adminMaterialEditorText";
import { adminServiceListText } from "@/i18n/adminServiceListText";
import { adminTranslationJobsText } from "@/i18n/adminTranslationJobsText";
import { adminDashboardText } from "@/i18n/adminDashboardText";
import AdminServiceEditor from "./AdminServiceEditor";
import AdminProjectEditor from "./AdminProjectEditor";
import AdminBlogEditor from "./AdminBlogEditor";
import AdminMaterialEditor from "./AdminMaterialEditor";
import AdminServiceList from "./AdminServiceList";
import AdminTranslationJobs from "./AdminTranslationJobs";
import AdminDashboard from "./AdminDashboard";

// Real observers, form state, editors and domain save payload builders. Only
// persistence/remote transport and unrelated image presentation are replaced.
const mocks = vi.hoisted(() => ({
  serviceRead: vi.fn(), projectRead: vi.fn(), blogRead: vi.fn(), materialRead: vi.fn(),
  serviceList: vi.fn(), translationRead: vi.fn(), dashboardRead: vi.fn(), healthRead: vi.fn(), settingsRead: vi.fn(), save: vi.fn(), toast: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/backend/modules/services/repository/serviceRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/services/repository/serviceRepository")>(), fetchAdminServiceDetail: mocks.serviceRead, fetchAdminServiceList: mocks.serviceList, findServiceIdsBySlug: vi.fn(async () => []) }));
vi.mock("@/backend/modules/projects/repository/projectRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/projects/repository/projectRepository")>(), fetchAdminProjectDetail: mocks.projectRead, findProjectIdsBySlug: vi.fn(async () => []) }));
vi.mock("@/backend/modules/blog/repository/blogRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/blog/repository/blogRepository")>(), fetchAdminBlogPostDetail: mocks.blogRead, findBlogPostIdsBySlug: vi.fn(async () => []) }));
vi.mock("@/backend/modules/materials/repository/materialRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/materials/repository/materialRepository")>(), fetchAdminMaterialDetail: mocks.materialRead, findMaterialIdsBySlug: vi.fn(async () => []) }));
vi.mock("@/backend/modules/system/repository/dashboardRepository", () => ({ fetchAdminDashboardStatsData: mocks.dashboardRead }));
vi.mock("@/backend/modules/cms/repository/contentHealthRepository", () => ({ fetchAdminContentHealthRows: mocks.healthRead }));
vi.mock("@/backend/modules/settings/repository/siteSettingsRepository", () => ({ fetchDefaultSiteSettingsRecord: mocks.settingsRead }));
vi.mock("@/lib/adminEditorData", async (original) => ({ ...await original<typeof import("@/lib/adminEditorData")>(), fetchTranslationJobs: mocks.translationRead }));
vi.mock("@/lib/adminMutation", async (original) => ({ ...await original<typeof import("@/lib/adminMutation")>(), saveAdminRecord: mocks.save }));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast, useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/components/admin/ImageField", () => ({ default: ({ onChange }: { onChange: (value: string) => void }) => <button type="button" data-custom-editor onClick={() => onChange("synthetic-image.webp")}>Synthetic image picker</button> }));
vi.mock("./AdminProjectImages", () => ({ default: () => <div data-custom-editor /> }));
vi.mock("./AdminMaterialImages", () => ({ default: () => <div data-custom-editor /> }));
vi.mock("@/lib/adminLocale", async (original) => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => "zh", useAdminLang: () => "zh" }));
vi.mock("@/components/admin/AdminPermission", () => ({
  useAdminPermission: () => ({ allowed: true }), AdminPermissionHint: () => null,
  AdminActionButton: ({ action: _action, showDeniedHint: _hint, variant: _variant, ...props }: ComponentProps<"button"> & { action: string; showDeniedHint?: boolean; variant?: string }) => <button {...props} />,
}));

const fixture = { id: "confirmed-record", title_zh: "已确认记录", title_en: "Confirmed fixture", slug: "confirmed-record", status: "draft", updated_at: "2026-10-05T01:02:03.123456Z" };
const savedVersion = "2026-10-05T02:03:04.654321Z";
const cases = [
  { table: "services", path: "services", Page: AdminServiceEditor, read: mocks.serviceRead, saveLabel: adminServiceEditorText.saveDraft.zh },
  { table: "projects", path: "projects", Page: AdminProjectEditor, read: mocks.projectRead, saveLabel: adminProjectEditorText.saveDraft.zh },
  { table: "blog_posts", path: "blog", Page: AdminBlogEditor, read: mocks.blogRead, saveLabel: adminBlogEditorText.saveDraft.zh },
  { table: "materials", path: "materials", Page: AdminMaterialEditor, read: mocks.materialRead, saveLabel: adminMaterialEditorText.saveDraft.zh },
];
const detailKey = (table: string, id: string | undefined = fixture.id) => ["admin", table, "detail", id];
const listKey = ["admin", "services", { page: 0, pageSize: 30, status: "all", search: "" }];
const jobsKey = ["admin", "translation_jobs", { limit: 100 }];
const dashboardKey = ["admin", "dashboard", "stats"];
const settingsKey = ["site-settings"];
let root: Root, node: HTMLDivElement, client: QueryClient;
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function render(Page: ComponentType, path = "/admin/isolated") {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><TooltipProvider><Routes>
    <Route path="/admin/:kind/:id?" element={<Page />} />
  </Routes></TooltipProvider></MemoryRouter></QueryClientProvider>)); await settle();
}
function button(label: string) {
  const result = Array.from(node.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent?.trim() === label);
  expect(result, `Expected button ${label}`).toBeDefined(); return result!;
}
function input(value: string) {
  const result = Array.from(node.querySelectorAll<HTMLInputElement>("input")).find((item) => item.value === value);
  expect(result, `Expected input ${value}`).toBeDefined(); return result!;
}
function edit(element: HTMLInputElement, value: string) {
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value); element.dispatchEvent(new Event("input", { bubbles: true })); });
}
function lastSave() { expect(mocks.save).toHaveBeenCalledOnce(); return mocks.save.mock.calls[0]![0]; }
function BrandReadiness() {
  const settings = useSiteSettings();
  const first = useSiteSettingsReadiness(), second = useSiteSettingsReadiness();
  return <div data-first={String(first)} data-second={String(second)}>{settings.brand_name}</div>;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); onlineManager.setOnline(true);
  Object.values(mocks).forEach((mock) => mock.mockReset());
  for (const testCase of cases) testCase.read.mockResolvedValue(fixture);
  mocks.serviceList.mockResolvedValue({ rows: [], count: 0, page: 0, pageSize: 30 });
  mocks.translationRead.mockResolvedValue([]); mocks.healthRead.mockResolvedValue([]);
  mocks.dashboardRead.mockResolvedValue({ counts: { todayLeads: 0 }, recentLeads: [], recentQuotes: [] });
  mocks.settingsRead.mockResolvedValue({ ...fallbackSiteSettings, brand_name: "Confirmed brand" });
  mocks.save.mockImplementation(async (args) => ({ ...args.payload, id: args.id || "created-fixture", updated_at: savedVersion }));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); client.clear(); node.remove(); onlineManager.setOnline(true); vi.unstubAllGlobals();
});

describe("existing business record readiness", () => {
  it.each(cases)("$table waits offline before mounting custom editors, then updates the recovered identity", async ({ table, path, Page, read, saveLabel }) => {
    onlineManager.setOnline(false); await render(Page, `/admin/${path}/${fixture.id}`);
    expect(client.getQueryState(detailKey(table))?.fetchStatus).toBe("paused"); expect(read).not.toHaveBeenCalled();
    expect(node.querySelector('[role="status"]')).toHaveAttribute("aria-busy", "true");
    expect(node.querySelector("form")).toBeNull(); expect(node.querySelector("input, textarea, [data-custom-editor]")).toBeNull(); expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(read).toHaveBeenCalledOnce(); expect(input(fixture.title_zh)).not.toBeDisabled();
    edit(input(fixture.title_zh), "恢复后草稿"); await act(async () => button(saveLabel).click()); await settle();
    expect(lastSave()).toMatchObject({ table, id: fixture.id, action: "update", expectedUpdatedAt: fixture.updated_at, payload: { title_zh: "恢复后草稿", slug: fixture.slug } });
  });

  it.each(cases)("$table keeps cached dirty values and identity through paused/failed background reads", async ({ table, path, Page, read, saveLabel }) => {
    client.setQueryData(detailKey(table), fixture, { updatedAt: 1 }); onlineManager.setOnline(false);
    await render(Page, `/admin/${path}/${fixture.id}`); expect(client.getQueryState(detailKey(table))?.fetchStatus).toBe("paused");
    edit(input(fixture.title_zh), "缓存草稿"); read.mockRejectedValueOnce(new Error("Synthetic refresh failure"));
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(client.getQueryState(detailKey(table))?.status).toBe("error"); expect(input("缓存草稿")).not.toBeDisabled();
    await act(async () => button(saveLabel).click()); await settle();
    expect(lastSave()).toMatchObject({ table, id: fixture.id, action: "update", expectedUpdatedAt: fixture.updated_at, payload: { title_zh: "缓存草稿" } });
  });

  it.each(cases)("$table permits a new disabled detail route without remote confirmation", async ({ table, path, Page, read, saveLabel }) => {
    onlineManager.setOnline(false); await render(Page, `/admin/${path}/new`);
    expect(read).not.toHaveBeenCalled(); expect(client.getQueryState(["admin", table, "detail", undefined])?.fetchStatus).toBe("idle");
    expect(node.querySelector("form")).not.toBeNull(); expect(button(saveLabel)).not.toBeDisabled();
    const field = node.querySelector<HTMLInputElement>('input:not([type]), input[type="text"]'); expect(field).not.toBeNull(); edit(field!, "new-record");
    await act(async () => button(saveLabel).click()); await settle();
    expect(lastSave()).toMatchObject({ table, id: undefined, action: "insert", payload: { title_zh: "new-record", slug: "new-record" } });
  });

  it("keeps an initial failed record unavailable and allows retry to restore the existing ID", async () => {
    mocks.serviceRead.mockRejectedValueOnce(new Error("Synthetic initial failure")); await render(AdminServiceEditor, `/admin/services/${fixture.id}`);
    expect(node.querySelector("input, [data-custom-editor]")).toBeNull(); expect(node.textContent).toContain(adminServiceEditorText.loadFailed.zh);
    await act(async () => button("重试").click()); await settle(); edit(input(fixture.title_zh), "重试草稿");
    await act(async () => button(adminServiceEditorText.saveDraft.zh).click()); await settle();
    expect(lastSave()).toMatchObject({ id: fixture.id, action: "update", expectedUpdatedAt: fixture.updated_at });
  });
});

describe("read-only consumer states", () => {
  it("shows initial paused service loading, then a legitimately confirmed empty list", async () => {
    onlineManager.setOnline(false); await render(AdminServiceList);
    expect(client.getQueryState(listKey)?.fetchStatus).toBe("paused"); expect(node.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(node.textContent).not.toContain(adminServiceListText.emptyTitle.zh);
    await act(async () => onlineManager.setOnline(true)); await settle(); expect(node.textContent).toContain(adminServiceListText.emptyTitle.zh);
  });

  it("keeps cached service rows visible through a paused background read", async () => {
    client.setQueryData(listKey, { rows: [fixture], count: 1, page: 0, pageSize: 30 }, { updatedAt: 1 }); onlineManager.setOnline(false);
    await render(AdminServiceList); expect(client.getQueryState(listKey)?.fetchStatus).toBe("paused");
    expect(node.textContent).toContain(fixture.title_zh); expect(node.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("translation jobs wait without empty text or zero statistics until confirmed", async () => {
    onlineManager.setOnline(false); await render(AdminTranslationJobs);
    expect(client.getQueryState(jobsKey)?.fetchStatus).toBe("paused"); expect(node.textContent).not.toContain(adminTranslationJobsText.zh.empty);
    expect(node.querySelector('[aria-busy="true"]')).not.toBeNull(); expect(node.textContent?.match(/…/g)).toHaveLength(4);
    await act(async () => onlineManager.setOnline(true)); await settle(); expect(node.textContent).toContain(adminTranslationJobsText.zh.empty);
    expect(node.textContent).not.toContain("…");
  });

  it("dashboard delayed health remains unknown while paused and recent sections only become empty after confirmation", async () => {
    onlineManager.setOnline(false); await render(AdminDashboard);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 950)); }); await settle();
    expect(client.getQueryState(dashboardKey)?.fetchStatus).toBe("paused"); expect(client.getQueryState(["admin", "content_health"])?.fetchStatus).toBe("paused");
    expect(node.querySelectorAll('[aria-busy="true"]')).toHaveLength(2); expect(node.textContent).not.toContain(adminDashboardText.emptyLeadsDescription.zh);
    expect(node.querySelector('a[href="/admin/content-health"]')).toHaveAttribute("aria-label", `${adminDashboardText.contentHealth.zh}: …`);
    await act(async () => onlineManager.setOnline(true)); await settle(); expect(node.textContent).toContain(adminDashboardText.emptyLeadsDescription.zh);
    expect(node.querySelector('a[href="/admin/content-health"]')).toHaveAttribute("aria-label", `${adminDashboardText.contentHealth.zh}: 0`);
  });
});

describe("site settings shared readiness", () => {
  it("reports paused first read while showing brand fallback and deduplicates all observers on recovery", async () => {
    onlineManager.setOnline(false); await render(BrandReadiness);
    expect(node.querySelector('[data-first="true"][data-second="true"]')).not.toBeNull(); expect(node.textContent).toBe(fallbackSiteSettings.brand_name);
    expect(mocks.settingsRead).not.toHaveBeenCalled(); expect(client.getQueryState(settingsKey)?.fetchStatus).toBe("paused");
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(mocks.settingsRead).toHaveBeenCalledOnce(); expect(node.querySelector('[data-first="false"][data-second="false"]')).not.toBeNull(); expect(node.textContent).toBe("Confirmed brand");
  });

  it("keeps cached branding nonblocking through paused and failed background reads", async () => {
    client.setQueryData(settingsKey, { ...fallbackSiteSettings, brand_name: "Cached brand" }, { updatedAt: 1 }); onlineManager.setOnline(false); await render(BrandReadiness);
    expect(client.getQueryState(settingsKey)?.fetchStatus).toBe("paused"); expect(node.querySelector('[data-first="false"][data-second="false"]')).not.toBeNull();
    mocks.settingsRead.mockRejectedValueOnce(new Error("Synthetic settings refresh failure")); await act(async () => onlineManager.setOnline(true)); await settle();
    expect(node.textContent).toBe("Cached brand"); expect(node.querySelector('[data-first="false"][data-second="false"]')).not.toBeNull();
  });
});
