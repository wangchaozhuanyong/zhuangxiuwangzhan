import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAdminSeoAudit } from "@/lib/adminSeoAudit";
import { setAdminLang } from "@/lib/adminLocale";

const { fetchRows } = vi.hoisted(() => ({ fetchRows: vi.fn() }));
vi.mock("@/backend/modules/seo/repository/seoAuditRepository", () => ({ fetchAdminSeoAuditRows: fetchRows }));
vi.mock("@/lib/adminQueryCore", () => ({ adminQueriesEnabled: true }));
const Probe = () => <output>{JSON.stringify(useAdminSeoAudit().data)}</output>;

describe("SEO audit language cache", () => {
  const clients: QueryClient[] = [];
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    fetchRows.mockReset();
    fetchRows.mockImplementation(async (table: string) => {
      if (table === "projects") throw new Error("fixture read failure");
      return table === "services" ? [{ id: "fixture-service", title_en: "Fixture service" }] : [];
    });
  });
  afterEach(async () => {
    for (const dispose of cleanup.splice(0)) await dispose();
    for (const client of clients.splice(0)) client.clear();
    setAdminLang("zh");
    vi.unstubAllGlobals();
  });
  const mount = async (client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) => {
    if (!clients.includes(client)) clients.push(client);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    cleanup.push(async () => { await act(async () => root.unmount()); container.remove(); });
    await act(async () => root.render(<QueryClientProvider client={client}><Probe /></QueryClientProvider>));
    return { client, container };
  };
  it("translates successful and failed source rows in both directions without another database read", async () => {
    const { client, container } = await mount();
    await vi.waitFor(() => expect(container.textContent).toContain('"label":"服务项目"'));
    expect(container.textContent).toContain('"label":"装修案例"');
    expect(fetchRows).toHaveBeenCalledTimes(8);
    expect(JSON.stringify(client.getQueryData(["admin", "seo", "audit"]))).not.toContain('"label"');
    await act(async () => setAdminLang("en"));
    expect(container.textContent).toContain('"label":"Services"');
    expect(container.textContent).toContain('"label":"Projects"');
    expect(container.textContent).not.toContain("服务项目");
    await act(async () => setAdminLang("zh"));
    expect(container.textContent).toContain('"label":"服务项目"');
    expect(fetchRows).toHaveBeenCalledTimes(8);
  });
  it("uses the current language when mounting an already fresh cache", async () => {
    const { client, container } = await mount();
    await vi.waitFor(() => expect(container.textContent).toContain('"label":"服务项目"'));
    await act(async () => setAdminLang("en"));
    const second = await mount(client);
    expect(second.container.textContent).toContain('"label":"Services"');
    expect(fetchRows).toHaveBeenCalledTimes(8);
  });
});
