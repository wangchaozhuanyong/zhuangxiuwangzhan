import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLeadDetail from "./AdminLeadDetail";
import AdminQuoteDetail from "./AdminQuoteDetail";

const mocks = vi.hoisted(() => ({ read: vi.fn(), update: vi.fn(), add: vi.fn(), warn: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/backend/modules/leads/service/leadService", () => ({
  loadAdminLeadDetail: mocks.read, updateAdminLead: mocks.update, addAdminLeadFollowup: mocks.add,
  loadAdminLeadReportRows: vi.fn(), loadAdminLeads: vi.fn(),
}));
vi.mock("@/backend/modules/quotes/service/quoteService", () => ({
  loadAdminQuoteDetail: mocks.read, updateAdminQuote: mocks.update, addAdminQuoteFollowup: mocks.add,
}));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: mocks.warn }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminPermission", () => ({
  useAdminPermission: () => ({ allowed: true }),
  AdminActionButton: ({ action: _action, ...props }: ComponentProps<"button"> & { action: string }) => <button {...props} />,
}));
vi.mock("@/lib/adminLocale", async (original) => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => "zh" }));

let root: Root, container: HTMLDivElement, client: QueryClient;
const initial = { id: "fixture", name: "Synthetic customer", status: "new", notes: "Before", next_follow_up_at: null, created_at: "2026-10-01T00:00:00Z", updated_at: "version-1" };
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
function edit(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function blur(element: HTMLElement) { act(() => element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))); }
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.values(mocks).forEach(mock => mock.mockReset());
  mocks.read.mockResolvedValue({ lead: initial, followups: [] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/admin/leads/fixture"]}><Routes><Route path="/admin/leads/:id" element={<AdminLeadDetail />} /></Routes></MemoryRouter></QueryClientProvider>));
  await settle();
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("CRM save recovery", () => {
  it.each(["lead", "quote"] as const)("round trips %s reminder inputs through an absolute instant and retries that instant", async (kind) => {
    const stored = "2026-10-24T02:30:00.000Z";
    const local = "2026-10-24T10:30";
    vi.stubEnv("TZ", "Asia/Kuala_Lumpur");
    const record = { ...initial, next_follow_up_at: stored, customer_name: "Synthetic customer" };
    mocks.read.mockResolvedValue({ [kind]: record, followups: [] });
    const path = kind === "lead" ? "leads" : "quotes";
    await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter key={kind} initialEntries={[`/admin/${path}/fixture`]}><Routes><Route path={`/admin/${path}/:id`} element={kind === "lead" ? <AdminLeadDetail /> : <AdminQuoteDetail />} /></Routes></MemoryRouter></QueryClientProvider>));
    await settle();
    const reminder = container.querySelector<HTMLInputElement>(`#${kind}-nextFollowUp`)!;
    expect(reminder.value).toBe(local);
    mocks.update.mockResolvedValue({ ...record, next_follow_up_at: "2026-10-24T03:45:00.000Z", updated_at: "version-2" });
    edit(reminder, "2026-10-24T11:45"); blur(reminder); await settle();
    expect(mocks.update).toHaveBeenLastCalledWith("fixture", { next_follow_up_at: "2026-10-24T03:45:00.000Z" }, "version-1");
    mocks.add.mockResolvedValue({ syncError: new Error("Synthetic sync failure") });
    edit(container.querySelector<HTMLTextAreaElement>(`#${kind}-followup-content`)!, "Scheduled followup");
    edit(container.querySelector<HTMLInputElement>(`#${kind}-followup-next`)!, local);
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); await settle();
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ nextFollowUpAt: stored }));
    const retry = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "重试同步跟进日期")!;
    await act(async () => retry.click()); await settle();
    expect(mocks.update).toHaveBeenLastCalledWith("fixture", { next_follow_up_at: stored }, expect.any(String));
    expect(mocks.add).toHaveBeenCalledOnce();
  });
  it("serializes blur patches with the last acknowledged version and keeps a newer draft", async () => {
    let resolve!: (record: Record<string, unknown>) => void;
    mocks.update.mockImplementationOnce(() => new Promise(done => { resolve = done; }))
      .mockResolvedValueOnce({ ...initial, notes: "Submitted", next_follow_up_at: "2026-10-09T10:00", updated_at: "version-3" });
    const notes = container.querySelector<HTMLTextAreaElement>("#lead-notes")!;
    const date = container.querySelector<HTMLInputElement>("#lead-nextFollowUp")!;
    edit(notes, "Submitted"); blur(notes); await settle();
    expect(mocks.update).toHaveBeenNthCalledWith(1, "fixture", { notes: "Submitted" }, "version-1");
    edit(date, "2026-10-09T10:00"); blur(date);
    edit(date, "2026-10-10T11:00");
    expect(mocks.update).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ...initial, notes: "Submitted", updated_at: "version-2" })); await settle();
    expect(mocks.update).toHaveBeenNthCalledWith(2, "fixture", { next_follow_up_at: new Date("2026-10-09T10:00").toISOString() }, "version-2");
    expect(date.value).toBe("2026-10-10T11:00");
    expect(mocks.warn).toHaveBeenLastCalledWith(true);
  });

  it("shows a saved followup after date sync failure and retries only the date", async () => {
    const savedFollowup = { id: "saved-note", content: "Saved note", followup_type: "note", next_follow_up_at: "2026-10-09T10:00", created_at: initial.created_at };
    mocks.add.mockImplementation(async () => {
      mocks.read.mockResolvedValue({ lead: initial, followups: [savedFollowup] });
      return { syncError: new Error("Date unavailable") };
    });
    edit(container.querySelector<HTMLTextAreaElement>("#lead-followup-content")!, "Saved note");
    edit(container.querySelector<HTMLInputElement>("#lead-followup-next")!, "2026-10-09T10:00");
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); await settle();
    expect(container.textContent).toContain("Saved note");
    expect(container.querySelector<HTMLTextAreaElement>("#lead-followup-content")!.value).toBe("");
    expect(mocks.add).toHaveBeenCalledOnce();
    mocks.update.mockResolvedValue({ ...initial, next_follow_up_at: savedFollowup.next_follow_up_at, updated_at: "version-2" });
    const retry = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "重试同步跟进日期")!;
    await act(async () => retry.click()); await settle();
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith("fixture", { next_follow_up_at: new Date(savedFollowup.next_follow_up_at).toISOString() }, "version-1");
    expect(mocks.add).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain("重试同步跟进日期");
  });
});
