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

  it("classifies legacy project media when the published copy identifies a rendering concept", () => {
    expect(isRenderingConceptProject({
      thumbnail: "/images/projects/proj2-office-1.webp",
      title: "Corporate Office Space Planning Rendering Concept",
    })).toBe(true);
    expect(isRenderingConceptProject({
      thumbnail: "/images/projects/proj1-condo-1.webp",
      description: "本页展示现代公寓空间规划效果图概念。",
    })).toBe(true);
    expect(isRenderingConceptProject({
      image_url: "/images/projects/proj7-restaurant-1.webp",
      content_en: "<p>This page is for early discussion. It is not a completed customer project.</p>",
    })).toBe(true);
  });

  it("does not infer a concept from ordinary design-process wording", () => {
    expect(isRenderingConceptProject({
      images: ["/images/projects/completed-office.webp"],
      title: "Office Renovation Project",
      description: "The design direction was confirmed before construction.",
    })).toBe(false);
  });
});
