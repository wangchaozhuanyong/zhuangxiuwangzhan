import { loadHomeEditorAuxiliaryRows, type CtaRow, type FaqRow, type ProcessStepRow } from "@/backend/modules/company";
import { fetchHomeSectionRecord, hasHomeEditorDatabaseClient, type HomeSectionRow } from "../repository/adminEditorRepository";

export type AdminHomeEditorData = {
  stats: HomeSectionRow | null;
  why: HomeSectionRow | null;
  brandPartnersVisibility: HomeSectionRow | null;
  processSteps: ProcessStepRow[];
  faqRows: FaqRow[];
  ctaBlock: CtaRow | null;
};

export const hasAdminEditorDatabaseClient = hasHomeEditorDatabaseClient;
export async function loadHomeSectionRecord(sectionKey: string, signal?: AbortSignal): Promise<HomeSectionRow | null> {
  return (await fetchHomeSectionRecord(sectionKey, signal)) as HomeSectionRow | null;
}

export async function loadAdminHomeEditorData(signal?: AbortSignal): Promise<AdminHomeEditorData> {
  if (!hasHomeEditorDatabaseClient()) {
    return { stats: null, why: null, brandPartnersVisibility: null, processSteps: [], faqRows: [], ctaBlock: null };
  }

  const [stats, why, brandPartnersVisibility, auxiliary] = await Promise.all([
    loadHomeSectionRecord("stats", signal),
    loadHomeSectionRecord("why_choose_us", signal),
    loadHomeSectionRecord("brand_partners", signal),
    loadHomeEditorAuxiliaryRows(signal),
  ]);
  return { stats, why, brandPartnersVisibility, ...auxiliary };
}
