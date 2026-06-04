import { ensureAdminDefaultContent } from "@/lib/adminDefaultContent";
import {
  ensureAboutSectionRecord,
  ensureHomeSectionRecord,
  fetchAboutEditorCtaBlock,
  fetchHomeEditorAuxiliaryRows,
  hasAdminEditorDatabaseClient,
} from "@/backend/modules/cms/repository/adminEditorRepository";
import {
  fetchAdminUserRows,
  fetchTranslationJobRows,
  fetchTranslationLabelRows,
  invokeNotificationSettingsGet,
} from "@/backend/modules/system/repository/adminSystemDataRepository";

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
  record_label?: string | null;
  status: string | null;
  error_message: string | null;
  regenerated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  role: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  version?: number | null;
};

async function ensureHomeSection(section_key: string): Promise<HomeSectionRow | null> {
  const row = await ensureHomeSectionRecord(section_key);
  return (row as HomeSectionRow | null) || null;
}

async function ensureAboutSection(section_key: string): Promise<AboutSectionRow | null> {
  const row = await ensureAboutSectionRecord(section_key);
  return (row as AboutSectionRow | null) || null;
}

export async function fetchAdminHomeEditorData(): Promise<AdminHomeEditorData> {
  if (!hasAdminEditorDatabaseClient()) {
    return { stats: null, why: null, processSteps: [], faqRows: [], ctaBlock: null };
  }

  await ensureAdminDefaultContent();

  const [stats, why, auxiliary] = await Promise.all([
    ensureHomeSection("stats"),
    ensureHomeSection("why_choose_us"),
    fetchHomeEditorAuxiliaryRows(),
  ]);

  return {
    stats,
    why,
    processSteps: (auxiliary.processSteps as ProcessStepRow[]) ?? [],
    faqRows: (auxiliary.faqRows as FaqRow[]) ?? [],
    ctaBlock: (auxiliary.ctaBlock as CtaRow | null) ?? null,
  };
}

export async function fetchAdminAboutEditorData(): Promise<AdminAboutEditorData> {
  if (!hasAdminEditorDatabaseClient()) {
    return { sections: {}, ctaBlock: null };
  }

  await ensureAdminDefaultContent();

  const ensured = await Promise.all(aboutSectionKeys.map((key) => ensureAboutSection(key)));
  const sections: Record<string, AboutSectionRow | null> = {};
  aboutSectionKeys.forEach((key, index) => {
    sections[key] = ensured[index] ?? null;
  });

  const data = await fetchAboutEditorCtaBlock();

  return {
    sections,
    ctaBlock: (data as CtaRow | null) ?? null,
  };
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const data = await invokeNotificationSettingsGet();
  return (data?.settings || {}) as NotificationSettings;
}

export async function fetchTranslationJobs(limit = 100): Promise<TranslationJob[]> {
  const jobs = (await fetchTranslationJobRows(limit)) as TranslationJob[];
  const labelSelects: Record<string, string> = {
    services: "id,title_zh,title_en,slug",
    projects: "id,title_zh,title_en,slug",
    materials: "id,title_zh,title_en,slug",
    blog_posts: "id,title_zh,title_en,slug",
    testimonials: "id,customer_name,content_zh,content_en",
    hero_slides: "id,title_zh,title_en",
    service_areas: "id,title_zh,title_en,area_name,slug",
    landing_pages: "id,title_zh,title_en,slug",
    home_sections: "id,title_zh,title_en,section_key",
    about_sections: "id,title_zh,title_en,section_key",
    faqs: "id,question_zh,question_en,page_key",
    cta_blocks: "id,title_zh,title_en,block_key",
    site_pages: "id,title_zh,title_en,page_key,path",
    cms_pages: "id,title_zh,title_en,page_key,path",
    cms_sections: "id,section_key,section_type,page_id",
    cms_content_entries: "id,title_zh,title_en,entry_type,slug",
    project_images: "id,alt_zh,alt_en,image_type",
  };

  const labels = new Map<string, string>();
  await Promise.all(
    Object.entries(labelSelects).map(async ([table, select]) => {
      const ids = jobs.filter((job) => job.table_name === table && job.record_id).map((job) => job.record_id as string);
      if (ids.length === 0) return;
      const rows = await fetchTranslationLabelRows(table, select, ids);
      for (const row of rows) {
        const label =
          row.title_zh ||
          row.title_en ||
          row.question_zh ||
          row.question_en ||
          row.customer_name ||
          row.area_name ||
          row.alt_zh ||
          row.alt_en ||
          row.section_key ||
          row.block_key ||
          row.page_key ||
          row.slug ||
          row.path ||
          row.entry_type ||
          row.image_type;
        if (label) labels.set(`${table}:${row.id}`, String(label));
      }
    }),
  );

  return jobs.map((job) => ({
    ...job,
    record_label: job.table_name && job.record_id ? labels.get(`${job.table_name}:${job.record_id}`) || null : null,
  }));
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  return (await fetchAdminUserRows()) as AdminUserRow[];
}
