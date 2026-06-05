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
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { toArray, toText, type UnknownRecord } from "@/lib/recordUtils";

const applyOptionalLimit = <T>(items: T[], limit?: number) =>
  limit && limit > 0 ? items.slice(0, limit) : items;

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

export const getFallbackProjects = async (language: "en" | "zh" = "en") => {
  const { projectsData } = await import("@/data/projects");
  if (language !== "zh") return projectsData;

  return projectsData.map((project: any) => ({
    ...project,
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
const getFallbackMaterials = async () => (await import("@/data/materials")).materialsData;
const getFallbackBlogPosts = async (language: "en" | "zh" = "en") => {
  const { blogPosts } = await import("@/data/blog");
  if (language !== "zh") return blogPosts;

  const localize = (value: string) => translateDisplayText(value, language);

  return blogPosts.map((post: any) => ({
    ...post,
    title: localize(post.title || ""),
    excerpt: localize(post.excerpt || ""),
    content: localize(post.content || ""),
    category: localize(post.category || ""),
    tags: (post.tags || []).map((tag: string) => localize(tag)),
  }));
};
const getFallbackLocations = async (language: "en" | "zh" = "en") => {
  const { locationsData } = await import("@/data/locations");
  if (language !== "zh") return locationsData;

  const localize = (value: string) => translateDisplayText(value, language);

  return Object.fromEntries(
    Object.entries(locationsData).map(([slug, location]: any) => [
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
        projects: (location.projects || []).map((project: any) => ({ ...project, title: localize(project.title || "") })),
        faqs: (location.faqs || []).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
      },
    ])
  );
};
export const getFallbackServices = async (language: "en" | "zh" = "en") => {
  const { servicesData } = await import("@/data/services");
  if (language !== "zh") return servicesData;

  const localize = (value: string) => translateDisplayText(value, language);

  return servicesData.map((service: any) => ({
    ...service,
    title: localize(service.title || ""),
    summary: localize(service.summary || ""),
    description: localize(service.description || ""),
    suitableFor: (service.suitableFor || []).map((item: string) => localize(item)),
    commonProjects: (service.commonProjects || []).map((item: string) => localize(item)),
    processSteps: (service.processSteps || []).map((step: any) => ({
      title: localize(step.title || ""),
      desc: localize(step.desc || ""),
    })),
    items: (service.items || []).map((item: string) => localize(item)),
    faqs: (service.faqs || []).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
  }));
};

const pickLocalizedValue = <T = unknown>(item: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback: T): T => {
  const value = item?.[`${field}_${language}`];
  return value === null || value === undefined || value === "" ? fallback : (value as T);
};

const pickLocalizedText = (item: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback = ""): string =>
  toText(pickLocalizedValue(item, field, language, fallback));

const pickLocalizedList = <T = unknown>(item: UnknownRecord | null | undefined, field: string, language: "en" | "zh"): T[] => {
  const value = item?.[`${field}_${language}`];
  return toArray<T>(value);
};

const getOrderedProjectImages = (item: any) => {
  const all = (item.project_images || []).slice().sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const cover = all.filter((img: any) => img.image_type === "cover");
  const gallery = all.filter((img: any) => img.image_type === "gallery");
  const beforeAfter = all.filter((img: any) => img.image_type === "before" || img.image_type === "after");
  return [...cover, ...gallery, ...beforeAfter];
};

export const mapPublishedProjectSummary = (item: any, language: "en" | "zh") => {
  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);
  const orderedImages = getOrderedProjectImages(item);
  const images = orderedImages.map((img: any) => img.image_url).filter(Boolean);
  const fallbackAlt = pickLocalizedText(item, "title", language);
  const imageAlts = orderedImages
    .map((img: any) => pickLocalizedText(img, "alt", language, fallbackAlt))
    .filter(Boolean);
  const thumbnail = images[0] || item.image_url || "";

  return {
    id: item.id,
    slug: item.slug,
    title: localize(pickLocalizedText(item, "title", language)),
    type: normalizeProjectType(item.project_type || "Renovation"),
    location: item.location || "",
    description:
      localize(pickLocalizedText(item, "excerpt", language)) ||
      localize(stripHtml(pickLocalizedText(item, "content", language))),
    images: thumbnail ? [thumbnail] : [],
    imageAlts: imageAlts.length ? [imageAlts[0]] : fallbackAlt ? [fallbackAlt] : [],
    thumbnail,
    thumbnailAlt: imageAlts[0] || fallbackAlt,
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
    return applyOptionalLimit(preloadedRows, limit).map((item: any) => mapPublishedService(item, language));
  }

  if (!hasPublicContentDatabaseClient()) return fallbackServices();

  const data = await fetchPublishedServiceSummaryRows(limit);
  if (!data?.length) return fallbackServices();
  return data.map((item: any) => mapPublishedService(item, language));
};

export const getPublishedHeroSlides = async (language: "en" | "zh" = "en") => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedHeroSlideRows();
  if (!data?.length) return [];
  return data.map((item: any) => mapPublishedHeroSlide(item, language));
};

export const mapPublishedHeroSlide = (item: any, language: "en" | "zh" = "en") => ({
    id: item.id,
    title: pickLocalizedText(item, "title", language),
    excerpt: pickLocalizedText(item, "excerpt", language),
    buttonLabel: pickLocalizedText(item, "button_label", language),
    buttonUrl: item.button_url || "/quote",
    image: item.image_url,
    alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
});

export const getPublishedTestimonials = async (language: "en" | "zh" = "en") => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedTestimonialRows();
  if (!data?.length) return [];
  return data.map((item: any) => mapPublishedTestimonial(item, language));
};

