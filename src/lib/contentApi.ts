import {
  fetchPublishedBlogPostRowBySlug,
  fetchPublishedBlogPostRows,
  fetchPublishedHeroSlideRows,
  fetchPublishedLandingPageRowBySlug,
  fetchPublishedMaterialRows,
  fetchPublishedProjectRowBySlug,
  fetchPublishedProjectSummaryRows,
  fetchPublishedProjectSummaryRowsWithContent,
  fetchPublishedServiceAreaRowBySlug,
  fetchPublishedServiceRowBySlug,
  fetchPublishedServiceRows,
  fetchPublishedServiceSummaryRows,
  fetchPublishedTestimonialRows,
  hasPublicContentDatabaseClient,
} from "@/backend/modules/cms/repository/publicContentRepository";
import { stripHtml } from "@/lib/text";
import { translateDisplayText } from "@/i18n/displayLabels";
import { formatBlogReadTime } from "@/lib/blogMeta";
import type { MaterialCatalogCategory } from "@/lib/materialCatalog";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { toArray, toRecord, toText, type UnknownRecord } from "@/lib/recordUtils";

type Language = "en" | "zh";
type ProjectImageRecord = UnknownRecord & {
  image_url?: string;
  image_type?: string;
  sort_order?: string | number | null;
};
export type PublishedProjectSummary = {
  id: string;
  slug: string;
  title: string;
  type: string;
  location: string;
  description: string;
  images: string[];
  imageAlts: string[];
  thumbnail: string;
  thumbnailAlt: string;
};

export type PublishedServiceSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  suitableFor: string[];
  commonProjects: string[];
  processSteps: Array<{ title?: string; desc?: string }>;
  items: string[];
  faqs: Array<{ q?: string; a?: string }>;
  image: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type PublishedHeroSlide = {
  id: string;
  title: string;
  excerpt: string;
  buttonLabel: string;
  buttonUrl: string;
  image: string;
  alt: string;
};

type PublishedMaterialCategoryRecord = MaterialCatalogCategory & {
  slug: string;
  image: string;
};

const applyOptionalLimit = <T>(items: T[], limit?: number) =>
  limit && limit > 0 ? items.slice(0, limit) : items;

const readText = (record: UnknownRecord | null | undefined, field: string, fallback = "") => toText(record?.[field], fallback);

const readRecordArray = (value: unknown): UnknownRecord[] => toArray<UnknownRecord>(value).map(toRecord);

const normalizeProjectType = (value: string) => {
  const type = value.trim().toLowerCase();

  if (!type) return "Renovation";
  if (type.includes("home office")) return "Office";
  if (type.includes("built")) return "Built-In";
  if (type.includes("warehouse")) return "Warehouse";
  if (type.includes("exterior") || type.includes("shopfront")) return "Exterior";
  if (type.includes("commercial") || type.includes("shoplot") || type.includes("retail")) return "Commercial";
  if (type.includes("office")) return "Office";
  if (type.includes("kitchen")) return "Kitchen";
  if (type.includes("bathroom")) return "Bathroom";
  if (type.includes("residential") || type.includes("condo") || type.includes("renovation")) return "Residential";

  return value;
};

export const getFallbackProjects = async (language: Language = "en") => {
  const { projectsData } = await import("@/data/projects");
  const addImageAltFields = (project: (typeof projectsData)[number]) => ({
    ...project,
    imageAlts: [project.title],
    thumbnailAlt: project.title,
  });

  if (language !== "zh") return projectsData.map(addImageAltFields);

  return projectsData.map((project) => ({
    ...addImageAltFields(project),
    title: translateDisplayText(project.title || "", language),
    type: normalizeProjectType(project.type || "Renovation"),
    description: translateDisplayText(project.description || "", language),
    clientNeed: translateDisplayText(project.clientNeed || "", language),
    highlights: (project.highlights || []).map((item: string) => translateDisplayText(item, language)),
    scope: (project.scope || []).map((item: string) => translateDisplayText(item, language)),
    materialsUsed: (project.materialsUsed || []).map((item: string) => translateDisplayText(item, language)),
    testimonial: translateDisplayText(project.testimonial || "", language),
  }));
};
const getFallbackMaterials = async (): Promise<MaterialCatalogCategory[]> =>
  (await import("@/data/materials")).materialsData as MaterialCatalogCategory[];
