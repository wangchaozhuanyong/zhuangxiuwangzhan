import { describe, expect, it } from "vitest";
import { translateDisplayText } from "@/i18n/displayLabels";

describe("translateDisplayText", () => {
  it("does not replace a label inside a longer English word", () => {
    expect(translateDisplayText("Malaysian homes", "zh")).toBe("Malaysian homes");
  });

  it("keeps untranslated English prose intact instead of creating mixed fragments", () => {
    const title = "SPC Vinyl vs Laminate Flooring: Which is Better for Malaysian Homes?";
    expect(translateDisplayText(title, "zh")).toBe(title);
  });

  it("still translates exact short material labels", () => {
    expect(translateDisplayText("SPC Vinyl Flooring", "zh")).toBe("SPC 地板");
  });

  it("still applies curated full-sentence translations", () => {
    expect(translateDisplayText("Homeowners planning a renovation", "zh")).toBe("正在规划装修的屋主");
  });
});
