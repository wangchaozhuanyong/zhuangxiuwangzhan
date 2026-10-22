import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import generatedImages from "@/data/furnitureListingImages.json";
import { furnitureListingPictureSources } from "./furnitureListingImages";

describe("furniture listing images", () => {
  it("keeps unknown CMS images on their original source", () => {
    expect(furnitureListingPictureSources("https://example.com/custom-cabinet.webp")).toBeUndefined();
    expect(furnitureListingPictureSources("/images/furniture/assets/unknown.webp")).toBeUndefined();
  });

  it("ships every advertised candidate at its real encoded width, preserving the original", async () => {
    for (const [source, metadata] of Object.entries(generatedImages)) {
      const [picture] = furnitureListingPictureSources(source)!;
      expect(picture.sizes).toContain("148px");
      expect(picture.srcSet).toContain(`${source} ${metadata.width}w`);
      for (const candidate of picture.srcSet.split(", ")) {
        const [url, descriptor] = candidate.split(" ");
        const file = path.join(process.cwd(), "public", url);
        expect(fs.existsSync(file), url).toBe(true);
        expect((await sharp(file).metadata()).width, url).toBe(Number(descriptor.slice(0, -1)));
      }
    }
  });
});