const getFallbackBlogPosts = async (language: Language = "en") => {
  const { blogPosts } = await import("@/data/blog");
  if (language !== "zh") return blogPosts;

  const localize = (value: string) => translateDisplayText(value, language);

  return blogPosts.map((post) => ({
    ...post,
    title: localize(post.title || ""),
    excerpt: localize(post.excerpt || ""),
    content: localize(post.content || ""),
    category: localize(post.category || ""),
    tags: (post.tags || []).map((tag: string) => localize(tag)),
  }));
};
const getFallbackLocations = async (language: Language = "en") => {
  const { locationsData } = await import("@/data/locations");
  if (language !== "zh") return locationsData;

  const localize = (value: string) => translateDisplayText(value, language);

  return Object.fromEntries(
    Object.entries(locationsData).map(([slug, location]) => [
      slug,
      {
        ...location,
        name: localize(location.name || ""),
        metaTitle: localize(location.metaTitle || ""),
        description: localize(location.description || ""),
        intro: localize(location.intro || ""),
        propertyTypes: (location.propertyTypes || []).map((item: string) => localize(item)),
        commonNeeds: (location.commonNeeds || []).map((item: string) => localize(item)),
        constructionNotes: localize(location.constructionNotes || ""),
        projects: (location.projects || []).map((project) => ({ ...project, title: localize(project.title || "") })),
        faqs: (location.faqs || []).map((faq) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
      },
    ])
  );
};
export const getFallbackServices = async (language: Language = "en") => {
  const { servicesData } = await import("@/data/services");
  if (language !== "zh") return servicesData;

  const localize = (value: string) => translateDisplayText(value, language);

  return servicesData.map((service) => ({
    ...service,
    title: service.titleZh || localize(service.title || ""),
    summary: service.summaryZh || localize(service.summary || ""),
    description: service.descriptionZh || localize(service.description || ""),
    suitableFor: service.suitableForZh || (service.suitableFor || []).map((item: string) => localize(item)),
    commonProjects: service.commonProjectsZh || (service.commonProjects || []).map((item: string) => localize(item)),
    processSteps: service.processStepsZh || (service.processSteps || []).map((step) => ({
      title: localize(step.title || ""),
      desc: localize(step.desc || ""),
    })),
    items: service.itemsZh || (service.items || []).map((item: string) => localize(item)),
    faqs: service.faqsZh || (service.faqs || []).map((faq) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
    seoTitle: service.seoTitleZh || service.seoTitle,
    seoDescription: service.seoDescriptionZh || service.seoDescription,
  }));
};

const pickLocalizedValue = <T = unknown>(item: UnknownRecord | null | undefined, field: string, language: Language, fallback: T): T => {
  const value = item?.[`${field}_${language}`];
  return value === null || value === undefined || value === "" ? fallback : (value as T);
};

const pickLocalizedText = (item: UnknownRecord | null | undefined, field: string, language: Language, fallback = ""): string =>
  toText(pickLocalizedValue(item, field, language, fallback));

const pickLocalizedList = <T = unknown>(item: UnknownRecord | null | undefined, field: string, language: Language): T[] => {
  const value = item?.[`${field}_${language}`];
  return toArray<T>(value);
};

const getOrderedProjectImages = (item: UnknownRecord): ProjectImageRecord[] => {
  const all = readRecordArray(item.project_images).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const cover = all.filter((img) => img.image_type === "cover");
  const gallery = all.filter((img) => img.image_type === "gallery");
  const beforeAfter = all.filter((img) => img.image_type === "before" || img.image_type === "after");
  return [...cover, ...gallery, ...beforeAfter];
};

export const mapPublishedProjectSummary = (item: UnknownRecord, language: Language): PublishedProjectSummary => {
  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);
  const orderedImages = getOrderedProjectImages(item);
  const images = orderedImages.map((img) => toText(img.image_url)).filter(Boolean);
  const fallbackAlt = pickLocalizedText(item, "title", language);
  const imageAlts = orderedImages
    .map((img) => pickLocalizedText(img, "alt", language, fallbackAlt))
    .filter((value): value is string => Boolean(value));
  const thumbnail = images[0] || readText(item, "image_url");
  const firstImageAlt = imageAlts[0] || fallbackAlt;

  return {
    id: readText(item, "id"),
    slug: readText(item, "slug"),
    title: localize(pickLocalizedText(item, "title", language)),
    type: normalizeProjectType(readText(item, "project_type", "Renovation")),
    location: readText(item, "location"),
    description:
      localize(pickLocalizedText(item, "excerpt", language)) ||
      localize(stripHtml(pickLocalizedText(item, "content", language))),
    images: thumbnail ? [thumbnail] : [],
    imageAlts: firstImageAlt ? [firstImageAlt] : [],
    thumbnail,
    thumbnailAlt: firstImageAlt,
  };
};

const needsProjectSummaryContentFallback = (item: UnknownRecord, language: "en" | "zh") =>
  !pickLocalizedText(item, "excerpt", language);

export const getPublishedProjectSummaries = async (language: "en" | "zh", limit?: number) => {
  const fallbackProjects = async () => {
    const projects = await getFallbackProjects(language);
    return limit && limit > 0 ? projects.slice(0, limit) : projects;
  };

  const preloadedRows = readPreloadedPublicData()?.projectSummaries;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    const summaryRows = applyOptionalLimit(preloadedRows, limit);
    if (!summaryRows.some((item) => needsProjectSummaryContentFallback(item, language))) {
      return summaryRows.map((item) => mapPublishedProjectSummary(item, language));
    }
  }

  if (!hasPublicContentDatabaseClient()) return fallbackProjects();

  const data = await fetchPublishedProjectSummaryRows(limit);
  if (!data?.length) return fallbackProjects();
  let summaryRows = data as unknown as UnknownRecord[];
  if (summaryRows.some((item) => needsProjectSummaryContentFallback(item, language))) {
    summaryRows = ((await fetchPublishedProjectSummaryRowsWithContent(limit)) as unknown as UnknownRecord[] | null) || summaryRows;
  }
  return summaryRows.map((item) => mapPublishedProjectSummary(item, language));
};

