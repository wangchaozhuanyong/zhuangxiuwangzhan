import {
  archiveRecordsByField,
  fetchRecordByField,
  fetchRecordsByField,
  fetchServiceById,
  fetchServiceBySlug,
  insertContentRecord,
  insertAdminAuditLog,
  insertServiceRecord,
  replaceMaterialGallery,
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
const STANDALONE_SITE_PAGE_PATHS = new Set([
  "/about",
  "/services",
  "/materials",
  "/products",
  "/promotions",
  "/projects",
  "/before-after",
  "/process",
  "/faq",
  "/contact",
  "/quote",
  "/blog",
  "/locations",
  "/privacy",
  "/terms",
]);
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
const SERVICE_AREA_FIELDS = new Set([
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "area_name",
  "property_types",
  "common_needs",
  "construction_notes_zh",
  "construction_notes_en",
  "projects",
  "faqs_zh",
  "faqs_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "sort_order",
]);
const BLOG_FIELDS = new Set([
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "category",
  "tags",
  "cover_image_url",
  "alt_zh",
  "alt_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "published_at",
  "sort_order",
]);
const PROJECT_FIELDS = new Set([
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "image_url",
  "location",
  "area",
  "duration",
  "budget",
  "project_type",
  "materials",
  "scope",
  "highlights_zh",
  "highlights_en",
  "client_need_zh",
  "client_need_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "sort_order",
]);
const MATERIAL_FIELDS = new Set([
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "category",
  "subcategory",
  "material_type",
  "color",
  "texture",
  "suitable_spaces_zh",
  "suitable_spaces_en",
  "pros_zh",
  "pros_en",
  "cons_zh",
  "cons_en",
  "recommended_pairing_zh",
  "recommended_pairing_en",
  "note_zh",
  "note_en",
  "reference_price",
  "price_mode",
  "price_min",
  "price_max",
  "price_currency",
  "price_unit",
  "price_scope_zh",
  "price_scope_en",
  "price_note_zh",
  "price_note_en",
  "related_project_ids",
  "image_url",
  "alt_zh",
  "alt_en",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "sort_order",
]);
const MATERIAL_PRICE_MODES = new Set(["range", "from", "specification", "size", "scope", "none"]);
const MATERIAL_PRICE_UNITS = new Set(["sqft", "foot_run", "unit", "set", "panel", "scope", "none"]);
const MATERIAL_IMAGE_TYPES = new Set(["cover", "scene", "detail", "installation", "specification"]);
const MATERIAL_IMAGE_RIGHTS = new Set(["owned", "generated", "licensed", "supplier_approved"]);
const MATERIAL_SCHEMA_FIELDS = new Set([
  "gallery",
  "price_mode",
  "price_min",
  "price_max",
  "price_currency",
  "price_unit",
  "price_scope_zh",
  "price_scope_en",
  "price_note_zh",
  "price_note_en",
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

const isWebpDeliveryUrl = (value: unknown) => {
  const text = cleanText(value, 1000);
  if (!text) return true;

  try {
    const url = new URL(text, "http://localhost");
    if (/\.webp$/i.test(url.pathname)) return true;
    return url.pathname.includes("/storage/v1/render/image/public/")
      && url.searchParams.get("format")?.toLowerCase() === "webp";
  } catch {
    return false;
  }
};

const assertPublishedWebpImage = (value: unknown, status: unknown, fieldName: string) => {
  if (status !== "published" || !cleanText(value, 1000)) return;
  if (!isWebpDeliveryUrl(value)) {
    throw new Error(`${fieldName} must use a WebP image before publishing. Upload or select it from the media library first.`);
  }
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
  assertPublishedWebpImage(payload.image_url, status, "image_url");

  if (status === "published") {
    const requiredFields = [
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
      "scope_items_zh",
      "scope_items_en",
      "process_steps_zh",
      "process_steps_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = payload[field];
      return !value || (Array.isArray(value) && value.length === 0);
    });
    const incompleteFields = ["process_steps_zh", "process_steps_en"].filter((field) =>
      (payload[field] as Array<{ title?: string; desc?: string }>).some((item) => !item.title || !item.desc),
    );
    incompleteFields.push(
      ...["faqs_zh", "faqs_en"].filter((field) =>
        (payload[field] as Array<{ q?: string; a?: string }>).some((item) => !item.q || !item.a),
      ),
    );
    const invalidFields = Array.from(new Set([...missingFields, ...incompleteFields]));
    if (invalidFields.length) {
      throw new Error(
        `Published service requires bilingual content, structured details, SEO, image, and accessibility fields: ${invalidFields.join(", ")}.`,
      );
    }
  }

  return { payload, slug, warnings };
}

const cleanServiceAreaProjects = (value: unknown, status: ContentStatus) =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const project = {
            title: cleanText(row.title, 240) || "",
            type: cleanText(row.type, 120) || "",
            image: cleanText(row.image, 1000) || "",
          };
          if (!project.title || !project.type || !project.image) {
            throw new Error(`Service-area project ${index + 1} requires title, type, and image.`);
          }
          if (!isSafeImageUrl(project.image)) {
            throw new Error(`Service-area project ${index + 1} image must be site-relative, HTTPS, or localhost for local testing.`);
          }
          assertPublishedWebpImage(project.image, status, `projects[${index}].image`);
          return project;
        })
        .slice(0, 24)
    : [];

function cleanServiceAreaPayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!SERVICE_AREA_FIELDS.has(key)) throw new Error(`Unsupported service_area field: ${key}.`);
    payload[key] = value;
  }

  const slug = normalizeSlug(payload.slug || payload.area_name || payload.title_en || payload.title_zh);
  if (!slug) throw new Error("Service-area slug, area_name, or title is required.");
  payload.slug = slug;

  const status = (nextStatus || payload.status || "draft") as ContentStatus;
  if (!VALID_STATUSES.has(status)) throw new Error("Invalid service_area status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "area_name"]) payload[key] = cleanText(payload[key], 240);
  for (const key of ["excerpt_zh", "excerpt_en"]) payload[key] = cleanText(payload[key], 800);
  for (const key of ["content_zh", "content_en", "construction_notes_zh", "construction_notes_en"]) {
    payload[key] = cleanText(payload[key], 80000);
  }
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  payload.property_types = cleanLines(payload.property_types);
  payload.common_needs = cleanLines(payload.common_needs);
  payload.projects = cleanServiceAreaProjects(payload.projects, status);
  payload.faqs_zh = cleanFaqs(payload.faqs_zh);
  payload.faqs_en = cleanFaqs(payload.faqs_en);
  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;

  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");

  if (status === "published") {
    const required = [
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "area_name",
      "property_types",
      "common_needs",
      "construction_notes_zh",
      "construction_notes_en",
      "projects",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
    ];
    const missing = required.filter((field) => {
      const value = payload[field];
      return !value || (Array.isArray(value) && value.length === 0);
    });
    const incompleteFaqs = ["faqs_zh", "faqs_en"].filter((field) =>
      (payload[field] as Array<{ q?: string; a?: string }>).some((item) => !item.q || !item.a),
    );
    if ((payload.faqs_zh as unknown[]).length !== (payload.faqs_en as unknown[]).length) {
      incompleteFaqs.push("faqs_zh/faqs_en count mismatch");
    }
    const invalidFields = Array.from(new Set([...missing, ...incompleteFaqs]));
    if (invalidFields.length) {
      throw new Error(`Published service_area requires complete bilingual content, planning details, projects, FAQ, and SEO fields: ${invalidFields.join(", ")}.`);
    }
  }

  return { payload, key: slug, warnings: [] as string[] };
}

function cleanBlogPayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!BLOG_FIELDS.has(key)) throw new Error(`Unsupported blog field: ${key}.`);
    payload[key] = value;
  }

  const slug = normalizeSlug(payload.slug || payload.title_en || payload.title_zh);
  if (!slug) throw new Error("Blog slug or title is required.");
  payload.slug = slug;

  const status = nextStatus || payload.status || "draft";
  if (!VALID_STATUSES.has(status as ContentStatus)) throw new Error("Invalid blog status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "alt_zh", "alt_en"]) {
    payload[key] = cleanText(payload[key], 220);
  }
  for (const key of ["excerpt_zh", "excerpt_en"]) payload[key] = cleanText(payload[key], 600);
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 120000);
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  payload.category = cleanText(payload.category, 120);
  payload.cover_image_url = cleanText(payload.cover_image_url, 1000);

  if (payload.tags !== undefined && payload.tags !== null && !Array.isArray(payload.tags)) {
    throw new Error("Blog tags must be an array.");
  }
  payload.tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => cleanText(tag, 100)).filter(Boolean).slice(0, 30)
    : [];

  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;

  if (payload.published_at) {
    const publishedAt = new Date(String(payload.published_at));
    if (Number.isNaN(publishedAt.getTime())) throw new Error("Blog published_at must be a valid date.");
    payload.published_at = publishedAt.toISOString();
  } else {
    payload.published_at = status === "published" ? new Date().toISOString() : null;
  }

  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.cover_image_url)) {
    throw new Error("cover_image_url must be empty, site-relative, HTTPS, or localhost for local testing.");
  }
  assertPublishedWebpImage(payload.cover_image_url, status, "cover_image_url");

  if (status === "published") {
    const requiredFields = [
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "cover_image_url",
      "alt_zh",
      "alt_en",
    ];
    const missingFields = requiredFields.filter((field) => !payload[field]);
    if (missingFields.length) {
      throw new Error(`Published blog requires bilingual content, SEO, and image accessibility fields: ${missingFields.join(", ")}.`);
    }
  }

  return { payload, slug, warnings: [] as string[] };
}

