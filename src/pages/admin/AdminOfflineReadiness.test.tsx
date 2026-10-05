import { act, type ComponentProps, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { NotificationSettings } from "@/lib/adminEditorData";
import { adminPromotionsEditorText } from "@/i18n/adminPromotionsEditorText";
import AdminContentEditor from "./AdminContentEditor";
import AdminPromotionsEditor from "./AdminPromotionsEditor";
import AdminNotificationSettings from "./AdminNotificationSettings";

const mocks = vi.hoisted(() => ({ readEditor: vi.fn(), readPages: vi.fn(), readNotifications: vi.fn(), save: vi.fn(), saveNotifications: vi.fn(), testTelegram: vi.fn(), testMaintenance: vi.fn(), toast: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/backend/modules/cms/service/cmsService", () => ({ loadAdminEditorRows: mocks.readEditor, loadAdminSimpleCmsRows: mocks.readPages, generateAdminContentEnglish: vi.fn(async () => null) }));
vi.mock("@/lib/adminEditorData", () => ({ fetchNotificationSettings: mocks.readNotifications, fetchAdminUsers: vi.fn(), fetchTranslationJobs: vi.fn() }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: mocks.save, formatAdminMutationError: () => "Synthetic save failure" }));
vi.mock("@/backend/modules/settings/service/notificationSettingsService", () => ({ saveAdminNotificationSettings: mocks.saveNotifications, testAdminTelegramNotification: mocks.testTelegram, testAdminMaintenanceReminder: mocks.testMaintenance }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminHomeSectionVisibility", () => ({ default: () => null }));
vi.mock("./AdminImageUpload", () => ({ default: () => null, getAdminImagePreviewVariant: () => "cover" }));
vi.mock("./AdminProjectImages", () => ({ default: () => null }));
vi.mock("@/lib/adminLocale", async (original) => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => "zh" }));
vi.mock("@/components/admin/AdminPermission", () => ({
  useAdminPermission: () => ({ allowed: true }), AdminPermissionHint: () => null,
  AdminActionButton: ({ action: _action, showDeniedHint: _hint, variant: _variant, ...props }: ComponentProps<"button"> & { action: string; showDeniedHint?: boolean; variant?: string }) => <button {...props} />,
}));

const row = { id: "confirmed-content", customer_name: "Confirmed fixture", content_en: "Synthetic testimonial", updated_at: "2026-10-05T01:02:03.123456Z", status: "draft" };
const promotion = { id: "confirmed-promotion", page_key: "promotions", title_zh: "已确认优惠", title_en: "Confirmed offer", items_zh: [], items_en: [], updated_at: row.updated_at, status: "draft" };
// Synthetic, non-secret settings only; no credentials or external sends.
const notification: NotificationSettings = { telegram_enabled: true, telegram_bot_token_masked: "", has_telegram_bot_token: true, telegram_chat_id: "synthetic-chat", maintenance_reminders_enabled: true, maintenance_reminder_day: "friday", maintenance_reminder_time: "11:30", maintenance_timezone: "Asia/Singapore", maintenance_last_sent_at: null };
const contentKey = ["admin", "testimonials", "rows", { limit: 50 }];
const promotionKey = ["admin", "site_pages", "rows"];
const notificationKey = ["admin", "notification_settings"];
let root: Root, node: HTMLDivElement, client: QueryClient;
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; }
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function render(Page: ComponentType, path = "/admin/isolated") {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><TooltipProvider><Routes>
    <Route path="/admin/content/:type/:id?" element={<AdminContentEditor />} />
    <Route path="/admin/isolated" element={<Page />} />
  </Routes></TooltipProvider></MemoryRouter></QueryClientProvider>)); await settle();
}
function button(label: string) { return Array.from(node.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent?.trim() === label)!; }
function input(value: string) { return Array.from(node.querySelectorAll<HTMLInputElement>("input")).find((item) => item.value === value)!; }
function edit(element: HTMLInputElement, value: string) {
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value); element.dispatchEvent(new Event("input", { bubbles: true })); });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); onlineManager.setOnline(true);
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.readEditor.mockResolvedValue([row]); mocks.readPages.mockResolvedValue([promotion]); mocks.readNotifications.mockResolvedValue(notification);
  mocks.save.mockImplementation(async (args) => ({ ...args.payload, id: args.id || "created-fixture", updated_at: row.updated_at }));
  mocks.saveNotifications.mockResolvedValue(notification);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); client.clear(); node.remove(); onlineManager.setOnline(true); vi.unstubAllGlobals();
});