export const mapPublishedTestimonial = (item: any, language: "en" | "zh" = "en") => ({
    id: item.id,
    text: pickLocalizedText(item, "content", language),
    client: item.customer_name || "FLASH CAST Client",
    type: "Renovation",
    location: "",
    rating: item.rating || 5,
});

export const getPublishedServices = async (language: "en" | "zh" = "en") => {
  const preloadedRows = readPreloadedPublicData()?.services;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return preloadedRows.map((item: any) => mapPublishedService(item, language));
  }

  if (!hasPublicContentDatabaseClient()) return getFallbackServices(language);

  const data = await fetchPublishedServiceRows();
  if (!data?.length) return getFallbackServices(language);

  return data.map((item: any) => mapPublishedService(item, language));
};

export const mapPublishedService = (item: any, language: "en" | "zh") => ({
    id: item.id,
    title: pickLocalizedText(item, "title", language),
    slug: item.slug,
    summary: pickLocalizedText(item, "excerpt", language),
    description: pickLocalizedText(item, "content", language),
    suitableFor: pickLocalizedList(item, "suitable_for", language),
    commonProjects: pickLocalizedList(item, "common_projects", language),
    processSteps: pickLocalizedList(item, "process_steps", language),
    items: pickLocalizedList(item, "scope_items", language),
    faqs: pickLocalizedList(item, "faqs", language),
    image: item.image_url || "",
    seoTitle: pickLocalizedText(item, "seo_title", language),
    seoDescription: pickLocalizedText(item, "seo_description", language),
});

