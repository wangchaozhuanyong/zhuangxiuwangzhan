import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";

export type AdminLang = Language;

/** 管理后台界面默认使用中文（不跟随浏览器语言切换为英文 UI）。 */
export const getAdminLang = (): AdminLang => "zh";

/** 后台「返回网站」链接默认进入中文版前台。 */
export const adminPublicSitePath = (): "/zh" | "/en" => "/zh";

export const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;

/** 内容发布状态（草稿 / 已发布 / 已归档）下拉选项，显示中文标签。 */
export const publishStatusOptions = () =>
  PUBLISH_STATUSES.map((value) => ({
    value,
    label: translateStatusLabel("default", value, getAdminLang()),
  }));

/** 按业务表翻译状态值（线索、报价、翻译任务等）。 */
export const adminStatusLabel = (table: string, status: string) =>
  translateStatusLabel(table, status, getAdminLang());
