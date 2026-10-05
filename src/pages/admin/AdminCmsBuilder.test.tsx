import { act, type ButtonHTMLAttributes } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminCmsBuilder from "@/pages/admin/AdminCmsBuilder";
import { setAdminLang } from "@/lib/adminLocale";
import { getPublicSyncIssues, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";

const fixtures = vi.hoisted(() => ({
  pages: [
    { id: "page-a", page_key: "page-a", path: "/page-a", title_zh: "页面甲", status: "draft", sort_order: 10 },
    { id: "page-b", page_key: "page-b", path: "/page-b", title_zh: "页面乙", status: "published", sort_order: 20 },
  ],
  sections: [
    { id: "section-a", page_id: "page-a", section_key: "hero-a", section_type: "hero", title_zh: "模块甲", status: "draft", sort_order: 10, updated_at: "2026-10-05T00:00:00.000001Z", content_zh: {}, content_en: {}, settings: {} },
    { id: "section-b", page_id: "page-a", section_key: "hero-b", section_type: "hero", title_zh: "模块乙", status: "published", sort_order: 20, updated_at: "2026-10-05T00:00:00.000002Z", content_zh: {}, content_en: {}, settings: {} },
  ],
  empty: [],
  confirmNavigation: vi.fn(),
  save: vi.fn(),
  loadSections: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/hooks/useInteractionQuery", async () => {
  const { useQueryClient } = await import("@tanstack/react-query");
  const { useSyncExternalStore } = await import("react");
  return {
    useInteractionQuery: ({ queryKey }: { queryKey: unknown[] }) => {
      const client = useQueryClient();
      const cached = useSyncExternalStore(
        (listener) => client.getQueryCache().subscribe(listener),
        () => client.getQueryData(queryKey),
      );
      return {
        data: cached ?? (queryKey[1] === "cms_pages" ? fixtures.pages : queryKey[1] === "cms_sections" && queryKey[2] === "page-a" ? fixtures.sections : fixtures.empty),
        error: null, isFetching: false,
        refetch: async () => {
          const result = await fixtures.refetch();
          if (result.isSuccess) client.setQueryData(queryKey, result.data);
          return result;
        },
      };
    },
  };
});
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("@/backend/modules/cms/service/cmsService", () => ({
  loadAdminCmsPages: vi.fn(), loadAdminCmsRevisions: vi.fn(), loadAdminCmsSections: fixtures.loadSections, loadAdminCmsSectionTemplates: vi.fn(),
}));
vi.mock("@/lib/adminMutation", () => ({
  saveAdminRecord: fixtures.save,
  archiveOrDeleteAdminRecord: vi.fn(),
  formatAdminMutationError: (error: unknown) => String(error),
}));
vi.mock("@/lib/navigationProtection", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/navigationProtection")>(),
  confirmProtectedNavigation: fixtures.confirmNavigation,
}));
vi.mock("@/pages/admin/AdminCmsSectionContentEditor", () => ({ SectionContentEditor: () => null }));
vi.mock("@/components/admin/AdminPermission", () => ({
  useAdminPermission: () => ({ allowed: true, reason: "" }),
  AdminPermissionHint: () => null,
  AdminActionButton: ({ children, action, size: _size, variant: _variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { action: string; size?: string; variant?: string }) =>
    <button {...props} data-action={action}>{children}</button>,
}));

async function mountBuilder() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const client = new QueryClient();
  await act(async () => root.render(
    <QueryClientProvider client={client}><TooltipProvider><AdminCmsBuilder /></TooltipProvider></QueryClientProvider>,
  ));
  return {
    container,
    client,
    async cleanup() {
      await act(async () => root.unmount());
      client.clear();
      container.remove();
    },
  };
}

