import { act, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminBlogEditor from "@/pages/admin/AdminBlogEditor";
import AdminProjectEditor from "@/pages/admin/AdminProjectEditor";
import AdminServiceEditor from "@/pages/admin/AdminServiceEditor";
import AdminMaterialEditor from "@/pages/admin/AdminMaterialEditor";
import { setAdminLang } from "@/lib/adminLocale";

const fixtures = vi.hoisted(() => ({
  record: { id: "local-editor-record", slug: "local-editor-record", status: "published", title_zh: "本地测试", title_en: "Existing English title" },
  save: vi.fn(),
  publishService: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@/lib/adminBusinessContentQueries", () => {
  const detail = () => ({ data: fixtures.record, isLoading: false, isInitialError: false });
  return { useAdminBlogPostDetail: detail, useAdminProjectDetail: detail, useAdminServiceDetail: detail, useAdminMaterialDetail: detail };
});
vi.mock("@/backend/modules/blog/service/blogService", () => ({
  hasBlogBackendConfig: () => true,
  normalizeBlogSlug: (value: string) => value,
  checkAdminBlogSlugUnique: async () => true,
  generateAdminBlogEnglish: vi.fn(),
  saveAdminBlogPost: fixtures.save,
}));
vi.mock("@/backend/modules/projects/service/projectService", () => ({
  hasProjectBackendConfig: () => true,
  normalizeProjectSlug: (value: string) => value,
  checkAdminProjectSlugUnique: async () => true,
  generateAdminProjectEnglish: vi.fn(),
  saveAdminProject: fixtures.save,
}));
vi.mock("@/backend/modules/services/service/serviceService", () => ({
  hasServiceBackendConfig: () => true,
  normalizeServiceSlug: (value: string) => value,
  checkAdminServiceSlugUnique: async () => true,
  generateAdminServiceEnglish: vi.fn(),
  saveAdminService: fixtures.save,
  publishAdminService: fixtures.publishService,
}));
vi.mock("@/backend/modules/materials/service/materialService", () => ({
  hasMaterialBackendConfig: () => true,
  normalizeMaterialSlug: (value: string) => value,
  checkAdminMaterialSlugUnique: async () => true,
  generateAdminMaterialEnglish: vi.fn(),
  saveAdminMaterial: fixtures.save,
}));
vi.mock("@/components/admin/AdminConfirmProvider", () => ({ adminConfirm: fixtures.confirm }));
vi.mock("@/components/admin/ImageField", () => ({ default: () => null }));
vi.mock("@/pages/admin/AdminProjectImages", () => ({ default: () => null }));
vi.mock("@/pages/admin/AdminMaterialImages", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPermission", () => ({
  AdminActionButton: ({ children, action, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { action: string }) =>
    <button {...props} data-action={action}>{children}</button>,
}));
vi.mock("@/components/admin/AdminStickyActionBar", () => ({
  default: ({ left, right, more, mobileSticky }: { left?: ReactNode; right?: ReactNode; more?: ReactNode; mobileSticky?: boolean }) =>
    <div data-mobile-sticky={mobileSticky}><div>{left}</div><div data-primary-actions>{right}</div><div data-more-actions>{more}</div></div>,
}));

const editors = [
  { path: "projects", Component: AdminProjectEditor, saveLabel: "转为草稿", expectedStatus: "draft", savePermission: "content.write" },
  { path: "materials", Component: AdminMaterialEditor, saveLabel: "转为草稿", expectedStatus: "draft", savePermission: "content.write" },
  { path: "services", Component: AdminServiceEditor, saveLabel: "转为草稿", expectedStatus: "draft", savePermission: "content.write" },
  { path: "blog", Component: AdminBlogEditor, saveLabel: "保存修改", expectedStatus: undefined, savePermission: "content.publish" },
] as const;

async function mountEditor(editor: typeof editors[number]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const client = new QueryClient();
  const { Component, path } = editor;
  await act(async () => root.render(
    <MemoryRouter initialEntries={[`/admin/${path}/${fixtures.record.id}`]}>
      <QueryClientProvider client={client}><TooltipProvider>
        <Routes><Route path={`/admin/${path}/:id`} element={<Component />} /></Routes>
      </TooltipProvider></QueryClientProvider>
    </MemoryRouter>,
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

describe("mobile editor action behavior", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    fixtures.confirm.mockResolvedValue(true);
    const saved = ({ record, nextStatus }: { record: typeof fixtures.record; nextStatus?: string }) =>
      Promise.resolve({ saved: { ...record, status: nextStatus ?? record.status }, savedId: record.id, slug: record.slug, status: nextStatus ?? record.status });
    fixtures.save.mockImplementation(saved);
    fixtures.publishService.mockImplementation(saved);
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(editors)("$path retains its original save status and permission", async (editor) => {
    const view = await mountEditor(editor);
    try {
      const actions = view.container.querySelector("[data-primary-actions]")!;
      const buttons = actions.querySelectorAll("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe(editor.saveLabel);
      expect(buttons[0].dataset.action).toBe(editor.savePermission);
      expect(buttons[1].textContent).toBe("更新发布内容");
      expect(view.container.querySelector("[data-more-actions]")?.textContent).toContain("预览");
      expect(view.container.querySelector("[data-mobile-sticky]")?.getAttribute("data-mobile-sticky")).toBe("true");
      await act(async () => buttons[0].click());
      expect(fixtures.save).toHaveBeenCalledWith(expect.objectContaining({
        record: expect.objectContaining({ status: "published" }),
        nextStatus: editor.expectedStatus,
      }));
      expect(fixtures.publishService).not.toHaveBeenCalled();
    } finally { await view.cleanup(); }
  });

  it.each(editors)("$path keeps its existing publish path and confirmation behavior", async (editor) => {
    const view = await mountEditor(editor);
    try {
      const publish = view.container.querySelectorAll<HTMLButtonElement>("[data-primary-actions] button")[1];
      await act(async () => publish.click());
      const target = editor.path === "services" ? fixtures.publishService : fixtures.save;
      expect(target).toHaveBeenCalledWith(expect.objectContaining({ nextStatus: "published" }));
      expect(fixtures.confirm).toHaveBeenCalledTimes(editor.path === "services" ? 1 : 0);
      if (editor.path === "services") expect(fixtures.save).not.toHaveBeenCalled();
    } finally { await view.cleanup(); }
  });

  it("keeps English inputs mounted and retains edits when hidden and shown", async () => {
    const view = await mountEditor(editors[3]);
    try {
      const input = Array.from(view.container.querySelectorAll<HTMLInputElement>("input")).find((field) => field.value === "Existing English title")!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Unsaved English title");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const toggle = () => view.container.querySelector<HTMLButtonElement>("[data-more-actions] button[aria-expanded]")!;
      await act(async () => toggle().click());
      expect(input.isConnected).toBe(true);
      expect(input.closest("[hidden]")).not.toBeNull();
      await act(async () => toggle().click());
      expect(input.isConnected).toBe(true);
      expect(input.closest("[hidden]")).toBeNull();
      expect(input.value).toBe("Unsaved English title");
      expect(fixtures.save).not.toHaveBeenCalled();
    } finally { await view.cleanup(); }
  });
});
