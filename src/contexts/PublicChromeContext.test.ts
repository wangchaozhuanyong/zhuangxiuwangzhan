import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getInitialPublicTheme, PublicChromeProvider, usePageConsultation, usePageWhatsAppMessage, usePublicChrome } from "@/contexts/PublicChromeContext";
import { formatFurnitureEnquiryMessage } from "@/i18n/furnitureText";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { FurnitureProduct } from "@/lib/furnitureCatalog";
import FurnitureProductDetail from "@/pages/FurnitureProductDetail";

const managedPageFixture = vi.hoisted(() => ({ language: "en" as "en" | "zh", product: undefined as FurnitureProduct | undefined }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: managedPageFixture.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedManagedFurnitureProductBySlug: () => ({ data: managedPageFixture.product, isFetching: false, isError: false }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettingsReadiness: () => false, useSiteSettings: () => ({ whatsapp_url: (message = "") => `https://wa.me/601128853888?text=${encodeURIComponent(message)}` }) }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));

describe("public theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("uses the fixed dark public theme", () => {
    expect(getInitialPublicTheme()).toBe("dark");
  });

  it("ignores obsolete saved light preferences", () => {
    window.localStorage.setItem("flashcast-public-theme", "light");

    expect(getInitialPublicTheme()).toBe("dark");
  });
});

describe("page consultation ownership", () => {
  it("restores the shared invitation after route changes and cleans up overlapping registrations", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const PageConsultation = () => { usePageConsultation(); return null; };
    const SharedInvitation = () => {
      const { hasPageConsultation } = usePublicChrome();
      return hasPageConsultation ? null : createElement("p", null, "Shared invitation");
    };
    const renderPage = (routeKey: string, count: number) => act(() => root.render(
      createElement(StrictMode, null,
        createElement(PublicChromeProvider, {
          isAdminRoute: false,
          routeKey,
          children: [
            ...Array.from({ length: count }, (_, index) => createElement(PageConsultation, { key: `${routeKey}-${index}` })),
            createElement(SharedInvitation, { key: "shared" }),
          ],
        }),
      ),
    ));

    renderPage("home", 0);
    expect(container).toHaveTextContent("Shared invitation");
    renderPage("services", 2);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("services", 1);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("kitchen", 1);
    expect(container).not.toHaveTextContent("Shared invitation");
    renderPage("about", 0);
    expect(container).toHaveTextContent("Shared invitation");
    act(() => root.unmount());
  });
});