function cleanMaterialGallery(value: unknown, published: boolean) {
  if (value === undefined || value === null) {
    if (published) throw new Error("Published material requires 8 to 12 gallery images.");
    return [];
  }
  if (!Array.isArray(value)) throw new Error("Material gallery must be an array.");

  const gallery = value.slice(0, 12).map((item, index) => {
    const row = item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
    const imageUrl = cleanText(row.image_url, 1000);
    const imageType = cleanText(row.image_type || (index === 0 ? "cover" : "scene"), 40) || "scene";
    const rightsStatus = cleanText(row.rights_status || "owned", 40) || "owned";
    const altZh = cleanText(row.alt_zh, 240);
    const altEn = cleanText(row.alt_en, 240);
    const sourceUrl = cleanText(row.source_url, 1000);

    if (!imageUrl || !isSafeImageUrl(imageUrl)) throw new Error(`Material gallery image ${index + 1} has an invalid image_url.`);
    assertPublishedWebpImage(imageUrl, published ? "published" : "draft", `Material gallery image ${index + 1}`);
    if (!MATERIAL_IMAGE_TYPES.has(imageType)) throw new Error(`Material gallery image ${index + 1} has an invalid image_type.`);
    if (!MATERIAL_IMAGE_RIGHTS.has(rightsStatus)) throw new Error(`Material gallery image ${index + 1} has an invalid rights_status.`);
    if (sourceUrl && !isSafeImageUrl(sourceUrl)) throw new Error(`Material gallery image ${index + 1} has an invalid source_url.`);
    if (published && (!altZh || !altEn)) throw new Error(`Material gallery image ${index + 1} requires Chinese and English alt text.`);

    return {
      image_url: imageUrl,
      image_type: imageType,
      alt_zh: altZh,
      alt_en: altEn,
      source_url: sourceUrl,
      rights_status: rightsStatus,
      sort_order: cleanSortOrder(row.sort_order) ?? index * 10,
      is_active: true,
    };
  });

  if (published && (gallery.length < 8 || gallery.length > 12)) {
    throw new Error("Published material requires 8 to 12 gallery images.");
  }
  if (published && gallery[0]?.image_type !== "cover") {
    throw new Error("The first material gallery image must use image_type=cover.");
  }
  if (new Set(gallery.map((item) => item.image_url)).size !== gallery.length) {
    throw new Error("Material gallery image URLs must be unique within one product.");
  }
  return gallery;
}

function cleanMaterialPayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const payload: Record<string, unknown> = {};
  const warnings: string[] = [];
  const requiresMaterialSchema = Array.from(MATERIAL_SCHEMA_FIELDS).some((field) =>
    Object.prototype.hasOwnProperty.call(record, field),
  );
  for (const [key, value] of Object.entries(record)) {
    if (key === "gallery" || READONLY_FIELDS.has(key)) continue;
    if (!MATERIAL_FIELDS.has(key)) throw new Error(`Unsupported material field: ${key}.`);
    payload[key] = value;
  }

  const slug = normalizeSlug(payload.slug || payload.title_en || payload.title_zh);
  if (!slug) throw new Error("Material slug or title is required.");
  payload.slug = slug;

  const status = nextStatus || payload.status || "draft";
  if (!VALID_STATUSES.has(status as ContentStatus)) throw new Error("Invalid material status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "alt_zh", "alt_en", "category", "subcategory", "material_type", "color", "texture"]) {
    payload[key] = cleanText(payload[key], 220);
  }
  for (const key of ["excerpt_zh", "excerpt_en"]) payload[key] = cleanText(payload[key], 600);
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 80000);
  for (const key of ["recommended_pairing_zh", "recommended_pairing_en", "note_zh", "note_en"]) {
    payload[key] = cleanText(payload[key], 1600);
  }
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  for (const key of ["suitable_spaces_zh", "suitable_spaces_en", "pros_zh", "pros_en", "cons_zh", "cons_en"]) {
    payload[key] = cleanLines(payload[key]);
  }
  payload.image_url = cleanText(payload.image_url, 1000);
  payload.reference_price = cleanText(payload.reference_price, 220);
  payload.related_project_ids = cleanLines(payload.related_project_ids);
  if (requiresMaterialSchema) {
    for (const key of ["price_scope_zh", "price_scope_en", "price_note_zh", "price_note_en"]) {
      payload[key] = cleanText(payload[key], 1600);
    }
    payload.price_currency = (cleanText(payload.price_currency, 3) || "MYR").toUpperCase();
    payload.price_mode = cleanText(payload.price_mode, 40) || "none";
    payload.price_unit = cleanText(payload.price_unit, 40) || "none";
    if (!MATERIAL_PRICE_MODES.has(String(payload.price_mode))) throw new Error("Invalid material price_mode.");
    if (!MATERIAL_PRICE_UNITS.has(String(payload.price_unit))) throw new Error("Invalid material price_unit.");

    for (const key of ["price_min", "price_max"]) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        payload[key] = null;
        continue;
      }
      const amount = Number(payload[key]);
      if (!Number.isFinite(amount) || amount < 0) throw new Error(`${key} must be a non-negative number.`);
      payload[key] = amount;
    }
    if (payload.price_min !== null && payload.price_max !== null && Number(payload.price_max) < Number(payload.price_min)) {
      throw new Error("price_max must be greater than or equal to price_min.");
    }
  }

  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;
  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("image_url must be empty, site-relative, HTTPS, or localhost for local testing.");

  const published = status === "published";
  assertPublishedWebpImage(payload.image_url, status, "image_url");
  const gallery = requiresMaterialSchema ? cleanMaterialGallery(record.gallery, published) : [];
  if (published) {
    const requiredFields = [
      "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en",
      "category", "subcategory", "material_type", "image_url", "alt_zh", "alt_en",
      "suitable_spaces_zh", "suitable_spaces_en", "pros_zh", "pros_en", "cons_zh", "cons_en",
      "recommended_pairing_zh", "recommended_pairing_en", "note_zh", "note_en",
      "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en",
    ];
    if (requiresMaterialSchema) {
      requiredFields.push("price_scope_zh", "price_scope_en", "price_note_zh", "price_note_en");
    }
    const missing = requiredFields.filter((field) => !payload[field] || (Array.isArray(payload[field]) && payload[field].length === 0));
    if (missing.length) throw new Error(`Published material requires bilingual content, pricing context, SEO, and accessibility fields: ${missing.join(", ")}.`);

    if (requiresMaterialSchema) {
      const priceMode = String(payload.price_mode);
      if ((priceMode === "range" || priceMode === "from") && payload.price_min === null) {
        throw new Error("Published material with range/from pricing requires price_min.");
      }
      if (priceMode === "range" && payload.price_max === null) {
        throw new Error("Published material with range pricing requires price_max.");
      }
    }
  }

  return { payload, slug, gallery, warnings, requiresMaterialSchema };
}

function cleanProjectPayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const payload: Record<string, unknown> = {};
  const warnings: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!PROJECT_FIELDS.has(key)) throw new Error(`Unsupported project field: ${key}.`);
    payload[key] = value;
  }

  const slug = normalizeSlug(payload.slug || payload.title_en || payload.title_zh);
  if (!slug) throw new Error("Project slug or title is required.");
  payload.slug = slug;
  const status = nextStatus || payload.status || "draft";
  if (!VALID_STATUSES.has(status as ContentStatus)) throw new Error("Invalid project status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "project_type", "duration", "budget"]) {
    payload[key] = cleanText(payload[key], 220);
  }
  for (const key of ["excerpt_zh", "excerpt_en"]) payload[key] = cleanText(payload[key], 600);
  for (const key of ["content_zh", "content_en", "client_need_zh", "client_need_en"]) {
    payload[key] = cleanText(payload[key], 80000);
  }
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en"]) payload[key] = cleanText(payload[key], 320);
  for (const key of ["materials", "scope", "highlights_zh", "highlights_en"]) payload[key] = cleanLines(payload[key]);
  payload.image_url = cleanText(payload.image_url, 1000);
  payload.location = null;
  payload.area = null;
  if (cleanText(record.location, 220) || cleanText(record.area, 220)) {
    warnings.push("Project location and area were removed to keep case descriptions location-neutral.");
  }
  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;
  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("image_url must be empty, site-relative, HTTPS, or localhost for local testing.");
  assertPublishedWebpImage(payload.image_url, status, "image_url");

  if (status === "published") {
    const required = [
      "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en", "image_url",
      "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en",
    ];
    const missing = required.filter((field) => !payload[field]);
    if (missing.length) throw new Error(`Published project requires bilingual content, SEO, and a cover image: ${missing.join(", ")}.`);
  }

  return { payload, key: slug, warnings };
}

