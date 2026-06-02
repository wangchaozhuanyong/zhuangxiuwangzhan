import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";

export type AdminLang = Language;
export type AdminTheme = "light" | "dark";

export const ADMIN_LANG_KEY = "flashcast_admin_lang";
export const ADMIN_THEME_KEY = "flashcast_admin_theme";
const ADMIN_LANG_COOKIE = "flashcast_admin_lang";
const ADMIN_THEME_COOKIE = "flashcast_admin_theme";

let inMemoryAdminLang: AdminLang | null = null;
let inMemoryAdminTheme: AdminTheme | null = null;

const isAdminLang = (value: string | null): value is AdminLang => value === "zh" || value === "en";
const isAdminTheme = (value: string | null): value is AdminTheme => value === "light" || value === "dark";

export const getAdminLang = (): AdminLang => {
  if (isAdminLang(inMemoryAdminLang)) return inMemoryAdminLang;
  const stored = readBrowserPreference(ADMIN_LANG_KEY, ADMIN_LANG_COOKIE);
  if (isAdminLang(stored)) {
    inMemoryAdminLang = stored;
    return stored;
  }
  return "zh";
};

export const setAdminLang = (language: AdminLang) => {
  inMemoryAdminLang = language;
  writeBrowserPreference(ADMIN_LANG_KEY, language, ADMIN_LANG_COOKIE);
};

export const getAdminTheme = (): AdminTheme => {
  if (isAdminTheme(inMemoryAdminTheme)) return inMemoryAdminTheme;
  const stored = readBrowserPreference(ADMIN_THEME_KEY, ADMIN_THEME_COOKIE);
  if (isAdminTheme(stored)) {
    inMemoryAdminTheme = stored;
    return stored;
  }
  return "light";
};

export const setAdminTheme = (theme: AdminTheme) => {
  inMemoryAdminTheme = theme;
  writeBrowserPreference(ADMIN_THEME_KEY, theme, ADMIN_THEME_COOKIE);
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
