import { resolveReviewedBlogCover, resolveReviewedImageSource, resolveReviewedMaterialImage, wardrobeCover } from "../src/lib/reviewedContentMedia.mjs";
import { projectPublicMetadata } from "../src/lib/projectPublicMetadata.mjs";
import { resolveFurnitureDisplay } from "../src/lib/furnitureDisplaySafety.mjs";
import { pickPublicSourceOwners } from "../src/lib/publicContentQualification.mjs";
import { readFileSync } from "node:fs";
import { buildStaticManifest, SITE_URL, OG_IMAGE, COMPANY } from "./seo-static-pages.mjs";
import { loadMaterialSeoCategories, qualifiesLocale, currentSourcePath, serializeSourcePath, snapshotProvenance, isGeneratorEntry, runQualifiedSeoGeneration } from "./seo-material-pages.mjs";

const furnitureCatalog = JSON.parse(readFileSync(new URL("../src/data/furnitureCatalog.json", import.meta.url), "utf8"));
const furnitureLabels = JSON.parse(readFileSync(new URL("../src/i18n/furnitureTaxonomyLabels.json", import.meta.url), "utf8"));
const furnitureLocales = Object.fromEntries(["en", "zh"].map((lang) => [
  lang,
  JSON.parse(readFileSync(new URL(`../src/data/furnitureCatalog${lang === "zh" ? "Zh" : "En"}.json`, import.meta.url), "utf8")),
]));

export async function buildQualifiedManifest(snapshot) {
if(!snapshot.complete) throw new Error("seo_snapshot_incomplete");
const manifest = buildStaticManifest();
const DRAFT_MARKER_REPLACEMENTS = [
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning, including pre-opening preparation, customer flow, counter and storage planning, rendering concepts, FAQ, and consultation CTA\./gi,
    "FLASH CAST plans shop renovation and retail fit-out for shoplots, retail stores, clinics, beauty front areas, F&B spaces, display flow, counter storage, material direction, and quotation preparation.",
  ],
  [
    /FLASH CAST 店铺装修图文内容草案，包含开店前准备、展示动线、柜台收纳、材料方向、效果图方案、FAQ 和咨询 CTA。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，适合 shoplot、零售门店、诊所前区、beauty 前场和小型餐饮空间，重点整理展示动线、柜台收纳、材料方向和报价前准备。",
  ],
  [
    /FLASH CAST 店铺装修双语图文草案，覆盖 shoplot、零售门店、展示空间、柜台收纳、开店前准备、效果图方案、FAQ 和咨询路径。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，覆盖 shoplot、零售门店、展示动线、柜台收纳、开店前准备、效果图方案和咨询路径。",
  ],
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning/gi,
    "FLASH CAST shop renovation and retail fit-out planning guide",
  ],
  [
    /Bilingual shop renovation and retail fit-out planning content for FLASH CAST, covering/gi,
    "Plan shop renovation and retail fit-out with FLASH CAST, covering",
  ],
  [/image-rich draft/gi, "image-rich guide"],
  [/FLASH CAST 店铺装修双语图文草案/g, "FLASH CAST 店铺装修与零售空间规划服务"],
  [/FLASH CAST 店铺装修图文内容草案/g, "FLASH CAST 店铺装修与零售空间规划指南"],
  [/双语图文草案/g, "双语服务指南"],
  [/图文内容草案/g, "图文内容指南"],
  [/图文草案/g, "服务规划指南"],
  [/works best when/gi, "works well when"],
  [/warranty, and exclusions/gi, "after-sales terms, and exclusions"],
  [/保修和不包含项目/g, "售后条款和不包含项目"],
  [/第一印象/g, "入口观感"],
  [/第一眼/g, "入口观感"],
];

const sanitizeSeoText = (value = "") =>
  DRAFT_MARKER_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    String(value || ""),
  );

