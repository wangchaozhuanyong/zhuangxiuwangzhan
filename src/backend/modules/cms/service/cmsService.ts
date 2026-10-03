import type { CmsSection } from "@/lib/adminCmsBuilderModel";
import {
  fetchAdminCmsPages,
  fetchAdminCmsRevisions,
  fetchAdminCmsSections,
  fetchAdminCmsSectionTemplates,
  fetchAdminContentRecord,
  fetchAdminEditorRows,
  fetchAdminSimpleCmsRows,
  invokeAdminContentEnglishGeneration,
} from "@/backend/modules/cms/repository/cmsRepository";

export function loadAdminCmsPages(signal?: AbortSignal) {
  return fetchAdminCmsPages(signal);
}

export function loadAdminCmsSectionTemplates(signal?: AbortSignal) {
  return fetchAdminCmsSectionTemplates(signal);
}

export function loadAdminCmsSections(pageId: string, signal?: AbortSignal) {
  return fetchAdminCmsSections(pageId, signal);
}

export function loadAdminCmsRevisions(pageId: string, sections: CmsSection[], signal?: AbortSignal) {
  const sectionIds = sections.map((section) => section.id).filter(Boolean);
  return fetchAdminCmsRevisions([pageId, ...sectionIds] as string[], signal);
}

export function loadAdminSimpleCmsRows(table: string, signal?: AbortSignal) {
  return fetchAdminSimpleCmsRows(table, signal);
}

export function loadAdminEditorRows(table: string, limit: number, signal?: AbortSignal) {
  return fetchAdminEditorRows(table, limit, signal);
}

export function loadAdminContentRecord<T extends Record<string, unknown>>(table: string, id: string, signal?: AbortSignal) {
  return fetchAdminContentRecord<T>(table, id, signal);
}

export async function generateAdminContentEnglish<T extends Record<string, unknown>>(table: string, id: string, force: boolean) {
  await invokeAdminContentEnglishGeneration(table, id, force);
  return fetchAdminContentRecord<T>(table, id);
}
