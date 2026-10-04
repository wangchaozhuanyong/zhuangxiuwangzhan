import { describe, expect, it } from "vitest";
import { furnitureCatalog, getFurnitureProduct, localizeFurnitureProduct } from "./furnitureCatalog";
import { resolveFurnitureDisplay } from "./furnitureDisplaySafety.mjs";
import { formatFurnitureEnquiryMessage } from "@/i18n/furnitureText";

const danu = "danu-6-seater-sintered-stone-dining-set-cream";
const dresser = "limited-stock-2209-dressing-table";
const bed = "ws-2102-wooden-bunk-bed-white";

describe.each(["en", "zh"] as const)("reviewed supplier display in %s", (language) => {
  it("qualifies the seating variant and removes disputed dimensions and raw price", () => {
    const original = getFurnitureProduct(danu)!;
    const before = JSON.stringify(original);
    const display = localizeFurnitureProduct(original, language);
    expect(display.name).toContain(language === "en" ? "catalogue reference" : "目录标示");
    expect(display.description).toContain(language === "en" ? "require confirmation" : "待确认");
    expect(display.description).not.toMatch(/L140|140\s*[x×]|water.?proof|heat.?proof|防水|耐热/i);
    expect(display.price).toBe(language === "en" ? "Price on request" : "价格请咨询");
    expect(display.skuLabel).toBe(language === "en" ? "Catalogue reference" : "目录参考编号");
    expect(JSON.stringify(original)).toBe(before);
    expect(display.images).toBe(original.images);
    expect(display.sourceUrl).toBe(original.sourceUrl);
  });

  it("does not claim limited stock or send a conflicting dresser SKU", () => {
    const display = localizeFurnitureProduct(getFurnitureProduct(dresser)!, language);
    const message = formatFurnitureEnquiryMessage(display.name, display.sku, language);
    expect(display.name).not.toMatch(/limited stock|库存有限/i);
    expect(display.sku).toBe("");
    expect(message).not.toMatch(/2211|2237/);
    expect(display.description).toContain(language === "en" ? "different model references" : "不同型号编号");
    expect(display.price).toBe(language === "en" ? "Price on request" : "价格请咨询");
  });

  it("labels the bunk bed price and specifications with their distinct capture dates", () => {
    const display = localizeFurnitureProduct(getFurnitureProduct(bed)!, language);
    expect(display.price).toContain("RM1,900.00");
    expect(display.price).toContain(language === "en" ? "29 September 2026" : "2026年9月29日");
    expect(display.description).toContain(language === "en" ? "28 September 2026" : "2026年9月28日");
    expect(display.availabilityNote).toContain(language === "en" ? "confirm availability" : "请确认本款库存");
    expect(display.price).toContain(language === "en" ? "confirm the final price" : "最终价格");
  });

  it("leaves every other source record and a managed row with the same slug unchanged", () => {
    for (const product of furnitureCatalog.products.filter((product) => ![danu, dresser, bed].includes(product.slug))) {
      expect(resolveFurnitureDisplay(product, language)).toBe(product);
    }
    const managed = { ...getFurnitureProduct(dresser)!, sourceUrl: "admin-material:fixture", name: "Managed", sku: "CMS-SKU" };
    expect(resolveFurnitureDisplay(managed, language)).toBe(managed);
  });

});
