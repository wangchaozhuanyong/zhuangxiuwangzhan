export {
  loadAdminHomeEditorData as fetchAdminHomeEditorData,
  type HomeSectionRow,
  type AdminHomeEditorData,
} from "@/backend/modules/home";
export {
  loadAdminAboutEditorData as fetchAdminAboutEditorData,
  aboutSectionKeys,
  type AboutSectionKey,
  type AboutSectionRow,
  type ProcessStepRow,
  type FaqRow,
  type CtaRow,
  type AdminAboutEditorData,
} from "@/backend/modules/company";
import {
  fetchAdminUserRows,
  fetchTranslationJobRows,
  fetchTranslationLabelRows,
  invokeNotificationSettingsGet,
} from "@/backend/modules/system/repository/adminSystemDataRepository";

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

export async function fetchNotificationSettings(signal?: AbortSignal): Promise<NotificationSettings> {
  const data = await invokeNotificationSettingsGet(signal);
  return (data?.settings || {}) as NotificationSettings;
}

export async function fetchTranslationJobs(limit = 100, signal?: AbortSignal): Promise<TranslationJob[]> {
  const jobs = (await fetchTranslationJobRows(limit, signal)) as TranslationJob[];
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
      const rows = await fetchTranslationLabelRows(table, select, ids, signal);
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

export async function fetchAdminUsers(signal?: AbortSignal): Promise<AdminUserRow[]> {
  return (await fetchAdminUserRows(signal)) as AdminUserRow[];
}
