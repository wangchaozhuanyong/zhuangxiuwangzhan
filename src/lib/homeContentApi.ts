import {
  fetchPublicHomeBundleData,
  fetchPublishedAboutSectionRow,
  fetchPublishedBeforeAfterRows,
  fetchPublishedBrandPartnerRows,
  fetchPublishedCmsPageByPageKey,
  fetchPublishedCmsPageByPath,
  fetchPublishedCtaBlockRow,
  fetchPublishedFaqRows,
  fetchPublishedHomeSectionRow,
  fetchPublishedLegacySitePageRow,
  fetchPublishedProcessStepRows,
  hasPublicContentDatabaseClient,
} from "@/backend/modules/cms/repository/publicContentRepository";
import {
  getFallbackProjects,
  getFallbackServices,
  mapPublishedHeroSlide,
  mapPublishedProjectSummary,
  mapPublishedService,
  mapPublishedTestimonial,
} from "@/lib/contentApi";
import {
  createLocalFallbackContent,
  createRemoteContent,
  type PublicContentResult,
} from "@/lib/publicContentStatus";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { toArray, toRecord, toText, type UnknownRecord } from "@/lib/recordUtils";

export type PublishedBrandPartner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
};

export type PublishedBeforeAfterItem = {
  id: string;
  title: string;
  location: string;
  description: string;
  before_image_url: string;
  after_image_url: string;
  alt: string;
};

export type PublishedFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type PublishedHomeSection = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url?: string | null;
  items: any[];
};

export type PublishedProcessStep = {
  id: string;
  step_number: number;
  sort_order?: number;
  title: string;
  description: string;
  icon_key?: string | null;
};

export type PublishedCtaBlock = {
  id: string;
  block_key: string;
  title: string;
  description: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
  image_url?: string | null;
};

export type PublishedAboutSection = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url?: string | null;
  items: any[];
};

export type PublishedSitePage = {
  id: string;
  page_key: string;
  path: string;
  title: string;
  subtitle: string;
  description: string;
  content: string;
  cta_title: string;
  cta_description: string;
  image_url?: string | null;
  alt: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  items: any[];
  sections?: PublishedCmsSection[];
};

export type PublishedCmsSection = {
  id: string;
  section_key: string;
  section_type: string;
  title: string;
  content: UnknownRecord;
  settings: UnknownRecord;
  sort_order: number;
};

export type PublishedHomeContentBundle = {
  pageContent: PublishedSitePage | null;
  heroSlides: any[];
  statsSection: PublishedHomeSection | null;
  whyChooseUsSection: PublishedHomeSection | null;
  projects: any[];
  brandPartners: PublishedBrandPartner[];
  services: any[];
  processSteps: PublishedProcessStep[];
  beforeAfterItems: PublishedBeforeAfterItem[];
  testimonials: any[];
  faqs: PublishedFaq[];
  ctaBlock: PublishedCtaBlock | null;
};

const pickLocalizedValue = <T = unknown>(row: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback: T): T => {
  const value = row?.[`${field}_${language}`];
  return value === null || value === undefined || value === "" ? fallback : (value as T);
};

const pickLocalizedText = (row: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback = ""): string =>
  toText(pickLocalizedValue(row, field, language, fallback));

const pickLocalizedList = <T = any>(row: any, field: string, language: "en" | "zh"): T[] => {
  const value = row?.[`${field}_${language}`];
  return toArray<T>(value);
};

const pickLocalizedObject = (row: UnknownRecord | null | undefined, field: string, language: "en" | "zh"): UnknownRecord => {
  const value = row?.[`${field}_${language}`];
  return toRecord(value);
};

const normalizeCmsSectionType = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return "";
};

const firstList = <T = any>(...values: unknown[]): T[] => {
  for (const value of values) {
    const list = toArray<T>(value);
    if (list.length) return list;
  }
  return [];
};

