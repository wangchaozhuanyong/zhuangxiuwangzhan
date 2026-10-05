import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";
import AdminWebsiteSettings from "./AdminWebsiteSettings";

const { read, save, geocode, mediaRender } = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), geocode: vi.fn(), mediaRender: vi.fn(() => null) }));
vi.mock("@/lib/siteSettingsApi", async (original) => ({ ...await original<typeof import("@/lib/siteSettingsApi")>(), fetchSiteSettings: read }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: save, formatAdminMutationError: () => "Save failed" }));
vi.mock("@/lib/geocodeApi", () => ({ geocodeAddress: geocode }));
vi.mock("@/lib/adminLocale", () => ({ getAdminLang: () => "zh" }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("./AdminImageUpload", () => ({ default: mediaRender, getAdminImagePreviewVariant: () => "general" }));

let root: Root;
let client: QueryClient;
let container: HTMLDivElement;
const confirmed: SiteSettings = { ...fallbackSiteSettings, brand_name: "Confirmed brand", updated_at: "2026-10-05T00:00:00Z", map_latitude: "3.1", map_longitude: "101.6" };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function render() { await act(async () => root.render(<QueryClientProvider client={client}><AdminWebsiteSettings /></QueryClientProvider>)); await settle(); }
function saveButton() { return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => /保存/.test(button.textContent || ""))!; }
function editBrand(value: string) {
  const input = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(item => item.value === "Confirmed brand")!;
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
  return input;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  read.mockReset(); save.mockReset(); geocode.mockReset(); mediaRender.mockClear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("website settings confirmed-read and submission protection", () => {
  it("prevents fallback saving while pending or failed and enables saving after retry", async () => {
    const pending = deferred<SiteSettings>(); read.mockReturnValueOnce(pending.promise);
    await render();
    expect(saveButton()).toBeDisabled();
    expect(container.querySelector("fieldset")).toBeDisabled();
    expect(mediaRender).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(confirmed); }); await settle();
    expect(saveButton()).toBeEnabled();
    await act(async () => { client.removeQueries({ queryKey: ["site-settings"] }); });
    await act(async () => root.unmount()); root = createRoot(container);
    read.mockRejectedValueOnce(new Error("Initial read failed")); await render();
    expect(saveButton()).toBeDisabled();
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("内容加载失败");
    read.mockResolvedValueOnce(confirmed);
    const retry = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "重试")!;
    await act(async () => retry.click()); await settle();
    expect(saveButton()).toBeEnabled(); expect(save).not.toHaveBeenCalled();
  });
  it("locks same-tick submissions, sends the confirmed version and preserves later edits", async () => {
    read.mockResolvedValue(confirmed); const write = deferred<SiteSettings>(); save.mockReturnValue(write.promise);
    await render(); const input = editBrand("Submitted brand"); const button = saveButton();
    act(() => { button.click(); button.click(); });
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ expectedUpdatedAt: confirmed.updated_at, payload: { brand_name: "Submitted brand" } });
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Later draft"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => write.resolve({ ...confirmed, brand_name: "Submitted brand", updated_at: "2026-10-05T00:01:00Z" })); await settle();
    expect(input.value).toBe("Later draft");
    expect(saveButton()).toBeEnabled();
  });
  it("retains draft and confirmed version after failed refresh and failed save", async () => {
    read.mockResolvedValueOnce(confirmed); await render(); const input = editBrand("Local draft");
    read.mockRejectedValueOnce(new Error("Refresh failed"));
    await act(async () => { await client.refetchQueries({ queryKey: ["site-settings"] }); }); await settle();
    expect(input.value).toBe("Local draft"); expect(saveButton()).toBeEnabled();
    save.mockRejectedValueOnce(new Error("Save failed")); await act(async () => saveButton().click()); await settle();
    expect(input.value).toBe("Local draft");
    expect(save.mock.calls[0][0].expectedUpdatedAt).toBe(confirmed.updated_at);
    expect(container.textContent).toContain("Save failed"); expect(saveButton()).toBeEnabled();
  });
  it("confirms the delivered version after an earlier cache refresh without creating false dirty state", async () => {
    const refreshed = { ...confirmed, updated_at: "2026-10-05T00:01:00+00:00" };
    const delivered = { ...refreshed, updated_at: "2026-10-05T00:01:01.123456+00:00" };
    const pending = deferred<SiteSettings>();
    read.mockResolvedValue(confirmed);
    save.mockImplementation(() => {
      client.setQueryData(["site-settings"], refreshed);
      return pending.promise;
    });
    await render();
    await act(async () => saveButton().click()); await settle();
    await act(async () => pending.resolve(delivered)); await settle();
    expect(container.textContent).toContain("设置已保存");
    expect(container.textContent).not.toContain("有未保存修改");
    save.mockResolvedValue(delivered);
    await act(async () => saveButton().click()); await settle();
    expect(save.mock.calls[1][0].expectedUpdatedAt).toBe(delivered.updated_at);
  });

});
