import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { adminAuditScopeText } from "@/i18n/adminAuditScopeText";
import { adminContentHealthText } from "@/i18n/adminContentHealthText";
import { setAdminLang } from "@/lib/adminLocale";
import AdminContentHealth from "./AdminContentHealth";

const { fetchRows } = vi.hoisted(() => ({ fetchRows: vi.fn() }));
vi.mock("@/backend/modules/cms/repository/contentHealthRepository", () => ({ fetchAdminContentHealthRows: fetchRows }));
vi.mock("@/lib/adminQueryCore", () => ({ adminQueriesEnabled: true }));

const pageRow = (id: string, status: string, missingEnglish = false) => ({
  id, page_key: id, path: `/${id}`, status, title_zh: id, title_en: id,
  description_en: missingEnglish ? "" : "English introduction", content_en: "English body",
  seo_title_zh: "测试标题", seo_description_zh: "测试描述", seo_title_en: "Fixture title", seo_description_en: "Fixture description", image_url: "/fixture.webp",
});

describe("content health record scopes and incomplete reads", () => {
  let root: Root, container: HTMLDivElement, client: QueryClient;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    fetchRows.mockReset();
    fetchRows.mockImplementation(async (table: string) => table === "site_pages" ? [
      pageRow("current-record", "published"), pageRow("draft-record", "draft", true), pageRow("archived-record", "archived", true),
    ] : []);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); client.clear(); container.remove(); setAdminLang("zh"); vi.unstubAllGlobals();
  });
  const mount = async (entry = "/admin/content-health") => {
    await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}><TooltipProvider><AdminContentHealth /></TooltipProvider></MemoryRouter></QueryClientProvider>));
  };
  const cardValue = (key: "totalContent" | "brokenContent" | "healthy" | "englishMissing") =>
    Array.from(container.querySelectorAll("p")).find((node) => node.textContent === adminContentHealthText[key].zh)?.nextElementSibling?.textContent;
  const changeScope = async (value: string) => {
    const select = container.querySelector<HTMLSelectElement>(`select[aria-label="${adminAuditScopeText.scopeLabel.zh}"]`)!;
    await act(async () => { select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); });
  };

  it("defaults to unarchived records and lets archived and all records be inspected", async () => {
    await mount();
    await vi.waitFor(() => expect(cardValue("totalContent")).toBe("2"));
    expect(cardValue("brokenContent")).toBe("1");
    expect(container.querySelectorAll("article")).toHaveLength(2);
    expect(container.textContent).not.toContain("archived-record");
    await changeScope("archived");
    expect(cardValue("totalContent")).toBe("1"); expect(cardValue("brokenContent")).toBe("1");
    expect(container.textContent).toContain("archived-record"); expect(container.textContent).not.toContain("current-record");
    await changeScope("all_records");
    expect(cardValue("totalContent")).toBe("3"); expect(cardValue("brokenContent")).toBe("2");
    await changeScope("published");
    expect(cardValue("totalContent")).toBe("1"); expect(cardValue("brokenContent")).toBe("0");
  });

  it("supports a shared archived-scope URL", async () => {
    await mount("/admin/content-health?scope=archived");
    await vi.waitFor(() => expect(cardValue("totalContent")).toBe("1"));
    expect(container.textContent).toContain("archived-record"); expect(container.textContent).not.toContain("current-record");
  });

  it("excludes failed sources and keeps confirmed records visible with incomplete statistics", async () => {
    fetchRows.mockImplementation(async (table: string) => {
      if (table === "services") throw new Error("Synthetic source read failure");
      return table === "site_pages" ? [pageRow("confirmed-record", "published")] : [];
    });
    await mount();
    await vi.waitFor(() => expect(cardValue("totalContent")).toBe("1"));
    expect(cardValue("healthy")).toBe("1");
    expect(cardValue("brokenContent")).toBe(adminContentHealthText.pendingCount.zh);
    expect(container.textContent).toContain("统计不完整"); expect(container.textContent).toContain("服务项目");
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.textContent).not.toContain("Synthetic source read failure");
    expect(container.textContent).not.toContain("服务项目 读取失败");
  });

  it("does not report zero or healthy completion when every source failed", async () => {
    fetchRows.mockRejectedValue(new Error("Synthetic total read failure"));
    await mount();
    await vi.waitFor(() => expect(container.textContent).toContain("统计不完整"));
    expect(cardValue("totalContent")).toBe(adminContentHealthText.pendingCount.zh);
    expect(cardValue("healthy")).toBe(adminContentHealthText.pendingCount.zh);
    expect(cardValue("brokenContent")).toBe(adminContentHealthText.pendingCount.zh);
    expect(container.querySelectorAll("article")).toHaveLength(0);
    expect(container.textContent).toContain(adminContentHealthText.incompleteEmptyTitle.zh);
    expect(container.textContent).not.toContain(adminContentHealthText.emptyTitle.zh);
  });

  it("does not present empty content or zero counts before any source is confirmed", async () => {
    fetchRows.mockImplementation(() => new Promise(() => {}));
    await mount();
    expect(container.querySelector('[role="status"][aria-busy="true"]')).not.toBeNull();
    expect(cardValue("totalContent")).toBeUndefined();
    expect(container.textContent).not.toContain(adminContentHealthText.emptyTitle.zh);
  });
});
