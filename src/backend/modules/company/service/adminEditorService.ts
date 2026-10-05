import {
  fetchAboutSectionRecord,
  fetchEditorCtaBlock,
  fetchEditorFaqRows,
  fetchEditorProcessSteps,
  hasCompanyEditorDatabaseClient,
  type AboutSectionRow,
  type CtaRow,
  type FaqRow,
  type ProcessStepRow,
} from "../repository/adminEditorRepository";

export const aboutSectionKeys = ["hero", "intro", "stats", "core_values", "team", "milestones", "office"] as const;
export type AboutSectionKey = (typeof aboutSectionKeys)[number];

export type AdminAboutEditorData = {
  sections: Record<string, AboutSectionRow | null>;
  ctaBlock: CtaRow | null;
};

// Preserve the existing editor DTO contract at the application boundary.
export async function loadAboutSectionRecord(sectionKey: string, signal?: AbortSignal): Promise<AboutSectionRow | null> {
  return (await fetchAboutSectionRecord(sectionKey, signal)) as AboutSectionRow | null;
}

export async function loadAboutEditorCtaBlock(signal?: AbortSignal): Promise<CtaRow | null> {
  return (await fetchEditorCtaBlock("about_final", signal)) as CtaRow | null;
}

export async function loadHomeEditorAuxiliaryRows(signal?: AbortSignal) {
  const [processSteps, faqRows, ctaBlock] = await Promise.all([
    fetchEditorProcessSteps(signal),
    fetchEditorFaqRows("home", signal),
    fetchEditorCtaBlock("home_final", signal),
  ]);
  return { processSteps: processSteps as ProcessStepRow[], faqRows: faqRows as FaqRow[], ctaBlock: ctaBlock as CtaRow | null };
}

export async function loadAdminAboutEditorData(signal?: AbortSignal): Promise<AdminAboutEditorData> {
  if (!hasCompanyEditorDatabaseClient()) return { sections: {}, ctaBlock: null };

  const rows = await Promise.all(aboutSectionKeys.map((key) => loadAboutSectionRecord(key, signal)));
  const sections: Record<string, AboutSectionRow | null> = {};
  aboutSectionKeys.forEach((key, index) => {
    sections[key] = rows[index] ?? null;
  });
  const ctaBlock = await loadAboutEditorCtaBlock(signal);
  return { sections, ctaBlock };
}
