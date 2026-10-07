/** Shared, pure read contract for homepage cards in Edge HTML and browser reads. */
export const HOME_JOURNAL_LIMIT = 3;
export const HOME_SERVICE_AREAS_LIMIT = 8;

export const HOME_JOURNAL_ORDER = { column: "published_at", ascending: false } as const;
export const HOME_SERVICE_AREAS_ORDER = { column: "sort_order", ascending: true } as const;

const HOME_JOURNAL_FIELDS = [
  "id", "slug", "title_en", "title_zh", "excerpt_en", "excerpt_zh",
  "alt_en", "alt_zh", "cover_image_url", "category",
] as const;
const HOME_SERVICE_AREAS_FIELDS = ["slug", "area_name", "title_en", "title_zh"] as const;

export const HOME_JOURNAL_SELECT = HOME_JOURNAL_FIELDS.join(",");
export const HOME_SERVICE_AREAS_SELECT = HOME_SERVICE_AREAS_FIELDS.join(",");

type HomeDiscoveryRow = Record<string, unknown>;

const projectRows = (rows: readonly HomeDiscoveryRow[], fields: readonly string[], limit: number): HomeDiscoveryRow[] =>
  rows.slice(0, limit).map((row) => Object.fromEntries(
    fields.filter((field) => Object.prototype.hasOwnProperty.call(row, field)).map((field) => [field, row[field]]),
  ));

export const projectHomeJournalPosts = (rows: readonly HomeDiscoveryRow[]) =>
  projectRows(rows, HOME_JOURNAL_FIELDS, HOME_JOURNAL_LIMIT);

export const projectHomeServiceAreas = (rows: readonly HomeDiscoveryRow[]) =>
  projectRows(rows, HOME_SERVICE_AREAS_FIELDS, HOME_SERVICE_AREAS_LIMIT);
