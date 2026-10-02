import { describe, expect, it } from "vitest";
import { translateDisplayText, translateMaterialSubcategory } from "@/i18n/displayLabels";

describe("translateDisplayText", () => {
  it.each([
    ["Kajang renovation contractor、装修公司", "Kajang 装修承包商、装修公司"],
    ["Wangsa Maju 装修公司、renovation contractor", "Wangsa Maju 装修公司、装修承包商"],
    ["Built-in furniture", "定制内嵌家具"],
    ["Custom built-in", "定制内嵌家具"],
  ])("keeps the current local content phrase %s whole across both display passes", (source, expected) => {
    const localized = translateDisplayText(source, "zh");
    expect(localized).toBe(expected);
    expect(translateDisplayText(localized, "zh")).toBe(expected);
    expect(translateDisplayText(source, "en")).toBe(source);
  });

  it("retains the longer custom furniture label and unrelated CMS prose", () => {
    expect(translateDisplayText("Custom built-in furniture", "zh")).toBe("定制内嵌家具");
    expect(translateDisplayText("已确认的中文项目说明。", "zh")).toBe("已确认的中文项目说明。");
    expect(translateDisplayText("The contractor will review the site before discussing the project scope.", "zh"))
      .toBe("The contractor will review the site before discussing the project scope.");
  });

  it("localizes only the two curated whole-house fallback sentences and keeps EN/CMS text", () => {
    const pairs = [
      ["Built-in and walk-in wardrobes with modern sliding or swing doors.", "内嵌式衣柜与步入式衣帽间，可结合空间规划推拉门或平开门。"],
      ["Multi-purpose storage solutions for every room.", "适用于不同房间用途的多用途收纳规划。"],
    ];
    for (const [en, zh] of pairs) {
      expect(translateDisplayText(en, "zh")).toBe(zh);
      expect(translateDisplayText(en, "en")).toBe(en);
    }
    expect(translateDisplayText("已发布的定制柜材料摘要。", "zh")).toBe("已发布的定制柜材料摘要。");
  });
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

  it("translates CMS material subcategory labels used by public taxonomy pages", () => {
    expect(translateMaterialSubcategory("Anti-Slip Tile", "zh")).toBe("防滑砖");
    expect(translateMaterialSubcategory("Acoustic Wall Panel", "zh")).toBe("吸音墙板");
    expect(translateMaterialSubcategory("Solid Wood Finish", "zh")).toBe("实木饰面");
  });

  it("localizes legacy approval service cards on Chinese pages", () => {
    expect(translateDisplayText("Permit & Drawing Support", "zh")).toBe("装修准证与图纸支持");
    expect(translateDisplayText(
      "Review renovation approval, management, drawing, and document-coordination needs against the property and confirmed project scope.",
      "zh",
    )).toBe("根据房产类型与已确认项目范围，检查装修审批、管理方、图纸与文件协调需求。");
  });
});
