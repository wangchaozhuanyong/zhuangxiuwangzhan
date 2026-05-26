import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";

type Settings = {
  telegram_enabled: boolean;
  telegram_bot_token_masked: string;
  has_telegram_bot_token: boolean;
  telegram_chat_id: string;
  maintenance_reminders_enabled: boolean;
  maintenance_reminder_day: string;
  maintenance_reminder_time: string;
  maintenance_timezone: string;
  maintenance_last_sent_at: string | null;
};

const emptySettings: Settings = {
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
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true);
  const [maintenanceDay, setMaintenanceDay] = useState("monday");
  const [maintenanceTime, setMaintenanceTime] = useState("09:00");
  const [maintenanceTimezone, setMaintenanceTimezone] = useState("Asia/Kuala_Lumpur");
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingMaintenance, setTestingMaintenance] = useState(false);

  const loadSettings = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { data, error } = await supabase!.functions.invoke("notification-settings", {
      body: { action: "get" },
    });

    if (error) {
      toast({ title: "Failed to load notification settings", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const nextSettings = data.settings || emptySettings;
    setSettings(nextSettings);
    setEnabled(Boolean(nextSettings.telegram_enabled));
    setChatId(nextSettings.telegram_chat_id || "");
    setMaintenanceEnabled(nextSettings.maintenance_reminders_enabled ?? true);
    setMaintenanceDay(nextSettings.maintenance_reminder_day || "monday");
    setMaintenanceTime(nextSettings.maintenance_reminder_time || "09:00");
    setMaintenanceTimezone(nextSettings.maintenance_timezone || "Asia/Kuala_Lumpur");
    setBotToken("");
    setLoading(false);
  };

  useEffect(() => {
    void loadSettings();
  }, []);

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
      toast({ title: "Failed to save Telegram settings", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const nextSettings = data.settings || emptySettings;
    setSettings(nextSettings);
    setEnabled(Boolean(nextSettings.telegram_enabled));
    setChatId(nextSettings.telegram_chat_id || "");
    setMaintenanceEnabled(nextSettings.maintenance_reminders_enabled ?? true);
    setMaintenanceDay(nextSettings.maintenance_reminder_day || "monday");
    setMaintenanceTime(nextSettings.maintenance_reminder_time || "09:00");
    setMaintenanceTimezone(nextSettings.maintenance_timezone || "Asia/Kuala_Lumpur");
    setBotToken("");
    setSaving(false);
    toast({ title: "Telegram settings saved" });
  };

  const testTelegram = async () => {
    setTesting(true);
    const { error } = await supabase!.functions.invoke("notification-settings", {
      body: { action: "test" },
    });

    if (error) {
      toast({ title: "Telegram test failed", description: error.message, variant: "destructive" });
      setTesting(false);
      return;
    }

    setTesting(false);
    toast({ title: "Telegram test message sent" });
  };

  const testMaintenanceReminder = async () => {
    setTestingMaintenance(true);
    const { error } = await supabase!.functions.invoke("maintenance-reminder", {
      body: { test: true, include_monthly: includeMonthly },
    });

    if (error) {
      toast({ title: "Maintenance reminder test failed", description: error.message, variant: "destructive" });
      setTestingMaintenance(false);
      return;
    }

    setTestingMaintenance(false);
    toast({ title: "Maintenance reminder sent" });
  };

  return (
    <AdminLayout>
      <div className="grid gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Notifications</p>
            <h2 className="font-display text-2xl font-bold">Telegram Lead Alerts</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Configure Telegram Bot API alerts for contact leads and quote requests. The bot token is stored server-side and only a masked value is shown after saving.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
            {settings.has_telegram_bot_token ? `Saved token: ${settings.telegram_bot_token_masked}` : "No bot token saved"}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading notification settings...</div>
        ) : (
          <div className="grid gap-6 pt-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="telegram-enabled">Enable Telegram notifications</Label>
                <p className="mt-1 text-sm text-muted-foreground">When enabled, new website form submissions will be sent to Telegram.</p>
              </div>
              <Switch id="telegram-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telegram-bot-token">Telegram Bot Token</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                value={botToken}
                placeholder={settings.has_telegram_bot_token ? "Leave blank to keep current token" : "Paste BotFather token"}
                onChange={(event) => setBotToken(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telegram-chat-id">Telegram Chat ID</Label>
              <Input
                id="telegram-chat-id"
                value={chatId}
                placeholder="Example: 123456789 or -1001234567890"
                onChange={(event) => setChatId(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <Button onClick={saveSettings} disabled={saving || testing}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              <Button variant="outline" onClick={testTelegram} disabled={saving || testing || !settings.has_telegram_bot_token || !settings.telegram_chat_id}>
                {testing ? "Sending..." : "Send Test Message"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Operations</p>
          <h2 className="font-display text-2xl font-bold">Website Maintenance Reminders</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Send the weekly website maintenance checklist to Telegram. The reminder includes lead status, pending quote status, content counts, SEO checks, and monthly content tasks when selected.
          </p>
          {settings.maintenance_last_sent_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last sent: {new Date(settings.maintenance_last_sent_at).toLocaleString()}
            </p>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading maintenance reminder settings...</div>
        ) : (
          <div className="grid gap-6 pt-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="maintenance-enabled">Enable maintenance reminders</Label>
                <p className="mt-1 text-sm text-muted-foreground">When enabled, scheduled calls to the reminder function can send the checklist to Telegram.</p>
              </div>
              <Switch id="maintenance-enabled" checked={maintenanceEnabled} onCheckedChange={setMaintenanceEnabled} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Reminder day</Label>
                <Select value={maintenanceDay} onValueChange={setMaintenanceDay}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maintenance-time">Reminder time</Label>
                <Input id="maintenance-time" type="time" value={maintenanceTime} onChange={(event) => setMaintenanceTime(event.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select value={maintenanceTimezone} onValueChange={setMaintenanceTimezone}>
                  <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kuala_Lumpur">Malaysia</SelectItem>
                    <SelectItem value="Asia/Shanghai">China</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="include-monthly">Include monthly content tasks in test</Label>
                <p className="mt-1 text-sm text-muted-foreground">Use this when you want Telegram to include blog, case study, material, and location page reminders.</p>
              </div>
              <Switch id="include-monthly" checked={includeMonthly} onCheckedChange={setIncludeMonthly} />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <Button onClick={saveSettings} disabled={saving || testingMaintenance}>
                {saving ? "Saving..." : "Save Reminder Settings"}
              </Button>
              <Button
                variant="outline"
                onClick={testMaintenanceReminder}
                disabled={saving || testingMaintenance || !settings.has_telegram_bot_token || !settings.telegram_chat_id}
              >
                {testingMaintenance ? "Sending..." : "Send Maintenance Test"}
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationSettings;
