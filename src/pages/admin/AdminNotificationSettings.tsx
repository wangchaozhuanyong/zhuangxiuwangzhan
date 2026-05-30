import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { NotificationSettings } from "@/lib/adminEditorData";
import { useAdminNotificationSettings } from "@/lib/adminQueries";
import { getAdminLang } from "@/lib/adminLocale";

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
  const lang = getAdminLang();
  const t = copy[lang];
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
      toast({ title: t.loadFailed, description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    }
  }, [error, toast, t.loadFailed]);

  useEffect(() => {
    if (!remoteSettings || formDirtyRef.current) return;
    applyNotificationForm(remoteSettings);
  }, [remoteSettings]);

  const saveSettings = async () => {
    setSaving(true);
    const { data, error } = await supabase!.functions.invoke("notification-settings", {
      body: {
        action: "save",
        telegram_enabled: enabled,
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        maintenance_reminders_enabled: maintenanceEnabled,
        maintenance_reminder_day: maintenanceDay,
        maintenance_reminder_time: maintenanceTime,
        maintenance_timezone: maintenanceTimezone,
      },
    });

    if (error) {
      toast({ title: t.saveFailed, description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const nextSettings = data.settings || emptySettings;
    applyNotificationForm(nextSettings);
    setSaving(false);
    toast({ title: t.saved });
    void queryClient.invalidateQueries({ queryKey: ["admin", "notification_settings"] });
    await refetch();
  };

  const testTelegram = async () => {
    setTesting(true);
    const { error } = await supabase!.functions.invoke("notification-settings", {
      body: { action: "test" },
    });

    if (error) {
      toast({ title: t.testFailed, description: error.message, variant: "destructive" });
      setTesting(false);
      return;
    }

    setTesting(false);
    toast({ title: t.testSent });
  };

  const testMaintenanceReminder = async () => {
    setTestingMaintenance(true);
    const { error } = await supabase!.functions.invoke("maintenance-reminder", {
      body: { test: true, include_monthly: includeMonthly },
    });

    if (error) {
      toast({ title: t.maintenanceTestFailed, description: error.message, variant: "destructive" });
      setTestingMaintenance(false);
      return;
    }

    setTestingMaintenance(false);
    toast({ title: t.maintenanceSent });
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
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
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="telegram-enabled">{t.enableLead}</Label>
                <p className="mt-1 text-sm text-muted-foreground">{t.enableLeadDesc}</p>
              </div>
              <Switch
                id="telegram-enabled"
                checked={enabled}
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
                placeholder={t.chatIdPlaceholder}
                onChange={(event) => {
                  markDirty();
                  setChatId(event.target.value);
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t.saveTip}</p>
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <Button onClick={saveSettings} disabled={saving || testing}>
                {saving ? t.saving : t.save}
              </Button>
              <Button variant="outline" onClick={testTelegram} disabled={saving || testing || !settings.has_telegram_bot_token || !settings.telegram_chat_id}>
                {testing ? t.sending : t.test}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{t.ops}</p>
          <h2 className="font-display text-2xl font-bold">{t.maintenance}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.maintenanceDesc}</p>
          {settings.maintenance_last_sent_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.lastSent}: {new Date(settings.maintenance_last_sent_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="maintenance-enabled">{t.enableMaintenance}</Label>
            </div>
            <Switch
              id="maintenance-enabled"
              checked={maintenanceEnabled}
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
              value={maintenanceTime}
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
              onChange={(e) => {
                markDirty();
                setMaintenanceTimezone(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="include-monthly" checked={includeMonthly} onCheckedChange={setIncludeMonthly} />
            <Label htmlFor="include-monthly">{t.includeMonthly}</Label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t.monthlyTip}</p>
        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <Button onClick={saveSettings} disabled={saving || testingMaintenance}>
            {saving ? t.saving : t.save}
          </Button>
          <Button variant="outline" onClick={testMaintenanceReminder} disabled={testingMaintenance}>
            {testingMaintenance ? t.sending : t.sendReminder}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
