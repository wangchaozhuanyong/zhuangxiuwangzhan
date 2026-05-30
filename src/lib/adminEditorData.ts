import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ensureAdminDefaultContent } from "@/lib/adminDefaultContent";

export type HomeSectionRow = {
  id?: string;
  updated_at?: string | null;
  section_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  subtitle_zh?: string | null;
  subtitle_en?: string | null;
  content_zh?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  items_zh?: unknown;
  items_en?: unknown;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export type ProcessStepRow = {
  id?: string;
  updated_at?: string | null;
  step_number: number;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  icon_key?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export type FaqRow = {
  id?: string;
  updated_at?: string | null;
  page_key: string;
  question_zh?: string | null;
  answer_zh?: string | null;
  question_en?: string | null;
  answer_en?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export type CtaRow = {
  id?: string;
  updated_at?: string | null;
  block_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  primary_label_zh?: string | null;
  primary_label_en?: string | null;
  primary_url?: string | null;
  secondary_label_zh?: string | null;
  secondary_label_en?: string | null;
  secondary_url?: string | null;
  image_url?: string | null;
  status?: "draft" | "published" | "archived";
};

export type AboutSectionRow = {
  id?: string;
  updated_at?: string | null;
  section_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  subtitle_zh?: string | null;
  subtitle_en?: string | null;
  content_zh?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  items_zh?: unknown;
  items_en?: unknown;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export const aboutSectionKeys = ["hero", "intro", "stats", "core_values", "team", "milestones", "office"] as const;
export type AboutSectionKey = (typeof aboutSectionKeys)[number];

export type AdminHomeEditorData = {
  stats: HomeSectionRow | null;
  why: HomeSectionRow | null;
  processSteps: ProcessStepRow[];
  faqRows: FaqRow[];
  ctaBlock: CtaRow | null;
};

export type AdminAboutEditorData = {
  sections: Record<string, AboutSectionRow | null>;
  ctaBlock: CtaRow | null;
};

export type NotificationSettings = {
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

export type TranslationJob = {
  id: string;
  table_name: string | null;
  record_id: string | null;
  status: string | null;
  error_message: string | null;
  regenerated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function ensureHomeSection(section_key: string): Promise<HomeSectionRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("home_sections").select("*").eq("section_key", section_key).order("sort_order").limit(1);
  if (error) return null;
  const row = (data || [])[0];
  if (row) return row as HomeSectionRow;
  const { data: inserted, error: insertError } = await supabase
    .from("home_sections")
    .insert({ section_key, status: "published", sort_order: 0 })
    .select("*")
    .single();
  if (insertError) return null;
  return inserted as HomeSectionRow;
}

async function ensureAboutSection(section_key: string): Promise<AboutSectionRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("about_sections").select("*").eq("section_key", section_key).order("sort_order").limit(1);
  if (error) return null;
  const row = (data || [])[0];
  if (row) return row as AboutSectionRow;
  const { data: inserted, error: insertError } = await supabase
    .from("about_sections")
    .insert({ section_key, status: "published", sort_order: 0 })
    .select("*")
    .single();
  if (insertError) return null;
  return inserted as AboutSectionRow;
}

export async function fetchAdminHomeEditorData(): Promise<AdminHomeEditorData> {
  if (!isSupabaseConfigured || !supabase) {
    return { stats: null, why: null, processSteps: [], faqRows: [], ctaBlock: null };
  }

  await ensureAdminDefaultContent();

  const [stats, why, steps, faqs, cta] = await Promise.all([
    ensureHomeSection("stats"),
    ensureHomeSection("why_choose_us"),
    supabase.from("process_steps").select("*").order("sort_order").order("step_number"),
    supabase.from("faqs").select("*").eq("page_key", "home").order("sort_order"),
    supabase.from("cta_blocks").select("*").eq("block_key", "home_final").maybeSingle(),
  ]);

  return {
    stats,
    why,
    processSteps: ((steps.data || []) as ProcessStepRow[]) ?? [],
    faqRows: ((faqs.data || []) as FaqRow[]) ?? [],
    ctaBlock: (cta.data as CtaRow | null) ?? null,
  };
}

export async function fetchAdminAboutEditorData(): Promise<AdminAboutEditorData> {
  if (!isSupabaseConfigured || !supabase) {
    return { sections: {}, ctaBlock: null };
  }

  await ensureAdminDefaultContent();

  const ensured = await Promise.all(aboutSectionKeys.map((key) => ensureAboutSection(key)));
  const sections: Record<string, AboutSectionRow | null> = {};
  aboutSectionKeys.forEach((key, index) => {
    sections[key] = ensured[index];
  });

  const { data } = await supabase.from("cta_blocks").select("*").eq("block_key", "about_final").maybeSingle();

  return {
    sections,
    ctaBlock: (data as CtaRow | null) ?? null,
  };
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data, error } = await supabase!.functions.invoke("notification-settings", {
    body: { action: "get" },
  });
  if (error) throw error;
  return (data?.settings || {}) as NotificationSettings;
}

export async function fetchTranslationJobs(limit = 100): Promise<TranslationJob[]> {
  const { data, error } = await supabase!
    .from("translation_jobs")
    .select("id, table_name, record_id, status, error_message, regenerated_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as TranslationJob[];
}

export async function fetchAdminUsers() {
  const { data, error } = await supabase!.from("admin_users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
