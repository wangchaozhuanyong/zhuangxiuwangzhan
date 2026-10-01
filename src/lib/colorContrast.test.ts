import { describe, expect, it } from "vitest";
import { chooseAdaptiveTextColor, getContrastRatio, getImageSourcePoint, getReadableTextColor, parseCssColor } from "./colorContrast";

describe("resolved color contrast", () => {
  it("uses the WCAG luminance ratio and chooses actual contrast over a brightness threshold", () => {
    expect(getContrastRatio("white", "black")).toBe(21);
    expect(getContrastRatio("#3F4E42", "#FDFCFA")).toBeGreaterThan(7);
    expect(getReadableTextColor("#999", "#292E29", "#FDFCFA")).toBe("#292E29");
  });
  it("parses the browser's modern RGB, HSL and alpha hex notation", () => {
    expect(parseCssColor("rgb(100% 0% 0% / 50%)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseCssColor("hsl(0deg 100% 50% / .5)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseCssColor("#ff000080")?.a).toBeCloseTo(0.502);
    expect(parseCssColor("color(srgb 1 0 0 / 50%)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });
  it("does not invent a backdrop for transparent or unresolved backgrounds", () => {
    expect(getContrastRatio("white", "transparent")).toBeNull();
    expect(getContrastRatio("var(--foreground)", "#fff")).toBeNull();
    expect(getContrastRatio("white", "rgb(0 0 0 / .5)", "transparent")).toBeNull();
    expect(getContrastRatio("white", "transparent", "black")).toBe(21);
  });
  it.each(["#000", "#fff"])("keeps reading surfaces safe over the extreme %s backdrop", (backdrop) => {
    for (const foreground of ["#292E29", "#626A60", "#3F4E42"]) {
      expect(getContrastRatio(foreground, "rgb(253 252 250 / .96)", backdrop)).toBeGreaterThanOrEqual(4.5);
    }
    expect(getContrastRatio("#FDFCFA", "hsl(30 14% 5% / .88)", backdrop)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("adaptive local text contrast", () => {
  const sample = (color: string) => parseCssColor(color)!;
  it("switches the same transparent text between dark and light local backgrounds", () => {
    expect(chooseAdaptiveTextColor([sample("#fff")], "#292E29").color).toBe("#292E29");
    expect(chooseAdaptiveTextColor([sample("#111")], "#292E29").color).toBe("#ffffff");
  });
  it("keeps skin button colors when their actual background has enough contrast", () => {
    expect(chooseAdaptiveTextColor([sample("#3F4E42")], "#FDFCFA")).toMatchObject({ color: "#FDFCFA", outline: false });
  });
  it("uses an outline when one word covers both black and white, instead of averaging away the problem", () => {
    expect(chooseAdaptiveTextColor([sample("#000"), sample("#fff")], "#292E29")).toMatchObject({ outline: true, minimumRatio: 1 });
  });
  it("does not mistake a difference blend on mid-gray for readable text", () => {
    const result = chooseAdaptiveTextColor([sample("#808080")], "#7f7f7f");
    expect(result.color).toBe("#000000");
    expect(result.minimumRatio).toBeGreaterThanOrEqual(4.5);
    expect(result.outline).toBe(false);
  });
  it.each(Array.from({ length: 32 }, (_, index) => Math.round(index * 255 / 31)))("keeps a uniform gray level %s readable", (gray) => {
    const result = chooseAdaptiveTextColor([{ r: gray, g: gray, b: gray, a: 1 }], "#626A60");
    expect(result.minimumRatio).toBeGreaterThanOrEqual(4.5);
    expect(result.outline).toBe(false);
  });
  it("treats unavailable, unpainted and cross-origin pixels as unknown, with a glyph fallback", () => {
    for (const samples of [[], [null], [sample("#fff"), null], [sample("transparent")]]) {
      expect(chooseAdaptiveTextColor(samples, "#292E29")).toMatchObject({ outline: true, minimumRatio: null });
    }
  });
});

describe("responsive image coordinate mapping", () => {
  const geometry = { width: 400, height: 800, naturalWidth: 1600, naturalHeight: 900, fit: "cover", position: "50% 54%" };
  it("samples the cropped source region on mobile, not the uncropped photo", () => {
    expect(getImageSourcePoint(geometry, 200, 400)).toEqual({ x: 800, y: 450 });
    expect(getImageSourcePoint(geometry, 0, 0)?.x).toBeCloseTo(575);
  });
  it("honors the home photo's left alignment", () => {
    expect(getImageSourcePoint({ ...geometry, position: "left center" }, 0, 0)).toEqual({ x: 0, y: 0 });
  });
  it("distinguishes contain letterboxing from source pixels", () => {
    const contain = { ...geometry, fit: "contain", position: "50% 50%" };
    expect(getImageSourcePoint(contain, 200, 10)).toBeNull();
    expect(getImageSourcePoint(contain, 200, 400)).toEqual({ x: 800, y: 450 });
  });
  it("handles stretched images and reports unsupported positions honestly", () => {
    expect(getImageSourcePoint({ ...geometry, fit: "fill" }, 200, 400)).toEqual({ x: 800, y: 450 });
    expect(getImageSourcePoint({ ...geometry, position: "right 20px top 10px" }, 200, 400)).toBeNull();
  });
});
