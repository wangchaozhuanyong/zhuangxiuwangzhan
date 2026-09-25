import { act } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { locationsData } from "@/data/locations";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import LocationPage from "@/pages/LocationPage";

vi.mock("@/hooks/usePublishedContent", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/hooks/usePublishedContent")>(),
  usePublishedServiceAreaBySlug: (_slug: string, language: "en" | "zh") => ({
    data: {
      ...locationsData["kuala-lumpur"],
      name: language === "zh" ? "吉隆坡" : "Kuala Lumpur",
      intro: language === "zh"
        ? "<p>第一段介绍。</p><p>第二段服务。</p><p>第三段报价。</p>"
        : "<p>First introduction.</p><p>Second service.</p><p>Third quotation.</p>",
    },
    isPending: false,
  }),
}));

describe("LocationPage CMS paragraph rendering", () => {
  for (const language of ["en", "zh"] as const) {
    it(`preserves three ${language} paragraphs, service links and quote destination`, () => {
      window.history.replaceState({}, "", `/${language}/locations/kuala-lumpur`);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

      act(() => root.render(
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <LanguageProvider>
              <PublicChromeProvider isAdminRoute={false} routeKey="/locations/kuala-lumpur">
                <MemoryRouter initialEntries={[`/${language}/locations/kuala-lumpur`]}>
                  <Routes><Route path="/:language/locations/:slug" element={<LocationPage />} /></Routes>
                </MemoryRouter>
              </PublicChromeProvider>
            </LanguageProvider>
          </HelmetProvider>
        </QueryClientProvider>,
      ));

      const sections = Array.from(container.querySelectorAll(".fc-route-section"));
      const intro = sections.find((section) => section.querySelector(".fc-route-section-head p")?.textContent?.startsWith(language === "zh" ? "第一段" : "First"));
      expect(intro).toBeTruthy();
      expect(Array.from(intro!.querySelectorAll(".fc-route-section-head p"), (paragraph) => paragraph.textContent)).toEqual(
        language === "zh" ? ["第一段介绍。", "第二段服务。", "第三段报价。"] : ["First introduction.", "Second service.", "Third quotation."],
      );
      expect(container.querySelectorAll(`.fc-route-section a[href^="/${language}/services/"]`).length).toBeGreaterThan(0);
      expect(container.querySelector(`.scheme-a-page-cta a[href^="/${language}/quote?source=location"]`)).toBeTruthy();

      act(() => root.unmount());
      queryClient.clear();
      container.remove();
    });
  }
});