describe("shared WhatsApp page context", () => {
  it("renders the actual managed-loaded detail branch with no SKU and clears it for a missing product", async () => {
    // The hook is an internal fixture; no CMS row or external account is read.
    const container = document.createElement("div"); const root = createRoot(container);
    const SharedMessage = () => createElement("p", { "data-testid": "shared-message" }, usePublicChrome().pageWhatsAppMessage || "generic");
    const render = async (language: "en" | "zh", name?: string) => {
      managedPageFixture.language = language;
      managedPageFixture.product = name ? { slug: "managed-loaded-fixture", name, sku: "", shortDescription: "", description: "", sourceUrl: "internal-fixture", sourceImages: [], images: [], sourceCategories: [], price: null } : undefined;
      const path = `/${language}/furniture/product/${name ? "managed-loaded-fixture" : "missing"}`;
      await act(async () => root.render(createElement(MemoryRouter, { key: path, future: { v7_startTransition: true, v7_relativeSplatPath: true }, initialEntries: [path] }, createElement(PublicChromeProvider, {
        isAdminRoute: false, routeKey: path, children: [
          createElement(Routes, { key: "page" }, createElement(Route, { path: "/:lang/furniture/product/:slug", element: createElement(FurnitureProductDetail) })),
          createElement(SharedMessage, { key: "shared" }),
        ],
      }))));
    };
    await render("en", "Managed fixture chair");
    expect(container.querySelector("h1")).toHaveTextContent("Managed fixture chair");
    expect(container.querySelector("[data-testid=shared-message]")).toHaveTextContent("Managed fixture chair");
    expect(decodeURIComponent(container.querySelector('a[href*="wa.me"]')?.getAttribute("href") || "")).toContain("Managed fixture chair");
    expect(container.querySelector("dl")).toBeNull();
    await render("zh", "内部家具夹具");
    expect(container.querySelector("h1")).toHaveTextContent("内部家具夹具");
    expect(container.querySelector("[data-testid=shared-message]")).not.toHaveTextContent("Managed fixture chair");
    await render("zh");
    expect(container.querySelector("[data-testid=shared-message]")).toHaveTextContent("generic");
    await act(async () => root.unmount()); managedPageFixture.product = undefined;
  });
  it("keeps a managed-shaped loaded product name without inventing a missing SKU, then clears its context", () => {
    // Internal fixture models the existing managed product mapping's empty SKU; it is not a CMS readback.
    const container = document.createElement("div"); const root = createRoot(container);
    const FixturePage = ({ name, language }: { name?: string; language: "en" | "zh" }) => {
      usePageWhatsAppMessage(name ? formatFurnitureEnquiryMessage(name, "", language) : undefined);
      const { pageWhatsAppMessage } = usePublicChrome();
      return createElement("p", null, pageWhatsAppMessage || "generic");
    };
    const render = (name?: string, language: "en" | "zh" = "en") => act(() => root.render(createElement(PublicChromeProvider, {
      isAdminRoute: false, routeKey: name ? "/furniture/product/managed-fixture" : "/furniture/product/missing",
      children: createElement(FixturePage, { name, language }),
    })));
    render("Managed fixture chair"); expect(container).toHaveTextContent("Managed fixture chair");
    expect(container.textContent).not.toMatch(/SKU|N\/A|\(\)/);
    render("内部家具夹具", "zh"); expect(container).toHaveTextContent("内部家具夹具");
    expect(container.textContent).not.toContain("Managed fixture chair");
    render(); expect(container).toHaveTextContent("generic"); act(() => root.unmount());
  });
  it("tracks known products and language, clears missing context and prevents leakage on route changes", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const ProductContext = ({ message }: { message?: string }) => { usePageWhatsAppMessage(message); return null; };
    const SharedMessage = () => {
      const { pageWhatsAppMessage } = usePublicChrome();
      return createElement("p", null, pageWhatsAppMessage || "generic");
    };
    const renderPage = (routeKey: string, message?: string, mounted = true) => act(() => root.render(
      createElement(StrictMode, null, createElement(PublicChromeProvider, {
        isAdminRoute: false,
        routeKey,
        children: [
          mounted ? createElement(ProductContext, { key: "product", message }) : null,
          createElement(SharedMessage, { key: "shared" }),
        ],
      })),
    ));
    renderPage("/furniture");
    expect(container).toHaveTextContent("generic");
    renderPage("/furniture/product/a", "家具 A (A-1)");
    expect(container).toHaveTextContent("家具 A (A-1)");
    renderPage("/furniture/product/a", "Furniture A (A-1)");
    expect(container).toHaveTextContent("Furniture A (A-1)");
    expect(container).not.toHaveTextContent("家具");
    renderPage("/furniture/product/b", "Furniture B (B-2)");
    expect(container).toHaveTextContent("Furniture B (B-2)");
    expect(container).not.toHaveTextContent("A-1");
    renderPage("/furniture/product/missing");
    expect(container).toHaveTextContent("generic");
    renderPage("/furniture/product/a", "Furniture A (A-1)");
    renderPage("/services/renovation", undefined, false);
    expect(container).toHaveTextContent("generic");
    renderPage("/furniture", undefined, false);
    expect(container).toHaveTextContent("generic");
    act(() => root.unmount());
  });
});
