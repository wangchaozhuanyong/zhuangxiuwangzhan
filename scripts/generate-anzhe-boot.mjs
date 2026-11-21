// Keep the independently hosted, static showroom on the same public boot and language policies.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const showroom = path.join(root, "public/anzhe-showroom");
const check = process.argv.includes("--check");
const output = await build({
  absWorkingDir: root, entryPoints: ["src/showroomBoot.ts"], bundle: true, write: false,
  platform: "browser", target: "es2018", format: "iife", minify: true,
  define: { "import.meta.env.VITE_APP_VERSION": "undefined" }, // The edge stamps the showroom's actual document version.
  alias: { "@": path.join(root, "src") },
  loader: { ".html": "text", ".css": "text" },
  banner: { js: "// Generated from src/showroomBoot.ts by scripts/generate-anzhe-boot.mjs." },
});
const script = output.outputFiles[0].text;
const file = path.join(showroom, "showroom-boot.js");
function sync(target, content) {
  if (check) {
    if (readFileSync(target, "utf8") !== content) throw Error("Run node scripts/generate-anzhe-boot.mjs to update " + path.relative(root, target));
  } else writeFileSync(target, content);
}
sync(file, script);
for (const lang of ["zh", "en", "ms"]) {
  const html = path.join(showroom, lang, "index.html");
  const current = readFileSync(html, "utf8");
  if (!current.includes("../showroom-boot.js?v=")) throw Error("Missing showroom boot in " + lang);
  const updated = current.replace(/((?:src|href)=")((?:\.\.\/|\/)[\w-]+\.(?:js|css))\?v=[a-z0-9]+"/g, (_, attr, url) => {
    const asset = url.startsWith("/") ? path.join(root, "public", url.slice(1)) : path.resolve(path.dirname(html), url);
    const hash = createHash("sha256").update(readFileSync(asset)).digest("hex").slice(0, 12);
    return `${attr}${url}?v=${hash}"`;
  });
  sync(html, updated);
}