const legacyRedirectPaths = new Set([
  "/en/materials/acrylic-high-gloss-white",
  "/zh/materials/acrylic-high-gloss-white",
  "/en/materials/melamine-grey-oak",
  "/zh/materials/melamine-grey-oak",
  "/en/materials/spc-vinyl-natural-oak",
  "/zh/materials/spc-vinyl-natural-oak",
  "/en/services/office",
  "/zh/services/office",
  "/en/services/shoplot",
  "/zh/services/shoplot",
]);
const redirectOnlyPaths = new Set([
  "/products",
]);
const redirectOnlyLandingSlugs = new Set([
  "office-renovation",
  "shop-renovation",
  "bathroom-renovation",
  "old-house-renovation",
  "custom-built-in",
  "warehouse-shelving",
  "kitchen-cabinet",
  "flooring",
]);
const isRedirectSource = localized => {
  const path = localized.replace(/^\/(en|zh)(?=\/|$)/, "") || "/";
  return legacyRedirectPaths.has(localized) || redirectOnlyPaths.has(path)
    || (path.startsWith("/landing/") && redirectOnlyLandingSlugs.has(path.slice("/landing/".length)));
};

for (const path of legacyRedirectPaths) {
  delete manifest[path];
}

for (const path of redirectOnlyPaths) {
  for (const lang of ["en", "zh"]) {
    delete manifest[`/${lang}${path}`];
  }
}

let provenance;
const addDynamic = (lang, basePath, slug, title, description, metadata = {}) => {
  const path = serializeSourcePath(`${basePath}/${slug}`);
  const localized = `/${lang}${path}`;
  if (isRedirectSource(localized)) return;
  const enPath = `/en${path}`;
  const zhPath = `/zh${path}`;
  const rawTitle = title || COMPANY;
  const safeTitle = sanitizeSeoText(rawTitle.includes("FLASH CAST") ? rawTitle : `${rawTitle} | ${COMPANY}`);
  const safeDescription = sanitizeSeoText(description || rawTitle).slice(0, 300);
  const correctedOgImage = metadata.ogImage ? resolveReviewedImageSource(metadata.ogImage) : undefined;
  const dynamicOgImage = correctedOgImage
    ? (String(correctedOgImage).startsWith("http") ? correctedOgImage : `${SITE_URL}${correctedOgImage}`)
    : OG_IMAGE;
  manifest[localized] = {
    ...provenance,
    owned_static: Boolean(manifest[localized]?.owned_static || provenance.owned_static),
    lang,
    path,
    title: safeTitle,
    description: safeDescription,
    canonical: `${SITE_URL}${localized}`,
    hreflang: {
      ...(provenance.available_locales.includes("en") ? {en:`${SITE_URL}${enPath}`} : {}),
      ...(provenance.available_locales.includes("zh") ? {zh:`${SITE_URL}${zhPath}`} : {}),
      xDefault: `${SITE_URL}${provenance.available_locales.includes("en") ? enPath : zhPath}`,
    },
    ogImage: dynamicOgImage,
    schemaType: metadata.schemaType || undefined,
    entityName: metadata.entityName || undefined,
    headline: metadata.headline || undefined,
    datePublished: metadata.datePublished || undefined,
    dateModified: metadata.dateModified || undefined,
    articleSection: metadata.articleSection || undefined,
    imageAlt: metadata.imageAlt || undefined,
    keywords: metadata.keywords || undefined,
    breadcrumbCategory: metadata.breadcrumbCategory || undefined,
  };
};

