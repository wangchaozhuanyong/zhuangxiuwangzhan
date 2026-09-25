import { describe, expect, it } from "vitest";
import { isServiceConceptImage } from "./serviceMedia";

describe("service media disclosure", () => {
  it("recognizes bilingual concept descriptions without labeling ordinary photos", () => {
    expect(isServiceConceptImage("Warehouse shelving rendering concept")).toBe(true);
    expect(isServiceConceptImage("仓储货架规划概念图")).toBe(true);
    expect(isServiceConceptImage("Office reception and meeting area")).toBe(false);
  });
});
