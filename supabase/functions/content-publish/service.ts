import {
  archiveRecordsByField,
  fetchRecordByField,
  fetchRecordsByField,
  fetchServiceById,
  fetchServiceBySlug,
  insertContentRecord,
  insertAdminAuditLog,
  insertServiceRecord,
  updateContentRecord,
  updateServiceRecord,
} from "./repository.ts";
import type { ContentPublishClient, ContentPublishRequest, ContentPublishResult, ContentRow, ContentStatus } from "./types.ts";

const CONTENT_WRITE_ROLES = new Set(["super_admin", "content_editor"]);
const VALID_STATUSES = new Set<ContentStatus>(["draft", "published", "archived"]);
const READONLY_FIELDS = new Set(["created_at", "updated_at", "version"]);
const HOMEPAGE_ALLOWED_PAGE_KEYS = new Set(["home"]);
const HOMEPAGE_ALLOWED_PATHS = new Set(["/"]);
const HOMEPAGE_ALLOWED_CTA_KEYS = new Set(["home_final"]);
const HOMEPAGE_ALLOWED_SECTION_KEYS = new Set(["stats", "why_choose_us"]);
const SERVICE_FIELDS = new Set([
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "image_url",
  "alt_zh",
  "alt_en",
  "suitable_for_zh",
  "suitable_for_en",
  "common_projects_zh",
  "common_projects_en",
  "process_steps_zh",
  "process_steps_en",
  "scope_items_zh",
  "scope_items_en",
  "faqs_zh",
  "faqs_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "sort_order",
]);
const SITE_PAGE_FIELDS = new Set([
  "id",
  "page_key",
  "path",
  "title_zh",
  "title_en",
  "subtitle_zh",
  "subtitle_en",
  "description_zh",
  "description_en",
  "content_zh",
  "content_en",
  "cta_title_zh",
  "cta_title_en",
  "cta_description_zh",
  "cta_description_en",
  "image_url",
  "alt_zh",
  "alt_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "seo_keywords_zh",
  "seo_keywords_en",
  "items_zh",
  "items_en",
  "status",
  "sort_order",
]);
const CTA_BLOCK_FIELDS = new Set([
  "id",
  "block_key",
  "title_zh",
  "title_en",
  "description_zh",
  "description_en",
  "primary_label_zh",
  "primary_label_en",
  "primary_url",
  "secondary_label_zh",
  "secondary_label_en",
  "secondary_url",
  "image_url",
  "status",
]);
const HOME_SECTION_FIELDS = new Set([
  "id",
  "section_key",
  "title_zh",
  "title_en",
  "subtitle_zh",
  "subtitle_en",
  "content_zh",
  "content_en",
  "image_url",
  "button_label_zh",
  "button_label_en",
  "button_url",
  "items_zh",
  "items_en",
  "status",
  "sort_order",
]);

type PublishContext = {
  adminUserId?: string | null;
  role?: string | null;
  authMode?: string | null;
};

const normalizeSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const cleanText = (value: unknown, max = 8000) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

const cleanList = (value: unknown, maxItems = 40) => (Array.isArray(value) ? value.slice(0, maxItems) : []);

const cleanLines = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 40) : [];

const cleanProcessSteps = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            title: cleanText(row.title, 180) || "",
            desc: cleanText(row.desc, 1200) || "",
          };
        })
        .filter((item) => item.title || item.desc)
        .slice(0, 20)
    : [];

const cleanFaqs = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            q: cleanText(row.q, 240) || "",
            a: cleanText(row.a, 1600) || "",
          };
        })
        .filter((item) => item.q || item.a)
        .slice(0, 30)
    : [];

const normalizeDate = (value?: unknown) => {
  if (!value) return "";
  const time = new Date(String(value)).getTime();
  return Number.isNaN(time) ? String(value) : String(time);
};

const hasMediaPlaceholder = (value: unknown) => JSON.stringify(value).includes("NEEDS_MEDIA_UPLOAD:");

