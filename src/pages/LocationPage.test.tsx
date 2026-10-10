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
  usePublishedServiceAreaBySlug: (slug: string, language: "en" | "zh") => ({
    data: {
      ...locationsData[slug],
      name: language === "zh" ? (locationsData[slug].nameZh || locationsData[slug].name) : locationsData[slug].name,
      intro: language === "zh"
        ? `<p>第一段介绍。</p><p>${slug === "selangor" ? "仓储相关服务仅限货架、通道规划、地面标线及存储分区，具体范围以现场评估与报价为准。" : "第二段服务。"}</p><p>第三段报价。</p>`
        : `<p>First introduction.</p><p>${slug === "selangor" ? "For warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning; exact work is subject to a site review and quotation." : "Second service."}</p><p>Third quotation.</p>`,
    },
    isPending: false,
  }),
}));

describe("LocationPage CMS paragraph rendering", () => {
  for (const slug of ["kuala-lumpur", "bangsar", "selangor"]) for (const language of ["en", "zh"] as const) {
    it(`preserves CMS ${slug}/${language} body, scopes source-reviewed labels and quote destination`, () => {
      window.history.replaceState({}, "", `/${language}/locations/${slug}`);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

      act(() => root.render(
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <LanguageProvider>
              <PublicChromeProvider isAdminRoute={false} routeKey="/locations/kuala-lumpur">
                <MemoryRouter initialEntries={[`/${language}/locations/${slug}`]}>
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
        language === "zh"
          ? ["第一段介绍。", slug === "selangor" ? "仓储相关服务仅限货架、通道规划、地面标线及存储分区，具体范围以现场评估与报价为准。" : "第二段服务。", "第三段报价。"]
          : ["First introduction.", slug === "selangor" ? "For warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning; exact work is subject to a site review and quotation." : "Second service.", "Third quotation."],
      );
      const warehouse = intro!.querySelectorAll(`a[href="/${language}/services/warehouse"]`);
      expect(warehouse).toHaveLength(slug === "selangor" ? 1 : 0);
      if (slug === "selangor") expect(warehouse[0].textContent).toBe(language === "zh" ? "仓储相关服务" : "warehouse-related needs");
      if (slug === "kuala-lumpur") expect(container.querySelectorAll(`.fc-route-section a[href^="/${language}/services/"]`).length).toBeGreaterThan(0);
      const reviewedLabel = language === "zh" ? "可讨论的项目类型：" : "PROJECT TYPES TO DISCUSS:";
      const reviewedHeading = language === "zh" ? "概念参考与规划资料" : "Concept References and Planning Guides";
      if (slug === "bangsar") {
        expect(container.textContent).toContain(reviewedLabel);
        expect(Array.from(container.querySelectorAll("h2"), (h) => h.textContent)).toContain(reviewedHeading);
      } else {
        expect(container.textContent).not.toContain(reviewedLabel);
        expect(Array.from(container.querySelectorAll("h2"), (h) => h.textContent)).not.toContain(reviewedHeading);
      }
      expect(container.querySelector(`.scheme-a-page-cta a[href^="/${language}/quote?source=location"]`)).toBeTruthy();

      act(() => root.unmount());
      queryClient.clear();
      container.remove();
    });
  }
});
