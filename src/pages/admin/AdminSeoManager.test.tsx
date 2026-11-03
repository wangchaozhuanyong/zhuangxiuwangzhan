import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAdminLang } from "@/lib/adminLocale";
import { adminSeoManagerText as text } from "@/i18n/adminSeoManagerText";
import AdminSeoManager from "./AdminSeoManager";

const { fetchRows } = vi.hoisted(() => ({ fetchRows: vi.fn() }));
vi.mock("@/backend/modules/seo/repository/seoAuditRepository", () => ({ fetchAdminSeoAuditRows: fetchRows }));
vi.mock("@/lib/adminQueryCore", () => ({ adminQueriesEnabled: true }));

const published = {
  id: "published-service", status: "published", slug: "fixture-kitchen",
  title_zh: "已发布厨房服务", title_en: "Published kitchen service",
  seo_title_zh: "吉隆坡厨房装修", seo_title_en: "A".repeat(71),
  seo_description_zh: "吉隆坡厨房装修，按现场情况报价。",
  seo_description_en: "Kitchen renovation planning in Kuala Lumpur and Selangor, with quotations based on site conditions and material choices.",
};
const archived = { id: "archived-service", status: "archived", slug: "archived-kitchen", title_zh: "旧厨房记录" };
let client: QueryClient, root: Root, node: HTMLDivElement;
const settle = async () => {
  await vi.waitFor(() => {
    expect(client.getQueryState(["admin", "seo", "audit"])?.status).toBe("success");
    expect([...node.querySelectorAll("p")].some((p) => p.textContent === text.checkContent.zh)).toBe(true);
  });
};
const card = (key: keyof typeof text) => {
  const label = [...node.querySelectorAll("p")].find((p) => p.textContent === text[key].zh);
  expect(label).toBeDefined();
  return label?.nextElementSibling?.textContent;
};
const select = async (name: string, value: string) => {
  const control = node.querySelector<HTMLSelectElement>(`select[aria-label="${name}"]`)!;
  expect(control).not.toBeNull();
  await act(async () => {
    control.value = value;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  });
};
const mount = async () => {
  await act(async () => root.render(
    <QueryClientProvider client={client}><MemoryRouter initialEntries={["/admin/seo"]}>
      <TooltipProvider><AdminSeoManager /></TooltipProvider>
    </MemoryRouter></QueryClientProvider>,
  ));
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); setAdminLang("zh"); onlineManager.setOnline(true);
  fetchRows.mockReset().mockImplementation(async (table: string) => table === "services" ? [published, archived] : []);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.appendChild(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); node.remove(); client.clear();
  onlineManager.setOnline(true); setAdminLang("zh"); vi.unstubAllGlobals();
});

describe("SEO audit scoped counts and incomplete sources", () => {
  it("defaults to current records and separates suggestions from real missing fields", async () => {
    await mount(); await settle();
    expect(card("checkContent")).toBe("1"); expect(card("missing")).toBe("0");
    expect(card("suggestions")).toBe("1"); expect(card("configurationIssues")).toBe("0");
    expect(node.textContent).not.toContain("旧厨房记录");
    await select(text.filterLabel.zh, "missing");
    expect(node.textContent).not.toContain("已发布厨房服务");
    expect(node.textContent).toContain(text.emptyTitle.zh);
    await select(text.filterLabel.zh, "suggestions");
    expect(node.textContent).toContain("已发布厨房服务");
  });

  it("keeps archived and all-record scopes selectable through URL state", async () => {
    await mount(); await settle();
    await select("内容状态范围", "archived");
    expect(card("checkContent")).toBe("1"); expect(card("missing")).toBe("1");
    expect(node.textContent).toContain("旧厨房记录");
    expect(node.textContent).not.toContain("已发布厨房服务");
    await select("内容状态范围", "all_records");
    expect(card("checkContent")).toBe("2");
    expect(node.textContent).toContain("已发布厨房服务");
    expect(node.textContent).toContain("旧厨房记录");
  });

  it("preserves confirmed records while unread sources leave totals unknown", async () => {
    fetchRows.mockImplementation(async (table: string) => {
      if (table === "projects") throw new Error("private database failure");
      return table === "services" ? [published] : [];
    });
    await mount(); await settle();
    expect(card("checkContent")).toBe("…"); expect(card("missing")).toBe("…");
    expect(node.textContent).toContain("统计不完整");
    expect(node.textContent).toContain("装修案例");
    expect(node.textContent).toContain("已发布厨房服务");
    expect(node.querySelectorAll("article")).toHaveLength(1);
    expect(node.textContent).not.toContain("private database failure");
  });

  it("does not claim healthy empty content when every source fails", async () => {
    fetchRows.mockRejectedValue(new Error("private backend failure"));
    await mount(); await settle();
    expect(card("passed")).toBe("…");
    expect(node.querySelectorAll("article")).toHaveLength(0);
    expect(node.textContent).not.toContain(text.emptyTitle.zh);
    expect(node.textContent).not.toContain(text.seoGeoPassed.zh);
  });

  it("shows loading rather than confirmed zeros on first offline entry", async () => {
    onlineManager.setOnline(false);
    await mount();
    expect(node.textContent).toContain(text.loading.zh);
    expect(node.textContent).not.toContain(text.emptyTitle.zh);
    expect(fetchRows).not.toHaveBeenCalled();
    await act(async () => onlineManager.setOnline(true));
    await settle(); expect(card("checkContent")).toBe("1");
  });

  it("translates scopes and issue severity from cache without another read", async () => {
    await mount(); await settle();
    const reads = fetchRows.mock.calls.length;
    await act(async () => setAdminLang("en"));
    expect(node.textContent).toContain(text.suggestions.en);
    expect(node.querySelector('select[aria-label="Content status scope"]')).not.toBeNull();
    expect(node.textContent).not.toContain("优化建议");
    expect(fetchRows).toHaveBeenCalledTimes(reads);
  });
});
