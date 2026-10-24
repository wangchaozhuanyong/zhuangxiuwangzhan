import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAdminLang } from "@/lib/adminLocale";
import AdminNotificationSettings from "./AdminNotificationSettings";

const fixture = vi.hoisted(() => ({ toast: vi.fn(), telegram: vi.fn(), maintenance: vi.fn(), settings: {
  telegram_enabled: true, telegram_bot_token_masked: "********", has_telegram_bot_token: true, telegram_chat_id: "fixture-recipient",
  maintenance_reminders_enabled: true, maintenance_reminder_day: "monday", maintenance_reminder_time: "09:00", maintenance_timezone: "Asia/Kuala_Lumpur", maintenance_last_sent_at: null,
} }));
vi.mock("@/lib/adminSystemQueries", () => ({ useAdminNotificationSettings: () => ({ data: fixture.settings, isLoading: false, error: null }) }));
vi.mock("@/pages/admin/AdminAuthProvider", () => ({ useAdminAuth: () => ({ role: "super_admin", isSuperAdmin: true, userId: "synthetic-user" }) }));
vi.mock("@/backend/modules/settings/service/notificationSettingsService", () => ({ saveAdminNotificationSettings: vi.fn(), testAdminTelegramNotification: fixture.telegram, testAdminMaintenanceReminder: fixture.maintenance }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: fixture.toast }) }));
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => { fixture.toast.mockReset(); fixture.telegram.mockReset().mockResolvedValue({ ok: true }); fixture.maintenance.mockReset().mockResolvedValue({ ok: true }); container = document.createElement("div"); document.body.append(container); root = createRoot(container); client = new QueryClient(); });
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); setAdminLang("zh"); });
const mount = async (lang: "zh" | "en") => { setAdminLang(lang); await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><TooltipProvider><AdminNotificationSettings /></TooltipProvider></MemoryRouter></QueryClientProvider>)); };
const click = async (name: string) => { const button = [...container.querySelectorAll("button")].find(x => x.textContent?.trim() === name); expect(button).toBeDefined(); expect(button?.disabled).toBe(false); await act(async () => button!.click()); return button!; };

describe("notification settings localized completion feedback", () => {
  it("renders English labels, descriptions and opened help without Chinese UI", async () => {
    await mount("en"); expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/);
    await act(async () => (container.querySelector("[data-admin-page-header] button") as HTMLButtonElement).focus());
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });
  it.each(["zh", "en"] as const)("%s confirms request acceptance without claiming recipient delivery", async lang => {
    await mount(lang); await click(lang === "zh" ? "发送测试消息" : "Send Test Message");
    expect(fixture.telegram).toHaveBeenCalledOnce(); const title = fixture.toast.mock.calls.at(-1)?.[0].title;
    expect(title).toMatch(lang === "zh" ? /已接受/ : /accepted/i); expect(title).not.toMatch(lang === "zh" ? /已发送|已送达/ : /message sent|delivered/i);
  });
  it.each(["zh", "en"] as const)("%s shows a failed maintenance test and permits correction/retry", async lang => {
    fixture.maintenance.mockRejectedValue(new Error("Notification acknowledgement could not be verified"));
    await mount(lang); const button = await click(lang === "zh" ? "发送提醒" : "Send Reminder");
    expect(fixture.toast).toHaveBeenLastCalledWith(expect.objectContaining({ variant: "destructive", title: lang === "zh" ? "维护提醒测试失败" : "Maintenance reminder test failed" })); expect(button.disabled).toBe(false);
  });
});