const isSafeImageUrl = (value: unknown) => {
  const text = cleanText(value, 1000);
  if (!text) return true;
  return text.startsWith("/") || text.startsWith("https://") || text.startsWith("http://localhost");
};

const isSafeActionUrl = (value: unknown) => {
  const text = cleanText(value, 1000);
  if (!text) return true;
  return text.startsWith("/") || text.startsWith("https://") || text.startsWith("mailto:") || text.startsWith("tel:");
};

const errorResult = (error: string, status = 400, extra: Record<string, unknown> = {}): ContentPublishResult => ({
  status,
  body: { ok: false, error, ...extra },
});

function cleanServicePayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const warnings: string[] = [];
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!SERVICE_FIELDS.has(key)) {
      warnings.push(`Ignored unsupported service field: ${key}`);
      continue;
    }
    payload[key] = value;
  }

  const slug = normalizeSlug(payload.slug || payload.title_zh || payload.title_en);
  if (!slug) throw new Error("Service slug or title is required.");
  payload.slug = slug;

  const status = nextStatus || payload.status || "draft";
  if (!VALID_STATUSES.has(status as ContentStatus)) throw new Error("Invalid service status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "excerpt_zh", "excerpt_en", "alt_zh", "alt_en"]) {
    payload[key] = cleanText(payload[key], key.startsWith("excerpt") ? 500 : 220);
  }
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 80000);
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  payload.image_url = cleanText(payload.image_url, 1000);

  for (const key of ["suitable_for_zh", "suitable_for_en", "common_projects_zh", "common_projects_en", "scope_items_zh", "scope_items_en"]) {
    payload[key] = cleanLines(payload[key]);
  }
  payload.process_steps_zh = cleanProcessSteps(payload.process_steps_zh);
  payload.process_steps_en = cleanProcessSteps(payload.process_steps_en);
  payload.faqs_zh = cleanFaqs(payload.faqs_zh);
  payload.faqs_en = cleanFaqs(payload.faqs_en);

  if (payload.sort_order !== undefined && payload.sort_order !== null) {
    const parsed = Number(payload.sort_order);
    payload.sort_order = Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }

  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("image_url must be empty, site-relative, HTTPS, or localhost for local testing.");

  return { payload, slug, warnings };
}

type HomepageTablePayload = {
  key: string;
  payload: Record<string, unknown>;
};

type CleanedHomepagePayload = {
  sitePage?: HomepageTablePayload;
  ctaBlocks: HomepageTablePayload[];
  homeSections: HomepageTablePayload[];
  faqs: Record<string, unknown>[];
  replaceFaqs: boolean;
  warnings: string[];
};

const cleanStatus = (value: unknown, nextStatus: ContentStatus) => {
  const status = (value || nextStatus || "draft") as ContentStatus;
  if (!VALID_STATUSES.has(status)) throw new Error("Invalid homepage status.");
  return status;
};

const cleanSortOrder = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

function cleanAllowedFields(
  input: Record<string, unknown>,
  allowedFields: Set<string>,
  warnings: string[],
  label: string,
) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!allowedFields.has(key)) {
      warnings.push(`Ignored unsupported ${label} field: ${key}`);
      continue;
    }
    payload[key] = value;
  }
  return payload;
}

function cleanSitePage(input: unknown, nextStatus: ContentStatus, warnings: string[]): HomepageTablePayload | undefined {
  if (input === undefined || input === null) return undefined;
  const record = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
  if (!record) throw new Error("homepage.sitePage must be an object.");
  const payload = cleanAllowedFields(record, SITE_PAGE_FIELDS, warnings, "site_page");
  const pageKey = cleanText(payload.page_key || "home", 80) || "home";
  const path = cleanText(payload.path || "/", 120) || "/";
  if (!HOMEPAGE_ALLOWED_PAGE_KEYS.has(pageKey) || !HOMEPAGE_ALLOWED_PATHS.has(path)) {
    throw new Error("Homepage publish only supports page_key=home and path=/.");
  }
  payload.page_key = pageKey;
  payload.path = path;
  payload.status = cleanStatus(payload.status, nextStatus);

  for (const key of [
    "title_zh",
    "title_en",
    "subtitle_zh",
    "subtitle_en",
    "description_zh",
    "description_en",
    "cta_title_zh",
    "cta_title_en",
    "cta_description_zh",
    "cta_description_en",
    "alt_zh",
    "alt_en",
  ]) {
    payload[key] = cleanText(payload[key], key.startsWith("description") || key.startsWith("cta_description") ? 700 : 240);
  }
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 20000);
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  for (const key of ["seo_keywords_zh", "seo_keywords_en"]) payload[key] = cleanText(payload[key], 500);
  payload.image_url = cleanText(payload.image_url, 1000);
  payload.items_zh = cleanList(payload.items_zh);
  payload.items_en = cleanList(payload.items_en);

  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;

  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("sitePage.image_url must be empty, site-relative, HTTPS, or localhost for local testing.");

  return { key: pageKey, payload };
}

