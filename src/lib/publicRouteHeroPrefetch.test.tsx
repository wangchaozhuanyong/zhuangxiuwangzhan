import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchemeARouteHero } from "@/components/scheme-a/SchemeARoutePrimitives";
import { publicContentQueries } from "./publicContentQueries";
import { mapSitePageRows } from "./homeContentApi";
import { pageHeroImages, resolvePageHeroImage } from "./pageHeroImages";
import { prefetchPublishedRouteContent } from "./publicRoutePrefetch";
import { prefetchPublicRouteHero, publicRouteHeroPreloads } from "./publicRouteHeroPrefetch";
import { furnitureListingHeroImage } from "./routeHeroImage";

vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: ReactNode }) => <section>{children}</section> }));

const remote = "https://fixture.supabase.co/storage/v1/object/public/media/current-hero.webp?revision=2";
const prefetchLinks = () => [...document.head.querySelectorAll<HTMLLinkElement>('link[data-public-hero-prefetch]')];

afterEach(() => {
  prefetchLinks().forEach(link => link.remove());
  vi.restoreAllMocks();
});

describe("intended route hero transfer", () => {
  it.each(["services", "projects", "materials"] as const)("matches the actual %s picture candidates for fallback, local CMS, remote CMS and absolute static sources", pageKey => {
    for (const published of [null, "/images/heroes/v5/hero-about-v5-desktop.webp", remote, "https://flashcast.com.my/images/heroes/v5/hero-about-v5-desktop.webp"]) {
      const image = resolvePageHeroImage(published, pageHeroImages[pageKey]);
      const markup = renderToStaticMarkup(<SchemeARouteHero kind="listing" image={image.desktop} imageSourceWidth={image.desktopWidth}
        mobileImage={image.mobile} mobileImageSourceWidth={image.mobileWidth} tabletImage={image.tablet} tabletImageSourceWidth={image.tabletWidth}
        imageAlt="Current hero" label="Directory" title="Directory" description="Current content" />);
      const doc = new DOMParser().parseFromString(markup, "text/html");
      const preloads = publicRouteHeroPreloads(`/en/${pageKey}`, { image_url: published });
      expect(preloads).toHaveLength(3);
      const sources = [...doc.querySelectorAll("picture source")];
      sources.forEach((source, index) => {
        expect(preloads[index].srcSet || preloads[index].href).toBe(source.getAttribute("srcset"));
        expect(preloads[index].sizes).toBe(source.getAttribute("sizes"));
        expect(preloads[index].media).toBe(source.getAttribute("media"));
      });
      const img = doc.querySelector("img")!;
      expect(preloads[2].href).toBe(img.getAttribute("src"));
      expect(preloads[2].srcSet || null).toBe(img.getAttribute("srcset"));
      expect(preloads[2].sizes || null).toBe(img.getAttribute("sizes"));
    }
  });

  it("does not guess a CMS hero before its page configuration has succeeded", () => {
    expect(publicRouteHeroPreloads("/zh/services")).toEqual([]);
    expect(publicRouteHeroPreloads("/en/projects")).toEqual([]);
    expect(publicRouteHeroPreloads("/en/materials")).toEqual([]);
    expect(publicRouteHeroPreloads("/en/materials", null)).toHaveLength(3);
  });

  it.each(["/en/furniture", "/zh/furniture/bedroom", "/en/furniture/living/sofa"])("warms the actual furniture listing hero without loading a catalog for %s", path => {
    const markup = renderToStaticMarkup(<SchemeARouteHero {...furnitureListingHeroImage} imageAlt="Furniture" label="Furniture" title="Furniture" description="Furniture" />);
    const img = new DOMParser().parseFromString(markup, "text/html").querySelector("img")!;
    const [preload] = publicRouteHeroPreloads(path);
    expect(preload.href).toBe(img.getAttribute("src"));
    expect(preload.srcSet).toBe(img.getAttribute("srcset"));
    expect(preload.sizes).toBe(img.getAttribute("sizes"));
    expect(preload.media).toBeUndefined();
  });

  it.each(["/admin", "/furniture", "/services", "/en/services/kitchen", "/en/furniture/product/chair", "/en/blog", "/en/materials/category/wood"])("adds no extra image to an unrelated or detail route %s", path => {
    expect(publicRouteHeroPreloads(path, { image_url: remote })).toEqual([]);
  });

  it("deduplicates an existing document preload and does not create image-ready evidence", () => {
    const ready = vi.fn();
    window.addEventListener("public-route-ready", ready);
    try {
      prefetchPublicRouteHero("/zh/services", { image_url: remote });
      expect(prefetchLinks()).toHaveLength(3);
      prefetchLinks().forEach(link => link.removeAttribute("data-public-hero-prefetch"));
      prefetchPublicRouteHero("/zh/services", { image_url: remote });
      expect(prefetchLinks()).toHaveLength(0);
      expect(document.head.querySelectorAll('link[rel="preload"][as="image"]')).toHaveLength(3);
      expect(document.querySelector("img[data-image-state], [data-decoded-src]")).toBeNull();
      expect(ready).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("public-route-ready", ready);
      document.head.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => link.remove());
    }
  });

  it("keeps speculative links bounded while allowing a changed CMS image to warm", () => {
    for (let index = 0; index < 8; index++) prefetchPublicRouteHero("/en/services", { image_url: `${remote}&version=${index}` });
    expect(prefetchLinks()).toHaveLength(12);
    expect(prefetchLinks().some(link => link.href.includes("version=7"))).toBe(true);
    expect(prefetchLinks().every(link => link.getAttribute("fetchpriority") === "low")).toBe(true);
  });

  it("allows a failed speculative transfer to retry on later intent", () => {
    prefetchPublicRouteHero("/en/furniture");
    const first = prefetchLinks()[0];
    first.dispatchEvent(new Event("error"));
    expect(prefetchLinks()).toHaveLength(0);
    prefetchPublicRouteHero("/en/furniture");
    expect(prefetchLinks()).toHaveLength(1);
    expect(prefetchLinks()[0]).not.toBe(first);
  });

  it("starts the furniture hero before the catalog registration or read finishes", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let finishCatalog!: (value: []) => void;
    const catalog = new Promise<[]>(resolve => { finishCatalog = resolve; });
    vi.spyOn(publicContentQueries, "furnitureCatalog").mockReturnValue({
      queryKey: ["published", "furniture_catalog", "en"], queryFn: () => catalog,
    });
    const completed = vi.fn();
    const prefetch = prefetchPublishedRouteContent(client, "/en/furniture", "en").then(completed);
    try {
      expect(prefetchLinks()).toHaveLength(1);
      expect(prefetchLinks()[0].href).toContain("furniture-showcase-wide.webp");
      expect(completed).not.toHaveBeenCalled();
    } finally {
      finishCatalog([]);
      await prefetch;
      client.clear();
    }
  });

  it("starts the CMS hero transfer when configuration finishes while the services listing is still pending", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let finishPage!: (value: ReturnType<typeof mapSitePageRows>) => void;
    let finishList!: (value: []) => void;
    const page = new Promise<ReturnType<typeof mapSitePageRows>>(resolve => { finishPage = resolve; });
    const list = new Promise<[]>(resolve => { finishList = resolve; });
    vi.spyOn(publicContentQueries, "sitePage").mockReturnValue({ queryKey: ["published", "site_page", "zh", "services"], queryFn: () => page });
    vi.spyOn(publicContentQueries, "services").mockReturnValue({ queryKey: ["published", "services", "zh"], queryFn: () => list });
    const completed = vi.fn();
    const prefetch = prefetchPublishedRouteContent(client, "/zh/services", "zh").then(completed);
    try {
      expect(prefetchLinks()).toHaveLength(0);
      finishPage(mapSitePageRows({ site_pages: [{ image_url: remote }] }, "zh"));
      await vi.waitFor(() => expect(prefetchLinks()).toHaveLength(3));
      expect(prefetchLinks().every(link => link.href.includes("current-hero.webp"))).toBe(true);
      expect(completed).not.toHaveBeenCalled();
    } finally {
      finishList([]);
      await prefetch;
      client.clear();
    }
  });

  it("uses successful cached configuration but never preloads a guessed fallback after a failed configuration read", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const pageKey = ["published", "site_page", "en", "services"];
    const pageRead = vi.fn().mockRejectedValue(new Error("Unavailable"));
    vi.spyOn(publicContentQueries, "sitePage").mockReturnValue({ queryKey: pageKey, queryFn: pageRead });
    vi.spyOn(publicContentQueries, "services").mockReturnValue({ queryKey: ["published", "services", "en"], queryFn: async () => [] });
    try {
      await prefetchPublishedRouteContent(client, "/en/services", "en");
      expect(prefetchLinks()).toHaveLength(0);
      client.setQueryData(pageKey, mapSitePageRows({ site_pages: [{ image_url: remote }] }, "en"));
      await prefetchPublishedRouteContent(client, "/en/services", "en");
      expect(prefetchLinks()).toHaveLength(3);
      expect(pageRead).toHaveBeenCalledOnce();
    } finally {
      client.clear();
    }
  });
});
