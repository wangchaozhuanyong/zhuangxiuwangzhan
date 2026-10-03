import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminServiceList from "@/pages/admin/AdminServiceList";
import { setAdminLang } from "@/lib/adminLocale";

const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/adminBusinessContentQueries", () => ({ useAdminServices: read }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));

describe("service list empty states", () => {
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });

  for (const language of ["en", "zh"] as const) {
    it(`distinguishes an empty catalog from no filter matches and clears filters in ${language}`, async () => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      setAdminLang(language);
      const row = { id: "fixture", slug: "fixture-service", title_en: "Fixture service", title_zh: "服务示例", status: "published" };
      let emptyCatalog = true;
      read.mockImplementation(({ status, search }) => ({
        data: { rows: emptyCatalog || status !== "all" || search.trim() ? [] : [row], count: emptyCatalog ? 0 : 1, pageSize: 30 },
        error: null, isFetching: false, refetch: vi.fn(),
      }));
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      try {
        await act(async () => root.render(<MemoryRouter><TooltipProvider><AdminServiceList /></TooltipProvider></MemoryRouter>));
        expect(container.textContent).toContain(language === "en" ? "No services yet" : "暂无服务");
        emptyCatalog = false;
        const input = container.querySelector("input")!;
        await act(async () => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "no-match");
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(container.textContent).toContain(language === "en" ? "No matching services" : "没有匹配的服务");
        expect(container.textContent).not.toContain(language === "en" ? "Create a service first" : "先新建一个服务");
        const clear = () => Array.from(container.querySelectorAll("button")).find((button) => button.textContent === (language === "en" ? "Clear filters" : "清除筛选"))!;
        await act(async () => clear().click());
        expect(input.value).toBe("");
        expect(container.textContent).toContain(language === "en" ? "Fixture service" : "服务示例");
        const select = container.querySelector("select")!;
        await act(async () => { select.value = "archived"; select.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(container.textContent).toContain(language === "en" ? "No matching services" : "没有匹配的服务");
        await act(async () => clear().click());
        expect(select.value).toBe("all");
        expect(container.textContent).toContain(language === "en" ? "Fixture service" : "服务示例");
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    });
  }
});
