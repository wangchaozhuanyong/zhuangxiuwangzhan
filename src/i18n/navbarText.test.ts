import { describe, expect, it } from "vitest";
import { publicNavigationItems } from "@/config/publicNavigation";
import { getNavigationLabel, navigationTranslations } from "./navbarText";
import { translations } from "./translations";

describe("lightweight public navigation translation contract", () => {
  const navigationKeys = Object.keys(translations).filter((key) => key.startsWith("nav."));

  it("keeps exactly the complete table's navigation keys and bilingual values", () => {
    expect(Object.keys(navigationTranslations).sort()).toEqual([...navigationKeys].sort());
    for (const key of navigationKeys) {
      expect(navigationTranslations[key]).toEqual(translations[key]);
      expect(navigationTranslations[key].en).toBeTruthy();
      expect(navigationTranslations[key].zh).toBeTruthy();
    }
  });

  it("covers every label used by the actual public navigation configuration", () => {
    for (const item of publicNavigationItems) {
      expect(navigationTranslations).toHaveProperty(item.labelKey);
      expect(getNavigationLabel(item.labelKey, "en")).toBe(translations[item.labelKey].en);
      expect(getNavigationLabel(item.labelKey, "zh")).toBe(translations[item.labelKey].zh);
    }
  });

  it("preserves the original language and English fallback behavior", () => {
    for (const key of navigationKeys) {
      for (const language of ["en", "zh", "fr", ""]) {
        expect(getNavigationLabel(key, language)).toBe(translations[key][language] || translations[key].en || key);
      }
    }
  });

  it("returns an unknown key without inventing a navigation label", () => {
    for (const language of ["en", "zh", "fr", ""]) {
      expect(getNavigationLabel("nav.unknown-contract-key", language)).toBe("nav.unknown-contract-key");
    }
  });
});
