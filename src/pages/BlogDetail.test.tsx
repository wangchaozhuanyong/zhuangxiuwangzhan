import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import BlogDetail from "./BlogDetail";

const state = vi.hoisted(() => ({
  post: undefined as Record<string, unknown> | null | undefined,
  posts: [] as Record<string, unknown>[],
  pending: true,
  error: false,
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedBlogPostBySlug: () => ({ data: state.post, isPending: state.pending, isError: state.error, isInitialError: state.error, isFetching: state.pending, refetch: vi.fn() }),
  usePublishedBlogPosts: () => ({ data: state.posts }),
}));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://wa.me/601128853888" }) }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null, JsonLdBlogPosting: () => null }));

const summary = {
  id: "article-loading-check", slug: "article-loading-check", title: "装修交付检查",
  excerpt: "逐项检查装修交付细节", content: "", category: "budget-quotation",
  date: "2026-09-30", readTime: "2 min", image: "", tags: [],
};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const render = () => act(() => root.render(
  <MemoryRouter initialEntries={["/zh/blog/article-loading-check"]}>
    <PublicChromeProvider isAdminRoute={false} routeKey="article-loading-check">
      <Routes><Route path="/:lang/blog/:slug" element={<BlogDetail />} /></Routes>
    </PublicChromeProvider>
  </MemoryRouter>,
));
beforeEach(() => {
  state.post = undefined;
  state.posts = [];
  state.pending = true;
  state.error = false;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe("article loading presentation", () => {
  it("uses a page skeleton with an accessible status instead of the old text page", () => {
    render();
    expect(container.querySelector(".blog-loading-page")).toHaveAttribute("data-route-pending", "true");
    expect(container.querySelector(".blog-loading-page .sr-only")).toHaveTextContent("正在准备文章内容");
    expect(container.querySelector(".forest-state-page")).toBeNull();
    expect(container.querySelector("h1")).toBeNull();
  });

  it("keeps the clicked title and cover layout while a summary waits for its body", () => {
    state.posts = [summary];
    render();
    expect(container.querySelector("h1")).toHaveTextContent(summary.title);
    expect(container.querySelector(".blog-loading-page")).toBeNull();
    expect(container.querySelector(".blog-editorial-article")).toHaveAttribute("data-route-pending", "true");
    expect(container.querySelector(".blog-content-loading")).not.toBeNull();

    state.pending = false;
    state.post = { ...summary, content: "<h2>交付资料</h2><p>核对图纸和交付清单。</p>" };
    render();
    expect(container.querySelector("h1")).toHaveTextContent(summary.title);
    expect(container.querySelector(".blog-content-loading")).toBeNull();
    expect(container.querySelector(".blog-editorial-article")).toHaveTextContent("核对图纸和交付清单。");
    expect(container.querySelector(".blog-editorial-article")).not.toHaveAttribute("data-route-pending");
  });

  it("shows retry when the body request fails instead of keeping a summary forever", () => {
    state.posts = [summary];
    state.pending = false;
    state.error = true;
    render();
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("文章暂时无法载入");
    expect(container.querySelector('button')).toHaveTextContent("重新加载");
  });

  it("does not resurrect a missing article from the cached listing", () => {
    state.posts = [summary];
    state.post = null;
    state.pending = false;
    render();
    expect(container.querySelector("h1")).toHaveTextContent("文章不存在");
  });

  it("keeps a complete cached article when a background refresh fails", () => {
    state.post = { ...summary, content: "<p>已缓存的完整正文。</p>" };
    state.pending = false;
    state.error = true;
    render();
    expect(container.querySelector(".blog-editorial-article")).toHaveTextContent("已缓存的完整正文。");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
