import {
  createTranslationJob,
  fetchTranslationRecord,
  requireAdmin,
  updateTranslationRecord,
} from "./repository.ts";
import { isBlankValue, translateValue } from "./translator.ts";
import type { GenerateEnglishClient, GenerateEnglishRequest, GenerateEnglishResult } from "./types.ts";

const allowedTables = new Set([
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
]);

const errorResult = (error: string | null, status = 400): GenerateEnglishResult => ({ status, body: { error } });

export async function generateEnglishContent(
  req: Request,
  input: GenerateEnglishRequest,
  client: GenerateEnglishClient,
): Promise<GenerateEnglishResult> {
  const { table, id, force = false } = input;

  const adminCheck = await requireAdmin(req, client);
  if (!adminCheck.ok) {
    return errorResult(adminCheck.error, adminCheck.status);
  }

  if (!allowedTables.has(table)) {
    return errorResult(`Translation is not enabled for table: ${table}`);
  }

  let record: Record<string, unknown>;
  try {
    record = await fetchTranslationRecord(client, table, id);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : String(error));
  }

  await createTranslationJob(client, table, id, "processing");

  const translatable = Object.fromEntries(
    Object.entries(record).filter(([key, value]) => key.endsWith("_zh") && value !== null && value !== undefined && value !== ""),
  );
  const expectedKeys = Object.keys(translatable).map((key) => key.replace(/_zh$/, "_en"));

  if (expectedKeys.length === 0) {
    const message = "No Chinese fields ending with _zh were found to translate";
    await createTranslationJob(client, table, id, "failed", message);
    return errorResult(message);
  }

  const translatedRaw: Record<string, unknown> = {};

  try {
    for (const [sourceKey, sourceValue] of Object.entries(translatable)) {
      const targetKey = sourceKey.replace(/_zh$/, "_en");
      if (!force && !isBlankValue(record[targetKey])) continue;
      translatedRaw[targetKey] = await translateValue(sourceValue);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Translate web translation failed";
    await createTranslationJob(client, table, id, "failed", message);
    return errorResult(message, 500);
  }

  const translated = Object.fromEntries(Object.entries(translatedRaw).filter(([key]) => expectedKeys.includes(key)));

  if (Object.keys(translated).length === 0) {
    await createTranslationJob(client, table, id, "completed");
    return { body: { ok: true, translated: {}, skipped_existing_english: true } };
  }

  try {
    await updateTranslationRecord(client, table, id, translated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await createTranslationJob(client, table, id, "failed", message);
    return errorResult(message);
  }

  await createTranslationJob(client, table, id, "completed");
  return { body: { ok: true, translated } };
}