export const getPublishedServiceSummaries = async (language: "en" | "zh" = "en", limit?: number) => {
  const fallbackServices = async () => {
    const services = await getFallbackServices(language);
    return limit && limit > 0 ? services.slice(0, limit) : services;
  };

  const preloadedRows = readPreloadedPublicData()?.services;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return applyOptionalLimit(preloadedRows, limit).map((item) => mapPublishedService(item, language));
  }

  if (!hasPublicContentDatabaseClient()) return fallbackServices();

  const data = await fetchPublishedServiceSummaryRows(limit);
  if (!data?.length) return fallbackServices();
  return (data as unknown as UnknownRecord[]).map((item) => mapPublishedService(item, language));
};

export const getPublishedHeroSlides = async (language: "en" | "zh" = "en") => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedHeroSlideRows();
  if (!data?.length) return [];
  return data.map((item) => mapPublishedHeroSlide(item, language));
};

export const mapPublishedHeroSlide = (item: UnknownRecord, language: Language = "en"): PublishedHeroSlide => ({
    id: readText(item, "id"),
    title: pickLocalizedText(item, "title", language),
    excerpt: pickLocalizedText(item, "excerpt", language),
    buttonLabel: pickLocalizedText(item, "button_label", language),
    buttonUrl: readText(item, "button_url", "/quote"),
    image: readText(item, "image_url"),
    alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
});

export const getPublishedTestimonials = async (language: "en" | "zh" = "en") => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedTestimonialRows();
  if (!data?.length) return [];
  return data.map((item) => mapPublishedTestimonial(item, language));
};

export const mapPublishedTestimonial = (item: UnknownRecord, language: Language = "en") => ({
    id: readText(item, "id"),
    text: pickLocalizedText(item, "content", language),
    client: readText(item, "customer_name", "FLASH CAST Client"),
    type: "Renovation",
    location: "",
    rating: Number(item.rating || 5),
});

export const getPublishedServices = async (language: "en" | "zh" = "en") => {
  const preloadedRows = readPreloadedPublicData()?.services;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return preloadedRows.map((item) => mapPublishedService(item, language));
  }

  if (!hasPublicContentDatabaseClient()) return getFallbackServices(language);

  const data = await fetchPublishedServiceRows();
  if (!data?.length) return getFallbackServices(language);

  return data.map((item) => mapPublishedService(item, language));
};

