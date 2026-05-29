import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { stripHtml } from "@/lib/text";
import { translateDisplayText } from "@/i18n/displayLabels";

const byCreatedAtDesc = { ascending: false };

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

const getFallbackProjects = async (language: "en" | "zh" = "en") => {
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
const getFallbackServices = async (language: "en" | "zh" = "en") => {
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

export const getPublishedProjects = async (language: "en" | "zh") => {
  if (!isSupabaseConfigured) return getFallbackProjects(language);

  const { data, error } = await supabase!
    .from("projects")
    .select("*, project_images(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return getFallbackProjects(language);

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return data.map((item: any) => ({
    // images priority:
    // - cover: project_images(image_type='cover')
    // - then gallery
    // - then before/after (still part of the full list)
    // - finally fallback to projects.image_url if DB images are empty
    id: item.id,
    slug: item.slug,
    title: localize(item[`title_${language}`] || item.title_en || item.title_zh || ""),
    type: normalizeProjectType(item.project_type || "Renovation"),
    location: item.location || "",
    description:
      localize(item[`excerpt_${language}`] || "") ||
      item.excerpt_en ||
      item.excerpt_zh ||
      localize(stripHtml(item[`content_${language}`] || item.content_en || item.content_zh || "")),
    clientNeed: localize(item[`client_need_${language}`] || item.client_need_en || item.client_need_zh || ""),
    materialsUsed: item.materials || [],
    scope: item.scope || [],
    highlights: (item[`highlights_${language}`] || item.highlights_en || item.highlights_zh || []).map((value: string) => localize(value)),
    duration: item.duration || "",
    images: (() => {
      const all = (item.project_images || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
      const cover = all.filter((img: any) => img.image_type === "cover");
      const gallery = all.filter((img: any) => img.image_type === "gallery");
      const beforeAfter = all.filter((img: any) => img.image_type === "before" || img.image_type === "after");
      const urls = [...cover, ...gallery, ...beforeAfter].map((img: any) => img.image_url).filter(Boolean);
      return urls.length ? urls : item.image_url ? [item.image_url] : [];
    })(),
    imageAlts: (() => {
      const all = (item.project_images || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
      const cover = all.filter((img: any) => img.image_type === "cover");
      const gallery = all.filter((img: any) => img.image_type === "gallery");
      const beforeAfter = all.filter((img: any) => img.image_type === "before" || img.image_type === "after");
      const ordered = [...cover, ...gallery, ...beforeAfter];
      const fallbackAlt = item[`title_${language}`] || item.title_en || item.title_zh;
      const alts = ordered
        .map((img: any) => img[`alt_${language}`] || img.alt_en || img.alt_zh || fallbackAlt)
        .filter(Boolean);
      return alts.length ? alts : fallbackAlt ? [fallbackAlt] : [];
    })(),
    thumbnail: (() => {
      const all = (item.project_images || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
      const cover = all.find((img: any) => img.image_type === "cover");
      const galleryFirst = all.find((img: any) => img.image_type === "gallery");
      return cover?.image_url || galleryFirst?.image_url || item.image_url || "";
    })(),
    thumbnailAlt: (() => {
      const all = (item.project_images || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
      const cover = all.find((img: any) => img.image_type === "cover");
      const galleryFirst = all.find((img: any) => img.image_type === "gallery");
      const chosen = cover || galleryFirst;
      return (
        chosen?.[`alt_${language}`] ||
        chosen?.alt_en ||
        chosen?.alt_zh ||
        item[`title_${language}`] ||
        item.title_en ||
        item.title_zh
      );
    })(),
  }));
};

export const getPublishedHeroSlides = async (language: "en" | "zh" = "en") => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase!
    .from("hero_slides")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return [];

  return data.map((item: any) => ({
    id: item.id,
    title: item[`title_${language}`] || item.title_en || item.title_zh,
    excerpt: item[`excerpt_${language}`] || item.excerpt_en || item.excerpt_zh,
    buttonLabel: item[`button_label_${language}`] || item.button_label_en || item.button_label_zh,
    buttonUrl: item.button_url || "/quote",
    image: item.image_url,
    alt: item[`alt_${language}`] || item.alt_en || item.alt_zh || item.title_en || item.title_zh,
  }));
};

export const getPublishedTestimonials = async (language: "en" | "zh" = "en") => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase!
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return [];

  return data.map((item: any) => ({
    id: item.id,
    text: item[`content_${language}`] || item.content_en || item.content_zh,
    client: item.customer_name || "FLASH CAST Client",
    type: "Renovation",
    location: "",
    rating: item.rating || 5,
  }));
};

export const getPublishedServices = async (language: "en" | "zh" = "en") => {
  if (!isSupabaseConfigured) return getFallbackServices(language);

  const { data, error } = await supabase!
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return getFallbackServices(language);

  return data.map((item: any) => mapPublishedService(item, language));
};

const mapPublishedService = (item: any, language: "en" | "zh") => ({
    id: item.id,
    title: item[`title_${language}`] || item.title_en || item.title_zh,
    slug: item.slug,
    summary: item[`excerpt_${language}`] || item.excerpt_en || item.excerpt_zh || "",
    description: item[`content_${language}`] || item.content_en || item.content_zh || "",
    suitableFor: item[`suitable_for_${language}`] || item.suitable_for_en || item.suitable_for_zh || [],
    commonProjects: item[`common_projects_${language}`] || item.common_projects_en || item.common_projects_zh || [],
    processSteps: item[`process_steps_${language}`] || item.process_steps_en || item.process_steps_zh || [],
    items: item[`scope_items_${language}`] || item.scope_items_en || item.scope_items_zh || [],
    faqs: item[`faqs_${language}`] || item.faqs_en || item.faqs_zh || [],
    image: item.image_url || "",
    seoTitle: item[`seo_title_${language}`] || item.seo_title_en || item.seo_title_zh || "",
    seoDescription: item[`seo_description_${language}`] || item.seo_description_en || item.seo_description_zh || "",
});

export const getPublishedServiceBySlug = async (slug: string, language: "en" | "zh") => {
  const fallbackServices = async () => (await getFallbackServices(language)).find((service: any) => service.slug === slug) || null;
  if (!isSupabaseConfigured) return fallbackServices();

  const { data, error } = await supabase!
    .from("services")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error || !data) return fallbackServices();
  return mapPublishedService(data, language);
};

export const getPublishedProjectBySlug = async (slug: string, language: "en" | "zh") => {
  const fallbackProjects = async () => (await getFallbackProjects(language)).find((project) => project.slug === slug) || null;
  if (!isSupabaseConfigured) return fallbackProjects();

  const { data, error } = await supabase!
    .from("projects")
    .select("*, project_images(*)")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error || !data) return fallbackProjects();

  const orderedImages = (data.project_images || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
  const cover = orderedImages.filter((img: any) => img.image_type === "cover");
  const gallery = orderedImages.filter((img: any) => img.image_type === "gallery");
  const beforeAfter = orderedImages.filter((img: any) => img.image_type === "before" || img.image_type === "after");
  const imageRecords = [...cover, ...gallery, ...beforeAfter];
  const fallbackUrl = data.image_url ? [data.image_url] : [];
  const fallbackAlt = data[`title_${language}`] || data.title_en || data.title_zh;

  const images = imageRecords.map((img: any) => img.image_url).filter(Boolean);
  const imageAlts = imageRecords
    .map((img: any) => img[`alt_${language}`] || img.alt_en || img.alt_zh || fallbackAlt)
    .filter(Boolean);

  return {
    id: data.id,
    slug: data.slug,
    title: language === "zh" ? translateDisplayText(data[`title_${language}`] || data.title_en || data.title_zh || "", language) : data[`title_${language}`] || data.title_en || data.title_zh,
    type: normalizeProjectType(data.project_type || "Renovation"),
    location: data.location || "",
    description: language === "zh" ? translateDisplayText(data[`content_${language}`] || data.content_en || data.content_zh || "", language) : data[`content_${language}`] || data.content_en || data.content_zh || "",
    clientNeed: language === "zh" ? translateDisplayText(data[`client_need_${language}`] || data.client_need_en || data.client_need_zh || "", language) : data[`client_need_${language}`] || data.client_need_en || data.client_need_zh || "",
    materialsUsed: data.materials || [],
    scope: data.scope || [],
    highlights: (data[`highlights_${language}`] || data.highlights_en || data.highlights_zh || []).map((value: string) => (language === "zh" ? translateDisplayText(value, language) : value)),
    duration: data.duration || "",
    budget: data.budget || "",
    area: data.area || "",
    testimonial: "",
    images: images.length ? images : fallbackUrl,
    imageAlts: imageAlts.length ? imageAlts : fallbackAlt ? [fallbackAlt] : [],
    thumbnail: (cover[0]?.image_url || gallery[0]?.image_url || images[0] || data.image_url || ""),
    thumbnailAlt:
      (cover[0]?.[`alt_${language}`] ||
        cover[0]?.alt_en ||
        cover[0]?.alt_zh ||
        gallery[0]?.[`alt_${language}`] ||
        gallery[0]?.alt_en ||
        gallery[0]?.alt_zh ||
        imageAlts[0] ||
        fallbackAlt),
  };
};

export const getPublishedMaterials = async (language: "en" | "zh" = "en") => {
  if (!isSupabaseConfigured) return getFallbackMaterials();
  const { data, error } = await supabase!.from("materials").select("*").eq("status", "published").order("sort_order");
  if (error || !data?.length) return getFallbackMaterials();

  const grouped = data.reduce((acc: any[], item: any) => {
    const categoryName = item.category || "Materials";
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const subcategoryName = item.subcategory || categoryName;
    const subcategorySlug = subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let category = acc.find((cat) => cat.slug === categorySlug);

    if (!category) {
      category = {
        name: categoryName,
        slug: categorySlug,
        description: item[`excerpt_${language}`] || item.excerpt_en || item.excerpt_zh || "",
        image: item.image_url || "",
        alt: item[`alt_${language}`] || item.alt_en || item.alt_zh || item[`title_${language}`] || item.title_en || item.title_zh || categoryName,
        subcategories: [],
        items: [],
      };
      acc.push(category);
    }

    if (!category.subcategories.some((sub: any) => sub.slug === subcategorySlug)) {
      category.subcategories.push({
        name: subcategoryName,
        slug: subcategorySlug,
        description: item[`excerpt_${language}`] || item.excerpt_en || item.excerpt_zh || "",
        image: item.image_url || category.image,
        alt: item[`alt_${language}`] || item.alt_en || item.alt_zh || subcategoryName,
      });
    }

    category.items.push({
      id: item.id,
      name: item[`title_${language}`] || item.title_en || item.title_zh,
      slug: item.slug,
      category: categoryName,
      subcategory: subcategorySlug,
      type: item.material_type || categoryName,
      color: item.color || "",
      texture: item.texture || "",
      suitableSpaces: item[`suitable_spaces_${language}`] || item.suitable_spaces_en || item.suitable_spaces_zh || [],
      recommendedPairing: item[`recommended_pairing_${language}`] || item.recommended_pairing_en || item.recommended_pairing_zh || "",
      description: item[`content_${language}`] || item.content_en || item.content_zh || item[`excerpt_${language}`] || "",
      note: item[`note_${language}`] || item.note_en || item.note_zh || item.reference_price || "",
      image: item.image_url || "",
      alt: item[`alt_${language}`] || item.alt_en || item.alt_zh || item[`title_${language}`] || item.title_en || item.title_zh,
    });

    return acc;
  }, []);

  return grouped;
};

export const getPublishedMaterialBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const categories = await getPublishedMaterials(language);
  for (const category of categories) {
    const material = category.items.find((item: any) => item.slug === slug);
    if (material) return { material, category };
  }
  return { material: null, category: null };
};

export const getPublishedBlogPosts = async (language: "en" | "zh" = "en") => {
  if (!isSupabaseConfigured) return getFallbackBlogPosts(language);
  const { data, error } = await supabase!.from("blog_posts").select("*").eq("status", "published").order("published_at", byCreatedAtDesc);
  if (error || !data?.length) return getFallbackBlogPosts(language);

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return data.map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: localize(item[`title_${language}`] || item.title_en || item.title_zh || ""),
    excerpt: localize(item[`excerpt_${language}`] || item.excerpt_en || item.excerpt_zh || ""),
    content: localize(item[`content_${language}`] || item.content_en || item.content_zh || ""),
    category: localize(item.category || "Renovation"),
    date: item.published_at || item.created_at,
    readTime: "5 min read",
    image: item.cover_image_url || "",
    tags: (item.tags || []).map((tag: string) => localize(tag)),
  }));
};

