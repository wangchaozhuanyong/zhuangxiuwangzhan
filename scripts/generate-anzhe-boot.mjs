// Keep the independently hosted, static showroom on the same public boot and language policies.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import wechatContact from "../src/config/wechatContact.json" with { type: "json" };

const root = fileURLToPath(new URL("../", import.meta.url));
const showroom = path.join(root, "public/anzhe-showroom");
const check = process.argv.includes("--check");
function sync(target, content) {
  if (check) {
    if (!readFileSync(target).equals(Buffer.from(content))) throw Error("Run node scripts/generate-anzhe-boot.mjs to update " + path.relative(root, target));
  } else writeFileSync(target, content);
}
for (const [entry, file] of [["showroomBoot", "showroom-boot.js"], ["showroomUpdates", "showroom-updates.js"]]) {
  const source = `src/${entry}.ts`;
  const output = await build({
    absWorkingDir: root, entryPoints: [source], bundle: true, write: false,
    platform: "browser", target: "es2018", format: "iife", minify: true,
    define: { "import.meta.env.VITE_APP_VERSION": "undefined" }, // The edge stamps the actual document version.
    alias: { "@": path.join(root, "src") },
    loader: { ".html": "text", ".css": "text" },
    banner: { js: `// Generated from ${source} by scripts/generate-anzhe-boot.mjs.` },
  });
  sync(path.join(showroom, file), output.outputFiles[0].text);
}
// Keep the showroom's existing same-origin image URL usable by older documents.
const qrBytes = readFileSync(path.join(root, "public", wechatContact.wechatQrUrl.split("?")[0]));
const qrVersion = createHash("sha256").update(qrBytes).digest("hex").slice(0, 12);
sync(path.join(showroom, "assets/contact-wechat-qr.webp"), qrBytes);
const idText = wechatContact.wechatId.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const lang of ["zh", "en", "ms"]) {
  const html = path.join(showroom, lang, "index.html");
  const current = readFileSync(html, "utf8");
  if (!current.includes("../showroom-boot.js?v=")) throw Error("Missing showroom boot in " + lang);
  const idSlot = /(<span data-contact-wechat(?:="")?>)[^<]*(<\/span>)/g;
  const qrSlot = /src="\.\.\/assets\/contact-wechat-qr\.webp(?:\?v=[a-f0-9]+)?"/g;
  // Both the footer and the floating panel are present in the static document.
  if ([...current.matchAll(idSlot)].length !== 2 || [...current.matchAll(qrSlot)].length !== 2) {
    throw Error("Missing WeChat contact markup in " + lang);
  }
  const withContact = current.replace(idSlot, (_, open, close) => open + idText + close)
    .replace(qrSlot, `src="../assets/contact-wechat-qr.webp?v=${qrVersion}"`);
  const updated = withContact.replace(/((?:src|href)=")((?:\.\.\/|\/)[\w-]+\.(?:js|css))\?v=[a-z0-9]+"/g, (_, attr, url) => {
    const asset = url.startsWith("/") ? path.join(root, "public", url.slice(1)) : path.resolve(path.dirname(html), url);
    const hash = createHash("sha256").update(readFileSync(asset)).digest("hex").slice(0, 12);
    return `${attr}${url}?v=${hash}"`;
  });
  sync(html, updated);
}
