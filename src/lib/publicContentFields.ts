const localized = (fields: string[]) => fields.flatMap(field => ["en", "zh", "ms"].map(language => `${field}_${language}`));

// Full presentation records, including fallback bodies and detail-on-list error
// recovery. These are deliberately not truncated summary selections.
export const PUBLIC_SERVICE_FIELDS = ["id", "slug", "status", "sort_order", "image_url", ...localized([
  "title", "excerpt", "content", "suitable_for", "common_projects", "process_steps", "scope_items", "faqs", "alt", "seo_title", "seo_description",
])];
export const PUBLIC_BLOG_FIELDS = ["id", "slug", "status", "category", "published_at", "created_at", "updated_at", "cover_image_url", "tags", ...localized([
  "title", "excerpt", "content", "alt", "seo_title", "seo_description",
])];
