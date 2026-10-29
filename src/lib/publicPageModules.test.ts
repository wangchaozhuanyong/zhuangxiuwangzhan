import { afterEach, describe, expect, it, vi } from "vitest";
import { createPublicPageLoader, publicPageModules } from "./publicPageModules";
import { getPublicPageName, prefetchPublicPageModule } from "./publicPagePrefetch";

afterEach(() => vi.restoreAllMocks());

describe("public page module loading", () => {
  it.each(["zh", "en", "ms"])("recognizes the cabinet page in %s", lang => {
    expect(getPublicPageName(`/${lang}/custom-cabinets`)).toBe("CustomCabinets");
  });
  it("shares an intended page with navigation and waits for its canonical styles", async () => {
    const module = { default: () => null };
    let finishStyles: () => void;
    const loadPage = vi.fn(async () => module);
    const loadStyles = vi.fn(() => new Promise<void>((resolve) => { finishStyles = resolve; }));
    const load = createPublicPageLoader(loadPage, loadStyles);
    expect(loadPage).not.toHaveBeenCalled();

    const prefetch = load();
    const navigation = load();
    expect(navigation).toBe(prefetch);
    const ready = vi.fn();
    void navigation.then(ready);
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    finishStyles!();
    await expect(navigation).resolves.toBe(module);
    await expect(load()).resolves.toBe(module);
    expect(loadPage).toHaveBeenCalledOnce();
    expect(loadStyles).toHaveBeenCalledOnce();
  });

  it.each(["page", "styles"])("does not poison normal navigation after speculative %s loading fails", async (failed) => {
    const module = { default: () => null };
    const loadPage = vi.fn(async () => module);
    const loadStyles = vi.fn(async () => undefined);
    const error = new Error("temporary transfer failure");
    if (failed === "page") loadPage.mockRejectedValueOnce(error);
    else loadStyles.mockRejectedValueOnce(error);
    const load = createPublicPageLoader(loadPage, loadStyles);

    await expect(load()).rejects.toBe(error);
    await expect(load()).resolves.toBe(module);
    expect(loadPage).toHaveBeenCalledTimes(2);
    expect(loadStyles).toHaveBeenCalledTimes(2);
  });

  it("warms only the intended module, leaving all other page loaders idle", async () => {
    const service = vi.spyOn(publicPageModules, "ServiceDetail").mockResolvedValue({ default: () => null });
    const projects = vi.spyOn(publicPageModules, "Projects").mockResolvedValue({ default: () => null });
    const home = vi.spyOn(publicPageModules, "Index").mockResolvedValue({ default: () => null });
    await prefetchPublicPageModule("/ms/services/kitchen");
    await prefetchPublicPageModule("/admin");
    expect(service).toHaveBeenCalledOnce();
    expect(projects).not.toHaveBeenCalled();
    expect(home).not.toHaveBeenCalled();
  });
});

describe("public page destinations", () => {
  it.each([
    ["", "Index"], ["about", "About"], ["services", "Services"], ["services/kitchen", "ServiceDetail"],
    ["services/old-house", "OldHouseRenovation"], ["materials", "Materials"], ["materials/wood", "MaterialDetail"],
    ["materials/category/floor", "MaterialCategoryPage"], ["materials/category/floor/vinyl", "MaterialSubcategoryPage"],
    ["furniture", "FurnitureShowcase"], ["furniture/bedroom", "FurnitureShowcase"],
    ["furniture/bedroom/beds", "FurnitureShowcase"], ["furniture/product/chair", "FurnitureProductDetail"],
    ["products", "Materials"], ["products/wood", "MaterialDetail"], ["promotions", "Promotions"],
    ["projects", "Projects"], ["projects/condo", "ProjectDetail"], ["before-after", "BeforeAfter"],
    ["process", "Process"], ["faq", "FAQ"], ["contact", "Contact"], ["quote", "Quote"],
    ["blog", "Blog"], ["blog/renovation", "BlogDetail"], ["locations", "Locations"], ["locations/kl", "LocationPage"],
    ["landing/custom-campaign", "LandingPage"], ["landing/office-renovation", "ServiceDetail"],
    ["landing/old-house-renovation", "OldHouseRenovation"], ["privacy", "Privacy"], ["terms", "Terms"],
    ["custom/page", "CmsDynamicPage"], ["services/a/b", "CmsDynamicPage"], ["constructor", "CmsDynamicPage"],
  ])("matches %s for every supported language", (path, page) => {
    for (const language of ["zh", "en", "ms"]) {
      expect(getPublicPageName(`/${language}/${path}`)).toBe(page);
    }
  });

  it("does not prefetch admin, unprefixed, or unsupported-language paths", () => {
    for (const path of ["/", "/admin", "/admin/projects", "/services", "/de/services"]) {
      expect(getPublicPageName(path)).toBeNull();
    }
  });
});