const addSitePage = (lang, row) => {
  const sourcePath = currentSourcePath(row, "site_page");
  if (!sourcePath) return;
  const path = sourcePath === "/" ? "" : sourcePath;
  const localized = path ? `/${lang}${path}` : `/${lang}`;
  if (isRedirectSource(localized)) return;
  const enPath = path ? `/en${path}` : "/en";
  const zhPath = path ? `/zh${path}` : "/zh";
  const title =
    lang === "zh"
      ? row.seo_title_zh || row.title_zh
      : row.seo_title_en || row.title_en;
  const description =
    lang === "zh"
      ? row.seo_description_zh || row.description_zh
      : row.seo_description_en || row.description_en;
  const sectionTitle=(row.cms_sections||[]).filter(s=>s.status==="published"&&!s.deleted_at).map(s=>s[`content_${lang}`]?.title).find(Boolean);
  if (!title && !description && !sectionTitle) return;
  const ogImage = row.image_url
    ? (String(row.image_url).startsWith("http") ? row.image_url : `${SITE_URL}${row.image_url}`)
    : OG_IMAGE;
  const existing = manifest[localized] || {};
  const rawTitle = title || sectionTitle || COMPANY;
  const safeTitle = sanitizeSeoText(rawTitle.includes("FLASH CAST") ? rawTitle : `${rawTitle} | ${COMPANY}`);
  const safeDescription = sanitizeSeoText(description || rawTitle || COMPANY).slice(0, 300);
  manifest[localized] = {
    ...existing,
    ...provenance,
    owned_static: Boolean(existing.owned_static || provenance.owned_static),
    lang,
    path: sourcePath,
    title: safeTitle,
    description: safeDescription,
    keywords: lang === "zh" ? row.seo_keywords_zh || "" : row.seo_keywords_en || "",
    canonical: `${SITE_URL}${localized}`,
    hreflang: {
      ...(provenance.available_locales.includes("en") ? {en:`${SITE_URL}${enPath}`} : {}),
      ...(provenance.available_locales.includes("zh") ? {zh:`${SITE_URL}${zhPath}`} : {}),
      xDefault: `${SITE_URL}${provenance.available_locales.includes("en") ? enPath : zhPath}`,
    },
    ogImage,
  };
};

