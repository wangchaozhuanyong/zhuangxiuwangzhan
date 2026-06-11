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
  type PublishedHeroSlide,
  type PublishedProjectSummary,
  type PublishedServiceSummary,
} from "@/lib/contentApi";
import {
  createLocalFallbackContent,
  createRemoteContent,
  type PublicContentResult,
} from "@/lib/publicContentStatus";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { toArray, toRecord, toText, type UnknownRecord } from "@/lib/recordUtils";

type Language = "en" | "zh";

const readText = (record: UnknownRecord | null | undefined, field: string, fallback = "") => toText(record?.[field], fallback);
const readRecordArray = (value: unknown): UnknownRecord[] => toArray<UnknownRecord>(value).map(toRecord);

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
  items: unknown[];
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
  items: unknown[];
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
  items: unknown[];
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
  heroSlides: PublishedHeroSlide[];
  statsSection: PublishedHomeSection | null;
  whyChooseUsSection: PublishedHomeSection | null;
  projects: PublishedProjectSummary[];
  brandPartners: PublishedBrandPartner[];
  services: PublishedServiceSummary[];
  processSteps: PublishedProcessStep[];
  beforeAfterItems: PublishedBeforeAfterItem[];
  testimonials: Array<{
    id: string;
    text: string;
    client: string;
    type: string;
    location: string;
    rating: number;
  }>;
  faqs: PublishedFaq[];
  ctaBlock: PublishedCtaBlock | null;
};

const pickLocalizedValue = <T = unknown>(row: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback: T): T => {
  const value = row?.[`${field}_${language}`];
  return value === null || value === undefined || value === "" ? fallback : (value as T);
};

const pickLocalizedText = (row: UnknownRecord | null | undefined, field: string, language: "en" | "zh", fallback = ""): string =>
  toText(pickLocalizedValue(row, field, language, fallback));

