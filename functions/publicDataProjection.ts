import { estimateBlogReadMinutes } from "../src/lib/blogMeta";

export type PublicProjectionRecord = Record<string, unknown>;

const LANGUAGES = ["en", "zh"] as const;

const withLocalizedFields = (fields: readonly string[]) =>
  fields.flatMap((field) => LANGUAGES.map((language) => `${field}_${language}`));

const hasOwn = (record: PublicProjectionRecord, field: string) =>
  Object.prototype.hasOwnProperty.call(record, field);

const hasContent = (value: unknown) =>
  typeof value === "string" ? Boolean(value.trim()) : value !== null && value !== undefined;

const pickFields = (record: PublicProjectionRecord, fields: readonly string[]) => {
  const projected: PublicProjectionRecord = {};
  for (const field of fields) {
    if (hasOwn(record, field)) projected[field] = record[field];
  }
  return projected;
};

const toRows = (value: unknown): PublicProjectionRecord[] =>
  Array.isArray(value)
    ? value.filter((row): row is PublicProjectionRecord => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    : [];

const withDescriptionFallback = (source: PublicProjectionRecord, projected: PublicProjectionRecord) => {
  for (const language of LANGUAGES) {
    const excerptField = `excerpt_${language}`;
    const contentField = `content_${language}`;
    if (!hasContent(source[excerptField]) && hasOwn(source, contentField)) {
      projected[contentField] = source[contentField];
    }
  }
  return projected;
};

const PROJECT_SUMMARY_FIELDS = [
  "id",
  "slug",
  "project_type",
  "location",
  "image_url",
  ...withLocalizedFields(["title", "excerpt"]),
] as const;

const PROJECT_IMAGE_FIELDS = [
  "image_url",
  "image_type",
  "sort_order",
  ...withLocalizedFields(["alt"]),
] as const;

const projectPrimaryProjectImage = (value: unknown) => {
  const rows = toRows(value).slice().sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  const ordered = [
    ...rows.filter((row) => row.image_type === "cover"),
    ...rows.filter((row) => row.image_type === "gallery"),
    ...rows.filter((row) => row.image_type === "before" || row.image_type === "after"),
  ];
  return ordered[0] ? [pickFields(ordered[0], PROJECT_IMAGE_FIELDS)] : [];
};

const projectProjectSummary = (row: PublicProjectionRecord) => {
  const projected = withDescriptionFallback(row, pickFields(row, PROJECT_SUMMARY_FIELDS));
  const primaryImage = projectPrimaryProjectImage(row.project_images);
  if (primaryImage.length) projected.project_images = primaryImage;
  return projected;
};

export const projectProjectSummariesForPreload = (rows: PublicProjectionRecord[]) =>
  rows.map(projectProjectSummary);

const SERVICE_SUMMARY_FIELDS = [
  "id",
  "slug",
  "image_url",
  ...withLocalizedFields(["title", "excerpt"]),
] as const;

const projectServiceSummary = (row: PublicProjectionRecord) =>
  withDescriptionFallback(row, pickFields(row, SERVICE_SUMMARY_FIELDS));

export const projectServiceSummariesForPreload = (rows: PublicProjectionRecord[]) =>
  rows.map(projectServiceSummary);

const MATERIAL_LIST_FIELDS = [
  "id",
  "slug",
  "category",
  "subcategory",
  "material_type",
  "color",
  "texture",
  "image_url",
  "price_mode",
  "price_min",
  "price_max",
  "price_currency",
  "price_unit",
  "reference_price",
  ...withLocalizedFields(["title", "excerpt", "alt"]),
] as const;

const MATERIAL_DETAIL_FIELDS = [
  ...MATERIAL_LIST_FIELDS,
  ...withLocalizedFields([
    "content",
    "suitable_spaces",
    "recommended_pairing",
    "pros",
    "cons",
    "note",
    "price_scope",
    "price_note",
    "seo_title",
    "seo_description",
  ]),
] as const;

const MATERIAL_IMAGE_FIELDS = [
  "id",
  "image_url",
  "image_type",
  "sort_order",
  "is_active",
  ...withLocalizedFields(["alt"]),
] as const;

const projectMaterialListRow = (row: PublicProjectionRecord) =>
  withDescriptionFallback(row, pickFields(row, MATERIAL_LIST_FIELDS));

const projectMaterialDetailRow = (row: PublicProjectionRecord) => {
  const projected = pickFields(row, MATERIAL_DETAIL_FIELDS);
  const images = toRows(row.material_images).map((image) => pickFields(image, MATERIAL_IMAGE_FIELDS));
  if (images.length) projected.material_images = images;
  return projected;
};

export const projectMaterialsForPreload = (rows: PublicProjectionRecord[], detailSlug?: string | null) =>
  rows.map((row) => String(row.slug || "") === detailSlug ? projectMaterialDetailRow(row) : projectMaterialListRow(row));

const SERVICE_AREA_SUMMARY_FIELDS = [
  "id",
  "slug",
  "area_name",
  "property_types",
  ...withLocalizedFields(["title", "excerpt", "seo_description"]),
] as const;

export const projectServiceAreaSummariesForPreload = (rows: PublicProjectionRecord[]) =>
  rows.map((row) => pickFields(row, SERVICE_AREA_SUMMARY_FIELDS));

const BLOG_SUMMARY_FIELDS = [
  "id",
  "slug",
  "category",
  "published_at",
  "created_at",
  "updated_at",
  "cover_image_url",
  "tags",
  ...withLocalizedFields(["title", "excerpt", "alt", "seo_title", "seo_description"]),
] as const;

export const projectBlogPostSummariesForPreload = (rows: PublicProjectionRecord[]) =>
  rows.map((row) => ({
    ...pickFields(row, BLOG_SUMMARY_FIELDS),
    preload_read_minutes_en: estimateBlogReadMinutes(String(row.content_en || ""), "en"),
    preload_read_minutes_zh: estimateBlogReadMinutes(String(row.content_zh || ""), "zh"),
  }));

const SITE_PAGE_FIELDS = [
  "id",
  "page_key",
  "path",
  "image_url",
  ...withLocalizedFields([
    "title",
    "subtitle",
    "description",
    "content",
    "cta_title",
    "cta_description",
    "alt",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "items",
  ]),
] as const;

const HOME_SITE_PAGE_FIELDS = [
  "id",
  "page_key",
  "path",
  "image_url",
  ...withLocalizedFields(["title", "description", "alt", "seo_title", "seo_description", "seo_keywords"]),
] as const;

const CMS_SECTION_FIELDS = [
  "id",
  "section_key",
  "section_type",
  "status",
  "deleted_at",
  "sort_order",
  "settings",
  ...withLocalizedFields(["title", "content"]),
] as const;

const CMS_PAGE_FIELDS = [
  "id",
  "page_key",
  "path",
  ...withLocalizedFields(["title", "seo_title", "seo_description", "seo_keywords"]),
] as const;

const projectCmsPage = (row: PublicProjectionRecord) => {
  const projected = pickFields(row, CMS_PAGE_FIELDS);
  const sections = toRows(row.cms_sections).map((section) => pickFields(section, CMS_SECTION_FIELDS));
  if (sections.length) projected.cms_sections = sections;
  return projected;
};

export const projectSitePageBundleForPreload = (bundle: PublicProjectionRecord) => {
  const projected: PublicProjectionRecord = {};
  const legacyRows = toRows(bundle.site_pages);
  const cmsRows = toRows(bundle.cms_pages);
  if (legacyRows.length) projected.site_pages = legacyRows.map((row) => pickFields(row, SITE_PAGE_FIELDS));
  if (cmsRows.length) projected.cms_pages = cmsRows.map(projectCmsPage);
  return projected;
};

const HOME_SECTION_FIELDS = [
  "id",
  "section_key",
  "image_url",
  "status",
  ...withLocalizedFields(["title", "subtitle", "content", "items"]),
] as const;

const HERO_SLIDE_FIELDS = [
  "id",
  "button_url",
  "image_url",
  ...withLocalizedFields(["title", "excerpt", "button_label", "alt"]),
] as const;

const PROCESS_STEP_FIELDS = [
  "id",
  "step_number",
  "sort_order",
  "icon_key",
  ...withLocalizedFields(["title", "description"]),
] as const;

const BEFORE_AFTER_FIELDS = [
  "id",
  "location",
  "before_image_url",
  "after_image_url",
  ...withLocalizedFields(["title", "description", "alt"]),
] as const;

const TESTIMONIAL_FIELDS = [
  "id",
  "customer_name",
  "rating",
  ...withLocalizedFields(["content"]),
] as const;

const FAQ_FIELDS = [
  "id",
  "page_key",
  ...withLocalizedFields(["question", "answer"]),
] as const;

const BRAND_PARTNER_FIELDS = ["id", "name", "logo_url", "website_url"] as const;

const CTA_BLOCK_FIELDS = [
  "id",
  "block_key",
  "primary_url",
  "secondary_url",
  "image_url",
  ...withLocalizedFields(["title", "description", "primary_label", "secondary_label"]),
] as const;

export const projectCtaBlockForPreload = (row: PublicProjectionRecord) =>
  pickFields(row, CTA_BLOCK_FIELDS);

export const projectHomeContentBundleForPreload = (bundle: PublicProjectionRecord) => {
  const projected: PublicProjectionRecord = {};
  const projectTable = (
    field: string,
    projector: (row: PublicProjectionRecord) => PublicProjectionRecord,
  ) => {
    const rows = toRows(bundle[field]);
    if (rows.length || Array.isArray(bundle[field])) projected[field] = rows.map(projector);
  };

  projectTable("faqs", (row) => pickFields(row, FAQ_FIELDS));
  projectTable("projects", projectProjectSummary);
  projectTable("services", projectServiceSummary);
  projectTable("cms_pages", projectCmsPage);
  projectTable("cta_blocks", projectCtaBlockForPreload);
  projectTable("site_pages", (row) => pickFields(row, HOME_SITE_PAGE_FIELDS));
  projectTable("hero_slides", (row) => pickFields(row, HERO_SLIDE_FIELDS));
  projectTable("testimonials", (row) => pickFields(row, TESTIMONIAL_FIELDS));
  projectTable("home_sections", (row) => pickFields(row, HOME_SECTION_FIELDS));
  projectTable("process_steps", (row) => pickFields(row, PROCESS_STEP_FIELDS));
  projectTable("brand_partners", (row) => pickFields(row, BRAND_PARTNER_FIELDS));
  projectTable("before_after_items", (row) => pickFields(row, BEFORE_AFTER_FIELDS));

  return projected;
};
