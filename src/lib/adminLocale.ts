import { translateStatusLabel } from "@/i18n/displayLabels";
import { getAdminLang } from "@/lib/adminPreferences";
export * from "@/lib/adminPreferences";

export const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;

export const publishStatusOptions = () =>
  PUBLISH_STATUSES.map((value) => ({
    value,
    label: translateStatusLabel("default", value, getAdminLang()),
  }));

export const adminStatusLabel = (table: string, status: string) =>
  translateStatusLabel(table, status, getAdminLang());
