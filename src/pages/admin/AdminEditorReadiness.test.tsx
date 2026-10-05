import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminHomeEditor from "./AdminHomeEditor";
import AdminAboutEditor from "./AdminAboutEditor";
import type { AdminAboutEditorData, AdminHomeEditorData } from "@/lib/adminEditorData";
import { TooltipProvider } from "@/components/ui/tooltip";

const { readHome, readAbout, save } = vi.hoisted(() => ({ readHome: vi.fn(), readAbout: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/adminEditorData", async (original) => ({
  ...await original<typeof import("@/lib/adminEditorData")>(),
  fetchAdminHomeEditorData: readHome,
  fetchAdminAboutEditorData: readAbout,
}));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: save, archiveOrDeleteAdminRecord: vi.fn(), formatAdminMutationError: () => "Save failed" }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminHomeSectionVisibility", () => ({ default: () => null }));
vi.mock("@/components/admin/ImageField", () => ({ default: () => null }));
vi.mock("@/lib/adminLocale", async (original) => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => "zh" }));

const homeData: AdminHomeEditorData = {
  stats: { id: "confirmed-stats", section_key: "stats", updated_at: "2026-10-05T00:00:00Z", items_zh: [{ value: "8", label_zh: "已确认指标" }], items_en: [] },
  why: null, brandPartnersVisibility: null, processSteps: [], faqRows: [], ctaBlock: null,
};
const aboutData: AdminAboutEditorData = {
  sections: { hero: { id: "confirmed-hero", section_key: "hero", title_zh: "已确认标题", updated_at: "2026-10-05T00:00:00Z" } },
  ctaBlock: null,
};
let root: Root;
let client: QueryClient;
let container: HTMLDivElement;
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function render(Page: ComponentType) {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><TooltipProvider><Page /></TooltipProvider></MemoryRouter></QueryClientProvider>));
  await settle();
}
function button(label: string) { return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(item => item.textContent?.trim() === label)!; }
function selectHomeStats() {
  const picker = container.querySelector("select")!;
  act(() => { picker.value = "stats"; picker.dispatchEvent(new Event("change", { bubbles: true })); });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  readHome.mockReset(); readAbout.mockReset(); save.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("admin editors wait for a confirmed initial read", () => {
  it.each([
    ["home", AdminHomeEditor, readHome, homeData],
    ["about", AdminAboutEditor, readAbout, aboutData],
  ] as const)("keeps %s editing unavailable during pending and failed reads, then restores after retry", async (_name, Page, read, data) => {
    const pending = deferred<typeof data>(); read.mockReturnValueOnce(pending.promise);
    await render(Page);
    expect(container.querySelector('[role="status"]')).toHaveTextContent("正在加载内容");
    expect(container.querySelector("input, textarea, select")).toBeNull();
    expect(save).not.toHaveBeenCalled();
    await act(async () => pending.resolve(data)); await settle();
    expect(container.querySelector("select")).not.toBeNull();
    await act(async () => root.unmount()); client.clear(); root = createRoot(container);
    read.mockRejectedValueOnce(new Error("Read failed")); await render(Page);
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("内容加载失败");
    expect(container.querySelector("input, textarea, select")).toBeNull();
    read.mockResolvedValueOnce(data);
    await act(async () => button("重试").click()); await settle();
    expect(container.querySelector("select")).not.toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it("initializes home statistics with its confirmed record and keeps a later draft after failed refresh", async () => {
    const pending = deferred<AdminHomeEditorData>(); readHome.mockReturnValueOnce(pending.promise);
    await render(AdminHomeEditor);
    expect(container.textContent).not.toContain("新增条目");
    await act(async () => pending.resolve(homeData)); await settle(); selectHomeStats(); await settle();
    const input = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(item => item.value === "8")!;
    expect(input).toBeDefined();
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "9"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    readHome.mockRejectedValueOnce(new Error("Refresh failed"));
    await act(async () => { await client.refetchQueries({ queryKey: ["admin", "home_editor"] }); }); await settle();
    expect(input.value).toBe("9");
    save.mockResolvedValue({ ...homeData.stats, items_zh: [{ value: "9", label_zh: "已确认指标" }], items_en: [{ value: "9", label_zh: "已确认指标" }] });
    await act(async () => button("保存此分区").click()); await settle();
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ id: "confirmed-stats", expectedUpdatedAt: homeData.stats!.updated_at, payload: { items_zh: [{ value: "9" }] } });
  });

  it("keeps successful missing home rows distinct from an initial read failure", async () => {
    readHome.mockResolvedValue({ ...homeData, stats: null }); await render(AdminHomeEditor); selectHomeStats(); await settle();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await act(async () => button("保存此分区").click());
    expect(save).not.toHaveBeenCalled();
  });

  it("uses the confirmed about record for editing and preserves input after failed refresh", async () => {
    readAbout.mockResolvedValueOnce(aboutData); await render(AdminAboutEditor);
    const input = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(item => item.value === "已确认标题")!;
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "尚未提交标题"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    readAbout.mockRejectedValueOnce(new Error("Refresh failed"));
    await act(async () => { await client.refetchQueries({ queryKey: ["admin", "about_editor"] }); }); await settle();
    expect(input.value).toBe("尚未提交标题");
    save.mockResolvedValue({ ...aboutData.sections.hero, title_zh: "尚未提交标题" });
    await act(async () => button("保存此分区").click()); await settle();
    expect(save.mock.calls[0][0]).toMatchObject({ id: "confirmed-hero", expectedUpdatedAt: aboutData.sections.hero!.updated_at, payload: { title_zh: "尚未提交标题" } });
  });
});
