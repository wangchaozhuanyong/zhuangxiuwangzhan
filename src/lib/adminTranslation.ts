import { generateAdminEnglishContent as generateEnglishContent, requestPublicContentInvalidation,
  type GenerateEnglishContentRequest, type GenerateEnglishContentResponse } from "@/backend/modules/system";
import { getPublicSyncIssues, registerPublicSyncIssue, resolvePublicSyncIssue, type PublicSyncIssue } from "@/lib/publicSyncRecovery";
import { adminTranslationErrorsText } from "@/i18n/adminTranslationErrorsText";
import { interactionText } from "@/i18n/interactionText";
import { getAdminLang, type AdminLang } from "@/lib/adminLocale";

export function translationDeliveryNotice(
  result: Pick<GenerateEnglishContentResponse, "warnings"> & { publicSyncPending?: boolean } | undefined,
  lang: AdminLang = getAdminLang(),
) {
  return [
    result?.warnings?.includes("Translation job status could not be confirmed.") ? adminTranslationErrorsText[lang].jobPending : "",
    result?.publicSyncPending ? interactionText[lang].savedSyncPending : "",
  ].filter(Boolean).join(" ") || undefined;
}

/** Browser delivery adapter. A retry never repeats an already saved translation. */
export async function completeAdminTranslationDelivery<T extends GenerateEnglishContentResponse>(
  input: GenerateEnglishContentRequest, generate: () => Promise<T>,
): Promise<T & { publicSyncPending: boolean }> {
  const { table, id } = input;
  const key = `translation:${table}:${id}`;
  const previousIssue = getPublicSyncIssues().find((issue) => issue.key === key) || null;
  const result = await generate();
  const delivery = result?.cache_invalidation;
  const publicSyncPending = Boolean(delivery && (delivery.ok !== true || delivery.edge_purge_requested?.ok !== true));
  if (publicSyncPending) {
    const issue: PublicSyncIssue = { key, retry: async () => {
      const synced = await requestPublicContentInvalidation({ table, id, action: "translation" });
      if (synced.cache_invalidation?.edge_purge_requested?.ok !== true) {
        throw new Error("Public website update is still pending.");
      }
      resolvePublicSyncIssue(key, issue);
    } };
    registerPublicSyncIssue(issue);
  } else if (delivery) {
    resolvePublicSyncIssue(key, previousIssue);
  }
  return { ...result, publicSyncPending };
}

export function generateAdminEnglishContent(input: GenerateEnglishContentRequest) {
  return completeAdminTranslationDelivery(input, () => generateEnglishContent(input));
}

export const translationEnabledTables = [
  "services",
  "projects",
  "project_images",
  "blog_posts",
  "materials",
  "testimonials",
  "hero_slides",
  "service_areas",
  "landing_pages",
  "home_sections",
  "about_sections",
  "faqs",
  "cta_blocks",
  "site_pages",
  "cms_pages",
  "cms_sections",
  "cms_content_entries",
] as const;

export const translationTableLabels: Record<string, string> = {
  services: "服务项目",
  projects: "装修案例",
  project_images: "案例图片",
  blog_posts: "博客文章",
  materials: "材料库",
  testimonials: "客户评价",
  hero_slides: "首页轮播",
  service_areas: "服务区域",
  landing_pages: "落地页",
  home_sections: "首页模块",
  about_sections: "关于我们模块",
  faqs: "常见问题",
  cta_blocks: "行动引导模块",
  site_pages: "旧页面内容",
  cms_pages: "通用 CMS 页面",
  cms_sections: "通用 CMS 模块",
  cms_content_entries: "通用内容库",
};

export const englishMissingHint = "英文未生成。英文站会优先使用英文字段；如果没有英文，可能显示空内容或最后兜底内容。建议点“保存并自动生成英文”。";

export const autoEnglishDescription = "这里是自动生成的英文内容，可手动微调。默认折叠，平时主要维护中文即可。";

export const isBlankTranslationValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

export const hasAnyMissingEnglish = (record: Record<string, unknown>, fields: string[]) =>
  fields.some((field) => isBlankTranslationValue(record[field]));

export const translationFailureKind = (message?: string | null): keyof typeof adminTranslationErrorsText.zh.groups => {
  const raw = String(message || "").trim();
  if (!raw) return "empty";
  if (/protected (?:placeholder|HTML)|protected HTML or placeholders/i.test(raw)) return "protection";
  if (/invalid page links/i.test(raw)) return "links";
  if (/content (?:has changed|version is unavailable)/i.test(raw)) return "conflict";
  if (/approved content publishing workflow/i.test(raw)) return "workflow";
  if (/Malay content fields|unsupported translation language/i.test(raw)) return "language";
  if (/job could not be started/i.test(raw)) return "start";
  if (/service role key/i.test(raw)) return "configuration";
  if (/not enabled for table/i.test(raw)) return "unsupported";
  if (/No Chinese fields/i.test(raw)) return "source";
  if (/authorization|jwt|token|Admin access|editor access|assurance|MFA/i.test(raw)) return "access";
  if (/google translate|translation failed|request failed|fetch|network/i.test(raw)) return "provider";
  return "unknown";
};

export const friendlyTranslationError = (message?: string | null, lang: AdminLang = getAdminLang()) =>
  adminTranslationErrorsText[lang][translationFailureKind(message)];

export const classifyTranslationFailure = (message?: string | null, lang: AdminLang = getAdminLang()) =>
  adminTranslationErrorsText[lang].groups[translationFailureKind(message)];
