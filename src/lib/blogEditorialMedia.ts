import { localMediaPath, wardrobeCover } from "@/lib/reviewedContentMedia.mjs";
import type { Language } from "@/i18n/routes";
import { blogEditorialMediaText } from "@/i18n/blogEditorialMediaText";

type LocalizedMediaText = Record<Language, string>;
export type BlogConceptImage = {
  id: string;
  src: string;
  heading: LocalizedMediaText;
  alt: LocalizedMediaText;
};
type BlogEditorialMedia = {
  cmsCover: string;
  mobileHero: string;
  mobileWidth: number;
  mobileAlt: LocalizedMediaText;
  disclosure: LocalizedMediaText;
  inline: readonly BlogConceptImage[];
};
const mediaRoot = "/images/blog/editorial-concepts-20260926-v1";
const articleMedia = new Map<string, BlogEditorialMedia>();
for (const [slug, copy] of Object.entries(blogEditorialMediaText.articles)) {
  const topic = slug.startsWith("kitchen-") ? "kitchen" : "office";
  articleMedia.set(slug, {
    // Identification only: desktop cover and stored alt still come from CMS.
    cmsCover: `${mediaRoot}/${slug}/${topic}-cover.webp`,
    mobileHero: `${mediaRoot}/${slug}/${topic}-cover-mobile-900.webp`,
    mobileWidth: 900,
    mobileAlt: copy.coverAlt,
    disclosure: blogEditorialMediaText.disclosure,
    inline: Object.entries(copy.inline).map(([id, text]) => ({
      id, src: `${mediaRoot}/${slug}/${id}.webp`, ...text,
    })),
  });
}
articleMedia.set("custom-wardrobe-price-malaysia", {
  cmsCover: wardrobeCover,
  mobileHero: wardrobeCover,
  mobileWidth: 1536,
  mobileAlt: blogEditorialMediaText.wardrobeCoverAlt,
  disclosure: blogEditorialMediaText.disclosure,
  inline: [],
});
export const getBlogEditorialMedia = (slug: string | undefined, cover?: string) => {
  if (slug === "custom-wardrobe-price-malaysia" && cover && localMediaPath(cover) !== wardrobeCover) return undefined;
  return slug ? articleMedia.get(slug) : undefined;
};
export const findBlogConceptImage = (slug: string | undefined, heading: string, language: Language) => {
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return getBlogEditorialMedia(slug)?.inline.find(image => normalize(image.heading[language]) === normalize(heading));
};