export const mapPublishedService = (item: UnknownRecord, language: Language): PublishedServiceSummary & UnknownRecord => ({
    id: readText(item, "id"),
    title: pickLocalizedText(item, "title", language),
    slug: readText(item, "slug"),
    summary: pickLocalizedText(item, "excerpt", language),
    description: pickLocalizedText(item, "content", language),
    suitableFor: pickLocalizedList<string>(item, "suitable_for", language),
    commonProjects: pickLocalizedList<string>(item, "common_projects", language),
    processSteps: pickLocalizedList<{ title?: string; desc?: string }>(item, "process_steps", language),
    items: pickLocalizedList<string>(item, "scope_items", language),
    faqs: pickLocalizedList<{ q?: string; a?: string }>(item, "faqs", language),
    image: readText(item, "image_url"),
    seoTitle: pickLocalizedText(item, "seo_title", language),
    seoDescription: pickLocalizedText(item, "seo_description", language),
});

export const getPublishedServiceBySlug = async (slug: string, language: "en" | "zh") => {
  const fallbackServices = async () => (await getFallbackServices(language)).find((service) => service.slug === slug) || null;
  if (!hasPublicContentDatabaseClient()) return fallbackServices();

  const data = await fetchPublishedServiceRowBySlug(slug);
  if (!data) return fallbackServices();
  return mapPublishedService(data, language);
};

export const getPublishedProjectBySlug = async (slug: string, language: "en" | "zh") => {
  const fallbackProjects = async () => (await getFallbackProjects(language)).find((project) => project.slug === slug) || null;
  const preloadedProject = readPreloadedPublicData()?.projectDetails?.[slug];
  if (preloadedProject) return mapPublishedProjectDetail(preloadedProject, language);

  if (!hasPublicContentDatabaseClient()) return fallbackProjects();

  const data = await fetchPublishedProjectRowBySlug(slug);
  if (!data) return fallbackProjects();

  return mapPublishedProjectDetail(data, language);
};

export function mapPublishedProjectDetail(data: UnknownRecord, language: Language) {
  const projectRecord = data as UnknownRecord;
  const orderedImages = toArray<UnknownRecord>(projectRecord.project_images)
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const cover = orderedImages.filter((img) => img.image_type === "cover");
  const gallery = orderedImages.filter((img) => img.image_type === "gallery");
  const beforeAfter = orderedImages.filter((img) => img.image_type === "before" || img.image_type === "after");
  const imageRecords = [...cover, ...gallery, ...beforeAfter];
  const fallbackUrl = readText(data, "image_url") ? [readText(data, "image_url")] : [];
  const fallbackAlt = pickLocalizedText(data, "title", language);

  const images = imageRecords.map((img) => toText(img.image_url)).filter(Boolean);
  const imageAlts = imageRecords
    .map((img) => pickLocalizedText(img, "alt", language, fallbackAlt))
    .filter(Boolean);

  return {
    id: readText(data, "id"),
    slug: readText(data, "slug"),
    title: language === "zh" ? translateDisplayText(pickLocalizedText(data, "title", language), language) : pickLocalizedText(data, "title", language),
    type: normalizeProjectType(readText(data, "project_type", "Renovation")),
    location: readText(data, "location"),
    description: language === "zh" ? translateDisplayText(pickLocalizedText(data, "content", language), language) : pickLocalizedText(data, "content", language),
    clientNeed: language === "zh" ? translateDisplayText(pickLocalizedText(data, "client_need", language), language) : pickLocalizedText(data, "client_need", language),
    materialsUsed: toArray(data.materials),
    scope: toArray(data.scope),
    highlights: pickLocalizedList<string>(data, "highlights", language).map((value: string) => (language === "zh" ? translateDisplayText(value, language) : value)),
    duration: readText(data, "duration"),
    budget: readText(data, "budget"),
    area: readText(data, "area"),
    testimonial: "",
    images: images.length ? images : fallbackUrl,
    imageAlts: imageAlts.length ? imageAlts : fallbackAlt ? [fallbackAlt] : [],
    thumbnail: readText(cover[0], "image_url") || readText(gallery[0], "image_url") || images[0] || readText(data, "image_url"),
    thumbnailAlt:
      (pickLocalizedText(cover[0], "alt", language) ||
        pickLocalizedText(gallery[0], "alt", language) ||
        imageAlts[0] ||
        fallbackAlt),
  };
}

