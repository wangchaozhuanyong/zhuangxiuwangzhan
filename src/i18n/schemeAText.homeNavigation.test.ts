import { describe, expect, it } from "vitest";
import { schemeAHomeText } from "@/i18n/schemeAText";

const ownerPaths = [
  "/services/renovation",
  "/services/kitchen",
  "/services/builtin",
  "/services/office-renovation",
  "/services/shop-renovation",
  "/services/bathroom",
];

describe("homepage service navigation", () => {
  it.each(["zh", "en"] as const)("keeps six distinct Service owners in %s", (language) => {
    const copy = schemeAHomeText[language];
    expect(copy.serviceFallbacks.map(({ path }) => path)).toEqual(ownerPaths);
    expect(new Set(copy.serviceFallbacks.map(({ path }) => path)).size).toBe(6);
    expect(copy.serviceFallbacks.every(({ title, summary }) => title && summary)).toBe(true);
    expect(copy.designLink).toBeTruthy();
    expect(copy.areasLink).toBeTruthy();
  });

  it("replaces absolute fee promises with site review and written terms", () => {
    expect(schemeAHomeText.zh.trustBadgeDetail).not.toContain("0增项");
    expect(schemeAHomeText.en.trustBadgeDetail).not.toMatch(/no hidden fees/i);
    expect(schemeAHomeText.zh.trustBadgeDetail).toContain("书面报价");
    expect(schemeAHomeText.en.trustBadgeDetail).toContain("written quote");
  });
});