describe("content editor confirmed initial read", () => {
  it("blocks editing/saving while offline, then initializes and saves the recovered existing identity", async () => {
    onlineManager.setOnline(false); await render(AdminContentEditor, `/admin/content/testimonials/${row.id}`);
    const fieldset = node.querySelector("fieldset")!; expect(fieldset.disabled).toBe(true);
    const field = fieldset.querySelector<HTMLInputElement>('input:not([readonly])')!; expect(field).toBeDisabled();
    edit(field, "Unconfirmed edit"); await act(async () => button("保存").click()); expect(mocks.save).not.toHaveBeenCalled();
    expect(client.getQueryState(contentKey)?.fetchStatus).toBe("paused");
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(input(row.customer_name)).not.toBeDisabled(); edit(input(row.customer_name), "Confirmed draft");
    await act(async () => button("保存").click()); await settle();
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: row.id, expectedUpdatedAt: row.updated_at, payload: { customer_name: "Confirmed draft" } });
  });

  it("keeps a cached dirty form and existing identity usable during a paused refresh", async () => {
    client.setQueryData(contentKey, [row], { updatedAt: 1 }); onlineManager.setOnline(false);
    await render(AdminContentEditor, `/admin/content/testimonials/${row.id}`);
    expect(client.getQueryState(contentKey)?.fetchStatus).toBe("paused");
    edit(input(row.customer_name), "Cached draft");
    await act(async () => button("保存").click()); await settle();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: row.id, payload: { customer_name: "Cached draft" } });
  });

  it("distinguishes a confirmed empty collection from an unconfirmed or failed read", async () => {
    mocks.readEditor.mockRejectedValueOnce(new Error("Synthetic initial failure"));
    await render(AdminContentEditor, "/admin/content/testimonials");
    expect(node.querySelector("fieldset")).toBeDisabled(); await act(async () => button("保存").click()); expect(mocks.save).not.toHaveBeenCalled();
    mocks.readEditor.mockResolvedValueOnce([]); await act(async () => { await client.refetchQueries({ queryKey: contentKey }); }); await settle();
    expect(node.querySelector("fieldset")).not.toBeDisabled(); await act(async () => button("新建记录").click());
    await act(async () => button("保存").click()); expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: undefined, payload: { status: "draft" } });
  });
});

describe("promotions confirmed initial read", () => {
  it("waits offline and uses the recovered stored ID rather than inserting a default draft", async () => {
    onlineManager.setOnline(false); await render(AdminPromotionsEditor);
    expect(node.querySelector('[role="status"]')).toHaveTextContent(adminPromotionsEditorText.zh.loading); expect(node.querySelector("input")).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled(); await act(async () => onlineManager.setOnline(true)); await settle();
    edit(input(promotion.title_zh), "恢复后编辑优惠"); await act(async () => button(adminPromotionsEditorText.zh.save).click()); await settle();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: promotion.id, expectedUpdatedAt: promotion.updated_at, payload: { title_zh: "恢复后编辑优惠" } });
  });

  it("disables unconfirmed failed defaults and permits creation after a confirmed empty collection", async () => {
    mocks.readPages.mockRejectedValueOnce(new Error("Synthetic initial failure")); await render(AdminPromotionsEditor);
    expect(node.querySelector("fieldset")).toBeDisabled(); expect(button(adminPromotionsEditorText.zh.save)).toBeDisabled();
    const field = node.querySelector<HTMLInputElement>("fieldset input")!; edit(field, "Unconfirmed promotion");
    await act(async () => button(adminPromotionsEditorText.zh.save).click()); expect(mocks.save).not.toHaveBeenCalled();
    mocks.readPages.mockResolvedValueOnce([]); await act(async () => { await client.refetchQueries({ queryKey: promotionKey }); }); await settle();
    expect(node.querySelector("fieldset")).not.toBeDisabled(); expect(button(adminPromotionsEditorText.zh.save)).not.toBeDisabled();
    await act(async () => button(adminPromotionsEditorText.zh.save).click()); expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: undefined, payload: { page_key: "promotions" } });
    expect(mocks.save.mock.calls[0]![0].payload.title_zh).not.toBe("Unconfirmed promotion");
  });

  it("preserves a confirmed dirty promotion during a paused background refresh", async () => {
    client.setQueryData(promotionKey, [promotion], { updatedAt: 1 }); onlineManager.setOnline(false); await render(AdminPromotionsEditor);
    expect(client.getQueryState(promotionKey)?.fetchStatus).toBe("paused"); edit(input(promotion.title_zh), "缓存优惠草稿");
    await act(async () => button(adminPromotionsEditorText.zh.save).click()); await settle();
    expect(mocks.save.mock.calls[0]![0]).toMatchObject({ id: promotion.id, payload: { title_zh: "缓存优惠草稿" } });
  });
});

