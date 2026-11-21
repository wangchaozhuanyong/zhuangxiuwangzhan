import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markup = readFileSync(path.join(root, "src/components/publicBootTemplate.html"), "utf8").trim();

/** Critical HTML uses the existing CSP hash handling in Pages middleware.
 * Local dev/preview already permits inline scripts. No CSP relaxation is needed. */
export function publicBootHtml() {
  return [{
    name: "flashcast-public-boot",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        const result = await build({ entryPoints: [path.join(root, "src/publicBoot.ts")], bundle: true, write: false, format: "iife", platform: "browser", target: "es2018", minify: true, alias: { "@": path.join(root, "src") } });
        const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
        const css = readFileSync(path.join(root, "src/styles/components/public-boot.css"), "utf8");
        return html.replace("<!-- public-boot-head -->", `<template id="flashcast-public-boot-template">${markup}</template><style data-public-boot-critical>${css}</style><script data-public-boot-init>${script}</script>`).replace("<!-- public-boot-body -->", "");
      },
    },
  }, {
    name: "flashcast-public-style-handoff",
    transformIndexHtml: {
      order: "post",
      handler: (html) => html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) =>
        tag.includes('href="/assets/') ? tag.replace("<link ", '<link media="print" data-public-style ') : tag),
    },
  }];
}