function cleanCtaBlock(input: unknown, nextStatus: ContentStatus, warnings: string[]): HomepageTablePayload {
  const record = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
  if (!record) throw new Error("homepage.ctaBlocks items must be objects.");
  const payload = cleanAllowedFields(record, CTA_BLOCK_FIELDS, warnings, "cta_block");
  const blockKey = cleanText(payload.block_key || "home_final", 120) || "home_final";
  if (!HOMEPAGE_ALLOWED_CTA_KEYS.has(blockKey)) throw new Error("Homepage publish only supports cta block_key=home_final.");
  payload.block_key = blockKey;
  payload.status = cleanStatus(payload.status, nextStatus);
  for (const key of ["title_zh", "title_en", "primary_label_zh", "primary_label_en", "secondary_label_zh", "secondary_label_en"]) {
    payload[key] = cleanText(payload[key], 240);
  }
  for (const key of ["description_zh", "description_en"]) payload[key] = cleanText(payload[key], 900);
  for (const key of ["primary_url", "secondary_url", "image_url"]) payload[key] = cleanText(payload[key], 1000);
  if (!isSafeActionUrl(payload.primary_url) || !isSafeActionUrl(payload.secondary_url)) {
    throw new Error("CTA URLs must be empty, site-relative, HTTPS, mailto, or tel links.");
  }
  if (!isSafeImageUrl(payload.image_url)) throw new Error("ctaBlock.image_url must be empty, site-relative, HTTPS, or localhost for local testing.");
  return { key: blockKey, payload };
}

function cleanHomeSection(input: unknown, nextStatus: ContentStatus, warnings: string[]): HomepageTablePayload {
  const record = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
  if (!record) throw new Error("homepage.homeSections items must be objects.");
  const payload = cleanAllowedFields(record, HOME_SECTION_FIELDS, warnings, "home_section");
  const sectionKey = cleanText(payload.section_key, 120) || "";
  if (!HOMEPAGE_ALLOWED_SECTION_KEYS.has(sectionKey)) {
    throw new Error("Homepage publish only supports home section_key=stats or why_choose_us.");
  }
  payload.section_key = sectionKey;
  payload.status = cleanStatus(payload.status, nextStatus);
  for (const key of ["title_zh", "title_en", "subtitle_zh", "subtitle_en", "button_label_zh", "button_label_en"]) {
    payload[key] = cleanText(payload[key], 240);
  }
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 3000);
  for (const key of ["button_url", "image_url"]) payload[key] = cleanText(payload[key], 1000);
  payload.items_zh = cleanList(payload.items_zh);
  payload.items_en = cleanList(payload.items_en);
  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;
  if (!isSafeActionUrl(payload.button_url)) throw new Error("homeSection.button_url must be empty, site-relative, HTTPS, mailto, or tel links.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("homeSection.image_url must be empty, site-relative, HTTPS, or localhost for local testing.");
  return { key: sectionKey, payload };
}

