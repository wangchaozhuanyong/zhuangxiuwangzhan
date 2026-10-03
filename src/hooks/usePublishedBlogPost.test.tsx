import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPublishedBlogPostBySlug } from "@/lib/contentApi";
import { usePublishedBlogPostBySlug } from "./usePublishedContent";

vi.mock("@/lib/contentApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/contentApi")>(),
  getPublishedBlogPostBySlug: vi.fn(),
}));

const completePost = {
  id: "cached-article", slug: "cached-article", title: "已发布文章", excerpt: "文章摘要",
  content: "<h2>正文标题</h2><p>完整文章内容</p>", category: "budget-quotation",
  date: "2026-09-30", readTime: "2 min", image: "", tags: [],
};
const listKey = ["published", "blog", "zh"];
let client: QueryClient;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let result: ReturnType<typeof usePublishedBlogPostBySlug>;

const Probe = ({ language }: { language: "en" | "zh" }) => {
  result = usePublishedBlogPostBySlug("cached-article", language);
  return <div>{result.data?.content}</div>;
};
const render = async (language: "en" | "zh" = "zh") => {
  await act(async () => root.render(<QueryClientProvider client={client}><Probe language={language} /></QueryClientProvider>));
};

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(getPublishedBlogPostBySlug).mockReset();
  vi.mocked(getPublishedBlogPostBySlug).mockImplementation(() => new Promise(() => {}));
});
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); });

describe("blog list to article cache reuse", () => {
  it("opens a fresh complete article immediately without a duplicate request", async () => {
    client.setQueryData(listKey, [completePost]);
    await render();
    expect(result.isPending).toBe(false);
    expect(result.data).toEqual(completePost);
    expect(getPublishedBlogPostBySlug).not.toHaveBeenCalled();
  });

  it("preserves the list freshness timestamp and refreshes an old article", async () => {
    const updatedAt = Date.now() - 120_000;
    client.setQueryData(listKey, [completePost], { updatedAt });
    await render();
    expect(result.data).toEqual(completePost);
    expect(result.dataUpdatedAt).toBe(updatedAt);
    expect(getPublishedBlogPostBySlug).toHaveBeenCalledWith("cached-article", "zh", expect.anything());
  });

  it("fetches the body when the list contains only an Edge preload summary", async () => {
    client.setQueryData(listKey, [{ ...completePost, content: "" }]);
    await render();
    expect(result.isPending).toBe(true);
    expect(result.data).toBeUndefined();
    expect(getPublishedBlogPostBySlug).toHaveBeenCalledOnce();
  });

  it("does not reuse content from another language", async () => {
    client.setQueryData(listKey, [completePost]);
    await render("en");
    expect(result.data).toBeUndefined();
    expect(getPublishedBlogPostBySlug).toHaveBeenCalledWith("cached-article", "en", expect.anything());
  });

  it("does not reuse a different article", async () => {
    client.setQueryData(listKey, [{ ...completePost, slug: "other-article" }]);
    await render();
    expect(result.data).toBeUndefined();
    expect(getPublishedBlogPostBySlug).toHaveBeenCalledOnce();
  });

  it("honors invalidation after content publication", async () => {
    client.setQueryData(listKey, [completePost]);
    await client.invalidateQueries({ queryKey: listKey });
    await render();
    expect(result.data).toBeUndefined();
    expect(getPublishedBlogPostBySlug).toHaveBeenCalledOnce();
  });
});
