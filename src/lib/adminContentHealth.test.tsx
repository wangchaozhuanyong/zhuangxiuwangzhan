import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminHealthFieldLabel, useAdminContentHealth } from "@/lib/adminContentHealth";
import { setAdminLang } from "@/lib/adminLocale";

const { fetchRows } = vi.hoisted(() => ({ fetchRows: vi.fn() }));
vi.mock("@/backend/modules/cms/repository/contentHealthRepository", () => ({ fetchAdminContentHealthRows: fetchRows }));
vi.mock("@/lib/adminQueryCore", () => ({ adminQueriesEnabled: true }));

const Probe = () => {
  const { data } = useAdminContentHealth();
  return <output>{JSON.stringify(data)}</output>;
};

describe("content health language cache", () => {
  const clients: QueryClient[] = [];
  const cleanup: Array<() => Promise<void>> = [];

  beforeEach(() => {
    setAdminLang("zh");
    fetchRows.mockReset();
    fetchRows.mockImplementation(async (table: string) => table === "site_pages" ? [{
      id: "fixture-page", page_key: "faq", path: "/faq", status: "published",
      title_zh: "测试页面", title_en: "Fixture page", description_en: "", content_en: "",
      seo_title_zh: "测试页面", seo_description_zh: "测试说明",
      seo_title_en: "Fixture page", seo_description_en: "Fixture description", image_url: "/fixture.webp",
    }] : []);
  });

  afterEach(async () => {
    for (const dispose of cleanup.splice(0)) await dispose();
    for (const client of clients.splice(0)) client.clear();
    setAdminLang("zh");
  });

  const mount = async (client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) => {
    if (!clients.includes(client)) clients.push(client);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    cleanup.push(async () => {
      await act(async () => root.unmount());
      container.remove();
    });
    await act(async () => root.render(<QueryClientProvider client={client}><Probe /></QueryClientProvider>));
    return { client, container };
  };

  it("keeps field labels compatible with direct array mapping", () => {
    expect(["description_en", "content_en"].map(getAdminHealthFieldLabel)).toEqual(["英文说明", "英文正文"]);
    setAdminLang("en");
    expect(["description_en", "content_en"].map(getAdminHealthFieldLabel)).toEqual(["English description", "English body"]);
  });

  it("updates cached labels in both directions without a recheck or another read", async () => {
    const { container } = await mount();
    await vi.waitFor(() => expect(container.textContent).toContain("英文缺失：英文说明"));
    const initialReads = fetchRows.mock.calls.length;

    await act(async () => setAdminLang("en"));
    await vi.waitFor(() => expect(container.textContent).toContain("English missing: English description"));
    expect(container.textContent).toContain('"tableLabel":"Page content"');
    expect(container.textContent).not.toContain("英文缺失");
    expect(fetchRows).toHaveBeenCalledTimes(initialReads);

    await act(async () => setAdminLang("zh"));
    await vi.waitFor(() => expect(container.textContent).toContain("英文缺失：英文说明"));
    expect(fetchRows).toHaveBeenCalledTimes(initialReads);
  });

  it("translates read failures from the cache when the language changes", async () => {
    fetchRows.mockImplementation(async (table: string) => {
      if (table === "services") throw new Error("fixture read failure");
      return [];
    });
    const { container } = await mount();
    await vi.waitFor(() => expect(container.textContent).toContain("服务项目 读取失败"));
    const initialReads = fetchRows.mock.calls.length;

    await act(async () => setAdminLang("en"));
    await vi.waitFor(() => expect(container.textContent).toContain("Services read failed"));
    expect(container.textContent).not.toContain("读取失败");
    expect(fetchRows).toHaveBeenCalledTimes(initialReads);
  });

  it("renders a shared fresh cache in the new language after remounting", async () => {
    const { client, container } = await mount();
    await vi.waitFor(() => expect(container.textContent).toContain("英文缺失：英文说明"));
    const initialReads = fetchRows.mock.calls.length;

    await act(async () => setAdminLang("en"));
    const second = await mount(client);
    await vi.waitFor(() => expect(second.container.textContent).toContain("English missing: English description"));
    expect(fetchRows).toHaveBeenCalledTimes(initialReads);
  });
});
