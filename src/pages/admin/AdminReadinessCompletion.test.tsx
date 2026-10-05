import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import RouteReadFeedback from "@/components/RouteReadFeedback";
import { setAdminLang } from "@/lib/adminLocale";
import { buildAdminLeadReport } from "@/lib/adminLeadReports";
import { adminSimpleCmsText } from "@/i18n/adminSimpleCmsText";
import { adminEnglishCenterText } from "@/i18n/adminEnglishCenterText";
import { adminLeadReportsText } from "@/i18n/adminLeadReportsText";
import { adminUsersText } from "@/i18n/adminUsersText";
import { adminCmsBuilderText } from "@/i18n/adminCmsBuilderText";
import { adminDashboardText } from "@/i18n/adminDashboardText";
import { interactionText } from "@/i18n/interactionText";
import AdminSimpleCms from "./AdminSimpleCms";
import AdminEnglishCenter from "./AdminEnglishCenter";
import AdminLeadReports from "./AdminLeadReports";
import AdminUsers from "./AdminUsers";
import AdminCmsBuilder from "./AdminCmsBuilder";
import AdminDashboard from "./AdminDashboard";

// The components, observers, service composition, forms, permissions and shared
// recovery feedback are real. Repository reads and the Auth-context fixture are
// isolated from external systems; no login, MFA or persistence is performed.
const reads = vi.hoisted(() => ({
  simple: vi.fn(), health: vi.fn(), jobs: vi.fn(), users: vi.fn(), leads: vi.fn(), quotes: vi.fn(),
  pages: vi.fn(), sections: vi.fn(), templates: vi.fn(), revisions: vi.fn(), dashboard: vi.fn(), save: vi.fn(), generate: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/pages/admin/AdminAuthProvider", () => ({ useAdminAuth: () => ({ role: "super_admin", isSuperAdmin: true, userId: "synthetic-current-user" }) }));
vi.mock("@/backend/modules/cms/repository/cmsRepository", async (original) => ({
  ...await original<typeof import("@/backend/modules/cms/repository/cmsRepository")>(),
  fetchAdminSimpleCmsRows: reads.simple, fetchAdminCmsPages: reads.pages,
  fetchAdminCmsSections: reads.sections, fetchAdminCmsSectionTemplates: reads.templates, fetchAdminCmsRevisions: reads.revisions,
}));
vi.mock("@/backend/modules/cms/repository/contentHealthRepository", () => ({ fetchAdminContentHealthRows: reads.health }));
vi.mock("@/backend/modules/system/repository/adminSystemDataRepository", async (original) => ({
  ...await original<typeof import("@/backend/modules/system/repository/adminSystemDataRepository")>(),
  fetchAdminUserRows: reads.users, fetchTranslationJobRows: reads.jobs, fetchTranslationLabelRows: vi.fn(async () => []),
}));
vi.mock("@/backend/modules/leads/repository/leadRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/leads/repository/leadRepository")>(), fetchAdminLeadReportRows: reads.leads }));
vi.mock("@/backend/modules/quotes/repository/quoteRepository", async (original) => ({ ...await original<typeof import("@/backend/modules/quotes/repository/quoteRepository")>(), fetchAdminQuoteReportRows: reads.quotes }));
vi.mock("@/backend/modules/system/repository/dashboardRepository", () => ({ fetchAdminDashboardStatsData: reads.dashboard }));
vi.mock("@/lib/adminMutation", async (original) => ({ ...await original<typeof import("@/lib/adminMutation")>(), saveAdminRecord: reads.save }));
vi.mock("@/backend/modules/system/service/translationService", () => ({ generateAdminEnglishContent: reads.generate }));

