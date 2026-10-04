import { toRecord } from "@/lib/recordUtils";

export type OptionalHomeSection = "brand_partners" | "testimonials";

// Older published records must not activate sections removed from the current site.
export const isOptionalHomeSectionEnabled = (sectionKey: OptionalHomeSection, value: unknown): boolean => {
  const rows = Array.isArray(value) ? value : [value];
  return rows.some((value) => {
    const row = toRecord(value);
    return row.section_key === sectionKey && row.status === "published"
      && Array.isArray(row.items_zh) && row.items_zh.some((item) => toRecord(item).enabled === true);
  });
};
