import type { QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  createProjectImageRecord,
  deleteProjectImageRecord,
  fetchAdminProjectDetail,
  fetchAdminProjectImages,
  fetchAdminProjectList,
  fetchAdminProjectRows,
  findProjectIdsBySlug,
  invokeProjectEnglishGeneration,
  resetProjectCoverRecords,
  saveProjectRecord,
  updateProjectImageRecord,
  type AdminProjectListInput,
} from "@/backend/modules/projects/repository/projectRepository";

type AdminProjectRecord = Record<string, unknown> & {
  id?: string;
  updated_at?: string | null;
  slug?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
  sort_order?: string | number | null;
  materials?: unknown[] | null;
  scope?: unknown[] | null;
  highlights_zh?: unknown[] | null;
  highlights_en?: unknown[] | null;
};

export type SaveAdminProjectInput = {
  record: AdminProjectRecord;
  nextStatus?: AdminProjectRecord["status"];
  queryClient?: QueryClient;
};

export type ProjectImageType = "gallery" | "before" | "after" | "cover";

export type AdminProjectImageDraft = {
  image_url: string;
  image_type?: ProjectImageType | string | null;
  alt_zh?: string | null;
  alt_en?: string | null;
  sort_order?: string | number | null;
};

export const hasProjectBackendConfig = () => isSupabaseConfigured;

export const normalizeProjectSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function checkAdminProjectSlugUnique(slug: string, currentId?: string) {
  const value = normalizeProjectSlug(slug);
  if (!value) return false;

  const ids = await findProjectIdsBySlug(value);
  return !ids.some((id) => id !== currentId);
}

export function buildAdminProjectPayload(record: AdminProjectRecord, nextStatus?: AdminProjectRecord["status"]) {
  const slug = normalizeProjectSlug(record.slug || record.title_zh || "");

  return {
    slug,
    payload: {
      ...record,
      slug,
      status: nextStatus ?? record.status,
      sort_order: Number(record.sort_order || 0),
      materials: record.materials || [],
      scope: record.scope || [],
      highlights_zh: record.highlights_zh || [],
      highlights_en: record.highlights_en || [],
    },
  };
}

export async function saveAdminProject(input: SaveAdminProjectInput) {
  const { slug, payload } = buildAdminProjectPayload(input.record, input.nextStatus);
  const saved = await saveProjectRecord({
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

export function generateAdminProjectEnglish(projectId: string, force: boolean) {
  return invokeProjectEnglishGeneration(projectId, force);
}

export function addAdminProjectImage(projectId: string, draft: AdminProjectImageDraft) {
  return createProjectImageRecord({
    ...draft,
    project_id: projectId,
    image_type: (draft.image_type as ProjectImageType) || "gallery",
    sort_order: Number(draft.sort_order || 0),
  });
}

export function updateAdminProjectImage(imageId: string, patch: Record<string, unknown>) {
  return updateProjectImageRecord(imageId, patch);
}

export async function setAdminProjectImageAsCover(projectId: string, imageId: string) {
  await resetProjectCoverRecords(projectId);
  await updateProjectImageRecord(imageId, { image_type: "cover", sort_order: 0 });

  return true;
}

export function deleteAdminProjectImage(imageId: string) {
  return deleteProjectImageRecord(imageId);
}

export function loadAdminProjectList<T extends Record<string, unknown>>(input: AdminProjectListInput) {
  return fetchAdminProjectList<T>(input);
}

export function loadAdminProjectDetail(projectId: string) {
  return fetchAdminProjectDetail(projectId);
}

export function loadAdminProjectRows(limit: number) {
  return fetchAdminProjectRows(limit);
}

export function loadAdminProjectImages(projectId: string) {
  return fetchAdminProjectImages(projectId);
}