const page = { id: "page-a", page_key: "page-a", path: "/page-a", title_zh: "已确认页面", title_en: "Confirmed page", status: "draft", sort_order: 10, updated_at: "2026-10-05T01:02:03.123456Z" };
const section = { id: "section-a", page_id: page.id, section_key: "rich-text-a", section_type: "rich_text", title_zh: "已确认模块", status: "draft", sort_order: 10, updated_at: page.updated_at, content_zh: {}, content_en: {}, settings: {} };
const revision = { id: "revision-a", entity_table: "cms_sections", entity_id: section.id, action: "update", version: 4, snapshot: {}, created_at: "2026-10-05T01:02:03.000000Z" };
const simpleKey = ["admin", "faqs", "rows"];
const usersKey = ["admin", "users"];
const reportKey = ["admin", "lead-report", { period: "90d", language: "zh" }];
const pagesKey = ["admin", "cms_pages"];
const sectionsKey = ["admin", "cms_sections", page.id];
const jobsKey = ["admin", "translation_jobs", { limit: 100 }];
const healthKey = ["admin", "content_health"];
const revisionsKey = (ids: string[]) => ["admin", "cms_revisions", page.id, { sectionIds: ids }];
const listCases = [
  { name: "SimpleCMS", node: <AdminSimpleCms module="faqs" />, key: simpleKey, read: reads.simple, empty: adminSimpleCmsText.zh.emptyList, cached: [{ id: "faq-a", question_zh: "已确认问题", status: "draft", updated_at: page.updated_at }], visible: "已确认问题" },
  { name: "Users", node: <AdminUsers />, key: usersKey, read: reads.users, empty: adminUsersText.zh.empty, cached: [{ user_id: "fixture-user", email: "fixture@example.invalid", role: "content_editor", active: true }], visible: "fixture@example.invalid" },
  { name: "LeadReports", node: <AdminLeadReports />, key: reportKey, read: reads.leads, empty: adminLeadReportsText.zh.empty, cached: buildAdminLeadReport({ leads: [{ id: "lead-a", status: "new", source_path: "/fixture", created_at: new Date().toISOString() }], quotes: [], period: "90d", language: "zh" }), visible: adminLeadReportsText.zh.totals.submitted },
];
let client: QueryClient, root: Root, container: HTMLDivElement;
async function settle() { for (let i = 0; i < 4; i += 1) await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function mount(node: ReactNode) {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><TooltipProvider>{node}<RouteReadFeedback surface="admin" /></TooltipProvider></MemoryRouter></QueryClientProvider>));
  await settle();
}
async function reconnect() { await act(async () => onlineManager.setOnline(true)); await settle(); }
function cardValue(label: string) {
  const labelElement = Array.from(container.querySelectorAll("p")).find((node) => node.textContent === label);
  expect(labelElement, `Expected summary card ${label}`).toBeDefined();
  return labelElement!.nextElementSibling?.textContent;
}
function button(label: string) {
  const element = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((node) => node.textContent?.trim() === label);
  expect(element, `Expected button ${label}`).toBeDefined(); return element!;
}
async function edit(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const prototype = input instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); setAdminLang("zh"); onlineManager.setOnline(true);
  for (const read of Object.values(reads)) read.mockReset().mockResolvedValue([]);
  reads.dashboard.mockResolvedValue({ counts: { todayLeads: 7 }, recentLeads: [], recentQuotes: [] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); onlineManager.setOnline(true); vi.unstubAllGlobals(); });