function cleanHomepageFaqs(input: unknown, nextStatus: ContentStatus) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new Error("homepage.faqs must be an array.");
  return input
    .map((item, index) => {
      const row = item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
      const questionZh = cleanText(row.question_zh ?? row.q_zh ?? row.qZh, 260);
      const questionEn = cleanText(row.question_en ?? row.q_en ?? row.q, 260);
      const answerZh = cleanText(row.answer_zh ?? row.a_zh ?? row.aZh, 1800);
      const answerEn = cleanText(row.answer_en ?? row.a_en ?? row.a, 1800);
      if ((!questionZh && !questionEn) || (!answerZh && !answerEn)) return null;
      const sortOrder = cleanSortOrder(row.sort_order) ?? (index + 1) * 10;
      return {
        page_key: "home",
        question_zh: questionZh || questionEn,
        question_en: questionEn || questionZh,
        answer_zh: answerZh || answerEn,
        answer_en: answerEn || answerZh,
        status: cleanStatus(row.status, nextStatus),
        sort_order: sortOrder,
      };
    })
    .filter(Boolean)
    .slice(0, 12) as Record<string, unknown>[];
}

function cleanHomepagePayload(record: Record<string, unknown>, nextStatus: ContentStatus): CleanedHomepagePayload {
  const warnings: string[] = [];
  const sitePage = cleanSitePage(record.sitePage ?? record.site_page ?? record.page, nextStatus, warnings);
  const ctaBlocks = cleanList(record.ctaBlocks ?? record.cta_blocks, 3).map((item) => cleanCtaBlock(item, nextStatus, warnings));
  const homeSections = cleanList(record.homeSections ?? record.home_sections, 4).map((item) => cleanHomeSection(item, nextStatus, warnings));
  const faqs = cleanHomepageFaqs(record.faqs, nextStatus);
  const replaceFaqs = record.replaceFaqs === true || record.replace_faqs === true;

  if (!sitePage && !ctaBlocks.length && !homeSections.length && !faqs.length) {
    throw new Error("Homepage publish requires sitePage, ctaBlocks, homeSections, or faqs.");
  }
  if (faqs.length && !replaceFaqs) {
    warnings.push("Homepage FAQs will be inserted without archiving existing home FAQs unless replaceFaqs=true.");
  }
  if (hasMediaPlaceholder({ sitePage, ctaBlocks, homeSections, faqs })) {
    throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  }

  return { sitePage, ctaBlocks, homeSections, faqs, replaceFaqs, warnings };
}

async function resolveExistingService(client: ContentPublishClient, payload: Record<string, unknown>, slug: string) {
  const id = typeof payload.id === "string" ? payload.id : "";
  if (id) return fetchServiceById(client, id);
  return fetchServiceBySlug(client, slug);
}

const upsertByKey = async (
  client: ContentPublishClient,
  table: string,
  keyField: string,
  item: HomepageTablePayload,
) => {
  const existing = await fetchRecordByField(client, table, keyField, item.key);
  const payload = { ...item.payload };
  delete payload.id;
  const saved = existing?.id
    ? await updateContentRecord(client, table, String(existing.id), payload)
    : await insertContentRecord(client, table, payload);
  return {
    table,
    key: item.key,
    action: existing ? "update" : "insert",
    existing,
    saved,
  };
};