const mapPublishedCmsPage = (
  cmsRow: any,
  language: "en" | "zh",
  legacy: PublishedSitePage | null = null,
): PublishedSitePage => {
  const sections = ((cmsRow.cms_sections || []) as any[])
    .filter((section) => section.status === "published" && !section.deleted_at)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const pickContent = (section: any) => pickLocalizedObject(section, "content", language);
  const typeMatches = (section: any, types: string[]) => types.includes(normalizeCmsSectionType(String(section.section_type || "")));
  const hero = sections.find((section) => typeMatches(section, ["hero"]) || section.section_key === "hero");
  const richText = sections.find((section) => typeMatches(section, ["rich_text", "text", "content"]));
  const cta = sections.find((section) => typeMatches(section, ["cta"]) || String(section.section_key || "").includes("cta"));
  const listSection = sections.find((section) => {
    const content = pickContent(section);
    return Array.isArray(content.items) && content.items.length > 0;
  });
  const heroContent = pickContent(hero);
  const richContent = pickContent(richText);
  const ctaContent = pickContent(cta);
  const listContent = pickContent(listSection);
  const heroSettings = hero?.settings || {};
  const ctaSettings = cta?.settings || {};
  const publishedSections: PublishedCmsSection[] = sections.map((section) => ({
    id: section.id,
    section_key: section.section_key,
    section_type: section.section_type,
    title: pickLocalizedText(section, "title", language),
    content: pickContent(section),
    settings: toRecord(section.settings),
    sort_order: Number(section.sort_order || 0),
  }));

  return {
    id: cmsRow.id,
    page_key: cmsRow.page_key,
    path: cmsRow.path || legacy?.path || "",
    title: firstText(pickLocalizedText(cmsRow, "title", language), heroContent.title, legacy?.title),
    subtitle: firstText(heroContent.subtitle, legacy?.subtitle),
    description: firstText(heroContent.description, heroContent.excerpt, legacy?.description),
    content: firstText(richContent.content, heroContent.content, legacy?.content),
    cta_title: firstText(ctaContent.title, ctaSettings.title, legacy?.cta_title),
    cta_description: firstText(ctaContent.description, ctaSettings.description, legacy?.cta_description),
    image_url: firstText(heroContent.image_url, heroSettings.image_url, legacy?.image_url) || null,
    alt: firstText(heroContent.alt, heroSettings.alt, legacy?.alt),
    seo_title: pickLocalizedText(cmsRow, "seo_title", language) || legacy?.seo_title || "",
    seo_description: pickLocalizedText(cmsRow, "seo_description", language) || legacy?.seo_description || "",
    seo_keywords: pickLocalizedText(cmsRow, "seo_keywords", language) || legacy?.seo_keywords || "",
    items: firstList(listContent.items, heroContent.items, richContent.items, legacy?.items),
    sections: publishedSections,
  };
};

const mapLegacySitePage = (row: any, language: "en" | "zh"): PublishedSitePage => ({
  id: row.id,
  page_key: row.page_key,
  path: row.path || "",
  title: pickLocalizedText(row, "title", language),
  subtitle: pickLocalizedText(row, "subtitle", language),
  description: pickLocalizedText(row, "description", language),
  content: pickLocalizedText(row, "content", language),
  cta_title: pickLocalizedText(row, "cta_title", language),
  cta_description: pickLocalizedText(row, "cta_description", language),
  image_url: row.image_url || null,
  alt: pickLocalizedText(row, "alt", language),
  seo_title: pickLocalizedText(row, "seo_title", language),
  seo_description: pickLocalizedText(row, "seo_description", language),
  seo_keywords: pickLocalizedText(row, "seo_keywords", language),
  items: pickLocalizedList(row, "items", language),
});

const mapSitePageRows = (payload: UnknownRecord, language: "en" | "zh") => {
  const legacyRow = toArray<any>(payload.site_pages)[0];
  const legacy = legacyRow ? mapLegacySitePage(legacyRow, language) : null;
  const cmsRow = toArray<any>(payload.cms_pages)[0];
  return cmsRow ? mapPublishedCmsPage(cmsRow, language, legacy) : legacy;
};

const mapPublishedHomeSectionRow = (row: any, language: "en" | "zh"): PublishedHomeSection => ({
  id: row.id,
  section_key: row.section_key,
  title: pickLocalizedText(row, "title", language),
  subtitle: pickLocalizedText(row, "subtitle", language),
  content: pickLocalizedText(row, "content", language),
  image_url: row.image_url,
  items: pickLocalizedList(row, "items", language),
});

const mapPublishedBeforeAfterItem = (item: any, language: "en" | "zh"): PublishedBeforeAfterItem => ({
  id: item.id,
  title: pickLocalizedText(item, "title", language),
  location: item.location || "",
  description: pickLocalizedText(item, "description", language),
  before_image_url: item.before_image_url,
  after_image_url: item.after_image_url,
  alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
});

const mapPublishedFaq = (item: any, language: "en" | "zh"): PublishedFaq => ({
  id: item.id,
  category: item.page_key || "general",
  question: pickLocalizedText(item, "question", language),
  answer: pickLocalizedText(item, "answer", language),
});

const mapPublishedProcessStep = (row: any, language: "en" | "zh"): PublishedProcessStep => ({
  id: row.id,
  step_number: Number(row.step_number || 0),
  sort_order: Number(row.sort_order ?? row.step_number ?? 0),
  title: pickLocalizedText(row, "title", language),
  description: pickLocalizedText(row, "description", language),
  icon_key: row.icon_key || null,
});