export const getPublishedServiceBySlug = async (slug: string, language: "en" | "zh") => {
  const fallbackServices = async () => (await getFallbackServices(language)).find((service: any) => service.slug === slug) || null;
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

export function mapPublishedProjectDetail(data: any, language: "en" | "zh") {
  const projectRecord = data as UnknownRecord;
  const orderedImages = toArray<UnknownRecord>(projectRecord.project_images)
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const cover = orderedImages.filter((img) => img.image_type === "cover");
  const gallery = orderedImages.filter((img) => img.image_type === "gallery");
  const beforeAfter = orderedImages.filter((img) => img.image_type === "before" || img.image_type === "after");
  const imageRecords = [...cover, ...gallery, ...beforeAfter];
  const fallbackUrl = data.image_url ? [data.image_url] : [];
  const fallbackAlt = pickLocalizedText(data, "title", language);

  const images = imageRecords.map((img) => toText(img.image_url)).filter(Boolean);
  const imageAlts = imageRecords
    .map((img) => pickLocalizedText(img, "alt", language, fallbackAlt))
    .filter(Boolean);

  return {
    id: data.id,
    slug: data.slug,
    title: language === "zh" ? translateDisplayText(pickLocalizedText(data, "title", language), language) : pickLocalizedText(data, "title", language),
    type: normalizeProjectType(data.project_type || "Renovation"),
    location: data.location || "",
    description: language === "zh" ? translateDisplayText(pickLocalizedText(data, "content", language), language) : pickLocalizedText(data, "content", language),
    clientNeed: language === "zh" ? translateDisplayText(pickLocalizedText(data, "client_need", language), language) : pickLocalizedText(data, "client_need", language),
    materialsUsed: data.materials || [],
    scope: data.scope || [],
    highlights: pickLocalizedList<string>(data, "highlights", language).map((value: string) => (language === "zh" ? translateDisplayText(value, language) : value)),
    duration: data.duration || "",
    budget: data.budget || "",
    area: data.area || "",
    testimonial: "",
    images: images.length ? images : fallbackUrl,
    imageAlts: imageAlts.length ? imageAlts : fallbackAlt ? [fallbackAlt] : [],
    thumbnail: (cover[0]?.image_url || gallery[0]?.image_url || images[0] || data.image_url || ""),
    thumbnailAlt:
      (pickLocalizedText(cover[0], "alt", language) ||
        pickLocalizedText(gallery[0], "alt", language) ||
        imageAlts[0] ||
        fallbackAlt),
  };
}

export const getPublishedMaterials = async (language: "en" | "zh" = "en") => {
  const preloadedRows = readPreloadedPublicData()?.materials;
  if (Array.isArray(preloadedRows) && preloadedRows.length) {
    return mapPublishedMaterialRows(preloadedRows, language);
  }

  if (!hasPublicContentDatabaseClient()) return getFallbackMaterials();
  const data = await fetchPublishedMaterialRows();
  if (!data?.length) return getFallbackMaterials();

  return mapPublishedMaterialRows(data, language);
};

const mapPublishedMaterialRows = (rows: any[], language: "en" | "zh" = "en") =>
  rows.reduce((acc: any[], item: any) => {
    const categoryName = item.category || "Materials";
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const subcategoryName = item.subcategory || categoryName;
    const subcategorySlug = subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let category = acc.find((cat) => cat.slug === categorySlug);

    if (!category) {
      category = {
        name: categoryName,
        slug: categorySlug,
        description: pickLocalizedText(item, "excerpt", language),
        image: item.image_url || "",
        alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language, categoryName)),
        subcategories: [],
        items: [],
      };
      acc.push(category);
    }

    if (!category.subcategories.some((sub: any) => sub.slug === subcategorySlug)) {
      category.subcategories.push({
        name: subcategoryName,
        slug: subcategorySlug,
        description: pickLocalizedText(item, "excerpt", language),
        image: item.image_url || category.image,
        alt: pickLocalizedText(item, "alt", language, subcategoryName),
      });
    }

    category.items.push({
      id: item.id,
      name: pickLocalizedText(item, "title", language),
      slug: item.slug,
      category: categoryName,
      subcategory: subcategorySlug,
      type: item.material_type || categoryName,
      color: item.color || "",
      texture: item.texture || "",
      suitableSpaces: pickLocalizedList(item, "suitable_spaces", language),
      recommendedPairing: pickLocalizedText(item, "recommended_pairing", language),
      pros: pickLocalizedList(item, "pros", language),
      cons: pickLocalizedList(item, "cons", language),
      description: pickLocalizedText(item, "content", language) || pickLocalizedText(item, "excerpt", language),
      note: pickLocalizedText(item, "note", language) || item.reference_price || "",
      image: item.image_url || "",
      alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
    });

    return acc;
  }, []);