function cleanStandaloneSitePagePayload(record: Record<string, unknown>, nextStatus?: ContentStatus) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (READONLY_FIELDS.has(key)) continue;
    if (!SITE_PAGE_FIELDS.has(key)) throw new Error(`Unsupported site_page field: ${key}.`);
    payload[key] = value;
  }

  const pageKey = String(payload.page_key || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(pageKey)) throw new Error("site_page.page_key is required and must use a stable key.");
  if (pageKey === "home") throw new Error("Use contentType=homepage for the home site page.");
  const path = String(payload.path || "").trim().replace(/\/+$/, "") || "/";
  if (!STANDALONE_SITE_PAGE_PATHS.has(path)) {
    throw new Error("site_page.path must match an existing bilingual public page route. Use cms_pages for new dynamic routes.");
  }
  payload.page_key = pageKey;
  payload.path = path;
  const status = nextStatus || payload.status || "draft";
  if (!VALID_STATUSES.has(status as ContentStatus)) throw new Error("Invalid site_page status.");
  payload.status = status;

  for (const key of ["title_zh", "title_en", "subtitle_zh", "subtitle_en", "cta_title_zh", "cta_title_en", "alt_zh", "alt_en"]) {
    payload[key] = cleanText(payload[key], 240);
  }
  for (const key of ["description_zh", "description_en", "cta_description_zh", "cta_description_en"]) {
    payload[key] = cleanText(payload[key], 1200);
  }
  for (const key of ["content_zh", "content_en"]) payload[key] = cleanText(payload[key], 80000);
  for (const key of ["seo_title_zh", "seo_title_en"]) payload[key] = cleanText(payload[key], 180);
  for (const key of ["seo_description_zh", "seo_description_en", "seo_keywords_zh", "seo_keywords_en"]) {
    payload[key] = cleanText(payload[key], 500);
  }
  payload.items_zh = cleanList(payload.items_zh, 80);
  payload.items_en = cleanList(payload.items_en, 80);
  payload.image_url = cleanText(payload.image_url, 1000);
  const sortOrder = cleanSortOrder(payload.sort_order);
  if (sortOrder !== undefined) payload.sort_order = sortOrder;
  if (hasMediaPlaceholder(payload)) throw new Error("Media placeholders remain. Upload/select media in the admin media library first.");
  if (!isSafeImageUrl(payload.image_url)) throw new Error("image_url must be empty, site-relative, HTTPS, or localhost for local testing.");
  assertPublishedWebpImage(payload.image_url, status, "image_url");

  if (status === "published") {
    const required = ["title_zh", "title_en", "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en"];
    if (payload.image_url) required.push("alt_zh", "alt_en");
    const missing = required.filter((field) => !payload[field]);
    if (missing.length) throw new Error(`Published site_page requires bilingual title, SEO, and image alt fields when applicable: ${missing.join(", ")}.`);
  }

  return { payload, key: pageKey, warnings: [] as string[] };
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
  assertPublishedWebpImage(payload.image_url, payload.status, "sitePage.image_url");

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
  assertPublishedWebpImage(payload.image_url, payload.status, "ctaBlock.image_url");
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
  assertPublishedWebpImage(payload.image_url, payload.status, "homeSection.image_url");
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

async function resolveExistingBlog(client: ContentPublishClient, payload: Record<string, unknown>, slug: string) {
  const id = typeof payload.id === "string" ? payload.id : "";
  if (id) return fetchRecordByField(client, "blog_posts", "id", id);
  return fetchRecordByField(client, "blog_posts", "slug", slug);
}

