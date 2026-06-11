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

export function loadAdminCmsPages() {
  return fetchAdminCmsPages();
}

export function loadAdminCmsSectionTemplates() {
  return fetchAdminCmsSectionTemplates();
}

export function loadAdminCmsSections(pageId: string) {
  return fetchAdminCmsSections(pageId);
}

export function loadAdminCmsRevisions(pageId: string, sections: CmsSection[]) {
  const sectionIds = sections.map((section) => section.id).filter(Boolean);
  return fetchAdminCmsRevisions([pageId, ...sectionIds] as string[]);
}

export function loadAdminSimpleCmsRows(table: string) {
  return fetchAdminSimpleCmsRows(table);
}

export function loadAdminEditorRows(table: string, limit: number) {
  return fetchAdminEditorRows(table, limit);
}

export function loadAdminContentRecord<T extends Record<string, unknown>>(table: string, id: string) {
  return fetchAdminContentRecord<T>(table, id);
}

export async function generateAdminContentEnglish<T extends Record<string, unknown>>(table: string, id: string, force: boolean) {
  await invokeAdminContentEnglishGeneration(table, id, force);
  return fetchAdminContentRecord<T>(table, id);
}