export const getPublishedMaterialBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const categories = await getPublishedMaterials(language);
  for (const category of categories) {
    const material = category.items.find((item: any) => item.slug === slug);
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

const mapPublishedBlogPostRows = (rows: any[], language: "en" | "zh" = "en") => {
  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return rows.map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: localize(pickLocalizedText(item, "title", language)),
    excerpt: localize(pickLocalizedText(item, "excerpt", language)),
    content: localize(pickLocalizedText(item, "content", language)),
    category: localize(item.category || "Renovation"),
    date: item.published_at || item.created_at,
    readTime: formatBlogReadTime(null, language),
    image: item.cover_image_url || "",
    tags: (item.tags || []).map((tag: string) => localize(tag)),
  }));
};

export const getPublishedBlogPostBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallbackPost = async () => (await getFallbackBlogPosts(language)).find((post) => post.slug === slug) || null;
  if (!hasPublicContentDatabaseClient()) return fallbackPost();

  const data = await fetchPublishedBlogPostRowBySlug(slug);
  if (!data) return fallbackPost();

  return {
    id: data.id,
    slug: data.slug,
    title: language === "zh" ? translateDisplayText(pickLocalizedText(data, "title", language), language) : pickLocalizedText(data, "title", language),
    excerpt: language === "zh" ? translateDisplayText(pickLocalizedText(data, "excerpt", language), language) : pickLocalizedText(data, "excerpt", language),
    content: language === "zh" ? translateDisplayText(pickLocalizedText(data, "content", language), language) : pickLocalizedText(data, "content", language),
    category: language === "zh" ? translateDisplayText(data.category || "Renovation", language) : data.category || "Renovation",
    date: data.published_at || data.created_at,
    readTime: formatBlogReadTime(null, language),
    image: data.cover_image_url || "",
    tags: (data.tags || []).map((tag: string) => (language === "zh" ? translateDisplayText(tag, language) : tag)),
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
    slug: data.slug,
    metaTitle: localize(pickLocalizedText(data, "seo_title", language) || data.area_name || ""),
    description: localize(pickLocalizedText(data, "seo_description", language) || pickLocalizedText(data, "excerpt", language)),
    intro: localize(pickLocalizedText(data, "content", language)),
    propertyTypes: (data.property_types || []).map((value: string) => localize(value)),
    commonNeeds: (data.common_needs || []).map((value: string) => localize(value)),
    constructionNotes: localize(pickLocalizedText(data, "construction_notes", language)),
    projects: toArray<UnknownRecord>(data.projects).map((project) => ({
      ...project,
      title: localize(toText(project.title)),
      image: project.image,
    })),
    faqs: pickLocalizedList<any>(data, "faqs", language).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
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
      relatedProjects: (page.relatedProjects || []).map((project: any) => ({
        ...project,
        title: localize(project.title || ""),
        location: localize(project.location || ""),
      })),
      faqs: (page.faqs || []).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
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
    heroImage: data.hero_image_url || "",
    heroAlt: localize(pickLocalizedText(data, "alt", language, pickLocalizedText(data, "title", language))),
    description: localize(pickLocalizedText(data, "content", language)),
    benefits: pickLocalizedList<string>(data, "benefits", language).map((item: string) => localize(item)),
    relatedProjects: data.related_projects || [],
    faqs: pickLocalizedList<any>(data, "faqs", language).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
    seoTitle: localize(pickLocalizedText(data, "seo_title", language)),
    seoDescription: localize(pickLocalizedText(data, "seo_description", language)),
  };
};
