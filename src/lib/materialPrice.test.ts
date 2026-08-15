import { describe, expect, it } from "vitest";
import { formatMaterialPrice, localizeLegacyMaterialPrice } from "@/lib/materialPrice";

describe("material price localization", () => {
  it("formats numeric ranges with the current language unit", () => {
    const input = { mode: "range", min: 5, max: 10, currency: "MYR", unit: "sqft" };

    expect(formatMaterialPrice(input, "zh")).toBe("RM 5–10 / 平方尺");
    expect(formatMaterialPrice(input, "en")).toBe("RM 5–10 / sq ft");
  });

  it("formats starting prices in Chinese without English prefixes or units", () => {
    expect(formatMaterialPrice({ mode: "from", min: 180, unit: "foot_run" }, "zh")).toBe("RM 180 / 延尺起");
    expect(formatMaterialPrice({ mode: "from", min: 180, unit: "foot_run" }, "en")).toBe("From RM 180 / ft run");
  });

  it("uses localized quote wording when a numeric price is unavailable", () => {
    expect(formatMaterialPrice({ mode: "specification" }, "zh")).toBe("按规格报价");
    expect(formatMaterialPrice({ mode: "size" }, "zh")).toBe("按尺寸报价");
    expect(formatMaterialPrice({ mode: "scope" }, "zh")).toBe("按工程范围报价");
  });

  it("localizes legacy shared price text for records not migrated yet", () => {
    expect(localizeLegacyMaterialPrice("Quote by specification", "zh")).toBe("按规格报价");
    expect(localizeLegacyMaterialPrice("From RM250 / ft run", "zh")).toBe("RM250 / 延尺起");
    expect(localizeLegacyMaterialPrice("RM6 - RM15 / sq ft", "zh")).toBe("RM6–RM15 / 平方尺");
  });
});
