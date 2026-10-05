import { act, type ButtonHTMLAttributes } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminCmsBuilder from "@/pages/admin/AdminCmsBuilder";
import { setAdminLang } from "@/lib/adminLocale";

const fixtures = vi.hoisted(() => ({
  pages: [
    { id: "page-a", page_key: "page-a", path: "/page-a", title_zh: "页面甲", status: "draft", sort_order: 10 },
    { id: "page-b", page_key: "page-b", path: "/page-b", title_zh: "页面乙", status: "published", sort_order: 20 },
  ],
  sections: [
    { id: "section-a", page_id: "page-a", section_key: "hero-a", section_type: "hero", title_zh: "模块甲", status: "draft", sort_order: 10, content_zh: {}, content_en: {}, settings: {} },
    { id: "section-b", page_id: "page-a", section_key: "hero-b", section_type: "hero", title_zh: "模块乙", status: "published", sort_order: 20, content_zh: {}, content_en: {}, settings: {} },
  ],
  empty: [],
  confirmNavigation: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/hooks/useInteractionQuery", () => ({
  useInteractionQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    data: queryKey[1] === "cms_pages" ? fixtures.pages : queryKey[1] === "cms_sections" && queryKey[2] === "page-a" ? fixtures.sections : fixtures.empty,
    error: null,
  }),
}));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("@/backend/modules/cms/service/cmsService", () => ({
  loadAdminCmsPages: vi.fn(), loadAdminCmsRevisions: vi.fn(), loadAdminCmsSections: vi.fn(), loadAdminCmsSectionTemplates: vi.fn(),
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
  });
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

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
});
