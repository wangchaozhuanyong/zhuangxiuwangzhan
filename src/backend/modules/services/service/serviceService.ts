import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAdminServiceDetail,
  fetchAdminServiceList,
  fetchAdminServiceRows,
  findServiceIdsBySlug,
  invokeServiceEnglishGeneration,
  saveServiceRecord,
  type AdminServiceListInput,
} from "@/backend/modules/services/repository/serviceRepository";

type AdminServiceRecord = Record<string, any> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
};

export type SaveAdminServiceInput = {
  record: AdminServiceRecord;
  nextStatus?: AdminServiceRecord["status"];
  queryClient?: QueryClient;
};

export const hasServiceBackendConfig = () => isSupabaseConfigured;

export const normalizeServiceSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const cleanLines = (value?: string[] | null) => (value || []).map((item) => item.trim()).filter(Boolean);

const cleanProcessSteps = (value?: any[] | null) =>
  (value || [])
    .map((item) => ({ ...item, title: String(item?.title || "").trim(), desc: String(item?.desc || "").trim() }))
    .filter((item) => item.title || item.desc);

const cleanFaqs = (value?: any[] | null) =>
  (value || [])
    .map((item) => ({ ...item, q: String(item?.q || "").trim(), a: String(item?.a || "").trim() }))
    .filter((item) => item.q || item.a);

export async function checkAdminServiceSlugUnique(slug: string, currentId?: string) {
  const value = normalizeServiceSlug(slug);
  if (!value) return false;

  const ids = await findServiceIdsBySlug(value);
  return !ids.some((id) => id !== currentId);
}

export function buildAdminServicePayload(record: AdminServiceRecord, nextStatus?: AdminServiceRecord["status"]) {
  const slug = normalizeServiceSlug(record.slug || record.title_zh || "");

  return {
    slug,
    payload: {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      suitable_for_zh: cleanLines(record.suitable_for_zh),
      suitable_for_en: cleanLines(record.suitable_for_en),
      common_projects_zh: cleanLines(record.common_projects_zh),
      common_projects_en: cleanLines(record.common_projects_en),
      scope_items_zh: cleanLines(record.scope_items_zh),
      scope_items_en: cleanLines(record.scope_items_en),
      process_steps_zh: cleanProcessSteps(record.process_steps_zh),
      process_steps_en: cleanProcessSteps(record.process_steps_en),
      faqs_zh: cleanFaqs(record.faqs_zh),
      faqs_en: cleanFaqs(record.faqs_en),
    },
  };
}

export async function saveAdminService(input: SaveAdminServiceInput) {
  const { slug, payload } = buildAdminServicePayload(input.record, input.nextStatus);
  const saved = await saveServiceRecord({
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

export function generateAdminServiceEnglish(serviceId: string, force: boolean) {
  return invokeServiceEnglishGeneration(serviceId, force);
}

export function loadAdminServiceList<T extends Record<string, any>>(input: AdminServiceListInput) {
  return fetchAdminServiceList<T>(input);
}

export function loadAdminServiceDetail(serviceId: string) {
  return fetchAdminServiceDetail(serviceId);
}

export function loadAdminServiceRows(limit: number) {
  return fetchAdminServiceRows(limit);
}
