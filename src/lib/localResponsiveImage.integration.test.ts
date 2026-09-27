/// <reference types="node" />
import { resolve } from "node:path";
import sharp from "sharp";
import { expect, it } from "vitest";
import { localResponsiveImageMetadata } from "@/data/localResponsiveImageMetadata";
import { buildLocalResponsiveSrcSet, LOCAL_RESPONSIVE_IMAGE_WIDTHS } from "@/lib/localResponsiveImage";

it("describes every shipped local responsive candidate using its encoded pixel width", async () => {
  let checked = 0;
  for (const src of Object.keys(localResponsiveImageMetadata)) {
    const srcSet = buildLocalResponsiveSrcSet(src, [...LOCAL_RESPONSIVE_IMAGE_WIDTHS]);
    expect(srcSet, src).toBeTruthy();
    const widths = new Set<number>();
    for (const entry of srcSet!.split(", ")) {
      const [url, descriptor] = entry.split(" ");
      const declaredWidth = Number(descriptor.replace(/w$/, ""));
      const file = resolve(process.cwd(), "public", url.slice(1));
      const info = await sharp(file).metadata();
      expect(info.width, entry).toBe(declaredWidth);
      expect(widths.has(declaredWidth), src).toBe(false);
      widths.add(declaredWidth);
      checked++;
    }
  }
  expect(checked).toBeGreaterThan(1000);
}, 20_000);