const pickLocalizedList = <T = unknown>(row: UnknownRecord | null | undefined, field: string, language: Language): T[] => {
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

const firstList = <T = unknown>(...values: unknown[]): T[] => {
  for (const value of values) {
    const list = toArray<T>(value);
    if (list.length) return list;
  }
  return [];
};

const mapPublishedCmsPage = (
  cmsRow: UnknownRecord,
  language: Language,
  legacy: PublishedSitePage | null = null,
): PublishedSitePage => {
  const sections = readRecordArray(cmsRow.cms_sections)
    .filter((section) => section.status === "published" && !section.deleted_at)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const pickContent = (section: UnknownRecord | undefined) => pickLocalizedObject(section, "content", language);
  const typeMatches = (section: UnknownRecord, types: string[]) => types.includes(normalizeCmsSectionType(String(section.section_type || "")));
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
  const heroSettings = toRecord(hero?.settings);
  const ctaSettings = toRecord(cta?.settings);
  const publishedSections: PublishedCmsSection[] = sections.map((section) => ({
    id: readText(section, "id"),
    section_key: readText(section, "section_key"),
    section_type: readText(section, "section_type"),
    title: pickLocalizedText(section, "title", language),
    content: pickContent(section),
    settings: toRecord(section.settings),
    sort_order: Number(section.sort_order || 0),
  }));

  return {
    id: readText(cmsRow, "id"),
    page_key: readText(cmsRow, "page_key"),
    path: readText(cmsRow, "path", legacy?.path || ""),
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

const mapLegacySitePage = (row: UnknownRecord, language: Language): PublishedSitePage => ({
  id: readText(row, "id"),
  page_key: readText(row, "page_key"),
  path: readText(row, "path"),
  title: pickLocalizedText(row, "title", language),
  subtitle: pickLocalizedText(row, "subtitle", language),
  description: pickLocalizedText(row, "description", language),
  content: pickLocalizedText(row, "content", language),
  cta_title: pickLocalizedText(row, "cta_title", language),
  cta_description: pickLocalizedText(row, "cta_description", language),
  image_url: readText(row, "image_url") || null,
  alt: pickLocalizedText(row, "alt", language),
  seo_title: pickLocalizedText(row, "seo_title", language),
  seo_description: pickLocalizedText(row, "seo_description", language),
  seo_keywords: pickLocalizedText(row, "seo_keywords", language),
  items: pickLocalizedList(row, "items", language),
});

const mapSitePageRows = (payload: UnknownRecord, language: "en" | "zh") => {
  const legacyRow = readRecordArray(payload.site_pages)[0];
  const legacy = legacyRow ? mapLegacySitePage(legacyRow, language) : null;
  const cmsRow = readRecordArray(payload.cms_pages)[0];
  return cmsRow ? mapPublishedCmsPage(cmsRow, language, legacy) : legacy;
};

const mapPublishedHomeSectionRow = (row: UnknownRecord, language: Language): PublishedHomeSection => ({
  id: readText(row, "id"),
  section_key: readText(row, "section_key"),
  title: pickLocalizedText(row, "title", language),
  subtitle: pickLocalizedText(row, "subtitle", language),
  content: pickLocalizedText(row, "content", language),
  image_url: readText(row, "image_url") || null,
  items: pickLocalizedList(row, "items", language),
});

const mapPublishedBeforeAfterItem = (item: UnknownRecord, language: Language): PublishedBeforeAfterItem => ({
  id: readText(item, "id"),
  title: pickLocalizedText(item, "title", language),
  location: readText(item, "location"),
  description: pickLocalizedText(item, "description", language),
  before_image_url: readText(item, "before_image_url"),
  after_image_url: readText(item, "after_image_url"),
  alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
});

const mapPublishedFaq = (item: UnknownRecord, language: Language): PublishedFaq => ({
  id: readText(item, "id"),
  category: readText(item, "page_key", "general"),
  question: pickLocalizedText(item, "question", language),
  answer: pickLocalizedText(item, "answer", language),
});

const mapPublishedProcessStep = (row: UnknownRecord, language: Language): PublishedProcessStep => ({
  id: readText(row, "id"),
  step_number: Number(row.step_number || 0),
  sort_order: Number(row.sort_order ?? row.step_number ?? 0),
  title: pickLocalizedText(row, "title", language),
  description: pickLocalizedText(row, "description", language),
  icon_key: readText(row, "icon_key") || null,
});

const mapPublishedCtaBlockRow = (row: UnknownRecord, language: Language): PublishedCtaBlock => ({
  id: readText(row, "id"),
  block_key: readText(row, "block_key"),
  title: pickLocalizedText(row, "title", language),
  description: pickLocalizedText(row, "description", language),
  primary_label: pickLocalizedText(row, "primary_label", language),
  primary_url: readText(row, "primary_url", "/quote"),
  secondary_label: pickLocalizedText(row, "secondary_label", language),
  secondary_url: readText(row, "secondary_url"),
  image_url: readText(row, "image_url") || null,
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
  const homeSections = readRecordArray(payload.home_sections).map((row) => mapPublishedHomeSectionRow(row, language));
  const findHomeSection = (sectionKey: string) => homeSections.find((section) => section.section_key === sectionKey) || null;
  const ctaBlocks = readRecordArray(payload.cta_blocks);

  return {
    pageContent: mapSitePageRows(payload, language),
    heroSlides: readRecordArray(payload.hero_slides).map((item) => mapPublishedHeroSlide(item, language)),
    statsSection: findHomeSection("stats"),
    whyChooseUsSection: findHomeSection("why_choose_us"),
    projects: readRecordArray(payload.projects).map((item) => mapPublishedProjectSummary(item, language)),
    brandPartners: toArray<PublishedBrandPartner>(payload.brand_partners).filter((item) => item.logo_url && item.name),
    services: readRecordArray(payload.services).map((item) => mapPublishedService(item, language)),
    processSteps: readRecordArray(payload.process_steps).map((row) => mapPublishedProcessStep(row, language)),
    beforeAfterItems: readRecordArray(payload.before_after_items)
      .filter((item): item is typeof item & { before_image_url: string; after_image_url: string } =>
        Boolean(item.before_image_url && item.after_image_url)
      )
      .map((item) => mapPublishedBeforeAfterItem(item, language)),
    testimonials: readRecordArray(payload.testimonials).map((item) => mapPublishedTestimonial(item, language)),
    faqs: readRecordArray(payload.faqs).map((item) => mapPublishedFaq(item, language)),
    ctaBlock: ctaBlocks[0]
      ? mapPublishedCtaBlockRow(ctaBlocks[0], language)
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
  const row = toRecord(await fetchPublishedHomeSectionRow(sectionKey));
  if (!Object.keys(row).length) return null;
  if (!row) return null;
  return mapPublishedHomeSectionRow(row, language);
};

export const getPublishedProcessSteps = async (language: "en" | "zh"): Promise<PublishedProcessStep[]> => {
  if (!hasPublicContentDatabaseClient()) return [];
  const data = await fetchPublishedProcessStepRows();
  return ((data || []) as unknown as UnknownRecord[]).map((row) => mapPublishedProcessStep(row, language));
};

export const getPublishedCtaBlock = async (language: "en" | "zh", blockKey: string): Promise<PublishedCtaBlock | null> => {
  const preloadedBlock = readPreloadedPublicData()?.ctaBlocks?.[blockKey];
  if (preloadedBlock) {
    return mapPublishedCtaBlockRow(preloadedBlock, language);
  }

  if (!hasPublicContentDatabaseClient()) return null;
  const row = toRecord(await fetchPublishedCtaBlockRow(blockKey));
  if (!Object.keys(row).length) return null;
  return mapPublishedCtaBlockRow(row, language);
};

export const getPublishedAboutSection = async (
  language: "en" | "zh",
  sectionKey: string,
): Promise<PublishedAboutSection | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const row = toRecord(await fetchPublishedAboutSectionRow(sectionKey));
  if (!Object.keys(row).length) return null;
  return {
    id: readText(row, "id"),
    section_key: readText(row, "section_key"),
    title: pickLocalizedText(row, "title", language),
    subtitle: pickLocalizedText(row, "subtitle", language),
    content: pickLocalizedText(row, "content", language),
    image_url: readText(row, "image_url") || null,
    items: pickLocalizedList(row, "items", language),
  };
};

export const getPublishedSitePage = async (
  language: "en" | "zh",
  pageKey: string,
): Promise<PublishedSitePage | null> => {
  const preloadedPageBundle = toRecord(readPreloadedPublicData()?.sitePages?.[pageKey]);
  if (Object.keys(preloadedPageBundle).length) {
    return mapSitePageRows(preloadedPageBundle, language);
  }

  if (!hasPublicContentDatabaseClient()) return null;
  const row = toRecord(await fetchPublishedLegacySitePageRow(pageKey));
  const legacy: PublishedSitePage | null = Object.keys(row).length
    ? {
        id: readText(row, "id"),
        page_key: readText(row, "page_key"),
        path: readText(row, "path"),
        title: pickLocalizedText(row, "title", language),
        subtitle: pickLocalizedText(row, "subtitle", language),
        description: pickLocalizedText(row, "description", language),
        content: pickLocalizedText(row, "content", language),
        cta_title: pickLocalizedText(row, "cta_title", language),
        cta_description: pickLocalizedText(row, "cta_description", language),
        image_url: readText(row, "image_url") || null,
        alt: pickLocalizedText(row, "alt", language),
        seo_title: pickLocalizedText(row, "seo_title", language),
        seo_description: pickLocalizedText(row, "seo_description", language),
        seo_keywords: pickLocalizedText(row, "seo_keywords", language),
        items: pickLocalizedList(row, "items", language),
    }
    : null;

  const cmsRow = toRecord(await fetchPublishedCmsPageByPageKey(pageKey));
  if (!Object.keys(cmsRow).length) return legacy;

  return mapPublishedCmsPage(cmsRow, language, legacy);
};

export const getPublishedCmsPageByPath = async (
  language: "en" | "zh",
  path: string,
): Promise<PublishedSitePage | null> => {
  if (!hasPublicContentDatabaseClient()) return null;
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "").replace(/\/+$/, "")}`;
  const cmsRow = toRecord(await fetchPublishedCmsPageByPath(normalizedPath));
  return Object.keys(cmsRow).length ? mapPublishedCmsPage(cmsRow, language) : null;
};