describe("first unresolved Admin reads", () => {
  it.each(listCases)("$name pauses without claiming empty, then shows confirmed empty", async (testCase) => {
    onlineManager.setOnline(false); await mount(testCase.node);
    expect(client.getQueryState(testCase.key)?.fetchStatus).toBe("paused"); expect(testCase.read).not.toHaveBeenCalled();
    expect(container.querySelector('[role="status"][aria-busy="true"]')).not.toBeNull(); expect(container.textContent).not.toContain(testCase.empty);
    await reconnect(); expect(testCase.read).toHaveBeenCalled(); expect(container.textContent).toContain(testCase.empty);
  });
  it.each(listCases)("$name first error is recoverable rather than empty", async (testCase) => {
    testCase.read.mockRejectedValueOnce(new Error("Synthetic initial read failure")); await mount(testCase.node);
    expect(client.getQueryState(testCase.key)?.status).toBe("error"); expect(container.textContent).not.toContain(testCase.empty);
    expect(container.textContent).toContain(interactionText.zh.loadingFailed);
    await act(async () => button(interactionText.zh.retry).click()); await settle(); expect(container.textContent).toContain(testCase.empty);
  });
  it.each(listCases)("$name keeps confirmed data through paused and failed background reads", async (testCase) => {
    client.setQueryData(testCase.key, testCase.cached, { updatedAt: 1 }); onlineManager.setOnline(false); await mount(testCase.node);
    expect(client.getQueryState(testCase.key)?.fetchStatus).toBe("paused"); expect(container.textContent).toContain(testCase.visible); expect(container.textContent).not.toContain(testCase.empty);
    testCase.read.mockRejectedValueOnce(new Error("Synthetic background failure")); await reconnect();
    expect(client.getQueryState(testCase.key)?.status).toBe("error"); expect(container.textContent).toContain(testCase.visible); expect(container.textContent).not.toContain(testCase.empty);
  });
  it("keeps independent SimpleCMS and User creation inputs usable while lists are paused", async () => {
    onlineManager.setOnline(false); await mount(<><AdminSimpleCms module="faqs" /><AdminUsers /></>);
    expect(button(adminSimpleCmsText.zh.save)).not.toBeDisabled(); expect(button(adminUsersText.zh.saveAdmin)).not.toBeDisabled();
    const input = container.querySelector<HTMLInputElement>('input[placeholder="admin@example.com"]')!;
    await edit(input, "draft@example.invalid"); await reconnect(); expect(input.value).toBe("draft@example.invalid"); expect(reads.save).not.toHaveBeenCalled();
  });
});

