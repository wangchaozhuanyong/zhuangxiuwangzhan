import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminActionButton, AdminPermissionHint, useAdminPermission } from "@/components/admin/AdminPermission";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { NotificationSettings } from "@/lib/adminEditorData";
import { useAdminNotificationSettings } from "@/lib/adminSystemQueries";
import { getAdminLang } from "@/lib/adminLocale";
import { adminNotificationSettingsText as copy } from "@/i18n/adminNotificationSettingsText";
import {
  saveAdminNotificationSettings,
  testAdminMaintenanceReminder,
  testAdminTelegramNotification,
} from "@/backend/modules/settings/service/notificationSettingsService";
import { formatUserFacingError } from "@/lib/userFacingText";

const emptySettings: NotificationSettings = {
  telegram_enabled: false,
  telegram_bot_token_masked: "",
  has_telegram_bot_token: false,
  telegram_chat_id: "",
  maintenance_reminders_enabled: true,
  maintenance_reminder_day: "monday",
  maintenance_reminder_time: "09:00",
  maintenance_timezone: "Asia/Kuala_Lumpur",
  maintenance_last_sent_at: null,
};



const AdminNotificationSettings = () => {
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: remoteSettings, isLoading, error } = useAdminNotificationSettings();
  const settingsPermission = useAdminPermission("settings.write");
  const lang = getAdminLang();
  const t = copy[lang];
  const canManageSettings = settingsPermission.allowed;
  const hasConfirmedSettings = remoteSettings !== undefined;
  const canEditSettings = canManageSettings && hasConfirmedSettings;
  const [settings, setSettings] = useState<NotificationSettings>(emptySettings);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true);
  const [maintenanceDay, setMaintenanceDay] = useState("monday");
  const [maintenanceTime, setMaintenanceTime] = useState("09:00");
  const [maintenanceTimezone, setMaintenanceTimezone] = useState("Asia/Kuala_Lumpur");
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingMaintenance, setTestingMaintenance] = useState(false);
  const formDirtyRef = useRef(false);
  const revision = useRef(0);
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty || saving || isSubmitting);

  const markDirty = () => {
    formDirtyRef.current = true;
    revision.current += 1;
    setDirty(true);
  };

  const applyNotificationForm = (nextSettings: NotificationSettings) => {
    setSettings(nextSettings);
    setEnabled(Boolean(nextSettings.telegram_enabled));
    setChatId(nextSettings.telegram_chat_id || "");
    setMaintenanceEnabled(nextSettings.maintenance_reminders_enabled ?? true);
    setMaintenanceDay(nextSettings.maintenance_reminder_day || "monday");
    setMaintenanceTime(nextSettings.maintenance_reminder_time || "09:00");
    setMaintenanceTimezone(nextSettings.maintenance_timezone || "Asia/Kuala_Lumpur");
    setBotToken("");
    formDirtyRef.current = false;
    setDirty(false);
  };

  useEffect(() => {
    if (error) {
      toast({ title: t.loadFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
    }
  }, [error, lang, toast, t.loadFailed]);

  useEffect(() => {
    if (!remoteSettings || formDirtyRef.current) return;
    applyNotificationForm(remoteSettings);
  }, [remoteSettings]);

  const saveSettings = protectSubmission("saveSettings", async () => {
    if (!canManageSettings || !hasConfirmedSettings) return;

    if (enabled && (!chatId.trim() || (!botToken.trim() && !settings.has_telegram_bot_token))) {
      toast({ title: t.saveFailed, description: t.missingTelegramConfig, variant: "destructive" });
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(maintenanceTime.trim())) {
      toast({ title: t.saveFailed, description: t.invalidMaintenanceTime, variant: "destructive" });
      return;
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: maintenanceTimezone.trim() }).format(new Date());
    } catch {
      toast({ title: t.saveFailed, description: t.invalidMaintenanceTimezone, variant: "destructive" });
      return;
    }

    setSaving(true);
    const submittedRevision = revision.current;
    try {
      const nextSettings = await saveAdminNotificationSettings({
        telegram_enabled: enabled,
        telegram_bot_token: botToken,
        telegram_chat_id: chatId.trim(),
        maintenance_reminders_enabled: maintenanceEnabled,
        maintenance_reminder_day: maintenanceDay,
        maintenance_reminder_time: maintenanceTime.trim(),
        maintenance_timezone: maintenanceTimezone.trim(),
      });

      if (revision.current === submittedRevision) applyNotificationForm(nextSettings || emptySettings);
      else setSettings(nextSettings || emptySettings);
      setSaving(false);
      toast({ title: t.saved });
      queryClient.setQueryData(["admin", "notification_settings"], nextSettings);
    } catch (error) {
      toast({ title: t.saveFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setSaving(false);
    }
  });

  const testTelegram = protectSubmission("testTelegram", async () => {
    if (!canManageSettings || !hasConfirmedSettings) return;
    setTesting(true);
    try {
      await testAdminTelegramNotification();
      setTesting(false);
      toast({ title: t.testSent });
    } catch (error) {
      toast({ title: t.testFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setTesting(false);
    }
  });

  const testMaintenanceReminder = protectSubmission("testMaintenanceReminder", async () => {
    if (!canManageSettings || !hasConfirmedSettings) return;
    setTestingMaintenance(true);
    try {
      await testAdminMaintenanceReminder(includeMonthly);
      setTestingMaintenance(false);
      toast({ title: t.maintenanceSent });
    } catch (error) {
      toast({ title: t.maintenanceTestFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setTestingMaintenance(false);
    }
  });

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={t.notifications}
        description={t.pageDescription}
        helpText={t.helpText}
      />

      {!canManageSettings && <AdminPermissionHint action="settings.write" />}

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{t.notifications}</p>
            <h2 className="font-display text-2xl font-bold">{t.leadAlerts}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.leadDesc}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
            {settings.has_telegram_bot_token ? `${t.savedToken}: ${settings.telegram_bot_token_masked}` : t.noToken}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{t.loading}</div>
        ) : (
          <div className="grid gap-6 pt-6">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="min-w-0">
                <Label htmlFor="telegram-enabled">{t.enableLead}</Label>
                <p className="mt-1 text-sm text-muted-foreground">{t.enableLeadDesc}</p>
              </div>
              <Switch
                id="telegram-enabled"
                language={lang}
                checked={enabled}
                disabled={!canEditSettings}
                onCheckedChange={(value) => {
                  markDirty();
                  setEnabled(value);
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telegram-bot-token">{t.botToken}</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                value={botToken}
                disabled={!canEditSettings}
                placeholder={settings.has_telegram_bot_token ? t.keepTokenPlaceholder : t.botTokenPlaceholder}
                onChange={(event) => {
                  markDirty();
                  setBotToken(event.target.value);
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telegram-chat-id">{t.chatId}</Label>
              <Input
                id="telegram-chat-id"
                value={chatId}
                disabled={!canEditSettings}
                placeholder={t.chatIdPlaceholder}
                onChange={(event) => {
                  markDirty();
                  setChatId(event.target.value);
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t.saveTip}</p>
            <div data-admin-mobile-actions className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <AdminActionButton action="settings.write" onClick={saveSettings} disabled={!hasConfirmedSettings || saving || testing} showDeniedHint={false}>
                {saving ? t.saving : t.save}
              </AdminActionButton>
              <AdminActionButton action="settings.write" variant="outline" onClick={testTelegram} disabled={!hasConfirmedSettings || saving || testing || !settings.has_telegram_bot_token || !settings.telegram_chat_id} showDeniedHint={false}>
                {testing ? t.sending : t.test}
              </AdminActionButton>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{t.ops}</p>
          <h2 className="font-display text-2xl font-bold">{t.maintenance}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.maintenanceDesc}</p>
          <p className="mt-3 max-w-2xl rounded-lg border px-3 py-2 text-xs leading-5 admin-tone-warning">
            {t.cronNotice}
          </p>
          {settings.maintenance_last_sent_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.lastSent}: {new Date(settings.maintenance_last_sent_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
            <div className="min-w-0">
              <Label htmlFor="maintenance-enabled">{t.enableMaintenance}</Label>
            </div>
            <Switch
              id="maintenance-enabled"
              language={lang}
              checked={maintenanceEnabled}
              disabled={!canEditSettings}
              onCheckedChange={(value) => {
                markDirty();
                setMaintenanceEnabled(value);
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t.dayLabel}</Label>
            <Select
              value={maintenanceDay}
              disabled={!canEditSettings}
              onValueChange={(value) => {
                markDirty();
                setMaintenanceDay(value);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">{t.monday}</SelectItem>
                <SelectItem value="tuesday">{t.tuesday}</SelectItem>
                <SelectItem value="wednesday">{t.wednesday}</SelectItem>
                <SelectItem value="thursday">{t.thursday}</SelectItem>
                <SelectItem value="friday">{t.friday}</SelectItem>
                <SelectItem value="saturday">{t.saturday}</SelectItem>
                <SelectItem value="sunday">{t.sunday}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maintenance-time">{t.timeLabel}</Label>
            <Input
              id="maintenance-time"
              type="time"
              value={maintenanceTime}
              disabled={!canEditSettings}
              onChange={(e) => {
                markDirty();
                setMaintenanceTime(e.target.value);
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maintenance-timezone">{t.timezoneLabel}</Label>
            <Input
              id="maintenance-timezone"
              value={maintenanceTimezone}
              disabled={!canEditSettings}
              onChange={(e) => {
                markDirty();
                setMaintenanceTimezone(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="include-monthly" language={lang} checked={includeMonthly} disabled={!canEditSettings} onCheckedChange={setIncludeMonthly} />
            <Label htmlFor="include-monthly">{t.includeMonthly}</Label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t.monthlyTip}</p>
        <div data-admin-mobile-actions className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <AdminActionButton action="settings.write" onClick={saveSettings} disabled={!hasConfirmedSettings || saving || testingMaintenance} showDeniedHint={false}>
            {saving ? t.saving : t.save}
          </AdminActionButton>
          <AdminActionButton action="settings.write" variant="outline" onClick={testMaintenanceReminder} disabled={!hasConfirmedSettings || testingMaintenance} showDeniedHint={false}>
            {testingMaintenance ? t.sending : t.sendReminder}
          </AdminActionButton>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
