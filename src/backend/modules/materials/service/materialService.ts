import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAdminMaterialDetail,
  fetchAdminMaterialList,
  fetchAdminMaterialRows,
  findMaterialIdsBySlug,
  invokeMaterialEnglishGeneration,
  saveMaterialRecord,
  type AdminMaterialListInput,
} from "@/backend/modules/materials/repository/materialRepository";

type AdminMaterialRecord = Record<string, any> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
};

export type SaveAdminMaterialInput = {
  record: AdminMaterialRecord;
  nextStatus?: AdminMaterialRecord["status"];
  queryClient?: QueryClient;
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

export function loadAdminMaterialList<T extends Record<string, any>>(input: AdminMaterialListInput) {
  return fetchAdminMaterialList<T>(input);
}

export function loadAdminMaterialDetail(materialId: string) {
  return fetchAdminMaterialDetail(materialId);
}

export function loadAdminMaterialRows(limit: number) {
  return fetchAdminMaterialRows(limit);
}