export const getPublishedMaterials = async (language: "en" | "zh" = "en"): Promise<MaterialCatalogCategory[]> => {
  const preloadedRows = readPreloadedPublicData()?.materials;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return mapPublishedMaterialRows(preloadedRows, language);
  }

  if (!hasPublicContentDatabaseClient()) return getFallbackMaterials();
  const data = await fetchPublishedMaterialRows();
  if (!data?.length) return getFallbackMaterials();

  return mapPublishedMaterialRows(data, language);
};

const mapPublishedMaterialRows = (rows: UnknownRecord[], language: Language = "en") =>
  rows.reduce<PublishedMaterialCategoryRecord[]>((acc, item) => {
    const categoryName = readText(item, "category", "Materials");
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const subcategoryName = readText(item, "subcategory", categoryName);
    const subcategorySlug = subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let category = acc.find((cat) => cat.slug === categorySlug);

    if (!category) {
      category = {
        name: categoryName,
        slug: categorySlug,
        description: pickLocalizedText(item, "excerpt", language),
        image: readText(item, "image_url"),
        alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language, categoryName)),
        subcategories: [],
        items: [],
      };
      acc.push(category);
    }

    if (!category.subcategories.some((sub) => sub.slug === subcategorySlug)) {
      category.subcategories.push({
        name: subcategoryName,
        slug: subcategorySlug,
        description: pickLocalizedText(item, "excerpt", language),
        image: readText(item, "image_url") || readText(category, "image"),
        alt: pickLocalizedText(item, "alt", language, subcategoryName),
      });
    }

    category.items.push({
      id: readText(item, "id"),
      name: pickLocalizedText(item, "title", language),
      slug: readText(item, "slug"),
      category: categoryName,
      subcategory: subcategorySlug,
      type: readText(item, "material_type", categoryName),
      color: readText(item, "color"),
      texture: readText(item, "texture"),
      suitableSpaces: pickLocalizedList(item, "suitable_spaces", language),
      recommendedPairing: pickLocalizedText(item, "recommended_pairing", language),
      pros: pickLocalizedList(item, "pros", language),
      cons: pickLocalizedList(item, "cons", language),
      description: pickLocalizedText(item, "content", language) || pickLocalizedText(item, "excerpt", language),
      note: pickLocalizedText(item, "note", language) || readText(item, "reference_price"),
      image: readText(item, "image_url"),
      alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
    });

    return acc;
  }, []);

export const getPublishedMaterialBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const categories = await getPublishedMaterials(language);
  for (const category of categories) {
    const material = category.items.find((item) => item.slug === slug);
    if (material) return { material, category };
  }
  return { material: null, category: null };
};

export const getPublishedBlogPosts = async (language: "en" | "zh" = "en") => {
  const preloadedRows = readPreloadedPublicData()?.blogPosts;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return mapPublishedBlogPostRows(preloadedRows, language);
  }

  if (!hasPublicContentDatabaseClient()) return getFallbackBlogPosts(language);
  const data = await fetchPublishedBlogPostRows();
  if (!data?.length) return getFallbackBlogPosts(language);

  return mapPublishedBlogPostRows(data, language);
};

const mapPublishedBlogPostRows = (rows: UnknownRecord[], language: Language = "en") => {
  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return rows.map((item) => ({
    id: readText(item, "id"),
    slug: readText(item, "slug"),
    title: localize(pickLocalizedText(item, "title", language)),
    excerpt: localize(pickLocalizedText(item, "excerpt", language)),
    content: localize(pickLocalizedText(item, "content", language)),
    category: localize(readText(item, "category", "Renovation")),
    date: readText(item, "published_at") || readText(item, "created_at"),
    readTime: formatBlogReadTime(null, language),
    image: readText(item, "cover_image_url"),
    tags: toArray<string>(item.tags).map((tag) => localize(tag)),
  }));
};

