import { rm } from "node:fs/promises";
import path from "node:path";

const UNREFERENCED_VIDEO_ALIASES = [
  "videos/home-hero.mp4",
  "videos/home-hero.webm",
  "videos/home-hero-tablet.mp4",
  "videos/home-hero-tablet.webm",
  "videos/home-hero-mobile.mp4",
  "videos/home-hero-mobile.webm",
];

export function pruneDuplicatePublicMedia() {
  let outDir = "dist";

  return {
    name: "prune-duplicate-public-media",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async writeBundle() {
      await Promise.all(
        UNREFERENCED_VIDEO_ALIASES.map((relativePath) =>
          rm(path.join(outDir, relativePath), { force: true }),
        ),
      );
    },
  };
}