async function publishHomepageContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: "dry-run" | "publish",
  nextStatus: ContentStatus,
): Promise<ContentPublishResult> {
  let cleaned: CleanedHomepagePayload;
  try {
    cleaned = cleanHomepagePayload(input.record || {}, nextStatus);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Invalid homepage payload");
  }

  const existingSitePage = cleaned.sitePage ? await fetchRecordByField(client, "site_pages", "page_key", cleaned.sitePage.key) : null;
  const existingFaqs = cleaned.faqs.length ? await fetchRecordsByField(client, "faqs", "page_key", "home") : [];
  const existingCtaBlocks = await Promise.all(cleaned.ctaBlocks.map((item) => fetchRecordByField(client, "cta_blocks", "block_key", item.key)));
  const existingHomeSections = await Promise.all(cleaned.homeSections.map((item) => fetchRecordByField(client, "home_sections", "section_key", item.key)));

  const expectedUpdatedAt = input.expectedUpdatedAt || (typeof input.record?.updated_at === "string" ? input.record.updated_at : "");
  if (existingSitePage && expectedUpdatedAt && normalizeDate(existingSitePage.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    return errorResult("This homepage site page was changed by someone else. Refresh before publishing.", 409, {
      currentUpdatedAt: existingSitePage.updated_at || null,
    });
  }

  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: "homepage",
    page_key: "home",
    path: "/",
    status: nextStatus,
    action: "publish-homepage",
    warnings: cleaned.warnings,
    next_steps: [
      "Regenerate SEO manifest/sitemap/llms after approved homepage publish.",
      "Verify /zh and /en homepage title, meta, H1/hero, FAQ, CTA, and schema in a real browser.",
      "Run publish receipt/QA before deployment or production cache verification.",
    ],
    auth_mode: context.authMode || "admin",
  };

  if (mode === "dry-run") {
    return {
      body: {
        ...commonBody,
        payload_preview: {
          site_page: cleaned.sitePage
            ? {
                action: existingSitePage ? "update" : "insert",
                payload: cleaned.sitePage.payload,
              }
            : null,
          faqs: {
            action: cleaned.replaceFaqs ? "archive_existing_and_insert" : "insert",
            existing_published_count: existingFaqs.filter((row) => row.status === "published").length,
            payload: cleaned.faqs,
          },
          cta_blocks: cleaned.ctaBlocks.map((item, index) => ({
            action: existingCtaBlocks[index] ? "update" : "insert",
            payload: item.payload,
          })),
          home_sections: cleaned.homeSections.map((item, index) => ({
            action: existingHomeSections[index] ? "update" : "insert",
            payload: item.payload,
          })),
        },
      },
    };
  }

  const savedRecords: Array<Record<string, unknown>> = [];
  const auditWarnings: string[] = [];
  const audit = async (
    tableName: string,
    action: string,
    recordId: string | null,
    oldValue: ContentRow | ContentRow[] | null,
    newValue: ContentRow | ContentRow[] | null,
  ) => {
    try {
      await insertAdminAuditLog(client, {
        adminUserId: context.adminUserId || null,
        action,
        tableName,
        recordId,
        oldValue,
        newValue,
      });
    } catch (error) {
      auditWarnings.push(error instanceof Error ? error.message : "Audit log failed");
    }
  };

  if (cleaned.sitePage) {
    const result = await upsertByKey(client, "site_pages", "page_key", cleaned.sitePage);
    savedRecords.push({ table: result.table, key: result.key, action: result.action, saved_id: result.saved.id || null });
    await audit("site_pages", `homepage_${result.action}`, String(result.saved.id || result.existing?.id || ""), result.existing, result.saved);
  }

  for (const item of cleaned.ctaBlocks) {
    const result = await upsertByKey(client, "cta_blocks", "block_key", item);
    savedRecords.push({ table: result.table, key: result.key, action: result.action, saved_id: result.saved.id || null });
    await audit("cta_blocks", `homepage_${result.action}`, String(result.saved.id || result.existing?.id || ""), result.existing, result.saved);
  }

  for (const item of cleaned.homeSections) {
    const result = await upsertByKey(client, "home_sections", "section_key", item);
    savedRecords.push({ table: result.table, key: result.key, action: result.action, saved_id: result.saved.id || null });
    await audit("home_sections", `homepage_${result.action}`, String(result.saved.id || result.existing?.id || ""), result.existing, result.saved);
  }

  if (cleaned.faqs.length) {
    let archived: ContentRow[] = [];
    if (cleaned.replaceFaqs) {
      archived = await archiveRecordsByField(client, "faqs", "page_key", "home");
      savedRecords.push({ table: "faqs", key: "home", action: "archive_existing", archived_count: archived.length });
      await audit("faqs", "homepage_archive_existing_faqs", null, existingFaqs, archived);
    }
    const insertedFaqs: ContentRow[] = [];
    for (const faq of cleaned.faqs) {
      insertedFaqs.push(await insertContentRecord(client, "faqs", faq));
    }
    savedRecords.push({ table: "faqs", key: "home", action: "insert", inserted_count: insertedFaqs.length });
    await audit("faqs", "homepage_insert_faqs", null, archived.length ? archived : null, insertedFaqs);
  }

  return {
    body: {
      ...commonBody,
      saved_records: savedRecords,
      warnings: [...cleaned.warnings, ...auditWarnings.map((warning) => `Audit warning: ${warning}`)],
    },
  };
}

