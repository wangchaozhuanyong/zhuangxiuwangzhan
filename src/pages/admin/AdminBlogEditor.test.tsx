import { act, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminBlogEditor from "@/pages/admin/AdminBlogEditor";
import { setAdminLang } from "@/lib/adminLocale";

const { savePost, checkSlug } = vi.hoisted(() => ({ savePost: vi.fn(), checkSlug: vi.fn() }));
vi.mock("@/lib/adminBusinessContentQueries", () => ({
  useAdminBlogPostDetail: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock("@/backend/modules/blog/service/blogService", () => ({
  hasBlogBackendConfig: () => true,
  normalizeBlogSlug: (value: string) => value,
  checkAdminBlogSlugUnique: checkSlug,
  generateAdminBlogEnglish: vi.fn(),
  saveAdminBlogPost: savePost,
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
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });

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
