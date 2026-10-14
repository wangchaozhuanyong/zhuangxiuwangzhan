import { beforeEach, describe, expect, it, vi } from "vitest";

let cache: typeof import("@/lib/publicImageDecodeCache");

function completeImage(src: string, currentSrc = src) {
  const image = document.createElement("img");
  image.src = src;
  Object.defineProperties(image, {
    complete: { configurable: true, value: true },
    naturalWidth: { configurable: true, value: 100 },
    currentSrc: { configurable: true, value: currentSrc },
  });
  return image;
}

beforeEach(async () => {
  vi.resetModules();
  cache = await import("@/lib/publicImageDecodeCache");
});

describe("document image decode evidence", () => {
  it("requires successful evidence for the actual complete selected image", () => {
    const image = completeImage("https://example.com/fallback.webp", "https://example.com/selected.webp");
    image.srcset = "https://example.com/selected.webp 1440w";
    cache.rememberDecodedPublicImage(image.src);
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
    cache.rememberDecodedPublicImage(image.currentSrc);
    expect(cache.hasDecodedPublicImage(image)).toBe(true);
    Object.defineProperty(image, "complete", { value: false });
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 0 } });
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
  });

  it("does not identify an old plain-img currentSrc as its new src's selected image", () => {
    const image = completeImage("https://example.com/new-src.webp", "https://example.com/old-src.webp");
    cache.rememberDecodedPublicImage(image.currentSrc);
    expect(cache.getPublicImageSelectedSource(image)).toBe("");
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
  });

  it("cannot guess a responsive or picture candidate from a cached fallback", () => {
    const image = completeImage("https://example.com/fallback.webp", "");
    cache.rememberDecodedPublicImage(image.src);
    expect(cache.hasDecodedPublicImage(image)).toBe(true);
    image.srcset = "https://example.com/large.webp 1440w";
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
    image.removeAttribute("srcset");
    const picture = document.createElement("picture");
    const source = document.createElement("source");
    source.srcset = "https://example.com/mobile.webp";
    picture.append(source, image);
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
  });

  it("keeps retry URLs independent and forgets a failed candidate", () => {
    const image = completeImage("https://example.com/image.webp");
    cache.rememberDecodedPublicImage(image.currentSrc);
    expect(cache.hasDecodedPublicImage(image)).toBe(true);
    const retry = completeImage(`${image.src}?image_retry=123`);
    expect(cache.hasDecodedPublicImage(retry)).toBe(false);
    cache.forgetDecodedPublicImage(image.currentSrc);
    expect(cache.hasDecodedPublicImage(image)).toBe(false);
  });

  it("bounds document evidence and retains candidates that are still being reused", () => {
    const reused = completeImage("https://example.com/reused.webp");
    const oldest = completeImage("https://example.com/oldest.webp");
    cache.rememberDecodedPublicImage(reused.currentSrc);
    cache.rememberDecodedPublicImage(oldest.currentSrc);
    for (let index = 0; index < 510; index++) cache.rememberDecodedPublicImage(`https://example.com/${index}.webp`);
    expect(cache.hasDecodedPublicImage(reused)).toBe(true);
    cache.rememberDecodedPublicImage("https://example.com/newest.webp");
    expect(cache.hasDecodedPublicImage(oldest)).toBe(false);
    expect(cache.hasDecodedPublicImage(reused)).toBe(true);
  });

  it("does not persist successful evidence into a new module/document lifetime", async () => {
    const image = completeImage("https://example.com/document-only.webp");
    cache.rememberDecodedPublicImage(image.currentSrc);
    expect(cache.hasDecodedPublicImage(image)).toBe(true);
    vi.resetModules();
    const freshDocument = await import("@/lib/publicImageDecodeCache");
    expect(freshDocument.hasDecodedPublicImage(image)).toBe(false);
  });
});
