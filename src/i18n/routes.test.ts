import { describe, expect, it } from "vitest";
import { switchLanguagePath, withLanguagePrefix } from "@/i18n/routes";

describe("localized route helpers", () => {
  it("keeps query and hash when switching language", () => {
    expect(
      switchLanguagePath(
        "/en/quote",
        "zh",
        "?source=project&title=Mont%20Kiara%20Condo",
        "#form",
      ),
    ).toBe("/zh/quote?source=project&title=Mont%20Kiara%20Condo#form");
  });

  it("preserves the same page and tracking parameters across all three languages", () => {
    for (const source of ["zh", "en", "ms"]) for (const target of ["zh", "en", "ms"] as const) {
      expect(switchLanguagePath(`/${source}/services/kitchen`, target, "?utm_source=google", "#details")).toBe(`/${target}/services/kitchen?utm_source=google#details`);
    }
  });

  it("does not duplicate language prefixes", () => {
    expect(withLanguagePrefix("/zh/services", "en")).toBe("/en/services");
  });
});
