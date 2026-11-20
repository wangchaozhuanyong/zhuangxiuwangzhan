const excludedPaths = new Set([
  "/en/privacy",
  "/en/terms",
  "/zh/privacy",
  "/zh/terms",
]);

/** @param {string} pathname A localized canonical path. */
export function isExcludedFromPublicSitemap(pathname) {
  return excludedPaths.has(pathname);
}