const mapPublishedCtaBlockRow = (row: any, language: "en" | "zh"): PublishedCtaBlock => ({
  id: row.id,
  block_key: row.block_key,
  title: pickLocalizedText(row, "title", language),
  description: pickLocalizedText(row, "description", language),
  primary_label: pickLocalizedText(row, "primary_label", language),
  primary_url: row.primary_url || "/quote",
  secondary_label: pickLocalizedText(row, "secondary_label", language),
  secondary_url: row.secondary_url || "",
  image_url: row.image_url || null,
});

const emptyHomeContentBundle = (): PublishedHomeContentBundle => ({
  pageContent: null,
  heroSlides: [],
  statsSection: null,
  whyChooseUsSection: null,
  projects: [],
  brandPartners: [],
  services: [],
  processSteps: [],
  beforeAfterItems: [],
  testimonials: [],
  faqs: [],
  ctaBlock: null,
});

const getLocalHomeContentBundle = async (language: "en" | "zh"): Promise<PublishedHomeContentBundle> => {
  const [{ testimonials, homeFAQs }, projects, services] = await Promise.all([
    import("@/data/siteContent"),
    getFallbackProjects(language),
    getFallbackServices(language),
  ]);

  return {
    ...emptyHomeContentBundle(),
    projects: projects.slice(0, 6),
    services: services.slice(0, 8),
    testimonials: testimonials.map((item, index) => ({
      id: `local-testimonial-${index}`,
      text: item.text,
      client: item.client,
      type: item.type,
      location: item.location,
      rating: 5,
    })),
    faqs: homeFAQs.map((item, index) => ({
      id: `local-home-faq-${index}`,
      category: "home",
      question: item.q,
      answer: item.a,
    })),
  };
};

const mapRemoteHomeContentBundle = (payload: UnknownRecord, language: "en" | "zh"): PublishedHomeContentBundle => {
  const homeSections = toArray<any>(payload.home_sections).map((row) => mapPublishedHomeSectionRow(row, language));
  const findHomeSection = (sectionKey: string) => homeSections.find((section) => section.section_key === sectionKey) || null;

  return {
    pageContent: mapSitePageRows(payload, language),
    heroSlides: toArray<any>(payload.hero_slides).map((item) => mapPublishedHeroSlide(item, language)),
    statsSection: findHomeSection("stats"),
    whyChooseUsSection: findHomeSection("why_choose_us"),
    projects: toArray<any>(payload.projects).map((item) => mapPublishedProjectSummary(item, language)),
    brandPartners: toArray<PublishedBrandPartner>(payload.brand_partners).filter((item) => item.logo_url && item.name),
    services: toArray<any>(payload.services).map((item) => mapPublishedService(item, language)),
    processSteps: toArray<any>(payload.process_steps).map((row) => mapPublishedProcessStep(row, language)),
    beforeAfterItems: toArray<any>(payload.before_after_items)
      .filter((item): item is typeof item & { before_image_url: string; after_image_url: string } =>
        Boolean(item.before_image_url && item.after_image_url)
      )
      .map((item) => mapPublishedBeforeAfterItem(item, language)),
    testimonials: toArray<any>(payload.testimonials).map((item) => mapPublishedTestimonial(item, language)),
    faqs: toArray<any>(payload.faqs).map((item) => mapPublishedFaq(item, language)),
    ctaBlock: toArray<any>(payload.cta_blocks)[0]
      ? mapPublishedCtaBlockRow(toArray<any>(payload.cta_blocks)[0], language)
      : null,
  };
};

export const getPublishedHomeContentBundle = async (
  language: "en" | "zh",
): Promise<PublicContentResult<PublishedHomeContentBundle>> => {
  const fallback = async (reason: "supabase-not-configured" | "remote-empty" | "remote-error", error?: unknown) =>
    createLocalFallbackContent(await getLocalHomeContentBundle(language), reason, error);

  const preloadedHomeBundle = toRecord(readPreloadedPublicData()?.homeContentBundle);
  if (Object.keys(preloadedHomeBundle).length) {
    return createRemoteContent(mapRemoteHomeContentBundle(preloadedHomeBundle, language));
  }

  if (!hasPublicContentDatabaseClient()) return fallback("supabase-not-configured");

  try {
    const data = await fetchPublicHomeBundleData();
    const payload = toRecord(data);
    if (!Object.keys(payload).length) return fallback("remote-empty");

    return createRemoteContent(mapRemoteHomeContentBundle(payload, language));
  } catch (error) {
    return fallback("remote-error", error);
  }
};

export const getPublishedBrandPartners = async (): Promise<PublishedBrandPartner[]> => {
  if (!hasPublicContentDatabaseClient()) return [];
  const data = await fetchPublishedBrandPartnerRows();
  return data || [];
};

