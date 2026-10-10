import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PageMeta from "./PageMeta";

const state = vi.hoisted(() => {
  vi.stubEnv("VITE_SITE_URL", "https://flashcast.com.my");
  return {
    language: "zh" as "en" | "zh",
    settings: { brand_name: "FLASH CAST", company_name: "FLASH CAST SDN. BHD.", og_image_url: "https://example.com/default.webp", updated_at: "current" },
  };
});
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => state.settings }));

let root: Root;
let container: HTMLDivElement;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => {
  state.language = "zh";
  state.settings = { brand_name: "FLASH CAST", company_name: "FLASH CAST SDN. BHD.", og_image_url: "https://example.com/default.webp", updated_at: "current" };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("public page metadata", () => {
  it("makes a current page image absolute and uses the settings image for malformed input", async () => {
    act(() => root.render(<HelmetProvider><PageMeta title="Current page" description="Current description" canonicalPath="/contact" ogImage="/images/current.webp" /></HelmetProvider>));
    await vi.waitFor(() => expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute("content", "https://flashcast.com.my/images/current.webp"));
    for (const image of ["http://", "   ", "javascript:alert(1)"]) {
      act(() => root.render(<HelmetProvider><PageMeta title="Current page" description="Current description" canonicalPath="/contact" ogImage={image} /></HelmetProvider>));
      await vi.waitFor(() => expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toMatch(/^https:\/\/example.com\/default.webp/));
    }
  });

  it("removes indexable identity when changing from a valid route to a missing route", async () => {
    act(() => root.render(<HelmetProvider><PageMeta title="Current page" description="Current description" canonicalPath="/contact" /></HelmetProvider>));
    await vi.waitFor(() => expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://flashcast.com.my/zh/contact"));
    act(() => root.render(<HelmetProvider><PageMeta title="404" description="Missing page" canonicalPath="/missing" noIndex /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
      expect(document.querySelector('link[rel="alternate"]')).toBeNull();
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    });
  });

  it.each([
    ["/", "闪铸装饰"],
    ["/about", "闪铸装饰"],
    ["/services/design", "闪铸设计"],
    ["/services/renovation", "闪铸装修"],
  ])("associates the confirmed Chinese brand with CMS metadata for %s", async (path, brand) => {
    const title = "后台已发布的住宅与商业空间咨询";
    const description = "保留后台确认的服务范围、地点与咨询说明。";
    act(() => root.render(<HelmetProvider><PageMeta title={title} description={description} canonicalPath={path} /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.title).toBe(`${brand} | ${title} | FLASH CAST SDN. BHD.`);
      const actualDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      expect(actualDescription.startsWith(description)).toBe(true);
      for (const alias of ["闪铸装饰", "闪铸设计", "闪铸装修", "FLASH CAST"]) expect(actualDescription).toContain(alias);
      expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute("content", document.title);
      expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute("content", document.title);
      expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute("content", actualDescription);
      expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute("content", actualDescription);
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", `https://flashcast.com.my/zh${path === "/" ? "" : path}`);
    });
  });

  it("does not duplicate a Chinese brand already present in published metadata", async () => {
    const title = "闪铸设计 | 后台已发布的空间规划 | FLASH CAST";
    const description = "FLASH CAST 的中文品牌为闪铸装饰、闪铸设计和闪铸装修。保留后台设计咨询范围。";
    act(() => root.render(<HelmetProvider><PageMeta title={title} description={description} canonicalPath="/services/design" /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.title).toBe(title);
      expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", description);
    });
  });

  it.each(["/", "/about", "/services/design", "/services/renovation"])("keeps English CMS metadata free of the Chinese brand line for %s", async (path) => {
    state.language = "en";
    const description = "The published English consultation scope remains intact.";
    act(() => root.render(<HelmetProvider><PageMeta title="Published English scope" description={description} canonicalPath={path} /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.title).toBe("Published English scope | FLASH CAST SDN. BHD.");
      expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", description);
      for (const alias of ["闪铸装饰", "闪铸设计", "闪铸装修"]) {
        expect(document.title).not.toContain(alias);
        expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).not.toContain(alias);
      }
    });
  });

  it("keeps an unrelated Chinese route and a different company outside the brand association", async () => {
    act(() => root.render(<HelmetProvider><PageMeta title="联系页面" description="原始联系说明。" canonicalPath="/contact" /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.title).toBe("联系页面 | FLASH CAST SDN. BHD.");
      expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", "原始联系说明。");
    });
    state.settings = { ...state.settings, company_name: "Different company", brand_name: "Different brand" };
    act(() => root.render(<HelmetProvider><PageMeta title="后台首页" description="其它公司的公开说明。" canonicalPath="/" /></HelmetProvider>));
    await vi.waitFor(() => {
      expect(document.title).toBe("后台首页 | Different company");
      expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", "其它公司的公开说明。");
    });
  });
});