describe("notification settings confirmed initial read", () => {
  it.each([true, false])("blocks unconfirmed controls (online=%s), then retains confirmed fields and a paused draft", async (online) => {
    const pending = deferred<NotificationSettings>(); mocks.readNotifications.mockReturnValueOnce(pending.promise);
    onlineManager.setOnline(online); await render(AdminNotificationSettings);
    expect(node.querySelector("#maintenance-time")).toBeDisabled(); expect(node.querySelector("#maintenance-enabled")).toBeDisabled();
    expect(node.querySelector("#maintenance-timezone")).toBeDisabled(); expect(node.querySelector("#include-monthly")).toBeDisabled();
    expect(node.querySelector('[role="combobox"]')).toBeDisabled(); expect(button("保存设置")).toBeDisabled(); expect(button("发送提醒")).toBeDisabled();
    await act(async () => button("保存设置").click()); expect(mocks.saveNotifications).not.toHaveBeenCalled();
    await act(async () => onlineManager.setOnline(true)); await settle(); await act(async () => pending.resolve(notification)); await settle();
    const time = node.querySelector<HTMLInputElement>("#maintenance-time")!; expect(time.value).toBe(notification.maintenance_reminder_time); expect(time).not.toBeDisabled();
    edit(time, "12:00"); onlineManager.setOnline(false);
    await act(async () => { void client.invalidateQueries({ queryKey: notificationKey }); }); await settle();
    expect(client.getQueryState(notificationKey)?.fetchStatus).toBe("paused"); expect(time.value).toBe("12:00"); expect(time).not.toBeDisabled();
    await act(async () => button("保存设置").click()); await settle();
    expect(mocks.saveNotifications).toHaveBeenCalledOnce();
    expect(mocks.saveNotifications.mock.calls[0]![0]).toMatchObject({ telegram_enabled: true, telegram_bot_token: "", telegram_chat_id: notification.telegram_chat_id, maintenance_reminder_day: "friday", maintenance_reminder_time: "12:00", maintenance_timezone: "Asia/Singapore" });
    expect(mocks.testTelegram).not.toHaveBeenCalled(); expect(mocks.testMaintenance).not.toHaveBeenCalled();
  });

  it("keeps an initial failed configuration read unavailable", async () => {
    mocks.readNotifications.mockRejectedValueOnce(new Error("Synthetic initial failure")); await render(AdminNotificationSettings);
    expect(node.querySelector("#telegram-chat-id")).toBeDisabled(); expect(node.querySelector("#maintenance-time")).toBeDisabled();
    expect(button("保存设置")).toBeDisabled(); await act(async () => button("保存设置").click());
    expect(mocks.saveNotifications).not.toHaveBeenCalled(); expect(mocks.testMaintenance).not.toHaveBeenCalled();
  });

  it("allows configuration of a successfully confirmed empty settings object", async () => {
    mocks.readNotifications.mockResolvedValueOnce({}); await render(AdminNotificationSettings);
    expect(node.querySelector("#maintenance-time")).not.toBeDisabled(); expect(button("保存设置")).not.toBeDisabled();
    await act(async () => button("保存设置").click()); expect(mocks.saveNotifications).toHaveBeenCalledOnce();
  });
});
