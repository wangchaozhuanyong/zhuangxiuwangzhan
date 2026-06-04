import type { NotificationSettings } from "@/lib/adminEditorData";
import {
  invokeMaintenanceReminderFunction,
  invokeNotificationSettingsFunction,
  type SaveNotificationSettingsRequest,
} from "@/backend/modules/settings/repository/notificationSettingsRepository";

export type SaveAdminNotificationSettingsInput = Omit<SaveNotificationSettingsRequest, "action">;

export async function saveAdminNotificationSettings(input: SaveAdminNotificationSettingsInput) {
  const data = await invokeNotificationSettingsFunction({
    action: "save",
    ...input,
  });

  return (data as { settings?: NotificationSettings })?.settings;
}

export function testAdminTelegramNotification() {
  return invokeNotificationSettingsFunction({ action: "test" });
}

export function testAdminMaintenanceReminder(includeMonthly: boolean) {
  return invokeMaintenanceReminderFunction({
    test: true,
    include_monthly: includeMonthly,
  });
}
