type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// These two exact read contracts are independent of any publishing approval.
export const nativeServiceSnapshotTargets = {
  bathroom: { id: "0f294e6d-2e2c-4f13-a93f-096728ccc6af", slug: "bathroom" },
  artistic: { id: "d862312d-d5f3-4bb7-9bf0-137ed71c87be", slug: "artistic-coating" },
} as const;

const bathroomFields = [
  "process_steps_en", "process_steps_zh", "content_en", "content_zh", "title_zh", "title_en",
  "excerpt_zh", "excerpt_en", "image_url", "alt_zh", "alt_en", "suitable_for_zh", "suitable_for_en",
  "common_projects_zh", "common_projects_en", "scope_items_zh", "scope_items_en", "faqs_zh", "faqs_en",
  "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en",
  "id", "slug", "status", "version", "updated_at",
] as const;

const textArrays = new Set(["suitable_for_zh", "suitable_for_en", "common_projects_zh", "common_projects_en", "scope_items_zh", "scope_items_en"]);
const jsonArrays = new Set(["process_steps_zh", "process_steps_en", "faqs_zh", "faqs_en"]);
const invalid = (): never => { throw new Error("Native service snapshot is unavailable"); };
const hasOwn = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);
const own = (object: Record<string, unknown>, key: string): unknown => {
  if (!hasOwn(object, key)) return invalid();
  return object[key];
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

function isJson(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return Array.from({ length: value.length }, (_, index) => hasOwn(value, index) && isJson(value[index])).every(Boolean);
  return isRecord(value) && Object.values(value).every(isJson);
}

export function canReadNativeServiceSnapshot(serviceId: string | undefined): boolean {
  // Office remains PROPOSED: no lookup, query or snapshot is admitted here.
  return Object.values(nativeServiceSnapshotTargets).some((target) => target.id === serviceId);
}

export function serializeNativeServiceSnapshot(serviceId: string, raw: unknown): string {
  const target = Object.values(nativeServiceSnapshotTargets).find((item) => item.id === serviceId);
  if (!target || !isRecord(raw) || own(raw, "id") !== target.id || own(raw, "slug") !== target.slug) return invalid();
  const updatedAt = own(raw, "updated_at");
  if (typeof updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt))) return invalid();

  const snapshot: Record<string, JsonValue> = {};
  if (target.slug === "artistic-coating") {
    for (const language of ["en", "zh"] as const) {
      const steps = own(raw, `process_steps_${language}`);
      if (!Array.isArray(steps) || !hasOwn(steps, 4) || !isRecord(steps[4])) return invalid();
      const description = own(steps[4], "desc");
      if (description === null) snapshot[`process_steps_${language}[4].desc`] = null;
      else if (typeof description === "string") snapshot[`process_steps_${language}[4].desc`] = description;
      else return invalid();
    }
    snapshot.id = target.id;
    snapshot.slug = target.slug;
    snapshot.updated_at = updatedAt;
    // Five leaves cannot establish a hash of the complete process arrays.
  } else {
    for (const field of bathroomFields) {
      const value = own(raw, field);
      if (field === "version") {
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) return invalid();
      } else if (field === "status") {
        if (value !== "draft" && value !== "published" && value !== "archived") return invalid();
      } else if (textArrays.has(field)) {
        if (value !== null && (!Array.isArray(value) || !value.every((item) => item === null || typeof item === "string"))) return invalid();
      } else if (jsonArrays.has(field)) {
        if (value !== null && !Array.isArray(value)) return invalid();
      } else if (value !== null && typeof value !== "string") return invalid();
      if (!isJson(value)) return invalid();
      snapshot[field] = value;
    }
  }
  // Parsed JSON values, not PostgreSQL JSONB text bytes; no normalization or full-row export.
  return JSON.stringify(snapshot);
}