export const getPublishedBlogPostBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallbackPost = async () => (await getFallbackBlogPosts(language)).find((post) => post.slug === slug) || null;
  if (!hasPublicContentDatabaseClient()) return fallbackPost();

  const data = await fetchPublishedBlogPostRowBySlug(slug);
  if (!data) return fallbackPost();

  return {
    id: readText(data, "id"),
    slug: readText(data, "slug"),
    title: language === "zh" ? translateDisplayText(pickLocalizedText(data, "title", language), language) : pickLocalizedText(data, "title", language),
    excerpt: language === "zh" ? translateDisplayText(pickLocalizedText(data, "excerpt", language), language) : pickLocalizedText(data, "excerpt", language),
    content: language === "zh" ? translateDisplayText(pickLocalizedText(data, "content", language), language) : pickLocalizedText(data, "content", language),
    category: language === "zh" ? translateDisplayText(readText(data, "category", "Renovation"), language) : readText(data, "category", "Renovation"),
    date: readText(data, "published_at") || readText(data, "created_at"),
    readTime: formatBlogReadTime(null, language),
    image: readText(data, "cover_image_url"),
    tags: toArray<string>(data.tags).map((tag) => (language === "zh" ? translateDisplayText(tag, language) : tag)),
  };
};

export const getPublishedServiceAreaBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallback = async () => {
    const locationsData = await getFallbackLocations(language);
    return locationsData[slug] || null;
  };
  if (!hasPublicContentDatabaseClient()) return fallback();

  const data = await fetchPublishedServiceAreaRowBySlug(slug);
  if (!data) return fallback();

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  const localizedTitle = pickLocalizedText(data, "title", language);
  const areaName = data.area_name || localizedTitle || "";

  return {
    name: localize(areaName),
    slug: readText(data, "slug"),
    metaTitle: localize(pickLocalizedText(data, "seo_title", language) || readText(data, "area_name")),
    description: localize(pickLocalizedText(data, "seo_description", language) || pickLocalizedText(data, "excerpt", language)),
    intro: localize(pickLocalizedText(data, "content", language)),
    propertyTypes: toArray<string>(data.property_types).map((value) => localize(value)),
    commonNeeds: toArray<string>(data.common_needs).map((value) => localize(value)),
    constructionNotes: localize(pickLocalizedText(data, "construction_notes", language)),
    projects: toArray<UnknownRecord>(data.projects).map((project) => ({
      ...project,
      title: localize(toText(project.title)),
      type: readText(project, "type"),
      image: readText(project, "image"),
    })),
    faqs: pickLocalizedList<UnknownRecord>(data, "faqs", language).map((faq) => ({
      q: localize(readText(faq, "q")),
      a: localize(readText(faq, "a")),
    })),
  };
};

export const getPublishedLandingPageBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallback = async () => {
    const { landingPages } = await import("@/data/landings");
    const page = landingPages[slug] || null;
    if (!page || language !== "zh") return page;

    const localize = (value: string) => translateDisplayText(value, language);

    return {
      ...page,
      title: localize(page.title || ""),
      subtitle: localize(page.subtitle || ""),
      heroAlt: localize(page.heroAlt || page.title || ""),
      description: localize(page.description || ""),
      benefits: (page.benefits || []).map((item: string) => localize(item)),
      relatedProjects: (page.relatedProjects || []).map((project) => ({
        ...project,
        title: localize(project.title || ""),
        location: localize(project.location || ""),
      })),
      faqs: (page.faqs || []).map((faq) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
      seoTitle: localize(page.seoTitle || ""),
      seoDescription: localize(page.seoDescription || ""),
    };
  };

  if (!hasPublicContentDatabaseClient()) return fallback();

  const data = await fetchPublishedLandingPageRowBySlug(slug);
  if (!data) return fallback();

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return {
    title: localize(pickLocalizedText(data, "title", language)),
    subtitle: localize(pickLocalizedText(data, "excerpt", language)),
    heroImage: readText(data, "hero_image_url"),
    heroAlt: localize(pickLocalizedText(data, "alt", language, pickLocalizedText(data, "title", language))),
    description: localize(pickLocalizedText(data, "content", language)),
    benefits: pickLocalizedList<string>(data, "benefits", language).map((item: string) => localize(item)),
    relatedProjects: toArray(data.related_projects),
    faqs: pickLocalizedList<UnknownRecord>(data, "faqs", language).map((faq) => ({
      q: localize(readText(faq, "q")),
      a: localize(readText(faq, "a")),
    })),
    seoTitle: localize(pickLocalizedText(data, "seo_title", language)),
    seoDescription: localize(pickLocalizedText(data, "seo_description", language)),
  };
};
