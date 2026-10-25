import type { Language } from "@/i18n/routes";
import { localizedContentValue } from "@/i18n/localizedContentValue";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";
import { toRecord, toText, type UnknownRecord } from "@/lib/recordUtils";

// The shared shell needs CTA records, not every page mapper and fallback dictionary.
const readText = (record: UnknownRecord | null | undefined, field: string, fallback = "") => toText(record?.[field], fallback);

const pickLocalizedValue = <T = unknown>(row: UnknownRecord | null | undefined, field: string, language: Language, fallback: T): T => {
  return localizedContentValue(row, field, language, fallback);
};

const pickLocalizedText = (row: UnknownRecord | null | undefined, field: string, language: Language, fallback = ""): string =>
  toText(pickLocalizedValue(row, field, language, fallback));


export type PublishedCtaBlock = {
  id: string;
  block_key: string;
  title: string;
  description: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
  image_url?: string | null;
};

export const mapPublishedCtaBlockRow = (row: UnknownRecord, language: Language): PublishedCtaBlock => ({
  id: readText(row, "id"),
  block_key: readText(row, "block_key"),
  title: pickLocalizedText(row, "title", language),
  description: pickLocalizedText(row, "description", language),
  primary_label: pickLocalizedText(row, "primary_label", language),
  primary_url: readText(row, "primary_url", "/quote"),
  secondary_label: pickLocalizedText(row, "secondary_label", language),
  secondary_url: readText(row, "secondary_url"),
  image_url: readText(row, "image_url") || null,
});

export const getPublishedCtaBlock = async (language: Language, blockKey: string, signal?: AbortSignal): Promise<PublishedCtaBlock | null> => {

  if (!isSupabaseConfigured) return null;
  const { fetchPublishedCtaBlockRow } = await import("@/backend/modules/cms/repository/publicContentRepository");
  const row = toRecord(await fetchPublishedCtaBlockRow(blockKey, signal));
  if (!Object.keys(row).length) return null;
  return mapPublishedCtaBlockRow(row, language);
};
