import {
  fetchServiceById,
  fetchServiceBySlug,
  insertAdminAuditLog,
  insertServiceRecord,
  updateServiceRecord,
} from "./repository.ts";
import type { ContentPublishClient, ContentPublishRequest, ContentPublishResult, ContentStatus, ServiceRow } from "./types.ts";

const CONTENT_WRITE_ROLES = new Set(["super_admin", "content_editor"]);
const VALID_STATUSES = new Set<ContentStatus>(["draft", "published", "archived"]);
const READONLY_FIELDS = new Set(["created_at", "updated_at", "version"]);
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

type PublishContext = {
  adminUserId?: string | null;
  role?: string | null;
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

async function resolveExistingService(client: ContentPublishClient, payload: Record<string, unknown>, slug: string) {
  const id = typeof payload.id === "string" ? payload.id : "";
  if (id) return fetchServiceById(client, id);
  return fetchServiceBySlug(client, slug);
}

export async function publishContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
): Promise<ContentPublishResult> {
  if (!CONTENT_WRITE_ROLES.has(String(context.role || ""))) {
    return errorResult("Content editor access required", 403);
  }
  if (input.contentType !== "service") return errorResult("Unsupported contentType. First version supports service only.");

  const mode = input.mode || "dry-run";
  if (mode !== "dry-run" && mode !== "publish") return errorResult("Invalid publish mode.");
  if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) return errorResult("record object is required.");

  const nextStatus = input.nextStatus || (input.record.status as ContentStatus | undefined) || "draft";
  if (!VALID_STATUSES.has(nextStatus)) return errorResult("Invalid nextStatus.");
  if (mode === "publish" && (!input.ownerApproved || !input.explicitExecution)) {
    return errorResult("Publishing requires ownerApproved=true and explicitExecution=true.", 403);
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