export const getPublishedBlogPostBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallbackPost = async () => (await getFallbackBlogPosts(language)).find((post) => post.slug === slug) || null;
  if (!isSupabaseConfigured) return fallbackPost();

  const { data, error } = await supabase!
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error || !data) return fallbackPost();

  return {
    id: data.id,
    slug: data.slug,
    title: language === "zh" ? translateDisplayText(data[`title_${language}`] || data.title_en || data.title_zh || "", language) : data[`title_${language}`] || data.title_en || data.title_zh,
    excerpt: language === "zh" ? translateDisplayText(data[`excerpt_${language}`] || data.excerpt_en || data.excerpt_zh || "", language) : data[`excerpt_${language}`] || data.excerpt_en || data.excerpt_zh,
    content: language === "zh" ? translateDisplayText(data[`content_${language}`] || data.content_en || data.content_zh || "", language) : data[`content_${language}`] || data.content_en || data.content_zh,
    category: language === "zh" ? translateDisplayText(data.category || "Renovation", language) : data.category || "Renovation",
    date: data.published_at || data.created_at,
    readTime: "5 min read",
    image: data.cover_image_url || "",
    tags: (data.tags || []).map((tag: string) => (language === "zh" ? translateDisplayText(tag, language) : tag)),
  };
};

export const getPublishedServiceAreaBySlug = async (slug: string, language: "en" | "zh" = "en") => {
  const fallback = async () => {
    const locationsData = await getFallbackLocations(language);
    return locationsData[slug] || null;
  };
  if (!isSupabaseConfigured) return fallback();

  const { data, error } = await supabase!
    .from("service_areas")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error || !data) return fallback();

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return {
    name: localize(data.area_name || data[`title_${language}`] || data.title_en || data.title_zh || ""),
    slug: data.slug,
    metaTitle: localize(data[`seo_title_${language}`] || data.seo_title_en || data.seo_title_zh || data.area_name || ""),
    description: localize(data[`seo_description_${language}`] || data.seo_description_en || data.seo_description_zh || data[`excerpt_${language}`] || ""),
    intro: localize(data[`content_${language}`] || data.content_en || data.content_zh || ""),
    propertyTypes: (data.property_types || []).map((value: string) => localize(value)),
    commonNeeds: (data.common_needs || []).map((value: string) => localize(value)),
    constructionNotes: localize(data[`construction_notes_${language}`] || data.construction_notes_en || data.construction_notes_zh || ""),
    projects: (data.projects || []).map((project: any) => ({ ...project, title: localize(project.title || ""), image: project.image })),
    faqs: (data[`faqs_${language}`] || data.faqs_en || data.faqs_zh || []).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
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

  if (!isSupabaseConfigured) return fallback();

  const { data, error } = await supabase!
    .from("landing_pages")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error || !data) return fallback();

  const localize = (value: string) => (language === "zh" ? translateDisplayText(value, language) : value);

  return {
    title: localize(data[`title_${language}`] || data.title_en || data.title_zh || ""),
    subtitle: localize(data[`excerpt_${language}`] || data.excerpt_en || data.excerpt_zh || ""),
    heroImage: data.hero_image_url || "",
    heroAlt: localize(data[`alt_${language}`] || data.alt_en || data.alt_zh || data[`title_${language}`] || data.title_en || data.title_zh || ""),
    description: localize(data[`content_${language}`] || data.content_en || data.content_zh || ""),
    benefits: (data[`benefits_${language}`] || data.benefits_en || data.benefits_zh || []).map((item: string) => localize(item)),
    relatedProjects: data.related_projects || [],
    faqs: (data[`faqs_${language}`] || data.faqs_en || data.faqs_zh || []).map((faq: any) => ({ q: localize(faq.q || ""), a: localize(faq.a || "") })),
    seoTitle: localize(data[`seo_title_${language}`] || data.seo_title_en || data.seo_title_zh || ""),
    seoDescription: localize(data[`seo_description_${language}`] || data.seo_description_en || data.seo_description_zh || ""),
  };
};