describe("independent English and source-level health confirmation", () => {
  it("does not turn either initial paused reader into zero statistics or completion", async () => {
    onlineManager.setOnline(false); await mount(<AdminEnglishCenter />);
    expect(client.getQueryState(healthKey)?.fetchStatus).toBe("paused"); expect(client.getQueryState(jobsKey)?.fetchStatus).toBe("paused");
    expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("…"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("…");
    expect(container.textContent).not.toContain(adminEnglishCenterText.noMissingEnglish.zh);
    await reconnect(); expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("0"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("0");
    expect(container.textContent).toContain(adminEnglishCenterText.noMissingEnglish.zh);
  });
  it.each(["health", "jobs"] as const)("a confirmed sibling does not confirm the unresolved %s reader", async (waiting) => {
    let resolveRead!: (rows: []) => void; const pending = new Promise<[]>((resolve) => { resolveRead = resolve; }); reads[waiting].mockReturnValue(pending);
    await mount(<AdminEnglishCenter />);
    expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe(waiting === "health" ? "…" : "0");
    expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe(waiting === "jobs" ? "…" : "0");
    if (waiting === "health") expect(container.textContent).not.toContain(adminEnglishCenterText.noMissingEnglish.zh);
    await act(async () => resolveRead([])); await settle(); expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("0"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("0");
  });
  it("keeps job statistics unknown on first error and retries through shared recovery", async () => {
    reads.jobs.mockRejectedValueOnce(new Error("Synthetic jobs failure")); await mount(<AdminEnglishCenter />);
    expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("…"); expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("0");
    await act(async () => button(interactionText.zh.retry).click()); await settle(); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("0");
  });
  it("actual source fallback errors are incomplete health rather than confirmed all-English", async () => {
    reads.health.mockImplementation(async (table: string) => { if (table === "faqs") throw new Error("Synthetic one source failure"); return []; });
    await mount(<AdminEnglishCenter />); expect(client.getQueryState(healthKey)?.status).toBe("success");
    expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("…"); expect(cardValue(adminEnglishCenterText.batchAvailable.zh)).toBe("…");
    expect(container.textContent).toContain(interactionText.zh.loadingFailed); expect(container.textContent).not.toContain(adminEnglishCenterText.noMissingEnglish.zh);
  });
  it("does not send English generation for actual source-error placeholder identities", async () => {
    reads.health.mockImplementation(async (table: string) => { if (table === "services") throw new Error("Synthetic unread source"); return []; }); await mount(<AdminEnglishCenter />);
    expect(client.getQueryState(healthKey)?.status).toBe("success"); expect(container.textContent).toContain(interactionText.zh.loadingFailed);
    expect(container.textContent).not.toContain(adminEnglishCenterText.noMissingEnglish.zh); expect(button(adminEnglishCenterText.batchGenerateMissing.zh)).toBeDisabled();
    expect(Array.from(container.querySelectorAll("button")).some((node) => node.textContent === adminEnglishCenterText.autoGenerate.zh)).toBe(false);
    expect(reads.generate).not.toHaveBeenCalled();
  });
  it("keeps known real single and batch targets unchanged alongside an unread source", async () => {
    reads.health.mockImplementation(async (table: string) => {
      if (table === "services") throw new Error("Synthetic unread source");
      return table === "projects" ? [{ id: "known-project", title_zh: "已确认案例", status: "draft" }] : [];
    }); await mount(<AdminEnglishCenter />); expect(button(adminEnglishCenterText.autoGenerate.zh)).not.toBeDisabled();
    await act(async () => button(adminEnglishCenterText.autoGenerate.zh).click()); await settle();
    expect(reads.generate).toHaveBeenCalledExactlyOnceWith({ table: "projects", id: "known-project", force: false });
    await act(async () => button(adminEnglishCenterText.batchGenerateMissing.zh).click()); await settle();
    expect(reads.generate).toHaveBeenCalledTimes(2); expect(reads.generate.mock.calls[1]![0]).toEqual({ table: "projects", id: "known-project", force: false });
    expect(reads.generate.mock.calls.every(([args]) => !String(args.id).endsWith("-error"))).toBe(true); expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("…");
  });
  it("retains independently confirmed English counters during offline refresh and a failed jobs refresh", async () => {
    reads.health.mockImplementation(async (table: string) => table === "services" ? [{ id: "service-a", title_zh: "已确认服务", status: "draft" }] : []);
    reads.jobs.mockResolvedValue([{ id: "job-a", table_name: null, record_id: null, status: "failed" }]); await mount(<AdminEnglishCenter />);
    expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("1"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("1");
    onlineManager.setOnline(false); await act(async () => { void client.invalidateQueries({ queryKey: healthKey }); void client.invalidateQueries({ queryKey: jobsKey }); }); await settle();
    expect(client.getQueryState(healthKey)?.fetchStatus).toBe("paused"); expect(client.getQueryState(jobsKey)?.fetchStatus).toBe("paused");
    expect(cardValue(adminEnglishCenterText.missingEnglishContent.zh)).toBe("1"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("1"); expect(container.textContent).toContain("已确认服务");
    reads.jobs.mockRejectedValueOnce(new Error("Synthetic jobs refresh failure")); await reconnect();
    expect(client.getQueryState(jobsKey)?.status).toBe("error"); expect(cardValue(adminEnglishCenterText.failedRecords.zh)).toBe("1"); expect(container.textContent).toContain("已确认服务");
  });
  it("Dashboard preserves main counters while source fallback makes health unknown, then confirmed empty becomes zero", async () => {
    reads.health.mockRejectedValue(new Error("Synthetic source failure")); await mount(<AdminDashboard />);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 930)); }); await settle();
    expect(client.getQueryState(healthKey)?.status).toBe("success"); expect(cardValue(adminDashboardText.contentHealth.zh)).toBe("…");
    expect(cardValue(adminDashboardText.publishCenter.zh)).toBe("…"); expect(cardValue(adminDashboardText.englishCenter.zh)).toBe("…");
    expect(client.getQueryData(["admin", "dashboard", "stats"])).toMatchObject({ counts: { todayLeads: 7 } });
    reads.health.mockResolvedValue([]); await act(async () => { await client.invalidateQueries({ queryKey: healthKey }); }); await settle();
    expect(cardValue(adminDashboardText.contentHealth.zh)).toBe("0"); expect(cardValue(adminDashboardText.publishCenter.zh)).toBe("0"); expect(cardValue(adminDashboardText.englishCenter.zh)).toBe("0");
  });
  it("Dashboard keeps confirmed health and main counters when a background read pauses", async () => {
    await mount(<AdminDashboard />); await act(async () => { await new Promise((resolve) => setTimeout(resolve, 930)); }); await settle();
    expect(cardValue(adminDashboardText.contentHealth.zh)).toBe("0"); onlineManager.setOnline(false);
    await act(async () => { void client.invalidateQueries({ queryKey: healthKey }); }); await settle();
    expect(client.getQueryState(healthKey)?.fetchStatus).toBe("paused"); expect(cardValue(adminDashboardText.contentHealth.zh)).toBe("0");
    expect(cardValue(adminDashboardText.publishCenter.zh)).toBe("0"); expect(client.getQueryData(["admin", "dashboard", "stats"])).toMatchObject({ counts: { todayLeads: 7 } });
  });
});

describe("CMS lists and confirmed revision entity dependencies", () => {
  it("does not report absent pages/sections/revisions for initial paused or new disabled reads", async () => {
    onlineManager.setOnline(false); await mount(<AdminCmsBuilder />);
    expect(client.getQueryState(pagesKey)?.fetchStatus).toBe("paused"); expect(reads.sections).not.toHaveBeenCalled(); expect(reads.revisions).not.toHaveBeenCalled();
    for (const key of ["noPages", "noSections", "noRevisions"] as const) expect(container.textContent).not.toContain(adminCmsBuilderText[key].zh);
    expect(button(adminCmsBuilderText.newPageButton.zh)).not.toBeDisabled(); await act(async () => button(adminCmsBuilderText.newPageButton.zh).click());
    const keyInput = container.querySelector<HTMLInputElement>("#cms-page-page_key")!; await edit(keyInput, "independent-draft"); await reconnect();
    expect(keyInput.value).toBe("independent-draft"); expect(container.textContent).toContain(adminCmsBuilderText.noPages.zh); expect(reads.revisions).not.toHaveBeenCalled();
  });
  it("shows paused sections without false empty and permits an independent new section", async () => {
    client.setQueryData(pagesKey, [page]); onlineManager.setOnline(false); await mount(<AdminCmsBuilder />);
    expect(client.getQueryState(sectionsKey)?.fetchStatus).toBe("paused"); expect(reads.revisions).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain(adminCmsBuilderText.noSections.zh); expect(container.textContent).not.toContain(adminCmsBuilderText.noRevisions.zh);
    await act(async () => button(adminCmsBuilderText.newSectionButton.zh).click());
    expect(container.querySelector("#cms-section-section_key")).not.toBeNull(); expect(container.querySelector("#cms-section-section_key")).not.toBeDisabled();
    await reconnect(); expect(container.textContent).toContain(adminCmsBuilderText.noSections.zh); expect(container.textContent).toContain(adminCmsBuilderText.noRevisions.zh);
  });
  it.each(["pages", "sections", "revisions"] as const)("first %s errors are not absent records", async (kind) => {
    reads.pages.mockResolvedValue([page]); reads[kind].mockRejectedValueOnce(new Error("Synthetic CMS read failure")); await mount(<AdminCmsBuilder />);
    const emptyKey = kind === "pages" ? "noPages" : kind === "sections" ? "noSections" : "noRevisions";
    expect(container.textContent).not.toContain(adminCmsBuilderText[emptyKey].zh); expect(container.textContent).toContain(interactionText.zh.loadingFailed);
    if (kind === "sections") expect(reads.revisions).not.toHaveBeenCalled();
  });
  it("waits for delayed sections and reads section-only revisions with the real service", async () => {
    let resolveSections!: (rows: typeof section[]) => void; reads.pages.mockResolvedValue([page]);
    reads.sections.mockReturnValue(new Promise<typeof section[]>((resolve) => { resolveSections = resolve; }));
    reads.revisions.mockImplementation(async (ids: string[]) => ids.includes(section.id) ? [revision] : []); await mount(<AdminCmsBuilder />);
    expect(reads.revisions).not.toHaveBeenCalled(); expect(container.textContent).not.toContain(adminCmsBuilderText.noRevisions.zh);
    await act(async () => resolveSections([section])); await settle();
    expect(reads.revisions).toHaveBeenCalledOnce(); expect(reads.revisions.mock.calls[0]![0]).toEqual([page.id, section.id]);
    expect(container.textContent).toContain("cms_sections · update · v4"); expect(container.textContent).not.toContain(adminCmsBuilderText.noRevisions.zh);
  });
  it("re-reads on added/deleted entity IDs, retains prefix invalidation and ignores harmless order changes", async () => {
    reads.pages.mockResolvedValue([page]); reads.sections.mockResolvedValue([section]); await mount(<AdminCmsBuilder />);
    expect(reads.revisions).toHaveBeenCalledOnce(); const added = { ...section, id: "section-b" };
    await act(async () => client.setQueryData(sectionsKey, [added, section])); await settle(); expect(reads.revisions).toHaveBeenCalledTimes(2);
    expect(reads.revisions.mock.calls[1]![0]).toEqual([page.id, added.id, section.id]);
    await act(async () => client.setQueryData(sectionsKey, [section, added])); await settle(); expect(reads.revisions).toHaveBeenCalledTimes(2);
    await act(async () => client.setQueryData(sectionsKey, [added])); await settle(); expect(reads.revisions).toHaveBeenCalledTimes(3); expect(reads.revisions.mock.calls[2]![0]).toEqual([page.id, added.id]);
    await act(async () => { await client.invalidateQueries({ queryKey: ["admin", "cms_revisions", page.id] }); }); await settle(); expect(reads.revisions).toHaveBeenCalledTimes(4);
  });
  it("confirmed empty sections still read page revisions", async () => {
    reads.pages.mockResolvedValue([page]); reads.revisions.mockResolvedValue([{ ...revision, entity_table: "cms_pages", entity_id: page.id }]); await mount(<AdminCmsBuilder />);
    expect(reads.revisions.mock.calls[0]![0]).toEqual([page.id]); expect(container.textContent).toContain("cms_pages · update · v4"); expect(container.textContent).not.toContain(adminCmsBuilderText.noRevisions.zh);
  });
  it("keeps cached page/sections/revisions and dirty page text through paused/failed refresh", async () => {
    client.setQueryData(pagesKey, [page], { updatedAt: 1 }); client.setQueryData(sectionsKey, [section], { updatedAt: 1 }); client.setQueryData(revisionsKey([section.id]), [revision], { updatedAt: 1 });
    onlineManager.setOnline(false); await mount(<AdminCmsBuilder />); const title = container.querySelector<HTMLInputElement>("#cms-page-title_zh")!; await edit(title, "未提交页面草稿");
    reads.pages.mockRejectedValueOnce(new Error("Synthetic cms_pages background failure")); reads.sections.mockRejectedValueOnce(new Error("Synthetic sections background failure")); reads.revisions.mockRejectedValueOnce(new Error("Synthetic revisions background failure")); await reconnect();
    expect(title.value).toBe("未提交页面草稿"); expect(container.textContent).toContain(section.title_zh); expect(container.textContent).toContain("cms_sections · update · v4"); expect(reads.save).not.toHaveBeenCalled();
  });
});
