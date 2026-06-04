import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type MaintenanceClient = SupabaseClient;

export type TelegramSettings = {
  telegram_enabled?: boolean;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  maintenance_reminders_enabled?: boolean;
  maintenance_reminder_day?: string;
  maintenance_reminder_time?: string;
  maintenance_timezone?: string;
  maintenance_last_sent_at?: string | null;
};

export type ReminderItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  frequency: "weekly" | "monthly";
  sort_order: number;
};

export type MaintenanceMetrics = {
  newLeads: number | null;
  newLeadsOlderThan24h: number | null;
  pendingQuotes: number | null;
  pendingQuotesOlderThan24h: number | null;
  leadsThisWeek: number | null;
  quotesThisWeek: number | null;
  publishedProjects: number | null;
  publishedBlogs: number | null;
  publishedMaterials: number | null;
  publishedAreas: number | null;
};

export type MaintenanceReminderInput = {
  includeMonthly: boolean;
  isTest: boolean;
  mode: string;
};

export type DeliveryResult = {
  skipped?: boolean;
  ok?: boolean;
  reason?: string;
  error?: string;
};

export type MaintenanceReminderResult = {
  status?: number;
  body: Record<string, unknown>;
};