export async function publishContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
): Promise<ContentPublishResult> {
  if (!CONTENT_WRITE_ROLES.has(String(context.role || ""))) {
    return errorResult("Content editor access required", 403);
  }
  if (input.contentType !== "service" && input.contentType !== "homepage") {
    return errorResult("Unsupported contentType. Supported content types: service, homepage.");
  }

  const mode = input.mode || "dry-run";
  if (mode !== "dry-run" && mode !== "publish") return errorResult("Invalid publish mode.");
  if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) return errorResult("record object is required.");

  const nextStatus = input.nextStatus || (input.record.status as ContentStatus | undefined) || "draft";
  if (!VALID_STATUSES.has(nextStatus)) return errorResult("Invalid nextStatus.");
  if (mode === "publish" && (!input.ownerApproved || !input.explicitExecution)) {
    return errorResult("Publishing requires ownerApproved=true and explicitExecution=true.", 403);
  }

  if (input.contentType === "homepage") {
    return publishHomepageContent(input, client, context, mode, nextStatus);
  }

  let cleaned: ReturnType<typeof cleanServicePayload>;
  try {
    cleaned = cleanServicePayload(input.record, nextStatus);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Invalid service payload");
  }

  const existing = await resolveExistingService(client, cleaned.payload, cleaned.slug);
  const existingId = existing?.id ? String(existing.id) : "";
  const providedId = typeof cleaned.payload.id === "string" ? cleaned.payload.id : "";
  if (providedId && !existing) return errorResult("Service id was provided but no matching service exists.", 404);

  const sameSlug = await fetchServiceBySlug(client, cleaned.slug);
  if (sameSlug?.id && existingId && String(sameSlug.id) !== existingId) {
    return errorResult("Service slug already belongs to another record.", 409);
  }

  const expectedUpdatedAt = input.expectedUpdatedAt || (typeof input.record.updated_at === "string" ? input.record.updated_at : "");
  if (existing && expectedUpdatedAt && normalizeDate(existing.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    return errorResult("This service was changed by someone else. Refresh before publishing.", 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }

  delete cleaned.payload.id;

  const action = existing ? (nextStatus === "published" ? "publish" : "update") : nextStatus === "published" ? "publish" : "insert";
  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: "service",
    action,
    slug: cleaned.slug,
    status: nextStatus,
    existing_id: existingId || null,
    warnings: cleaned.warnings,
    next_steps: [
      "Regenerate SEO manifest/sitemap/llms after approved publish.",
      "Verify the /zh and /en public service pages read the updated admin content.",
      "Run publish receipt/QA before deployment or production cache verification.",
    ],
    auth_mode: context.authMode || "admin",
  };

  if (mode === "dry-run") {
    return {
      body: {
        ...commonBody,
        payload_preview: cleaned.payload,
      },
    };
  }

  const saved = existingId
    ? await updateServiceRecord(client, existingId, cleaned.payload)
    : await insertServiceRecord(client, cleaned.payload);

  const auditWarnings: string[] = [];
  try {
    await insertAdminAuditLog(client, {
      adminUserId: context.adminUserId || null,
      action,
      tableName: "services",
      recordId: String(saved.id || existingId || ""),
      oldValue: existing,
      newValue: saved,
    });
  } catch (error) {
    auditWarnings.push(error instanceof Error ? error.message : "Audit log failed");
  }

  return {
    body: {
      ...commonBody,
      saved_id: saved.id || existingId,
      saved_updated_at: saved.updated_at || null,
      warnings: [...cleaned.warnings, ...auditWarnings.map((warning) => `Audit warning: ${warning}`)],
    },
  };
}
