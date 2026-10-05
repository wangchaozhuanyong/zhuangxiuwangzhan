import type { CmsSection } from "@/lib/adminCmsBuilderModel";
import { fetchAdminCmsSections } from "@/backend/modules/cms/repository/cmsRepository";

export class CmsSectionOrderError extends Error {
  constructor(
    public readonly completedIds: string[],
    public readonly confirmedSections: CmsSection[] | null,
    public readonly failure: unknown,
    public readonly invalidInput = false,
  ) {
    super("cms_section_order_incomplete");
    this.name = "CmsSectionOrderError";
  }
}

/** Sequential writes are not a transaction. On failure, read back actual order/versions before retrying. */
export async function persistCmsSectionOrder(
  pageId: string,
  nextSections: CmsSection[],
  saveSection: (section: CmsSection, sortOrder: number) => Promise<CmsSection>,
  readSections: () => Promise<CmsSection[]> = () => fetchAdminCmsSections(pageId),
) {
  const ids = nextSections.map((section) => section.id);
  if (!pageId || ids.some((id) => !id) || new Set(ids).size !== ids.length
    || nextSections.some((section) => section.page_id !== pageId)) {
    throw new CmsSectionOrderError([], null, null, true);
  }
  const changed = nextSections.map((section, index) => ({ section, sortOrder: (index + 1) * 10 }))
    .filter(({ section, sortOrder }) => Number(section.sort_order || 0) !== sortOrder);
  const saved = new Map<string, CmsSection>();
  try {
    for (const { section, sortOrder } of changed) {
      const record = await saveSection(section, sortOrder);
      saved.set(section.id!, record);
    }
  } catch (failure) {
    let confirmedSections: CmsSection[] | null = null;
    try { confirmedSections = await readSections(); } catch { /* Keep stale data locked until explicit recovery. */ }
    throw new CmsSectionOrderError([...saved.keys()], confirmedSections, failure);
  }
  return { changedCount: changed.length, sections: nextSections.map((section) => saved.get(section.id!) || section) };
}
