import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAdminMaterialDetail,
  fetchAdminMaterialList,
  fetchAdminMaterialRows,
  fetchAdminMaterialImages,
  findMaterialIdsBySlug,
  invokeMaterialEnglishGeneration,
  saveMaterialRecord,
  createMaterialImageRecord,
  updateMaterialImageRecord,
  archiveMaterialImageRecord,
  type AdminMaterialListInput,
} from "@/backend/modules/materials/repository/materialRepository";

type AdminMaterialRecord = Record<string, unknown> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
  sort_order?: string | number | null;
  suitable_spaces_zh?: unknown[] | null;
  suitable_spaces_en?: unknown[] | null;
  pros_zh?: unknown[] | null;
  pros_en?: unknown[] | null;
  cons_zh?: unknown[] | null;
  cons_en?: unknown[] | null;
  recommended_pairing_zh?: string | null;
  recommended_pairing_en?: string | null;
  note_zh?: string | null;
  note_en?: string | null;
  price_mode?: string | null;
  price_min?: string | number | null;
  price_max?: string | number | null;
  price_currency?: string | null;
  price_unit?: string | null;
  price_scope_zh?: string | null;
  price_scope_en?: string | null;
  price_note_zh?: string | null;
  price_note_en?: string | null;
};

export type SaveAdminMaterialInput = {
  record: AdminMaterialRecord;
  nextStatus?: AdminMaterialRecord["status"];
  queryClient?: QueryClient;
};

export type MaterialImageType = "cover" | "scene" | "detail" | "installation" | "specification";
export type MaterialImageRights = "owned" | "generated" | "licensed" | "supplier_approved";

export type AdminMaterialImageDraft = {
  image_url: string;
  image_type?: MaterialImageType | string | null;
  alt_zh?: string | null;
  alt_en?: string | null;
  source_url?: string | null;
  rights_status?: MaterialImageRights | string | null;
  sort_order?: string | number | null;
};

export const hasMaterialBackendConfig = () => isSupabaseConfigured;

export const normalizeMaterialSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function checkAdminMaterialSlugUnique(slug: string, currentId?: string) {
  const value = normalizeMaterialSlug(slug);
  if (!value) return false;

  const ids = await findMaterialIdsBySlug(value);
  return !ids.some((id) => id !== currentId);
}

export function buildAdminMaterialPayload(record: AdminMaterialRecord, nextStatus?: AdminMaterialRecord["status"]) {
  const slug = normalizeMaterialSlug(record.slug || record.title_zh || "");
  const toNullablePrice = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  };

  return {
    slug,
    payload: {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      sort_order: Number(record.sort_order || 0),
      suitable_spaces_zh: record.suitable_spaces_zh || [],
      suitable_spaces_en: record.suitable_spaces_en || [],
      pros_zh: record.pros_zh || [],
      pros_en: record.pros_en || [],
      cons_zh: record.cons_zh || [],
      cons_en: record.cons_en || [],
      recommended_pairing_zh: record.recommended_pairing_zh || "",
      recommended_pairing_en: record.recommended_pairing_en || "",
      note_zh: record.note_zh || "",
      note_en: record.note_en || "",
      price_mode: record.price_mode || "none",
      price_min: toNullablePrice(record.price_min),
      price_max: toNullablePrice(record.price_max),
      price_currency: String(record.price_currency || "MYR").toUpperCase(),
      price_unit: record.price_unit || "none",
      price_scope_zh: record.price_scope_zh || "",
      price_scope_en: record.price_scope_en || "",
      price_note_zh: record.price_note_zh || "",
      price_note_en: record.price_note_en || "",
    },
  };
}

export async function saveAdminMaterial(input: SaveAdminMaterialInput) {
  const { slug, payload } = buildAdminMaterialPayload(input.record, input.nextStatus);
  const saved = await saveMaterialRecord({
    payload,
    id: input.record.id,
    expectedUpdatedAt: input.record.updated_at || null,
    action: input.nextStatus === "published" ? "publish" : input.record.id ? "update" : "insert",
    queryClient: input.queryClient,
  });

  return {
    saved,
    savedId: String((saved as Record<string, unknown>)?.id || ""),
    slug,
    status: payload.status,
  };
}

export function generateAdminMaterialEnglish(materialId: string, force: boolean) {
  return invokeMaterialEnglishGeneration(materialId, force);
}

export function loadAdminMaterialList<T extends Record<string, unknown>>(input: AdminMaterialListInput) {
  return fetchAdminMaterialList<T>(input);
}

export function loadAdminMaterialDetail(materialId: string) {
  return fetchAdminMaterialDetail(materialId);
}

export function loadAdminMaterialRows(limit: number) {
  return fetchAdminMaterialRows(limit);
}

export function loadAdminMaterialImages(materialId: string) {
  return fetchAdminMaterialImages(materialId);
}

export function addAdminMaterialImage(materialId: string, draft: AdminMaterialImageDraft) {
  return createMaterialImageRecord({
    ...draft,
    material_id: materialId,
    image_type: (draft.image_type as MaterialImageType) || "scene",
    rights_status: (draft.rights_status as MaterialImageRights) || "owned",
    sort_order: Number(draft.sort_order || 0),
    is_active: true,
  });
}

export function updateAdminMaterialImage(imageId: string, patch: Record<string, unknown>) {
  return updateMaterialImageRecord(imageId, patch);
}

export function archiveAdminMaterialImage(imageId: string) {
  return archiveMaterialImageRecord(imageId);
}
