import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";

export type AdminLang = Language;
export type AdminTheme = "light" | "dark";

export const ADMIN_LANG_KEY = "flashcast_admin_lang";
export const ADMIN_THEME_KEY = "flashcast_admin_theme";

const isAdminLang = (value: string | null): value is AdminLang => value === "zh" || value === "en";
const isAdminTheme = (value: string | null): value is AdminTheme => value === "light" || value === "dark";

export const getAdminLang = (): AdminLang => {
  if (typeof window === "undefined") return "zh";
  const stored = window.localStorage.getItem(ADMIN_LANG_KEY);
  return isAdminLang(stored) ? stored : "zh";
};

export const setAdminLang = (language: AdminLang) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_LANG_KEY, language);
};

export const getAdminTheme = (): AdminTheme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(ADMIN_THEME_KEY);
  return isAdminTheme(stored) ? stored : "light";
};

export const setAdminTheme = (theme: AdminTheme) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_THEME_KEY, theme);
};

export const applyAdminTheme = (theme: AdminTheme, language: AdminLang = getAdminLang()) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.adminTheme = theme;
  root.lang = language === "zh" ? "zh-CN" : "en";
  root.classList.toggle("dark", theme === "dark");
};

export const clearAdminTheme = () => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset.adminTheme;
  root.classList.remove("dark");
};

export const adminPublicSitePath = (language: AdminLang = getAdminLang()): "/zh" | "/en" =>
  language === "en" ? "/en" : "/zh";

export const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;

export const publishStatusOptions = () =>
  PUBLISH_STATUSES.map((value) => ({
    value,
    label: translateStatusLabel("default", value, getAdminLang()),
  }));

export const adminStatusLabel = (table: string, status: string) =>
  translateStatusLabel(table, status, getAdminLang());