async function publishBlogContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: "dry-run" | "publish",
  nextStatus: ContentStatus,
): Promise<ContentPublishResult> {
  let cleaned: ReturnType<typeof cleanBlogPayload>;
  try {
    cleaned = cleanBlogPayload(input.record || {}, nextStatus);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Invalid blog payload");
  }

  const existing = await resolveExistingBlog(client, cleaned.payload, cleaned.slug);
  const existingId = existing?.id ? String(existing.id) : "";
  const providedId = typeof cleaned.payload.id === "string" ? cleaned.payload.id : "";
  if (providedId && !existing) return errorResult("Blog id was provided but no matching blog post exists.", 404);

  const sameSlug = await fetchRecordByField(client, "blog_posts", "slug", cleaned.slug);
  if (sameSlug?.id && (!existingId || String(sameSlug.id) !== existingId)) {
    return errorResult("Blog slug already belongs to another record.", 409);
  }

  const expectedUpdatedAt = input.expectedUpdatedAt || (typeof input.record?.updated_at === "string" ? input.record.updated_at : "");
  if (existing && !expectedUpdatedAt) {
    return errorResult("expectedUpdatedAt is required when updating an existing blog post.", 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (existing && expectedUpdatedAt && normalizeDate(existing.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    return errorResult("This blog post was changed by someone else. Refresh before publishing.", 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (mode === "publish" && !cleanText(input.approvalId, 180)) {
    return errorResult("Blog publishing requires a non-empty approvalId.", 403);
  }

  delete cleaned.payload.id;
  const action = existing ? (nextStatus === "published" ? "publish" : "update") : nextStatus === "published" ? "publish" : "insert";
  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: "blog",
    action,
    slug: cleaned.slug,
    status: nextStatus,
    existing_id: existingId || null,
    warnings: cleaned.warnings,
    next_steps: [
      "Dynamic HTML SEO, sitemap.xml, and llms.txt read this published record; no frontend deployment is required.",
      "Verify the /zh and /en blog detail pages read the updated content, SEO, cover image, and alt text.",
      "Run publish receipt/QA and production cache verification.",
    ],
    auth_mode: context.authMode || "admin",
  };

  if (mode === "dry-run") {
    return { body: { ...commonBody, payload_preview: cleaned.payload } };
  }

  const saved = existingId
    ? await updateContentRecord(client, "blog_posts", existingId, cleaned.payload)
    : await insertContentRecord(client, "blog_posts", cleaned.payload);

  const auditWarnings: string[] = [];
  try {
    await insertAdminAuditLog(client, {
      adminUserId: context.adminUserId || null,
      action,
      tableName: "blog_posts",
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

async function publishMaterialContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: "dry-run" | "publish",
  nextStatus: ContentStatus,
): Promise<ContentPublishResult> {
  let cleaned: ReturnType<typeof cleanMaterialPayload>;
  try {
    cleaned = cleanMaterialPayload(input.record || {}, nextStatus);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Invalid material payload");
  }

  if (cleaned.requiresMaterialSchema) {
    try {
      await fetchRecordsByField(client, "material_images", "material_id", "00000000-0000-0000-0000-000000000000");
    } catch {
      return errorResult(
        "The material price/gallery migration is not applied. Publish the legacy material fields only or apply the approved migration first.",
        409,
      );
    }
  }

  const providedId = typeof cleaned.payload.id === "string" ? cleaned.payload.id : "";
  const existing = providedId
    ? await fetchRecordByField(client, "materials", "id", providedId)
    : await fetchRecordByField(client, "materials", "slug", cleaned.slug);
  const existingId = existing?.id ? String(existing.id) : "";
  if (providedId && !existing) return errorResult("Material id was provided but no matching material exists.", 404);

  const sameSlug = await fetchRecordByField(client, "materials", "slug", cleaned.slug);
  if (sameSlug?.id && (!existingId || String(sameSlug.id) !== existingId)) {
    return errorResult("Material slug already belongs to another record.", 409);
  }

  const expectedUpdatedAt = input.expectedUpdatedAt || (typeof input.record?.updated_at === "string" ? input.record.updated_at : "");
  if (existing && mode === "publish" && !expectedUpdatedAt) {
    return errorResult("expectedUpdatedAt is required when updating an existing material.", 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (existing && expectedUpdatedAt && normalizeDate(existing.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    return errorResult("This material was changed by someone else. Refresh before publishing.", 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (mode === "publish" && !cleanText(input.approvalId, 180)) {
    return errorResult("Material publishing requires a non-empty approvalId.", 403);
  }

  delete cleaned.payload.id;
  const action = existing ? (nextStatus === "published" ? "publish" : "update") : nextStatus === "published" ? "publish" : "insert";
  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: "material",
    action,
    slug: cleaned.slug,
    status: nextStatus,
    existing_id: existingId || null,
    existing_updated_at: existing?.updated_at || null,
    warnings: cleaned.warnings,
    next_steps: [
      cleaned.requiresMaterialSchema
        ? "The material price/gallery schema was verified before this publish."
        : "Legacy material publishing remains available without the optional price/gallery schema.",
      "Verify dynamic HTML SEO, sitemap.xml, and llms.txt after approved material publish; no frontend deployment is required.",
      "Verify the /zh and /en product list and detail pages, gallery, pricing, and alt text.",
    ],
    auth_mode: context.authMode || "admin",
  };

  if (mode === "dry-run") {
    return {
      body: {
        ...commonBody,
        payload_preview: {
          material: cleaned.payload,
          gallery: cleaned.gallery,
        },
      },
    };
  }

  const saved = existingId
    ? await updateContentRecord(client, "materials", existingId, cleaned.payload)
    : await insertContentRecord(client, "materials", cleaned.payload);
  const materialId = String(saved.id || existingId || "");
  const previousGallery = cleaned.requiresMaterialSchema && materialId
    ? await fetchRecordsByField(client, "material_images", "material_id", materialId)
    : [];
  const insertedGallery: ContentRow[] = [];

  if (cleaned.gallery.length) {
    insertedGallery.push(...await replaceMaterialGallery(client, materialId, cleaned.gallery));
  }

  const auditWarnings: string[] = [];
  try {
    await insertAdminAuditLog(client, {
      adminUserId: context.adminUserId || null,
      action,
      tableName: "materials",
      recordId: materialId,
      oldValue: existing,
      newValue: saved,
    });
    if (cleaned.gallery.length) {
      await insertAdminAuditLog(client, {
        adminUserId: context.adminUserId || null,
        action: "replace_material_gallery",
        tableName: "material_images",
        recordId: materialId,
        oldValue: previousGallery,
        newValue: insertedGallery,
      });
    }
  } catch (error) {
    auditWarnings.push(error instanceof Error ? error.message : "Audit log failed");
  }

  return {
    body: {
      ...commonBody,
      saved_id: materialId,
      saved_updated_at: saved.updated_at || null,
      gallery_count: insertedGallery.length,
      gallery_archived_count: previousGallery.filter((row) => row.is_active !== false).length,
      warnings: [...cleaned.warnings, ...auditWarnings.map((warning) => `Audit warning: ${warning}`)],
    },
  };
}

type SingleRecordPublishConfig = {
  contentType: "project" | "site_page" | "service_area";
  table: "projects" | "site_pages" | "service_areas";
  keyField: "slug" | "page_key";
  clean: (
    record: Record<string, unknown>,
    nextStatus?: ContentStatus,
  ) => { payload: Record<string, unknown>; key: string; warnings: string[] };
  verifyPaths: string;
};

async function publishSingleRecordContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: "dry-run" | "publish",
  nextStatus: ContentStatus,
  config: SingleRecordPublishConfig,
): Promise<ContentPublishResult> {
  let cleaned: ReturnType<SingleRecordPublishConfig["clean"]>;
  try {
    cleaned = config.clean(input.record || {}, nextStatus);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : `Invalid ${config.contentType} payload`);
  }

  const providedId = typeof cleaned.payload.id === "string" ? cleaned.payload.id : "";
  const existing = providedId
    ? await fetchRecordByField(client, config.table, "id", providedId)
    : await fetchRecordByField(client, config.table, config.keyField, cleaned.key);
  const existingId = existing?.id ? String(existing.id) : "";
  if (providedId && !existing) return errorResult(`${config.contentType} id was provided but no matching record exists.`, 404);

  const sameKey = await fetchRecordByField(client, config.table, config.keyField, cleaned.key);
  if (sameKey?.id && (!existingId || String(sameKey.id) !== existingId)) {
    return errorResult(`${config.contentType} ${config.keyField} already belongs to another record.`, 409);
  }

  const expectedUpdatedAt = input.expectedUpdatedAt || (typeof input.record?.updated_at === "string" ? input.record.updated_at : "");
  if (existing && mode === "publish" && !expectedUpdatedAt) {
    return errorResult(`expectedUpdatedAt is required when updating an existing ${config.contentType}.`, 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (existing && expectedUpdatedAt && normalizeDate(existing.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    return errorResult(`This ${config.contentType} was changed by someone else. Refresh before publishing.`, 409, {
      currentUpdatedAt: existing.updated_at || null,
    });
  }
  if (mode === "publish" && !cleanText(input.approvalId, 180)) {
    return errorResult(`${config.contentType} publishing requires a non-empty approvalId.`, 403);
  }

  delete cleaned.payload.id;
  const action = existing ? (nextStatus === "published" ? "publish" : "update") : nextStatus === "published" ? "publish" : "insert";
  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: config.contentType,
    action,
    [config.keyField]: cleaned.key,
    status: nextStatus,
    existing_id: existingId || null,
    warnings: cleaned.warnings,
    next_steps: [
      "Dynamic HTML SEO, sitemap.xml, and llms.txt read the published CMS record; no frontend deployment is required.",
      `Verify ${config.verifyPaths} in both languages after publishing.`,
      "Record post-publish QA and rollback evidence.",
    ],
    auth_mode: context.authMode || "admin",
  };

  if (mode === "dry-run") return { body: { ...commonBody, payload_preview: cleaned.payload } };

  const saved = existingId
    ? await updateContentRecord(client, config.table, existingId, cleaned.payload)
    : await insertContentRecord(client, config.table, cleaned.payload);
  const auditWarnings: string[] = [];
  try {
    await insertAdminAuditLog(client, {
      adminUserId: context.adminUserId || null,
      action,
      tableName: config.table,
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
      "Dynamic HTML SEO, sitemap.xml, and llms.txt read the published CMS records; no frontend deployment is required.",
      "Verify /zh and /en homepage title, meta, H1/hero, FAQ, CTA, and schema in a real browser.",
      "Run publish receipt/QA and production cache verification.",
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
  if (
    input.contentType !== "service" &&
    input.contentType !== "homepage" &&
    input.contentType !== "blog" &&
    input.contentType !== "material" &&
    input.contentType !== "project" &&
    input.contentType !== "site_page" &&
    input.contentType !== "service_area" &&
    input.contentType !== "cache_invalidation"
  ) {
    return errorResult("Unsupported contentType. Supported content types: service, service_area, homepage, blog, material, project, site_page, cache_invalidation.");
  }

  const mode = input.mode || "dry-run";
  if (mode !== "dry-run" && mode !== "publish") return errorResult("Invalid publish mode.");
  if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) return errorResult("record object is required.");

  const nextStatus = input.nextStatus || (input.record.status as ContentStatus | undefined) || "draft";
  if (!VALID_STATUSES.has(nextStatus)) return errorResult("Invalid nextStatus.");
  if (mode === "publish" && (!input.ownerApproved || !input.explicitExecution)) {
    return errorResult("Publishing requires ownerApproved=true and explicitExecution=true.", 403);
  }

  if (input.contentType === "cache_invalidation") {
    if (mode === "publish" && !cleanText(input.approvalId, 180)) {
      return errorResult("Cache invalidation requires a non-empty approvalId.", 403);
    }

    return {
      body: {
        ok: true,
        dry_run: mode === "dry-run",
        content_type: "cache_invalidation",
        action: "invalidate",
        status: nextStatus,
        source: cleanText(input.source, 180) || "admin-content-mutation",
        warnings: [],
        next_steps: ["Verify the affected public route returns the new content revision."],
        auth_mode: context.authMode || "admin",
      },
    };
  }

  if (input.contentType === "homepage") {
    return publishHomepageContent(input, client, context, mode, nextStatus);
  }
  if (input.contentType === "blog") {
    return publishBlogContent(input, client, context, mode, nextStatus);
  }
  if (input.contentType === "material") {
    return publishMaterialContent(input, client, context, mode, nextStatus);
  }
  if (input.contentType === "service_area") {
    return publishSingleRecordContent(input, client, context, mode, nextStatus, {
      contentType: "service_area",
      table: "service_areas",
      keyField: "slug",
      clean: cleanServiceAreaPayload,
      verifyPaths: `/zh/locations/${normalizeSlug(input.record.slug)} and /en/locations/${normalizeSlug(input.record.slug)}`,
    });
  }
  if (input.contentType === "project") {
    return publishSingleRecordContent(input, client, context, mode, nextStatus, {
      contentType: "project",
      table: "projects",
      keyField: "slug",
      clean: cleanProjectPayload,
      verifyPaths: `/zh/projects/${normalizeSlug(input.record.slug)} and /en/projects/${normalizeSlug(input.record.slug)}`,
    });
  }
  if (input.contentType === "site_page") {
    return publishSingleRecordContent(input, client, context, mode, nextStatus, {
      contentType: "site_page",
      table: "site_pages",
      keyField: "page_key",
      clean: cleanStandaloneSitePagePayload,
      verifyPaths: "the bilingual localized routes for the saved site_page.path",
    });
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
      "Dynamic HTML SEO, sitemap.xml, and llms.txt read this published record; no frontend deployment is required.",
      "Verify the /zh and /en public service pages read the updated admin content.",
      "Run publish receipt/QA and production cache verification.",
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
