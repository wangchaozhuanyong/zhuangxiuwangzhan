import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";
import AdminWebsiteSettings from "./AdminWebsiteSettings";

const { read, save, mediaRender } = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), mediaRender: vi.fn<(props: { assetUsageType?: string; value?: string }) => null>(() => null) }));
vi.mock("@/lib/siteSettingsApi", async (original) => ({ ...await original<typeof import("@/lib/siteSettingsApi")>(), fetchSiteSettings: read }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: save, formatAdminMutationError: () => "Save failed" }));
vi.mock("@/lib/geocodeApi", () => ({ geocodeAddress: vi.fn() }));
vi.mock("@/lib/adminLocale", () => ({ getAdminLang: () => "zh" }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock("@/components/admin/AdminStickyActionBar", () => ({ default: ({ left, right, mobileSticky }: { left: ReactNode; right: ReactNode; mobileSticky: boolean }) => <div data-mobile-sticky={mobileSticky}>{left}{right}</div> }));
vi.mock("./AdminImageUpload", () => ({ default: mediaRender, getAdminImagePreviewVariant: () => "general" }));

let root: Root;
let client: QueryClient;
let container: HTMLDivElement;
const confirmed: SiteSettings = { ...fallbackSiteSettings, brand_name: "Sample brand", logo_url: "https://example.invalid/logo.webp", updated_at: "2026-10-05T00:00:00Z", map_latitude: "3.1", map_longitude: "101.6" };
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function render() { await act(async () => root.render(<QueryClientProvider client={client}><AdminWebsiteSettings /></QueryClientProvider>)); await settle(); }
function saveButton() { return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "保存设置")!; }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  read.mockReset(); save.mockReset(); mediaRender.mockClear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("website settings mobile save layout", () => {
  it("uses one title and one mobile action, mounting uploaders only with the loaded settings", async () => {
    let resolve!: (value: SiteSettings) => void;
    read.mockReturnValueOnce(new Promise<SiteSettings>(done => { resolve = done; }));
    await render();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('[data-mobile-sticky="true"]')).not.toBeNull();
    expect(saveButton()).toBeDisabled();
    expect(container.querySelector("fieldset")).toBeDisabled();
    expect(mediaRender).not.toHaveBeenCalled();
    await act(async () => resolve(confirmed)); await settle();
    expect(saveButton()).toBeEnabled();
    expect(container.querySelector("fieldset")).toBeEnabled();
    expect(mediaRender).toHaveBeenCalled();
    const logoProps = mediaRender.mock.calls.map((args) => args[0]).find((props) => props.assetUsageType === "logo");
    expect(logoProps?.value).toBe(confirmed.logo_url);
    const brand = container.querySelector<HTMLInputElement>("#setting-brand_name")!;
    expect(brand.value).toBe(confirmed.brand_name);
    expect(container.querySelector('label[for="setting-brand_name"]')).not.toBeNull();
  });

  it("keeps the action unavailable after a failed load and permits retry without changing the save payload", async () => {
    read.mockRejectedValueOnce(new Error("Read failed")); await render();
    expect(saveButton()).toBeDisabled();
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("内容加载失败");
    read.mockResolvedValue(confirmed);
    const retry = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "重试")!;
    await act(async () => retry.click()); await settle();
    save.mockResolvedValue(confirmed);
    await act(async () => saveButton().click()); await settle();
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ table: "site_settings", expectedUpdatedAt: confirmed.updated_at, payload: { brand_name: confirmed.brand_name, logo_url: confirmed.logo_url } });
  });
});
