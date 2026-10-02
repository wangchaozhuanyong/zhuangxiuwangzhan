import { expect, it } from "vitest";
import { translateDisplayText, translateProjectScopedLabel } from "./displayLabels";

const approvedCases = [
  [
    "puchong-home-library-built-in",
    "scope",
    "Bookcase",
    "整墙书柜"
  ],
  [
    "puchong-home-library-built-in",
    "scope",
    "Integrated desk",
    "一体式书桌"
  ],
  [
    "puchong-home-library-built-in",
    "scope",
    "Display lighting",
    "展示灯光"
  ],
  [
    "puchong-home-library-built-in",
    "scope",
    "Storage bench",
    "收纳坐凳"
  ],
  [
    "subang-jaya-restaurant-fit-out",
    "scope",
    "Dining area",
    "用餐区"
  ],
  [
    "subang-jaya-restaurant-fit-out",
    "scope",
    "Booth seating",
    "卡座"
  ],
  [
    "subang-jaya-restaurant-fit-out",
    "scope",
    "Ceiling feature",
    "天花造型"
  ],
  [
    "kepong-tv-feature-wall-storage",
    "scope",
    "Floating console",
    "悬浮电视柜"
  ],
  [
    "kepong-tv-feature-wall-storage",
    "scope",
    "Display niche",
    "展示格"
  ],
  [
    "kepong-tv-feature-wall-storage",
    "scope",
    "Cable concealment",
    "线路隐藏"
  ],
  [
    "ampang-landed-exterior-repaint",
    "scope",
    "Exterior repaint",
    "外墙重漆"
  ],
  [
    "ampang-landed-exterior-repaint",
    "scope",
    "Stone feature",
    "石材造型"
  ],
  [
    "ampang-landed-exterior-repaint",
    "scope",
    "Porch lighting",
    "门廊灯光"
  ],
  [
    "ampang-landed-exterior-repaint",
    "scope",
    "Driveway refresh",
    "车道翻新"
  ]
] as const;

for (const [slug, field, source, translated] of approvedCases) {
  it(`renders the approved ${slug}/${field}/${source} label without editing EN or other fields`, () => {
    expect(translateProjectScopedLabel(source, "zh", slug, field)).toBe(translated);
    expect(translateProjectScopedLabel(source, "en", slug, field)).toBe(source);
    expect(translateProjectScopedLabel(source, "zh", "other-project", field)).toBe(translateDisplayText(source, "zh"));
    const otherField = field === "scope" ? "materials" : "scope";
    expect(translateProjectScopedLabel(source, "zh", slug, otherField)).toBe(translateDisplayText(source, "zh"));
  });
}
it("does not translate substrings of CMS prose or unknown project labels", () => {
  const prose = "Choose Bookcase and Integrated desk after site assessment.";
  expect(translateProjectScopedLabel(prose, "zh", "puchong-home-library-built-in", "scope")).toBe(translateDisplayText(prose, "zh"));
  expect(translateProjectScopedLabel("Unknown next label", "zh", "puchong-home-library-built-in", "scope")).toBe(translateDisplayText("Unknown next label", "zh"));
});
