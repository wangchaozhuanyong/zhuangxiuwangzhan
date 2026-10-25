import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { publicContentQueryKeys as keys } from "./publicContentQueryKeys";
import { withPublicDetailReuse } from "./publicDetailReuse";
import { INTERACTION_POLICY } from "./interactionPolicy";
import { furnitureCatalog } from "./furnitureCatalogPresentation";

const clients: QueryClient[] = [];
afterEach(() => { clients.forEach(client => client.clear()); clients.length = 0; });
const client = () => { const value = new QueryClient(); clients.push(value); return value; };

describe("complete public detail reuse", () => {
  it("shares a fresh full article between prefetch and the hook without another read", async () => {
    const cache = client(), article = { slug: "article", content: "Full body", title: "Title" };
    const at = Date.now() - 1500;
    cache.setQueryData(keys.blogPosts.key("en"), [article], { updatedAt: at });
    const read = vi.fn(async () => article);
    const options = withPublicDetailReuse(cache, { queryKey: keys.blogPost.key("article", "en"), queryFn: read });
    expect(options.initialData()).toBe(article);
    expect(options.initialDataUpdatedAt()).toBe(at);
    expect(await options.queryFn({ signal: new AbortController().signal })).toBe(article);
    expect(read).not.toHaveBeenCalled();
  });

  it.each(["summary", "expired", "invalidated-list", "invalidated-detail", "other-language"])("reads the real detail for %s data", async reason => {
    const cache = client(), detailKey = keys.blogPost.key("article", "en");
    const listKey = keys.blogPosts.key(reason === "other-language" ? "zh" : "en");
    cache.setQueryData(listKey, [{ slug: "article", content: reason === "summary" ? "  " : "Full body" }], { updatedAt: reason === "expired" ? Date.now() - INTERACTION_POLICY.publicStaleTime - 1 : Date.now() });
    if (reason === "invalidated-list") await cache.invalidateQueries({ queryKey: listKey });
    if (reason === "invalidated-detail") { cache.setQueryData(detailKey, null); await cache.invalidateQueries({ queryKey: detailKey }); }
    const read = vi.fn(async () => ({ slug: "article", content: "Actual detail" }));
    const options = withPublicDetailReuse(cache, { queryKey: detailKey, queryFn: read });
    expect(options.initialData()).toBeUndefined();
    await options.queryFn({ signal: new AbortController().signal });
    expect(read).toHaveBeenCalledOnce();
  });

  it("reuses the full baseline furniture catalog and its existing setting", async () => {
    const cache = client(), product = furnitureCatalog.products[0];
    cache.setQueryData(keys.furnitureCatalog.key("en"), [product]);
    const read = vi.fn(async () => product);
    const options = withPublicDetailReuse(cache, { queryKey: keys.furnitureProduct.key(product.slug, "en"), queryFn: read });
    expect(await options.queryFn({ signal: new AbortController().signal })).toBe(product);
    expect(read).not.toHaveBeenCalled();
  });

  it("does not confuse a managed furniture summary with a full gallery", async () => {
    const cache = client(), summary = { slug: "managed-chair", images: ["cover"] };
    cache.setQueryData(keys.furnitureCatalog.key("en"), [summary]);
    const read = vi.fn(async () => ({ ...summary, images: ["cover", "gallery"] }));
    await withPublicDetailReuse(cache, { queryKey: keys.furnitureProduct.key(summary.slug, "en"), queryFn: read }).queryFn({ signal: new AbortController().signal });
    expect(read).toHaveBeenCalledOnce();
  });
});
