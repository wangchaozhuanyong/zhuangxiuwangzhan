import aliasMap from "../data/furnitureProductUrlAliases.json" with { type: "json" };

// Public URLs are separate from supplier and CMS record identities.
const aliasesBySource = new Map(Object.entries(aliasMap));
const sourcesByAlias = new Map([...aliasesBySource].map(([source, alias]) => [alias, source]));

export function decodeFurnitureSlug(slug) {
  if (!slug) return undefined;
  try { return decodeURIComponent(slug); } catch { return undefined; }
}

export function resolveFurnitureSourceSlug(slug) {
  const decoded = decodeFurnitureSlug(slug);
  return sourcesByAlias.get(decoded) ?? decoded;
}

export function furnitureProductPathForSlug(slug, language) {
  const source = resolveFurnitureSourceSlug(slug) ?? slug;
  const publicSlug = language === "ms" ? source : aliasesBySource.get(source) ?? source;
  return `/furniture/product/${encodeURIComponent(publicSlug)}`;
}

/** Only the old canonical English/Chinese product addresses move. */
export function getLegacyFurnitureProductRedirectPath(pathname) {
  const match = pathname.match(/^\/(en|zh)\/furniture\/product\/([^/]+)\/*$/);
  if (!match) return null;
  const alias = aliasesBySource.get(decodeFurnitureSlug(match[2]));
  return alias ? `/${match[1]}/furniture/product/${alias}` : null;
}

export function validateFurnitureProductUrlAliases(catalogSlugs, managedSlugs) {
  const catalog = new Set(catalogSlugs.map(decodeFurnitureSlug));
  const managed = new Set(managedSlugs.map(decodeFurnitureSlug));
  const aliases = new Set();
  for (const [source, alias] of aliasesBySource) {
    if (!catalog.has(source) || /^[-a-z0-9]+$/.test(source) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias)) {
      throw new Error(`Invalid furniture URL binding for ${source}`);
    }
    if (aliases.has(alias) || catalog.has(alias) || managed.has(alias)) {
      throw new Error(`Furniture URL alias already in use: ${alias}`);
    }
    aliases.add(alias);
  }
}
