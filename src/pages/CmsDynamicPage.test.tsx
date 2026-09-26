import { act } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CmsDynamicPage from "@/pages/CmsDynamicPage";

describe("CMS page shared layout", () => {
  for (const language of ["en", "zh"] as const) {
    it(`preserves ${language} CMS content, section lists and localized actions inside the public frame`, () => {
      const title = language === "zh" ? "空间规划" : "Space planning";
      const body = language === "zh" ? "按现场条件规划。" : "Plan around site conditions.";
      window.history.replaceState({}, "", `/${language}/layout-preview`);
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
      client.setQueryData(["published", "cms_path", language, "/layout-preview"], {
        title, path: "/layout-preview", description: body, content: `<p>${body}</p>`,
        sections: [{ id: "scope", section_type: "content", title, content: { text: body, items: [{ title, description: body }] } }],
      });
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => root.render(
        <QueryClientProvider client={client}>
          <HelmetProvider><LanguageProvider>
            <PublicChromeProvider isAdminRoute={false} routeKey="layout-preview">
              <MemoryRouter initialEntries={[`/${language}/layout-preview`]}>
                <Routes><Route path="/:lang/*" element={<CmsDynamicPage />} /></Routes>
              </MemoryRouter>
            </PublicChromeProvider>
          </LanguageProvider></HelmetProvider>
        </QueryClientProvider>,
      ));
      expect(container.querySelectorAll("h1")).toHaveLength(1);
      expect(container.querySelector(".fc-route-hero-frame h1")).toHaveTextContent(title);
      expect(container.querySelectorAll(".fc-route-section-frame .fc-route-cms-copy")).toHaveLength(2);
      expect(container.querySelector(".fc-route-cms-list")).toHaveTextContent(body);
      expect(container.querySelector(`a[href="/${language}/quote#quote-form"]`)).toBeTruthy();
      expect(container.querySelector(`a[href="/${language}/contact"]`)).toBeTruthy();
      act(() => root.unmount());
      client.clear();
      container.remove();
    });
  }
});
