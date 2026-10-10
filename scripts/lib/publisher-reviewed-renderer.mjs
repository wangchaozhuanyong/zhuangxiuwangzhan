// Offline expectation derivation only. Execute the actual product mapper/sanitizer;
// never inject this fixture into a live page or load a production credential here.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let bundlePromise;
export async function reviewedRendererBundle() {
  if (!bundlePromise) bundlePromise = (async () => {
    const [{ build }, { default: ts }] = await Promise.all([import("esbuild"), import("typescript")]);
    const file = "src/pages/BlogDetail.tsx"; const source = readFileSync(resolve(root, file), "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declarations = ast.statements.filter((node) => ts.isVariableStatement(node)
      && node.declarationList.declarations.some((declaration) => declaration.name.getText(ast) === "splitSanitizedHtmlSections"));
    if (declarations.length !== 1) throw Error("Exact existing BlogDetail section splitter unavailable");
    const splitter = ts.transpileModule(declarations[0].getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const result = await build({ stdin: { contents: `
      import { mapPublishedBlogPost } from ${JSON.stringify(resolve(root, "src/lib/contentApi.ts"))};
      import { sanitizeHtml } from ${JSON.stringify(resolve(root, "src/lib/sanitizeHtml.ts"))};
      import { sanitizeServiceOverviewHtml } from ${JSON.stringify(resolve(root, "src/lib/serviceOverviewHtml.ts"))};
      import { isHtmlText } from ${JSON.stringify(resolve(root, "src/lib/text.ts"))};
      ${splitter}
      window.__managedReviewedRenderer = (row, language, table) => {
        const content = table === "blog_posts" ? mapPublishedBlogPost(row, language).content : row["content_" + language];
        if (!isHtmlText(content)) throw Error("This exact reviewed publisher scope requires native HTML body");
        const sections = table === "blog_posts" ? splitSanitizedHtmlSections(sanitizeHtml(content)) : [sanitizeServiceOverviewHtml(content, language)];
        return { mappedContent: content, sections };
      };`, resolveDir: root, loader: "ts" }, bundle: true, write: false, platform: "browser", format: "iife",
      alias: { "@": resolve(root, "src") }, define: { "import.meta.env": "{}" }, logLevel: "silent",
      loader: { ".webp": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".png": "dataurl", ".svg": "dataurl" } });
    const files = [file, "src/lib/contentApi.ts", "src/i18n/displayLabels.ts", "src/lib/sanitizeHtml.ts", "src/lib/serviceOverviewHtml.ts", "src/lib/text.ts", "src/lib/recordUtils.ts"];
    return { code: result.outputFiles[0].text, sourceSha256: Object.fromEntries(files.map((path) => [path,
      createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex")])) };
  })();
  return bundlePromise;
}
export async function renderReviewedRow(page, { entry, language, row }) {
  if (!["en", "zh"].includes(language) || !["services", "blog_posts"].includes(entry?.table)
    || row?.id !== entry.recordId || row?.slug !== entry.slug || typeof row[`content_${language}`] !== "string" || !row[`content_${language}`].trim()) {
    throw Error("Exact reviewed native row identity and language body required");
  }
  const bundle = await reviewedRendererBundle();
  await page.setContent("<main><article></article></main>");
  await page.addScriptTag({ content: bundle.code });
  const result = await page.evaluate(({ row, language, table }) => {
    const rendered = window.__managedReviewedRenderer(row, language, table);
    document.querySelector("article").innerHTML = rendered.sections.map((section) => `<div>${section}</div>`).join("");
    return rendered;
  }, { row, language, table: entry.table });
  return { ...result, sourceSha256: bundle.sourceSha256 };
}