export const getPublishedBeforeAfterItems = async (language: "en" | "zh"): Promise<PublishedBeforeAfterItem[]> => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedBeforeAfterRows();
  return (data || [])
    .filter(
      (item): item is typeof item & { before_image_url: string; after_image_url: string } =>
        Boolean(item.before_image_url && item.after_image_url)
    )
    .map((item) => ({
      id: item.id,
      title: pickLocalizedText(item, "title", language),
      location: item.location || "",
      description: pickLocalizedText(item, "description", language),
      before_image_url: item.before_image_url,
      after_image_url: item.after_image_url,
      alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
    }));
};

export const getPublishedFaqs = async (language: "en" | "zh", pageKey = "general"): Promise<PublishedFaq[]> => {
  if (!hasPublicContentDatabaseClient()) return [];

  const data = await fetchPublishedFaqRows(pageKey);
  return (data || []).map((item) => ({
    id: item.id,
    category: item.page_key || "general",
    question: pickLocalizedText(item, "question", language),
    answer: pickLocalizedText(item, "answer", language),
  }));
};

export const getPublishedHomeSection = async (
  language: "en" | "zh",
  sectionKey: string,
): Promise<PublishedHomeSection | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const row: any = await fetchPublishedHomeSectionRow(sectionKey);
  if (!row) return null;
  return {
    id: row.id,
    section_key: row.section_key,
    title: pickLocalizedText(row, "title", language),
    subtitle: pickLocalizedText(row, "subtitle", language),
    content: pickLocalizedText(row, "content", language),
    image_url: row.image_url,
    items: pickLocalizedList(row, "items", language),
  };
};

export const getPublishedProcessSteps = async (language: "en" | "zh"): Promise<PublishedProcessStep[]> => {
  if (!hasPublicContentDatabaseClient()) return [];
  const data = await fetchPublishedProcessStepRows();
  return (data || []).map((row: any) => ({
    id: row.id,
    step_number: Number(row.step_number || 0),
    sort_order: Number(row.sort_order ?? row.step_number ?? 0),
    title: pickLocalizedText(row, "title", language),
    description: pickLocalizedText(row, "description", language),
    icon_key: row.icon_key || null,
  }));
};

export const getPublishedCtaBlock = async (language: "en" | "zh", blockKey: string): Promise<PublishedCtaBlock | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const row: any = await fetchPublishedCtaBlockRow(blockKey);
  if (!row) return null;
  return {
    id: row.id,
    block_key: row.block_key,
    title: pickLocalizedText(row, "title", language),
    description: pickLocalizedText(row, "description", language),
    primary_label: pickLocalizedText(row, "primary_label", language),
    primary_url: row.primary_url || "/quote",
    secondary_label: pickLocalizedText(row, "secondary_label", language),
    secondary_url: row.secondary_url || "",
    image_url: row.image_url || null,
  };
};

export const getPublishedAboutSection = async (
  language: "en" | "zh",
  sectionKey: string,
): Promise<PublishedAboutSection | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const row: any = await fetchPublishedAboutSectionRow(sectionKey);
  if (!row) return null;
  return {
    id: row.id,
    section_key: row.section_key,
    title: pickLocalizedText(row, "title", language),
    subtitle: pickLocalizedText(row, "subtitle", language),
    content: pickLocalizedText(row, "content", language),
    image_url: row.image_url,
    items: pickLocalizedList(row, "items", language),
  };
};

export const getPublishedSitePage = async (
  language: "en" | "zh",
  pageKey: string,
): Promise<PublishedSitePage | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const row: any = await fetchPublishedLegacySitePageRow(pageKey);
  const legacy: PublishedSitePage | null = row
    ? {
        id: row.id,
        page_key: row.page_key,
        path: row.path || "",
        title: pickLocalizedText(row, "title", language),
        subtitle: pickLocalizedText(row, "subtitle", language),
        description: pickLocalizedText(row, "description", language),
        content: pickLocalizedText(row, "content", language),
        cta_title: pickLocalizedText(row, "cta_title", language),
        cta_description: pickLocalizedText(row, "cta_description", language),
        image_url: row.image_url || null,
        alt: pickLocalizedText(row, "alt", language),
        seo_title: pickLocalizedText(row, "seo_title", language),
        seo_description: pickLocalizedText(row, "seo_description", language),
        seo_keywords: pickLocalizedText(row, "seo_keywords", language),
        items: pickLocalizedList(row, "items", language),
      }
    : null;

  const cmsRow: any = await fetchPublishedCmsPageByPageKey(pageKey);
  if (!cmsRow) return legacy;

  return mapPublishedCmsPage(cmsRow, language, legacy);
};

export const getPublishedCmsPageByPath = async (
  language: "en" | "zh",
  path: string,
): Promise<PublishedSitePage | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "").replace(/\/+$/, "")}`;
  const cmsRow: any = await fetchPublishedCmsPageByPath(normalizedPath);
  return cmsRow ? mapPublishedCmsPage(cmsRow, language) : null;
};
