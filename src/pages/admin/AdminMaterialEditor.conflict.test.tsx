import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminMaterialEditor from "./AdminMaterialEditor";
import { AdminMutationError } from "@/lib/adminMutation";
import { setAdminLang } from "@/lib/adminLocale";

const fixtures = vi.hoisted(() => ({
  loaded: { id: "material-test", slug: "material-test", status: "draft", title_zh: "原正文", title_en: "Original", updated_at: "2026-10-08T01:00:00.000001Z" },
  save: vi.fn(), confirm: vi.fn(), refetch: vi.fn(), toast: vi.fn(),
}));
vi.mock("@/lib/adminBusinessContentQueries", () => ({ useAdminMaterialDetail: () => ({ data: fixtures.loaded, isLoading: false, isInitialError: false, refetch: fixtures.refetch }) }));
vi.mock("@/backend/modules/materials/service/materialService", () => ({
  hasMaterialBackendConfig: () => true, normalizeMaterialSlug: (value: string) => value,
  checkAdminMaterialSlugUnique: async () => true, generateAdminMaterialEnglish: vi.fn(), saveAdminMaterial: fixtures.save,
}));
vi.mock("@/components/admin/AdminConfirmProvider", () => ({ adminConfirm: fixtures.confirm }));
vi.mock("@/hooks/use-toast", () => ({ toast: fixtures.toast }));
vi.mock("@/components/admin/ImageField", () => ({ default: () => null }));
vi.mock("@/pages/admin/AdminMaterialImages", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPermission", () => ({ AdminActionButton: ({ children, action: _action, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { action: string }) => <button {...props}>{children}</button> }));
vi.mock("@/components/admin/AdminStickyActionBar", () => ({ default: ({ left, right, more }: { left?: ReactNode; right?: ReactNode; more?: ReactNode }) => <div>{left}{right}{more}</div> }));

const initial = { ...fixtures.loaded };
const latest = { ...initial, title_zh: "新远端正文", updated_at: "2026-10-08T01:00:00.000002Z" };
const mounted: Array<{ root: Root; container: HTMLDivElement }> = [];
const clients: QueryClient[] = [];
const fireEvent = {
  click(button: HTMLElement) { act(() => button.click()); },
  change(input: HTMLInputElement, options: { target: { value: string } }) {
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, options.target.value);
      input.dispatchEvent(new Event("input", { bubbles: true })); });
  },
};
async function waitFor(assertion: () => void) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { assertion(); return; } catch (error) {
      if (attempt === 49) throw error;
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
    }
  }
}
async function view() {
  const client = new QueryClient(); clients.push(client);
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container); mounted.push({ root, container });
  const element = () => <MemoryRouter initialEntries={["/admin/materials/material-test"]}><QueryClientProvider client={client}><TooltipProvider><Routes><Route path="/admin/materials/:id" element={<AdminMaterialEditor />} /></Routes></TooltipProvider></QueryClientProvider></MemoryRouter>;
  await act(async () => root.render(element()));
  return {
    getByDisplayValue(value: string) { const result = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(item => item.value === value); if (!result) throw new Error(`Missing input ${value}`); return result; },
    getByRole(_role: string, options: { name: string }) { const result = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(item => item.textContent?.trim() === options.name); if (!result) throw new Error(`Missing button ${options.name}`); return result; },
    refresh: async () => { await act(async () => root.render(element())); },
  };
}
function action() {
  return fixtures.toast.mock.calls.map(([value]) => value.action as ReactElement<{ onClick: () => void }> | undefined).find(Boolean)!;
}
async function conflict(result: Awaited<ReturnType<typeof view>>) {
  fireEvent.change(result.getByDisplayValue("原正文"), { target: { value: "未保存正文" } });
  fireEvent.click(result.getByRole("button", { name: "保存草稿" }));
  await waitFor(() => expect(action()).toBeDefined());
}
async function reload() { await act(async () => { action().props.onClick(); }); }

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixtures.loaded = { ...initial }; fixtures.save.mockReset(); fixtures.confirm.mockReset(); fixtures.refetch.mockReset(); fixtures.toast.mockReset();
  fixtures.save.mockRejectedValue(new AdminMutationError("conflict", "conflict", "write", { reason: "stale" }));
  fixtures.confirm.mockResolvedValue(true); fixtures.refetch.mockResolvedValue({ data: latest, isError: false });
  setAdminLang("zh");
});
afterEach(async () => { for (const { root, container } of mounted.splice(0)) { await act(async () => root.unmount()); container.remove(); } clients.splice(0).forEach(client => client.clear()); vi.unstubAllGlobals(); });

describe("material editor gallery version conflict recovery", () => {
  it("keeps the dirty draft and its baseline on background gallery parent-version changes", async () => {
    const result = await view(); await conflict(result);
    fixtures.loaded = latest; await result.refresh();
    expect(result.getByDisplayValue("未保存正文")).toBeDefined();
    expect(fixtures.save.mock.calls[0][0].record.updated_at).toBe(initial.updated_at);
    expect(fixtures.refetch).not.toHaveBeenCalled();
  });
  it("does not discard the draft when the explicit reload is cancelled", async () => {
    const result = await view(); await conflict(result); fixtures.confirm.mockResolvedValue(false); await reload();
    expect(fixtures.refetch).not.toHaveBeenCalled(); expect(result.getByDisplayValue("未保存正文")).toBeDefined();
  });
  it("applies the confirmed fresh record and version, without re-saving the failed request", async () => {
    const result = await view(); await conflict(result); await reload();
    expect(result.getByDisplayValue("新远端正文")).toBeDefined();
    expect(fixtures.save).toHaveBeenCalledOnce();
    fireEvent.click(result.getByRole("button", { name: "保存草稿" }));
    await waitFor(() => expect(fixtures.save).toHaveBeenCalledTimes(2));
    expect(fixtures.save.mock.calls[1][0].record.updated_at).toBe(latest.updated_at);
  });
  it("retains the draft and old version if the approved read fails", async () => {
    const result = await view(); await conflict(result); fixtures.refetch.mockResolvedValue({ data: initial, isError: true, error: new Error("Read failed") }); await reload();
    expect(result.getByDisplayValue("未保存正文")).toBeDefined();
    expect(fixtures.toast.mock.calls.at(-1)?.[0].title).toBe("加载失败");
  });
  it("keeps input typed during the reload and adopts only the confirmed fresh baseline", async () => {
    const result = await view(); await conflict(result);
    let resolve!: (value: unknown) => void;
    fixtures.refetch.mockReturnValue(new Promise(done => { resolve = done; }));
    await reload();
    fireEvent.change(result.getByDisplayValue("未保存正文"), { target: { value: "读取期间新增正文" } });
    await act(async () => { resolve({ data: latest, isError: false }); });
    expect(result.getByDisplayValue("读取期间新增正文")).toBeDefined();
    fireEvent.click(result.getByRole("button", { name: "保存草稿" }));
    await waitFor(() => expect(fixtures.save).toHaveBeenCalledTimes(2));
    expect(fixtures.save.mock.calls[1][0].record).toMatchObject({ title_zh: "读取期间新增正文", updated_at: latest.updated_at });
  });
});