const {projects,blog_posts:posts,materials,service_areas:areas,landing_pages:landings,services,site_pages:sitePages,cms_pages:cmsPages}=snapshot.rows;
const sourceOwners=pickPublicSourceOwners(snapshot.rows);
const regularMaterials = materials.filter(row=>row.category!=="furniture");
const bind=(row,kind,lang,ownedStatic=false)=>({...snapshotProvenance(snapshot,kind,row.id||row.path||row.slug||"static-provider",lang,ownedStatic),available_locales:ownedStatic?["en","zh"]:["en","zh"].filter(l=>qualifiesLocale(row,kind,l))});
for(const [route,meta] of Object.entries(manifest)) manifest[route]={...meta,...snapshotProvenance(snapshot,"static_page",route,meta.lang,true),available_locales:["en","zh"]};
for (const lang of ["en", "zh"]) {
  provenance={...snapshotProvenance(snapshot,"furniture_catalogue","furnitureCatalog.json",lang,true),available_locales:["en","zh"]};
  const furnitureMeta = furnitureLabels.meta[lang];
  addDynamic(lang, "", "furniture", furnitureMeta.title, furnitureMeta.description, {
    ogImage: "/images/furniture/assets/7596c932c602dfc05255.webp",
  });
  for (const category of furnitureCatalog.taxonomy) {
    if (category.key === "new") continue;
    const categoryName = furnitureLabels.categories[category.key]?.[lang] || category.name;
    const categoryCopy = furnitureLabels.categoryPages?.[category.key]?.[lang];
    addDynamic(lang, "/furniture", category.key, categoryCopy?.title || categoryName, categoryCopy?.description || `${categoryName} · ${furnitureMeta.description}`);
    for (const subcategory of category.subcategories) {
      const subcategoryName = furnitureLabels.subcategories[subcategory.key]?.[lang] || subcategory.name;
      addDynamic(lang, `/furniture/${category.key}`, subcategory.key, `${subcategoryName} | ${categoryName}`, `${subcategoryName} · ${furnitureMeta.description}`);
    }
  }
  for (const product of furnitureCatalog.products) {
    const localized = resolveFurnitureDisplay({ ...product, ...furnitureLocales[lang][product.slug] }, lang);
    addDynamic(
      lang,
      "/furniture/product",
      encodeURIComponent(decodeURIComponent(product.slug)),
      localized.name,
      (localized.shortDescription || localized.description || furnitureMeta.description).replace(/\s+/g, " ").trim(),
      {
        ogImage: product.images[0], imageAlt: localized.name,
        breadcrumbCategory: (
          furnitureCatalog.taxonomy.find(category => category.key !== "new" && category.key !== "preorder" && category.productUrls.includes(product.sourceUrl))
          || furnitureCatalog.taxonomy.find(category => category.subcategories.some(subcategory => subcategory.productUrls.includes(product.sourceUrl)))
          || furnitureCatalog.taxonomy.find(category => category.key === "preorder" && category.productUrls.includes(product.sourceUrl))
        )?.key,
      },
    );
  }
  for (const row of materials.filter(row => row.category === "furniture")) {
    const path = currentSourcePath(row, "material");
    if (!path || !qualifiesLocale(row, "material", lang) || manifest[`/${lang}${path}`]?.owned_static) continue;
    provenance = bind(row, "material", lang);
    addDynamic(lang, "/furniture/product", row.slug, row[`title_${lang}`], row[`seo_description_${lang}`] || row[`excerpt_${lang}`], {
      ogImage: resolveReviewedMaterialImage(row.image_url || "", row.slug) || OG_IMAGE,
    });
  }
  for (const [row,kind] of [...sitePages.map(row=>[row,"site_page"]),...cmsPages.map(row=>[row,"cms_page"])]) { const path=currentSourcePath(row,kind); if(!path||sourceOwners.get(path)?.row!==row||!qualifiesLocale(row,kind,lang))continue; provenance=bind(row,kind,lang); addSitePage(lang,row);}
  for (const row of projects) {
    if(!qualifiesLocale(row,"project",lang))continue;
    provenance=bind(row,"project",lang);
    addDynamic(
      lang,
      "/projects",
      encodeURIComponent(row.slug),
      projectPublicMetadata(row, lang)?.title || (lang === "zh" ? row.title_zh : row.title_en),
      projectPublicMetadata({...row, excerpt_en:lang==="en"?row.excerpt_en:undefined,excerpt_zh:lang==="zh"?row.excerpt_zh:undefined}, lang)?.description || (lang === "zh" ? row.excerpt_zh : row.excerpt_en),
    );
  }
  for (const row of posts) {
    if(!qualifiesLocale(row,"blog",lang))continue;
    provenance=bind(row,"blog",lang);
    const title = lang === "zh" ? row.title_zh : row.title_en;
    const seoTitle = lang === "zh"
      ? row.seo_title_zh || title
      : row.seo_title_en || title;
    const excerpt = lang === "zh" ? row.excerpt_zh : row.excerpt_en;
    const seoDescription = lang === "zh"
      ? row.seo_description_zh || excerpt
      : row.seo_description_en || excerpt;
    const imageAlt = lang === "zh" ? row.alt_zh || title : row.alt_en || title;
    addDynamic(
      lang,
      "/blog",
      encodeURIComponent(row.slug),
      seoTitle,
      seoDescription,
      {
        schemaType: "BlogPosting",
        headline: title,
        datePublished: row.published_at,
        dateModified: row.updated_at || row.published_at,
        articleSection: row.category,
        imageAlt: resolveReviewedBlogCover(row.slug, row.cover_image_url) === wardrobeCover ? title : imageAlt,
        ogImage: resolveReviewedImageSource(resolveReviewedBlogCover(row.slug, row.cover_image_url)),
        keywords: Array.isArray(row.tags) ? row.tags.join(", ") : "",
      },
    );
  }
  const staticMaterialCategorySlugs=new Set((await loadMaterialSeoCategories([])).map(row=>row.slug));
  const materialCategories=await loadMaterialSeoCategories(regularMaterials.filter(row=>qualifiesLocale(row,"material",lang)));
  for (const row of materialCategories) {
    provenance={...snapshotProvenance(snapshot,"material_taxonomy",row.slug,lang,staticMaterialCategorySlugs.has(row.slug)),available_locales:["en","zh"]};
    addDynamic(
      lang,
      "/materials/category",
      encodeURIComponent(row.slug),
      lang === "zh" ? row.title_zh : row.title_en,
      lang === "zh" ? row.description_zh : row.description_en,
    );
    for (const subcategory of row.subcategories) {
      addDynamic(
        lang,
        `/materials/category/${row.slug}`,
        subcategory.slug,
        lang === "zh" ? subcategory.title_zh : subcategory.title_en,
        lang === "zh" ? subcategory.description_zh : subcategory.description_en,
      );
    }
  }
  for (const row of regularMaterials) {
    if(!qualifiesLocale(row,"material",lang))continue;
    provenance=bind(row,"material",lang);
    addDynamic(
      lang,
      "/materials",
      encodeURIComponent(row.slug),
      lang === "zh" ? row.title_zh : row.title_en,
      lang === "zh"
        ? row.seo_description_zh || row.excerpt_zh
        : row.seo_description_en || row.excerpt_en,
      { ogImage: resolveReviewedMaterialImage(row.image_url || "", row.slug) || OG_IMAGE },
    );
  }
  for (const row of areas) {
    if(!qualifiesLocale(row,"service_area",lang))continue;
    provenance=bind(row,"service_area",lang);
    addDynamic(
      lang,
      "/locations",
      encodeURIComponent(row.slug),
      lang === "zh" ? row.title_zh : row.title_en,
      lang === "zh"
        ? row.seo_description_zh || row.excerpt_zh
        : row.seo_description_en || row.excerpt_en,
    );
  }
  for (const row of landings) {
    if(!qualifiesLocale(row,"landing_page",lang))continue;
    provenance=bind(row,"landing_page",lang);
    if (redirectOnlyLandingSlugs.has(row.slug)) continue;
    const title =
      lang === "zh"
        ? row.seo_title_zh || row.title_zh
        : row.seo_title_en || row.title_en;
    const description =
      lang === "zh"
        ? row.seo_description_zh
        : row.seo_description_en;
    addDynamic(lang, "/landing", row.slug, title, description);
  }
  for (const row of services) {
    if(!qualifiesLocale(row,"service",lang))continue;
    provenance=bind(row,"service",lang);
    const title =
      lang === "zh"
        ? row.seo_title_zh || row.title_zh
        : row.seo_title_en || row.title_en;
    const description =
      lang === "zh"
        ? row.seo_description_zh
        : row.seo_description_en;
    addDynamic(lang, "/services", row.slug, title, description, {
      schemaType: "Service",
      entityName: lang === "zh" ? row.title_zh : row.title_en,
    });
  }
}

// Alternates attest only routes actually emitted by this complete snapshot.
for (const route of Object.keys(manifest)) if (isRedirectSource(route)) delete manifest[route];
for(const meta of Object.values(manifest)) {
 const en=`/en${meta.path === "/" ? "" : meta.path}`;const zh=`/zh${meta.path === "/" ? "" : meta.path}`;
 meta.available_locales=["en","zh"].filter(lang=>Boolean(manifest[lang==="en"?en:zh]));
 meta.hreflang={...(manifest[en]?{en:manifest[en].canonical}:{}),...(manifest[zh]?{zh:manifest[zh].canonical}:{}),xDefault:(manifest[en]||manifest[zh]).canonical};
}
return manifest;
}
if(isGeneratorEntry(import.meta.url)) runQualifiedSeoGeneration().catch(error=>{console.error(error.message);process.exitCode=1;});
