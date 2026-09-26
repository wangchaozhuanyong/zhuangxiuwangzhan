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
    mobileAlt: copy.coverAlt,
    disclosure: blogEditorialMediaText.disclosure,
    inline: Object.entries(copy.inline).map(([id, text]) => ({
      id, src: `${mediaRoot}/${slug}/${id}.webp`, ...text,
    })),
  });
}
export const getBlogEditorialMedia = (slug: string | undefined) => slug ? articleMedia.get(slug) : undefined;
export const findBlogConceptImage = (slug: string | undefined, heading: string, language: Language) => {
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return getBlogEditorialMedia(slug)?.inline.find(image => normalize(image.heading[language]) === normalize(heading));
};
