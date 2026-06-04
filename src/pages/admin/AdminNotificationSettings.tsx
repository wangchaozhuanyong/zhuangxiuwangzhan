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

const copy = {
  en: {
    notifications: "Notifications",
    leadAlerts: "Telegram Lead Alerts",
    leadDesc: "Configure Telegram Bot API alerts for contact leads and quote requests. The bot token is stored server-side and only a masked value is shown after saving.",
    savedToken: "Saved token",
    noToken: "No bot token saved",
    loading: "Loading notification settings...",
    enableLead: "Enable Telegram notifications",
    enableLeadDesc: "When enabled, new website form submissions will be sent to Telegram.",
    botToken: "Telegram Bot Token",
    botTokenPlaceholder: "Paste BotFather token",
    keepTokenPlaceholder: "Leave blank to keep current token",
    chatId: "Telegram Chat ID",
    chatIdPlaceholder: "Example: 123456789 or -1001234567890",
    saving: "Saving...",
    save: "Save Settings",
    sending: "Sending...",
    test: "Send Test Message",
    ops: "Operations",
    maintenance: "Website Maintenance Reminders",
    maintenanceDesc: "Send the weekly website maintenance checklist to Telegram. The reminder includes lead status, pending quote status, content counts, SEO checks, and monthly content tasks when selected.",
    lastSent: "Last sent",
    enableMaintenance: "Enable maintenance reminders",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    dayLabel: "发送日期",
    timeLabel: "发送时间",
    timezoneLabel: "时区",
    includeMonthly: "包含月度任务",
    saveTip: "开关和输入项改完后，需要点击“保存设置”才会写入数据库。",
    monthlyTip: "“包含月度任务”只用于发送测试提醒，不会保存到数据库。",
    cronNotice: "This page saves the preferred reminder day, time, and timezone. Automatic delivery still needs an external scheduler such as GitHub Actions, Cloudflare Cron, or a Supabase scheduled caller.",
    missingTelegramConfig: "Add a Telegram Bot Token and Chat ID before enabling Telegram notifications.",
    invalidMaintenanceTime: "Use a valid reminder time in HH:mm format, for example 09:00.",
    invalidMaintenanceTimezone: "Use a valid timezone name, for example Asia/Kuala_Lumpur.",
    sendReminder: "Send Reminder",
    testFailed: "Test failed",
    saveFailed: "Failed to save Telegram settings",
    loadFailed: "Failed to load notification settings",
    testSent: "Telegram test message sent",
    saved: "Telegram settings saved",
    maintenanceTestFailed: "Maintenance reminder test failed",
    maintenanceSent: "Maintenance reminder sent",
  },
  zh: {
    notifications: "通知",
    leadAlerts: "Telegram 咨询提醒",
    leadDesc: "配置 Telegram Bot API，用来接收客户咨询和报价请求提醒。机器人令牌会保存在服务端，保存后后台只显示部分遮罩内容。",
    savedToken: "已保存令牌",
    noToken: "还没有保存机器人令牌",
    loading: "正在加载通知设置...",
    enableLead: "启用 Telegram 通知",
    enableLeadDesc: "启用后，新的官网表单提交会发送到 Telegram。",
    botToken: "Telegram 机器人令牌",
    botTokenPlaceholder: "粘贴 BotFather 给你的令牌",
    keepTokenPlaceholder: "留空表示继续使用当前令牌",
    chatId: "Telegram 聊天 ID",
    chatIdPlaceholder: "例如：123456789 或 -1001234567890",
    saving: "保存中...",
    save: "保存设置",
    sending: "发送中...",
    test: "发送测试消息",
    ops: "运维",
    maintenance: "网站维护提醒",
    maintenanceDesc: "把每周的网站维护清单发送到 Telegram。提醒内容会包含咨询状态、待处理报价、内容数量、SEO 检查，以及可选的月度内容任务。",
    lastSent: "上次发送",
    enableMaintenance: "启用维护提醒",
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六",
    sunday: "周日",
    dayLabel: "发送日期",
    timeLabel: "发送时间",
    timezoneLabel: "时区",
    includeMonthly: "包含月度任务",
    saveTip: "开关和输入项改完后，需要点击“保存设置”才会写入数据库。",
    monthlyTip: "“包含月度任务”只用于发送测试提醒，不会保存到数据库。",
    cronNotice: "这里会保存你偏好的提醒日期、时间和时区；真正自动发送还需要外部定时任务来调用，例如 GitHub Actions、Cloudflare Cron 或 Supabase 定时调用。",
    missingTelegramConfig: "要启用 Telegram 通知，必须先填写 Telegram Bot Token 和 Chat ID。",
    invalidMaintenanceTime: "维护提醒时间格式不正确，请使用 09:00 这种 HH:mm 格式。",
    invalidMaintenanceTimezone: "维护提醒时区不正确，请使用 Asia/Kuala_Lumpur 这种时区名称。",
    sendReminder: "发送提醒",
    testFailed: "测试失败",
    saveFailed: "保存 Telegram 设置失败",
    loadFailed: "加载通知设置失败",
    testSent: "Telegram 测试消息已发送",
    saved: "Telegram 设置已保存",
    maintenanceTestFailed: "维护提醒测试失败",
    maintenanceSent: "维护提醒已发送",
  },
};

const AdminNotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: remoteSettings, isLoading, error, refetch } = useAdminNotificationSettings();
  const settingsPermission = useAdminPermission("settings.write");
  const lang = getAdminLang();
  const t = copy[lang];
  const canManageSettings = settingsPermission.allowed;
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

  const markDirty = () => {
    formDirtyRef.current = true;
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

  const saveSettings = async () => {
    if (!canManageSettings) return;

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

      applyNotificationForm(nextSettings || emptySettings);
      setSaving(false);
      toast({ title: t.saved });
      void queryClient.invalidateQueries({ queryKey: ["admin", "notification_settings"] });
      await refetch();
    } catch (error) {
      toast({ title: t.saveFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!canManageSettings) return;
    setTesting(true);
    try {
      await testAdminTelegramNotification();
      setTesting(false);
      toast({ title: t.testSent });
    } catch (error) {
      toast({ title: t.testFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setTesting(false);
    }
  };

  const testMaintenanceReminder = async () => {
    if (!canManageSettings) return;
    setTestingMaintenance(true);
    try {
      await testAdminMaintenanceReminder(includeMonthly);
      setTestingMaintenance(false);
      toast({ title: t.maintenanceSent });
    } catch (error) {
      toast({ title: t.maintenanceTestFailed, description: formatUserFacingError(error, lang), variant: "destructive" });
      setTestingMaintenance(false);
    }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={t.notifications}
        description="设置 Telegram 通知、维护提醒和测试消息。"
        helpText="这里控制哪些后台事件会发到 Telegram，比如新咨询、报价请求和每周维护提醒。"
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
                checked={enabled}
                disabled={!canManageSettings}
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
                disabled={!canManageSettings}
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
                disabled={!canManageSettings}
                placeholder={t.chatIdPlaceholder}
                onChange={(event) => {
                  markDirty();
                  setChatId(event.target.value);
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t.saveTip}</p>
            <div data-admin-mobile-actions className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <AdminActionButton action="settings.write" onClick={saveSettings} disabled={saving || testing} showDeniedHint={false}>
                {saving ? t.saving : t.save}
              </AdminActionButton>
              <AdminActionButton action="settings.write" variant="outline" onClick={testTelegram} disabled={saving || testing || !settings.has_telegram_bot_token || !settings.telegram_chat_id} showDeniedHint={false}>
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
          <p className="mt-3 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
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
              checked={maintenanceEnabled}
              disabled={!canManageSettings}
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
              disabled={!canManageSettings}
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
              disabled={!canManageSettings}
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
              disabled={!canManageSettings}
              onChange={(e) => {
                markDirty();
                setMaintenanceTimezone(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="include-monthly" checked={includeMonthly} disabled={!canManageSettings} onCheckedChange={setIncludeMonthly} />
            <Label htmlFor="include-monthly">{t.includeMonthly}</Label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t.monthlyTip}</p>
        <div data-admin-mobile-actions className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <AdminActionButton action="settings.write" onClick={saveSettings} disabled={saving || testingMaintenance} showDeniedHint={false}>
            {saving ? t.saving : t.save}
          </AdminActionButton>
          <AdminActionButton action="settings.write" variant="outline" onClick={testMaintenanceReminder} disabled={testingMaintenance} showDeniedHint={false}>
            {testingMaintenance ? t.sending : t.sendReminder}
          </AdminActionButton>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
