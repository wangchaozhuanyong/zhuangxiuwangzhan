import fs from "node:fs";

/**
 * When a .jpg/.jpeg/.png is imported and a sibling .webp exists, bundle the WebP instead.
 * Keeps source imports unchanged while shrinking production assets.
 */
export function preferWebpAssets() {
  return {
    name: "prefer-webp-assets",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || !/\.(png|jpe?g)$/i.test(source)) return null;

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) return null;

      const id = typeof resolved === "string" ? resolved : resolved.id;
      const webpPath = id.replace(/\.(png|jpe?g)$/i, ".webp");
      if (fs.existsSync(webpPath)) return webpPath;

      return null;
    },
  };
}
