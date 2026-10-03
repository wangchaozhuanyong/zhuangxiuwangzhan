import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminBlogList from "@/pages/admin/AdminBlogList";
import { setAdminLang } from "@/lib/adminLocale";

const { read } = vi.hoisted(() => ({ read: vi.fn(() => ({
  data: { count: 2, pageSize: 30, rows: [
    { id: "known", slug: "fixture-budget", title_en: "Fixture budget", title_zh: "预算示例", category: "budget-quotation", status: "draft" },
    { id: "unknown", slug: "fixture-other", title_en: "Fixture other", title_zh: "其他示例", category: "unknown_internal_code", status: "draft" },
  ] }, error: null, isFetching: false, refetch: vi.fn(),
})) }));
vi.mock("@/lib/adminBusinessContentQueries", () => ({ useAdminBlogPosts: read }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));

describe("blog list display language", () => {
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });
  it("translates category codes and titles immediately, with a safe fallback for unknown codes", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter><TooltipProvider><AdminBlogList /></TooltipProvider></MemoryRouter>));
      expect(container.textContent).toContain("预算与报价");
      expect(container.textContent).toContain("其他分类");
      expect(container.textContent).toContain("预算示例");
      expect(container.textContent).not.toContain("budget-quotation");
      expect(container.textContent).not.toContain("unknown_internal_code");
      await act(async () => setAdminLang("en"));
      expect(container.textContent).toContain("Budget & Quotations");
      expect(container.textContent).toContain("Other category");
      expect(container.textContent).toContain("Fixture budget");
      expect(container.textContent).not.toMatch(/[\u4e00-\u9fff]/);
      await act(async () => setAdminLang("zh"));
      expect(container.textContent).toContain("预算与报价");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
