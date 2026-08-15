import { legacyRedirectPaths, materialCategorySlugs, siteUrl, staticPaths } from "./config.ts";
import { fetchSitemapContentSlugs } from "./repository.ts";
import type { SitemapClient } from "./types.ts";

export const isPublicCmsPath = (path: string) =>
  path === "/" ||
  (path.startsWith("/") &&
    !path.includes(":") &&
    !/^\/(?:admin|en|zh)(?:\/|$)/.test(path) &&
    !/\.[a-z0-9]+$/i.test(path));

const urlEntry = (baseUrl: string, path: string) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${path.replace(/^\/(zh|en)/, "/en")}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${baseUrl}${path.replace(/^\/(zh|en)/, "/zh")}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path.replace(/^\/(zh|en)/, "/en")}" />
  </url>`;

export async function buildSitemapXml(client: SitemapClient) {
  const content = await fetchSitemapContentSlugs(client);
  const paths = [
    ...new Set([
      ...staticPaths,
      ...content.projects.map((item) => `/projects/${item.slug}`),
      ...content.posts.map((item) => `/blog/${item.slug}`),
      ...materialCategorySlugs.map((slug) => `/materials/category/${slug}`),
      ...content.materials.map((item) => `/materials/${item.slug}`),
      ...content.areas.map((item) => `/locations/${item.slug}`),
      ...content.landingPages.map((item) => `/landing/${item.slug}`),
      ...content.services.map((item) => `/services/${item.slug}`),
      ...content.sitePages.map((item) => item.path).filter(isPublicCmsPath),
      ...content.cmsPages.map((item) => item.path).filter(isPublicCmsPath),
    ]),
  ];

  const localizedPaths = paths
    .filter((path) => !legacyRedirectPaths.has(path))
    .flatMap((path) => [`/en${path === "/" ? "" : path}`, `/zh${path === "/" ? "" : path}`]);
  const baseUrl = siteUrl();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localizedPaths.map((path) => urlEntry(baseUrl, path)).join("\n")}
</urlset>`;
}
