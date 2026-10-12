import { expect, it } from "vitest";
import { translateDisplayText, translateProjectScopedLabel } from "./displayLabels";

const approvedCases = [
  ["mont-kiara-luxury-condo-renovation", "scope", "Living and dining layout concept", "客餐厅布局概念"],
  ["mont-kiara-luxury-condo-renovation", "scope", "Feature-wall direction", "背景墙设计方向"],
  ["mont-kiara-luxury-condo-renovation", "scope", "Built-in storage planning", "定制收纳规划"],
  ["mont-kiara-luxury-condo-renovation", "scope", "Lighting concept", "灯光设计概念"],
  ["kota-damansara-clinic-fit-out", "scope", "Reception counter", "接待柜台"],
  ["kota-damansara-clinic-fit-out", "scope", "Waiting area", "候诊区"],
  ["kota-damansara-clinic-fit-out", "scope", "Consultation corridor", "诊室走廊"],
  ["kota-damansara-clinic-fit-out", "scope", "Commercial lighting", "商业照明"],
  ["kota-damansara-clinic-fit-out", "materials", "Light oak veneer", "浅橡木饰面"],
  ["kota-damansara-clinic-fit-out", "materials", "Frosted glass", "磨砂玻璃"],
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

it("keeps concept prose and new scope values outside the reviewed exact labels", () => {
  const slug = "mont-kiara-luxury-condo-renovation";
  for (const value of ["Review Living and dining layout concept after site assessment.", "Future concept label", "已确认的中文范围"]) {
    expect(translateProjectScopedLabel(value, "zh", slug, "scope")).toBe(translateDisplayText(value, "zh"));
    expect(translateProjectScopedLabel(value, "en", slug, "scope")).toBe(value);
  }
});
