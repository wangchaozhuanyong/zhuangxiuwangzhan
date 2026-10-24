import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminHomeEditor from "./AdminHomeEditor";
import AdminAboutEditor from "./AdminAboutEditor";
import type { AdminAboutEditorData, AdminHomeEditorData } from "@/lib/adminEditorData";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAdminTableHelp } from "@/lib/adminHelpText";

const { readHome, readAbout, save, warn, malayFields } = vi.hoisted(() => ({ readHome: vi.fn(), readAbout: vi.fn(), save: vi.fn(), warn: vi.fn(), malayFields: vi.fn() }));
vi.mock("@/lib/adminEditorData", async (original) => ({
  ...await original<typeof import("@/lib/adminEditorData")>(),
  fetchAdminHomeEditorData: readHome,
  fetchAdminAboutEditorData: readAbout,
}));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: save, archiveOrDeleteAdminRecord: vi.fn(), formatAdminMutationError: () => "Save failed" }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: warn }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminHomeSectionVisibility", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminMalayFields", () => ({ default: (props: object) => { malayFields(props); return null; } }));
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
  readHome.mockReset(); readAbout.mockReset(); save.mockReset(); warn.mockReset(); malayFields.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("admin editors wait for a confirmed initial read", () => {
  it("exposes the home invitation editor through desktop tabs and the mobile picker", async () => {
    readHome.mockResolvedValue(homeData); await render(AdminHomeEditor);
    expect(container.querySelector('option[value="cta"]')).not.toBeNull();
    expect(Array.from(container.querySelectorAll('[role="tab"]')).some(tab => tab.textContent === "首页行动引导")).toBe(true);
  });
  it("explains that homepage hero media is editable while approved conversion buttons stay fixed", async () => {
    readHome.mockResolvedValue(homeData); await render(AdminHomeEditor);
    expect(container.textContent).toContain('首屏按钮固定使用 WhatsApp、案例和家具入口');
    expect(container.querySelector('a[href="/admin/content/hero_slides"]')).toHaveTextContent('管理首屏图片');
    expect(getAdminTableHelp('hero_slides')).toContain('第一条已发布记录的图片和替代文字');
    expect(getAdminTableHelp('hero_slides')).not.toContain('固定播放视频');
  });
  it("allows a confirmed empty about section to start as a draft and exposes its CTA editor", async () => {
    readAbout.mockResolvedValue({ sections: {}, ctaBlock: null });
    await render(AdminAboutEditor);
    const inputs = container.querySelectorAll<HTMLInputElement>('[role="tabpanel"] input');
    expect(inputs.length).toBeGreaterThan(1);
    expect(container.querySelector('option[value="cta"]')).not.toBeNull();
    expect(Array.from(container.querySelectorAll('[role="tab"]')).some(tab => tab.textContent === "关于我们行动引导区")).toBe(true);
    const title = inputs[1]!;
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(title, "新建合成标题"); title.dispatchEvent(new Event("input", { bubbles: true })); });
    save.mockResolvedValue({ id: "new-about-hero", section_key: "hero", title_zh: "新建合成标题", status: "draft" });
    await act(async () => button("保存此分区").click()); await settle();
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ table: "about_sections", id: undefined, payload: { section_key: "hero", title_zh: "新建合成标题", status: "draft" } });
  });
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

  it("creates a draft for a confirmed missing home statistics row", async () => {
    readHome.mockResolvedValue({ ...homeData, stats: null }); await render(AdminHomeEditor); selectHomeStats(); await settle();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector<HTMLSelectElement>('#home-stats-status')?.value).toBe('draft');
    save.mockResolvedValue({ id: 'new-stats', section_key: 'stats', status: 'draft', items_zh: [], items_en: [] });
    await act(async () => button("保存此分区").click()); await settle();
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ table: 'home_sections', id: undefined, expectedUpdatedAt: null, payload: { section_key: 'stats', status: 'draft' } });
  });

  it("publishes only the explicitly selected statistics status with its existing version", async () => {
    readHome.mockResolvedValue({ ...homeData, stats: { ...homeData.stats!, status: 'draft' } });
    save.mockResolvedValue({ ...homeData.stats!, status: 'published' });
    await render(AdminHomeEditor); selectHomeStats(); await settle();
    const picker = container.querySelector<HTMLSelectElement>('#home-stats-status')!;
    expect(picker).not.toBeNull();
    act(() => { picker.value = 'published'; picker.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => button("保存此分区").click()); await settle();
    expect(save.mock.calls[0][0]).toMatchObject({ id: 'confirmed-stats', expectedUpdatedAt: homeData.stats!.updated_at, payload: { section_key: 'stats', status: 'published' } });
  });

  it("offers Malay statistics fields using the shared item keys consumed by the public renderer", async () => {
    const item = { value: '987', label_zh: '中文指标', label_en: 'English metric', desc_zh: '中文说明', desc_en: 'English detail', icon: 'star' };
    readHome.mockResolvedValue({ ...homeData, stats: { ...homeData.stats!, items_zh: [item], items_en: [item] } });
    await render(AdminHomeEditor); selectHomeStats(); await settle();
    const props = malayFields.mock.calls.at(-1)![0];
    expect(props.record.items_en).toEqual([{ value: '987', label: 'English metric', desc: 'English detail', icon: 'star' }]);
    act(() => props.onChange({ items_ms: [{ value: '987', label: 'Metrik ujian', desc: 'Penerangan' }] }));
    save.mockResolvedValue({ ...homeData.stats!, items_ms: [{ value: '987', label: 'Metrik ujian', desc: 'Penerangan' }] });
    await act(async () => button('保存此分区').click()); await settle();
    expect(save.mock.calls[0][0].payload).toMatchObject({ items_ms: [{ value: '987', label: 'Metrik ujian', desc: 'Penerangan' }], items_en: [item], items_zh: [item] });
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


describe("about editor confirms exactly the submitted section", () => {
  it.each(["hero", "office"] as const)("preserves hidden bilingual items in %s", async key => {
    const row = { ...aboutData.sections.hero!, section_key: key, items_zh: ["保留原中文列表"], items_en: ["Keep existing English items"] };
    readAbout.mockResolvedValue({ sections: { [key]: row }, ctaBlock: null });
    save.mockResolvedValue(row);
    await render(AdminAboutEditor);
    const picker = container.querySelector("select")!;
    act(() => { picker.value = key; picker.dispatchEvent(new Event("change", { bubbles: true })); });
    await settle();
    await act(async () => button("保存此分区").click()); await settle();
    expect(save).toHaveBeenCalledOnce();
    const payload = save.mock.calls[0][0].payload;
    expect(payload).not.toHaveProperty("items_zh");
    expect(payload).not.toHaveProperty("items_en");
    expect(warn).toHaveBeenLastCalledWith(false);
  });

  it("stays pristine when the confirmed refresh normalizes submitted lists before save returns", async () => {
    const row = { ...aboutData.sections.hero!, section_key: "intro", items_zh: ["  原列表项目  "], items_en: [] };
    const saved = { ...row, items_zh: ["原列表项目"], updated_at: "2026-10-05T01:00:00Z" };
    const pending = deferred<typeof saved>();
    readAbout.mockResolvedValue({ sections: { intro: row }, ctaBlock: null });
    save.mockImplementation(async () => {
      client.setQueryData(["admin", "about_editor"], { sections: { intro: saved }, ctaBlock: null });
      return pending.promise;
    });
    await render(AdminAboutEditor);
    const picker = container.querySelector("select")!;
    act(() => { picker.value = "intro"; picker.dispatchEvent(new Event("change", { bubbles: true })); });
    await settle();
    await act(async () => button("保存此分区").click()); await settle();
    await act(async () => pending.resolve(saved)); await settle();
    expect(save.mock.calls[0][0].payload.items_zh).toEqual(["原列表项目"]);
    expect(warn).toHaveBeenLastCalledWith(false);
  });

  it("retains later input while confirming an earlier save", async () => {
    const pending = deferred<NonNullable<typeof aboutData.sections.hero>>();
    readAbout.mockResolvedValue(aboutData); save.mockReturnValue(pending.promise);
    await render(AdminAboutEditor);
    await act(async () => button("保存此分区").click());
    const input = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(item => item.value === "已确认标题")!;
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "保存期间新输入"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => pending.resolve({ ...aboutData.sections.hero!, updated_at: "2026-10-05T01:00:00Z" })); await settle();
    expect(input.value).toBe("保存期间新输入");
    expect(warn).toHaveBeenLastCalledWith(true);
  });
});
