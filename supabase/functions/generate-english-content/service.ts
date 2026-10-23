import { isProtectedContentRecord } from "../_shared/managed-targets.ts";
import { syncPublicContent } from "../_shared/public-content-sync.ts";
import {
  createTranslationJob,
  fetchTranslationRecord,
  requireAdmin,
  updateTranslationRecord,
  TranslationConflictError,
  createTranslationRecordGuard,
  resolveTranslationContentLink,
} from "./repository.ts";
import { isBlankValue, translateValue } from "./translator.ts";
import type { GenerateEnglishClient, GenerateEnglishRequest, GenerateEnglishResult } from "./types.ts";
import { pendingContentPaths, validateContentLinks } from "../_shared/content-links.mjs";

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
  const { table, id, force = false, targetLanguage = "en" } = input;
  if (typeof table !== "string" || typeof id !== "string" || !id || typeof force !== "boolean") {
    return errorResult("Invalid translation request");
  }

  if (targetLanguage !== "en" && targetLanguage !== "ms") return errorResult("Unsupported translation language");
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

  if (isProtectedContentRecord(table, record)) {
    return errorResult("This content requires the approved content publishing workflow.", 403);
  }
  const guard = createTranslationRecordGuard(table, record, targetLanguage);
  if (!guard) {
    return errorResult("Content version is unavailable. Reload before translating.", 409);
  }
  if (targetLanguage === "ms" && !Object.keys(record).some((key) => key.endsWith("_ms"))) {
    return errorResult("Malay content fields are not available. Apply the Malay content migration first.", 409);
  }
  await createTranslationJob(client, table, id, "processing", undefined, targetLanguage);

  const translatable = Object.fromEntries(
    [
      ...Object.entries(record).filter(([key, value]) => key.endsWith("_zh") && !isBlankValue(value)),
      ...(targetLanguage === "ms" ? Object.entries(record).filter(([key, value]) => key.endsWith("_en") && !isBlankValue(value))
        .map(([key, value]) => [key.replace(/_en$/, "_zh"), value] as [string, unknown]) : []),
    ],
  );
  const expectedKeys = Object.keys(translatable).map((key) => key.replace(/_zh$/, `_${targetLanguage}`));

  if (expectedKeys.length === 0) {
    const message = "No Chinese fields ending with _zh were found to translate";
    await createTranslationJob(client, table, id, "failed", message, targetLanguage);
    return errorResult(message);
  }

  const translatedRaw: Record<string, unknown> = {};

  try {
    for (const [sourceKey, sourceValue] of Object.entries(translatable)) {
      const targetKey = sourceKey.replace(/_zh$/, `_${targetLanguage}`);
      if (!force && !isBlankValue(record[targetKey])) continue;
      if (targetLanguage === "ms" && !(targetKey in record)) continue;
      const englishSource = record[sourceKey.replace(/_zh$/, "_en")];
      translatedRaw[targetKey] = await translateValue(targetLanguage === "ms" && !isBlankValue(englishSource) ? englishSource : sourceValue, targetLanguage);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Translate web translation failed";
    await createTranslationJob(client, table, id, "failed", message, targetLanguage);
    return errorResult(message, 500);
  }

  const translated = Object.fromEntries(Object.entries(translatedRaw).filter(([key]) => expectedKeys.includes(key)));

  if (Object.keys(translated).length === 0) {
    await createTranslationJob(client, table, id, "completed", undefined, targetLanguage);
    return { body: { ok: true, translated: {}, ...(targetLanguage === "en" ? { skipped_existing_english: true as const } : { skipped_existing_translation: true as const }) } };
  }

  try {
    if (record.status === "published") {
      const issues = await validateContentLinks(translated, target => resolveTranslationContentLink(client, target), {
        pendingPaths: pendingContentPaths(table, record),
      });
      if (issues.length) {
        const message = "Translated content has invalid page links. Correct the source links before translating.";
        await createTranslationJob(client, table, id, "failed", message, targetLanguage);
        return errorResult(message, 400);
      }
    }
    await updateTranslationRecord(client, table, id, translated, guard);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await createTranslationJob(client, table, id, "failed", message, targetLanguage);
    return errorResult(message, error instanceof TranslationConflictError ? 409 : 500);
  }

  await createTranslationJob(client, table, id, "completed", undefined, targetLanguage);
  // Child records have no status, so they may belong to a published parent.
  if (record.status === "published" || !("status" in record)) {
    const sync = await syncPublicContent(client, {
      apiToken: Deno.env.get("CLOUDFLARE_API_TOKEN"), zoneId: Deno.env.get("CLOUDFLARE_ZONE_ID"),
    });
    return { body: { ok: true, translated, ...sync } };
  }
  return { body: { ok: true, translated } };
}
