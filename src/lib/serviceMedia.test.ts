import { describe, expect, it } from "vitest";
import { isAiServiceConceptImage, isServiceConceptImage } from "./serviceMedia";

describe("service media disclosure", () => {
  it("recognizes bilingual concept descriptions without labeling ordinary photos", () => {
    expect(isServiceConceptImage("Warehouse shelving rendering concept")).toBe(true);
    expect(isServiceConceptImage("仓储货架规划概念图")).toBe(true);
    expect(isServiceConceptImage("Office reception and meeting area")).toBe(false);
  });

  it("ties AI disclosure to the controlled asset category, not a generic concept alt", () => {
    expect(isAiServiceConceptImage("/images/services/ai-concepts/builtin-concept.webp")).toBe(true);
    expect(isAiServiceConceptImage("https://flashcast.com.my/images/services/ai-concepts/warehouse-concept.webp?v=1")).toBe(true);
    expect(isAiServiceConceptImage("/images/services/builtin-solutions.webp")).toBe(false);
    expect(isAiServiceConceptImage("/images/services/ai-concepts/other.jpg")).toBe(false);
  });
});
