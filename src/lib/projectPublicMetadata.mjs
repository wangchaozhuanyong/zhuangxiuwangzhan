// Bounded source binding: these four published records contain design renderings.
export const conceptMetadataSlugs = Object.freeze([
  "bangsar-walk-in-wardrobe-system", "ampang-landed-exterior-repaint",
  "cyberjaya-tech-office-renovation", "puchong-heavy-duty-warehouse-racking",
]);

const text = (value) => typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
export function projectPublicMetadata(row, language) {
  if (!conceptMetadataSlugs.includes(row.slug)) return undefined;
  const other = language === "zh" ? "en" : "zh";
  const title = text(row[`title_${language}`]) || text(row[`title_${other}`]);
  const excerpt = text(row[`excerpt_${language}`]) || text(row[`excerpt_${other}`]);
  if (!title || !excerpt) return undefined;
  const label = language === "zh" ? "设计效果图" : "Design rendering";
  return {
    title: `${title} | ${label} | FLASH CAST`.slice(0, 180),
    description: `${label}${language === "zh" ? "：" : ": "}${excerpt}`.slice(0, 300),
  };
}
