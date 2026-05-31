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

export const friendlyTranslationError = (message?: string | null) => {
  const raw = String(message || "").trim();
  if (!raw) return "没有错误信息。";
  if (/service role key/i.test(raw)) return "英文生成服务没有配置后台密钥，需要先检查 Supabase Function 环境变量。";
  if (/not enabled for table/i.test(raw)) return "这张表还没有接入自动英文生成。";
  if (/No Chinese fields/i.test(raw)) return "这条内容没有可翻译的中文字段，请先填写中文内容。";
  if (/authorization|jwt|token/i.test(raw)) return "登录状态或权限不正确，请重新登录后台后再试。";
  if (/google translate|translation failed|request failed/i.test(raw)) return "自动翻译服务暂时不可用，可以稍后重试。";
  return raw;
};

export const classifyTranslationFailure = (message?: string | null) => {
  const raw = String(message || "").trim();
  if (!raw) return "未知原因";
  if (/service role key/i.test(raw)) return "服务配置问题";
  if (/not enabled for table/i.test(raw)) return "内容表未接入";
  if (/No Chinese fields/i.test(raw)) return "没有中文源内容";
  if (/authorization|jwt|token|Admin access/i.test(raw)) return "权限或登录问题";
  if (/google translate|translation failed|request failed|fetch|network/i.test(raw)) return "翻译服务不可用";
  return "其它失败";
};
