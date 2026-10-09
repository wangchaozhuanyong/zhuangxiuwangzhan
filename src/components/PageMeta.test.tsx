import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PageMeta from "./PageMeta";

vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ brand_name: "FLASH CAST", company_name: "FLASH CAST SDN. BHD.", og_image_url: "https://example.com/default.webp", updated_at: "current" }) }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
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
});
