import { act, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminBlogEditor from "@/pages/admin/AdminBlogEditor";
import { setAdminLang } from "@/lib/adminLocale";

const { savePost, checkSlug, previewPost, detail } = vi.hoisted(() => ({
  savePost: vi.fn(), checkSlug: vi.fn(), previewPost: vi.fn(),
  detail: { value: undefined as Record<string, unknown> | undefined },
}));
vi.mock("@/lib/adminBusinessContentQueries", () => ({
  useAdminBlogPostDetail: () => ({ data: detail.value, isLoading: false, isError: false }),
}));
vi.mock("@/backend/modules/blog/service/blogService", () => ({
  hasBlogBackendConfig: () => true,
  normalizeBlogSlug: (value: string) => value,
  checkAdminBlogSlugUnique: checkSlug,
  generateAdminBlogEnglish: vi.fn(),
  saveAdminBlogPost: savePost,
  previewAdminBlogPost: previewPost,
}));
vi.mock("@/components/admin/ImageField", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPermission", () => ({
  AdminActionButton: ({ children, onClick, disabled, action }: {
    children: ReactNode;
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
    disabled?: boolean;
    action: string;
  }) => <button onClick={onClick} disabled={disabled} data-action={action}>{children}</button>,
}));

describe("blog editor language changes", () => {
  afterEach(() => { detail.value = undefined; previewPost.mockReset(); setAdminLang("zh"); vi.unstubAllGlobals(); });

  it("validates unsaved input while the public link keeps the loaded published slug and language", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    const updatedAt = "2026-10-05T04:03:12.123456+00:00";
    detail.value = { id: "row-1", slug: "published-slug", status: "published", updated_at: updatedAt, version: 7 };
    previewPost.mockResolvedValue({ recordId: "row-1", expectedUpdatedAt: updatedAt, fieldCount: 2, warningCount: 0 });
    const container = document.createElement("div"); document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient();
    try {
      await act(async () => root.render(
        <MemoryRouter initialEntries={["/admin/blog/row-1"]}>
          <QueryClientProvider client={client}><TooltipProvider>
            <Routes><Route path="/admin/blog/:id" element={<AdminBlogEditor />} /></Routes>
          </TooltipProvider></QueryClientProvider>
        </MemoryRouter>,
      ));
      const openMore = async () => {
        const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="更多操作"], button[aria-label="More actions"]')!;
        expect(trigger).not.toBeNull();
        await act(async () => trigger.click());
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
        expect(dialog).not.toBeNull();
        return dialog;
      };
      const closeMore = async () => {
        const close = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find((button) => button.textContent === "关闭" || button.textContent === "Close")!;
        expect(close).not.toBeUndefined();
        await act(async () => close.click());
      };
      const publicLink = () => document.querySelector<HTMLAnchorElement>('[role="dialog"] a[target="_blank"]')!;
      await openMore();
      expect(publicLink().getAttribute("href")).toBe("/zh/blog/published-slug");
      expect(publicLink().textContent).toBe("打开已发布页面");
      await closeMore();
      const slug = container.querySelector<HTMLInputElement>('input[placeholder="例如：renovation-cost-kl"]')!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slug, "unsaved-slug");
        slug.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await openMore();
      expect(publicLink().getAttribute("href")).toBe("/zh/blog/published-slug");
      await closeMore();
      const preview = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "保存前预检（不写入）")!;
      await act(async () => preview.click());
      expect(previewPost).toHaveBeenCalledWith({ record: expect.objectContaining({ slug: "unsaved-slug", updated_at: updatedAt }) });
      await act(async () => setAdminLang("en"));
      await openMore();
      expect(publicLink().getAttribute("href")).toBe("/en/blog/published-slug");
      expect(publicLink().textContent).toBe("Open published page");
      await closeMore();
    } finally {
      await act(async () => root.unmount()); client.clear(); container.remove();
    }
  });

  it("does not present an unsaved draft as an already published page", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    detail.value = { id: "row-1", slug: "draft-slug", status: "draft", updated_at: "2026-10-05T04:03:12.123456+00:00" };
    const container = document.createElement("div"); const root = createRoot(container); const client = new QueryClient();
    try {
      await act(async () => root.render(
        <MemoryRouter initialEntries={["/admin/blog/row-1"]}><QueryClientProvider client={client}><TooltipProvider>
          <Routes><Route path="/admin/blog/:id" element={<AdminBlogEditor />} /></Routes>
        </TooltipProvider></QueryClientProvider></MemoryRouter>,
      ));
      expect(container.querySelector('a[target="_blank"]')).toBeNull();
    } finally {
      await act(async () => root.unmount()); client.clear(); container.remove();
    }
  });

  it("updates labels and translation guidance immediately without losing unsaved input", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient();
    try {
      await act(async () => root.render(
        <MemoryRouter initialEntries={["/admin/blog/new"]}>
          <QueryClientProvider client={client}>
            <TooltipProvider><AdminBlogEditor /></TooltipProvider>
          </QueryClientProvider>
        </MemoryRouter>,
      ));
      expect(container.textContent).toContain("新建博客文章");
      expect(container.textContent).toContain("英文未生成");
      const slug = container.querySelector<HTMLInputElement>('input[placeholder="例如：renovation-cost-kl"]');
      expect(slug).not.toBeNull();
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slug, "qa-unsaved-language-switch");
        slug!.dispatchEvent(new Event("input", { bubbles: true }));
      });

      await act(async () => setAdminLang("en"));
      expect(container.textContent).toContain("New blog post");
      expect(container.textContent).toContain("English content has not been generated");
      expect(container.textContent).toContain("Automatically generated English can be edited here");
      expect(container.textContent).not.toMatch(/[\u4e00-\u9fff]/);
      expect(container.querySelector<HTMLInputElement>('input[placeholder="Example: renovation-cost-kl"]')?.value)
        .toBe("qa-unsaved-language-switch");

      await act(async () => setAdminLang("zh"));
      expect(container.textContent).toContain("新建博客文章");
      expect(container.textContent).toContain("英文未生成");
      expect(container.querySelector<HTMLInputElement>('input[placeholder="例如：renovation-cost-kl"]')?.value)
        .toBe("qa-unsaved-language-switch");
    } finally {
      await act(async () => root.unmount());
      client.clear();
      container.remove();
    }
  });

  it("saves the selected archived status through the existing archive permission", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    checkSlug.mockResolvedValue(true);
    savePost.mockImplementation(async ({ record }) => ({ saved: record, savedId: "qa-local-record", slug: record.slug, status: record.status }));
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient();
    try {
      await act(async () => root.render(
        <MemoryRouter initialEntries={["/admin/blog/new"]}>
          <QueryClientProvider client={client}>
            <TooltipProvider><AdminBlogEditor /></TooltipProvider>
          </QueryClientProvider>
        </MemoryRouter>,
      ));
      const slug = container.querySelector<HTMLInputElement>('input[placeholder="例如：renovation-cost-kl"]')!;
      const status = container.querySelector("select")!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slug, "qa-archive-status");
        slug.dispatchEvent(new Event("input", { bubbles: true }));
        status.value = "archived";
        status.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const save = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "保存修改")!;
      expect(save.dataset.action).toBe("content.archive");
      await act(async () => save.click());
      expect(savePost).toHaveBeenCalledWith(expect.objectContaining({
        record: expect.objectContaining({ status: "archived", slug: "qa-archive-status" }),
        nextStatus: undefined,
      }));
    } finally {
      await act(async () => root.unmount());
      client.clear();
      container.remove();
      savePost.mockReset();
      checkSlug.mockReset();
    }
  });
});
