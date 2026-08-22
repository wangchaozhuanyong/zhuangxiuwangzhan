import { describe, expect, it } from "vitest";
import { isRenderingConceptImage, isRenderingConceptProject } from "@/lib/projectContentClassification";

describe("project content classification", () => {
  it("classifies generated portfolio media as a rendering concept", () => {
    expect(isRenderingConceptImage("/images/projects/generated-portfolio/office.webp")).toBe(true);
    expect(isRenderingConceptProject({ thumbnail: "https://example.com/projects/generated-portfolio/home.webp" })).toBe(true);
  });

  it("does not classify ordinary project media as a rendering concept", () => {
    expect(isRenderingConceptImage("/images/projects/proj1-condo-1.webp")).toBe(false);
    expect(isRenderingConceptProject({ images: ["/images/projects/proj1-condo-1.webp"] })).toBe(false);
  });
});
