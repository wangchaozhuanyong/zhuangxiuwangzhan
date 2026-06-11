import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAdminServiceDetail,
  fetchAdminServiceList,
  fetchAdminServiceRows,
  findServiceIdsBySlug,
  invokeServiceEnglishGeneration,
  publishServiceRecord,
  saveServiceRecord,
  type AdminServiceListInput,
} from "@/backend/modules/services/repository/serviceRepository";

type TextPairItem = {
  title?: string | null;
  desc?: string | null;
  q?: string | null;
  a?: string | null;
  [key: string]: unknown;
};

type AdminServiceRecord = Record<string, unknown> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
  suitable_for_zh?: string[] | null;
  suitable_for_en?: string[] | null;
  common_projects_zh?: string[] | null;
  common_projects_en?: string[] | null;
  scope_items_zh?: string[] | null;
  scope_items_en?: string[] | null;
  process_steps_zh?: TextPairItem[] | null;
  process_steps_en?: TextPairItem[] | null;
  faqs_zh?: TextPairItem[] | null;
  faqs_en?: TextPairItem[] | null;
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

const cleanProcessSteps = (value?: TextPairItem[] | null) =>
  (value || [])
    .map((item) => ({ ...item, title: String(item?.title || "").trim(), desc: String(item?.desc || "").trim() }))
    .filter((item) => item.title || item.desc);

const cleanFaqs = (value?: TextPairItem[] | null) =>
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

export async function publishAdminService(input: SaveAdminServiceInput & { approvalId?: string; source?: string }) {
  const { slug, payload } = buildAdminServicePayload(input.record, input.nextStatus || "published");
  const result = await publishServiceRecord({
    record: payload,
    nextStatus: (payload.status as AdminServiceRecord["status"]) || "published",
    expectedUpdatedAt: input.record.updated_at || null,
    approvalId: input.approvalId,
    source: input.source,
  });

  const saved = (result.saved_record || {}) as Record<string, unknown>;
  const savedId = String(result.saved_id || saved.id || input.record.id || "");

  return {
    saved,
    savedId,
    slug,
    status: (result.status as AdminServiceRecord["status"]) || (payload.status as AdminServiceRecord["status"]),
    warnings: result.warnings || [],
    nextSteps: result.next_steps || [],
  };
}

export function generateAdminServiceEnglish(serviceId: string, force: boolean) {
  return invokeServiceEnglishGeneration(serviceId, force);
}

export function loadAdminServiceList<T extends Record<string, unknown>>(input: AdminServiceListInput) {
  return fetchAdminServiceList<T>(input);
}

export function loadAdminServiceDetail(serviceId: string) {
  return fetchAdminServiceDetail(serviceId);
}

export function loadAdminServiceRows(limit: number) {
  return fetchAdminServiceRows(limit);
}
