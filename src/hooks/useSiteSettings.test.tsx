import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { useSiteSettings, useSiteSettingsQuery } from "./useSiteSettings";

const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/siteSettingsApi", async (original) => ({ ...await original<typeof import("@/lib/siteSettingsApi")>(), fetchSiteSettings: read }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));

let client: QueryClient;
let root: Root;
let container: HTMLDivElement;
function Readers() {
  const settings = useSiteSettings();
  const query = useSiteSettingsQuery();
  return <div data-initial-error={query.isInitialError} data-refresh-error={Boolean(query.refreshError)}>{settings.brand_name}</div>;
}
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  read.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("shared site settings remote cache", () => {
  it("keeps the rendering fallback outside a failed query cache", async () => {
    read.mockRejectedValue(new Error("Read unavailable"));
    await act(async () => root.render(<QueryClientProvider client={client}><Readers /></QueryClientProvider>));
    await settle();
    expect(container.textContent).toContain(fallbackSiteSettings.brand_name);
    expect(client.getQueryData(["site-settings"])).toBeUndefined();
    expect(container.firstElementChild?.getAttribute("data-initial-error")).toBe("true");
  });
  it("deduplicates consumers and keeps confirmed branding on a failed refresh", async () => {
    const confirmed = { ...fallbackSiteSettings, brand_name: "Confirmed brand" };
    read.mockResolvedValueOnce(confirmed);
    await act(async () => root.render(<QueryClientProvider client={client}><Readers /></QueryClientProvider>));
    await settle();
    expect(read).toHaveBeenCalledOnce();
    read.mockRejectedValueOnce(new Error("Refresh unavailable"));
    await act(async () => { await client.refetchQueries({ queryKey: ["site-settings"] }); });
    await settle();
    expect(client.getQueryData(["site-settings"])).toEqual(confirmed);
    expect(container.textContent).toContain("Confirmed brand");
    expect(container.firstElementChild?.getAttribute("data-refresh-error")).toBe("true");
    expect(container.firstElementChild?.getAttribute("data-initial-error")).toBe("false");
  });
});