async function selectValue(select: HTMLSelectElement, value: string) {
  await act(async () => { select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); });
}
async function editValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("CMS compact mobile selectors", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    fixtures.confirmNavigation.mockResolvedValue(true);
    fixtures.save.mockImplementation(async ({ payload, id }) => ({ ...payload, id }));
    fixtures.loadSections.mockResolvedValue(fixtures.sections);
    fixtures.refetch.mockResolvedValue({ isSuccess: true, data: fixtures.sections });
  });
  afterEach(() => {
    for (const issue of getPublicSyncIssues()) resolvePublicSyncIssue(issue.key);
    vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals();
  });

  it("keeps page edits when a selector change is cancelled and changes page only after approval", async () => {
    const view = await mountBuilder();
    try {
      const select = view.container.querySelector<HTMLSelectElement>("#admin-cms-current-page")!;
      const pageKey = view.container.querySelector<HTMLInputElement>("input")!;
      await editValue(pageKey, "unsaved-page-key");
      fixtures.confirmNavigation.mockResolvedValueOnce(false);
      await selectValue(select, "page-b");
      expect(select.value).toBe("page-a");
      expect(pageKey.value).toBe("unsaved-page-key");
      await selectValue(select, "page-b");
      expect(select.value).toBe("page-b");
      expect(pageKey.value).toBe("page-b");
      expect(fixtures.confirmNavigation).toHaveBeenCalledTimes(2);
      expect(fixtures.save).not.toHaveBeenCalled();
    } finally { await view.cleanup(); }
  });

  it("preserves dirty module inputs when a module change is cancelled", async () => {
    const view = await mountBuilder();
    try {
      const select = view.container.querySelector<HTMLSelectElement>("#admin-cms-current-section")!;
      await selectValue(select, "section-a");
      const sectionKey = Array.from(view.container.querySelectorAll<HTMLInputElement>("input")).find((input) => input.value === "hero-a")!;
      await editValue(sectionKey, "unsaved-section-key");
      fixtures.confirmNavigation.mockResolvedValueOnce(false);
      await selectValue(select, "section-b");
      expect(select.value).toBe("section-a");
      expect(sectionKey.value).toBe("unsaved-section-key");
      await selectValue(select, "section-b");
      expect(select.value).toBe("section-b");
      expect(sectionKey.value).toBe("hero-b");
      expect(fixtures.confirmNavigation).toHaveBeenCalledTimes(2);
      expect(fixtures.save).not.toHaveBeenCalled();
    } finally { await view.cleanup(); }
  });

  it("keeps the original up/down reorder controls inside the expandable directory", async () => {
    const view = await mountBuilder();
    try {
      const toggle = view.container.querySelector<HTMLButtonElement>('[aria-controls="admin-cms-section-directory"]')!;
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      await act(async () => toggle.click());
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      const down = view.container.querySelector<HTMLButtonElement>('#admin-cms-section-directory button[aria-label="模块下移"]')!;
      expect(down).not.toBeNull();
      await act(async () => down.click());
      expect(fixtures.save).toHaveBeenCalledWith(expect.objectContaining({
        table: "cms_sections", id: "section-a", payload: expect.objectContaining({ sort_order: 20 }), action: "section_reorder",
      }));
      const options = Array.from(view.container.querySelector<HTMLSelectElement>("#admin-cms-current-section")!.options).slice(1);
      expect(options.map((option) => option.value)).toEqual(["section-b", "section-a"]);
    } finally { await view.cleanup(); }
  });

  it("uses the confirmed server order and versions after a partial write, then retries only remaining changes", async () => {
    const confirmed = [fixtures.sections[0], { ...fixtures.sections[1], sort_order: 10, updated_at: "new-version" }];
    fixtures.save.mockResolvedValueOnce(confirmed[1]).mockRejectedValueOnce(new Error("conflict"));
    fixtures.loadSections.mockResolvedValueOnce(confirmed);
    const view = await mountBuilder();
    try {
      await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-controls="admin-cms-section-directory"]')!.click());
      await act(async () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!.click());
      expect(fixtures.save).toHaveBeenCalledTimes(2);
      expect(fixtures.loadSections).toHaveBeenCalledWith("page-a");
      expect(view.client.getQueryData(["admin", "cms_sections", "page-a"])).toEqual(confirmed);
      expect(view.container.textContent).toContain("排序未全部保存，已重新读取当前顺序");
      await act(async () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!.click());
      expect(fixtures.save).toHaveBeenCalledTimes(3);
      expect(fixtures.save).toHaveBeenLastCalledWith(expect.objectContaining({ id: "section-a", payload: expect.objectContaining({ sort_order: 20 }) }));
    } finally { await view.cleanup(); }
  });

  it("blocks another reorder until an explicit readback succeeds", async () => {
    fixtures.save.mockRejectedValueOnce(new Error("write failed"));
    fixtures.loadSections.mockRejectedValueOnce(new Error("read failed"));
    const view = await mountBuilder();
    try {
      await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-controls="admin-cms-section-directory"]')!.click());
      await act(async () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!.click());
      const down = () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!;
      expect(down().disabled).toBe(true);
      await act(async () => down().click());
      expect(fixtures.save).toHaveBeenCalledTimes(1);
      const reload = () => Array.from(view.container.querySelectorAll("button")).find((button) => button.textContent === "重新读取模块顺序")!;
      fixtures.refetch.mockResolvedValueOnce({ isSuccess: false });
      await act(async () => reload().click());
      expect(down().disabled).toBe(true);
      fixtures.refetch.mockResolvedValueOnce({ isSuccess: true, data: fixtures.sections });
      await act(async () => reload().click());
      expect(down().disabled).toBe(false);
      expect(reload()).toBeUndefined();
      expect(fixtures.save).toHaveBeenCalledTimes(1);
    } finally { await view.cleanup(); }
  });

  it("retains a successful save when refresh fails and retries delivery without another write", async () => {
    const view = await mountBuilder();
    try {
      const invalidate = vi.spyOn(view.client, "invalidateQueries").mockRejectedValueOnce(new Error("offline"));
      await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-controls="admin-cms-section-directory"]')!.click());
      await act(async () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!.click());
      expect(view.container.textContent).toContain("模块顺序已保存");
      expect(fixtures.save).toHaveBeenCalledTimes(2);
      const issue = getPublicSyncIssues().find((item) => item.key === "cms-section-order:page-a")!;
      expect(issue).toBeDefined();
      await act(async () => issue.retry());
      expect(fixtures.save).toHaveBeenCalledTimes(2);
      expect(invalidate).toHaveBeenCalledTimes(6);
      expect(getPublicSyncIssues()).toEqual([]);
    } finally { await view.cleanup(); }
  });

  it("advances the open editor's own saved version while preserving unsaved content", async () => {
    const rows = new Map(fixtures.sections.map((section) => [section.id, { ...section }]));
    fixtures.save.mockImplementation(async ({ id, payload, expectedUpdatedAt }) => {
      const current = rows.get(id)!;
      if (expectedUpdatedAt !== current.updated_at) throw new Error("stale editor version");
      const saved = { ...current, ...payload, id, updated_at: `${current.updated_at}:next` };
      rows.set(id, saved);
      return saved;
    });
    const view = await mountBuilder();
    try {
      await selectValue(view.container.querySelector<HTMLSelectElement>("#admin-cms-current-section")!, "section-a");
      await editValue(view.container.querySelector<HTMLInputElement>("#cms-section-title_zh")!, "尚未保存的内容");
      await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-controls="admin-cms-section-directory"]')!.click());
      await act(async () => view.container.querySelector<HTMLButtonElement>('button[aria-label="模块下移"]')!.click());
      expect(view.container.querySelector<HTMLInputElement>("#cms-section-title_zh")!.value).toBe("尚未保存的内容");
      const save = Array.from(view.container.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim() === "保存模块")!;
      expect(save).toBeDefined();
      await act(async () => save.click());
      expect(fixtures.save).toHaveBeenCalledTimes(3);
      expect(fixtures.save).toHaveBeenLastCalledWith(expect.objectContaining({
        id: "section-a", expectedUpdatedAt: "2026-10-05T00:00:00.000001Z:next",
        payload: expect.objectContaining({ title_zh: "尚未保存的内容", sort_order: 20 }),
      }));
      expect(rows.get("section-a")!.title_zh).toBe("尚未保存的内容");
    } finally { await view.cleanup(); }
  });

  it("explicitly associates page and section labels with their existing controls", async () => {
    const view = await mountBuilder();
    try {
      await selectValue(view.container.querySelector<HTMLSelectElement>("#admin-cms-current-section")!, "section-a");
      const labels = Array.from(view.container.querySelectorAll<HTMLLabelElement>('label[for^="cms-"]'));
      expect(labels.map((label) => label.htmlFor)).toEqual([
        "cms-page-page_key", "cms-page-path", "cms-page-title_zh", "cms-page-title_en", "cms-page-status", "cms-page-sort_order",
        "cms-page-seo_title_zh", "cms-page-seo_title_en", "cms-page-seo_description_zh", "cms-page-seo_description_en", "cms-page-seo_keywords_zh", "cms-page-seo_keywords_en",
        "cms-section-section_key", "cms-section-section_type", "cms-section-title_zh", "cms-section-title_en", "cms-section-status", "cms-section-sort_order", "cms-section-settings",
      ]);
      for (const label of labels) {
        expect(label.control).not.toBeNull();
        expect(["INPUT", "SELECT", "TEXTAREA"]).toContain(label.control!.tagName);
      }
      expect(new Set(labels.map((label) => label.htmlFor)).size).toBe(labels.length);
    } finally { await view.cleanup(); }
  });
});
