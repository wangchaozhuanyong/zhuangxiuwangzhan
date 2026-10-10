// Derive exact expectations from existing product code. Never inject into live pages.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let bundlePromise;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (value, message) => { if (!value) throw Error(message); };
export async function reviewedMetadataBundle() {
  if (!bundlePromise) bundlePromise = (async () => {
    const [{ build }, { default: ts }] = await Promise.all([import("esbuild"), import("typescript")]);
    const parse = (file) => ts.createSourceFile(file, readFileSync(resolve(root, file), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const edge = parse("functions/_middleware.ts"), client = parse("src/components/PageMeta.tsx");
    const nameOf = (statement) => ts.isVariableStatement(statement) ? statement.declarationList.declarations.map((item) => item.name.getText(edge))
      : ts.isFunctionDeclaration(statement) && statement.name ? [statement.name.text] : [];
    const top = new Map(edge.statements.flatMap((statement) => nameOf(statement).map((name) => [name, statement])));
    const selected = new Set();
    const add = (name) => {
      assert(top.has(name), "Existing Edge metadata declaration unavailable");
      const statement = top.get(name); if (selected.has(statement)) return; selected.add(statement);
      const visit = (node) => { if (ts.isIdentifier(node) && top.has(node.text)) add(node.text); ts.forEachChild(node, visit); };
      ts.forEachChild(statement, visit);
    };
    add("buildDynamicSeoEntry"); add("sanitizePublicDraftMarkers");
    const variable = (ast, name) => {
      const matches = ast.statements.filter((statement) => ts.isVariableStatement(statement)
        && statement.declarationList.declarations.some((item) => item.name.getText(ast) === name));
      assert(matches.length === 1, "Existing metadata function unavailable"); return matches[0].declarationList.declarations.find((item) => item.name.getText(ast) === name).initializer;
    };
    const inject = variable(edge, "injectSeo");
    const safe = inject.body.statements.filter((statement) => ts.isVariableStatement(statement)
      && statement.declarationList.declarations.some((item) => item.name.getText(edge) === "safeMeta"));
    assert(safe.length === 1, "Existing Edge shared-brand precedence unavailable");
    const page = variable(client, "PageMeta");
    const names = ["brandName", "companyName", "baseTitle", "path", "metadata"];
    const declarations = names.map((name) => {
      const matches = page.body.statements.filter((statement) => ts.isVariableStatement(statement)
        && statement.declarationList.declarations.some((item) => item.name.getText(client) === name));
      assert(matches.length === 1, "Existing PageMeta identity precedence unavailable"); return matches[0].getText(client);
    });
    const code = `
      import { readString, readRecordArray } from ${JSON.stringify(resolve(root, "functions/publicDataValues.ts"))};
      import { resolveReviewedBlogCover, resolveReviewedImageSource, resolveReviewedMaterialImage, wardrobeCover } from ${JSON.stringify(resolve(root, "src/lib/reviewedContentMedia.mjs"))};
      import { projectPublicMetadata } from ${JSON.stringify(resolve(root, "src/lib/projectPublicMetadata.mjs"))};
      import { translateDisplayText } from ${JSON.stringify(resolve(root, "src/i18n/displayLabels.ts"))};
      import { stripHtml } from ${JSON.stringify(resolve(root, "src/lib/text.ts"))};
      import { withChineseBrandMetadata } from ${JSON.stringify(resolve(root, "src/i18n/brandIdentity.ts"))};
      import { stripLanguagePrefix } from ${JSON.stringify(resolve(root, "src/i18n/routes.ts"))};
      import { siteConfig } from ${JSON.stringify(resolve(root, "src/config/site.ts"))};
      import { resolveSiteSettings } from ${JSON.stringify(resolve(root, "src/lib/siteSettingsApi.ts"))};
      import { mapPublishedBlogPost, mapPublishedService } from ${JSON.stringify(resolve(root, "src/lib/contentApi.ts"))};
      import { oldHouseRenovationPageText } from ${JSON.stringify(resolve(root, "src/i18n/oldHouseRenovationPageText.ts"))};
      ${edge.statements.filter((statement) => selected.has(statement)).map((statement) => statement.getText(edge)).join("\n")}
      export const deriveMetadata = (row, language, canonicalPath, siteSettings, table) => {
        const meta = buildDynamicSeoEntry(canonicalPath, row, table === "blog_posts" ? "blog" : "service");
        ${safe[0].getText(edge)}
        const settings = resolveSiteSettings(siteSettings, language);
        const mapped = table === "blog_posts" ? mapPublishedBlogPost(row, language) : mapPublishedService(row, language);
        const props = table === "services" && row.slug === "old-house"
          ? { title: oldHouseRenovationPageText[language].metaTitle, description: oldHouseRenovationPageText[language].metaDescription }
          : table === "blog_posts"
          ? { title: translateDisplayText(mapped.seoTitle, language), description: translateDisplayText(mapped.seoDescription, language) }
          : row.slug === "design"
            ? { title: stripHtml(mapped.seoTitle), description: stripHtml(mapped.seoDescription) }
            : { title: mapped.seoTitle, description: mapped.seoDescription };
        const { title, description } = props, noIndex = false;
        ${declarations.join("\n")}
        return { raw: { title: safeMeta.title, description: safeMeta.description }, hydrated: metadata, mappedPageMetaProps: props };
      };`;
    const transpiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const result = await build({ stdin: { contents: transpiled, resolveDir: root, loader: "js" }, bundle: true, write: false,
      platform: "browser", format: "esm", metafile: true, alias: { "@": resolve(root, "src") }, define: { "import.meta.env": "{}" }, logLevel: "silent",
      loader: { ".webp": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".png": "dataurl", ".svg": "dataurl" } });
    const files = new Set(["functions/_middleware.ts", "src/components/PageMeta.tsx", "src/pages/BlogDetail.tsx", "src/pages/ServiceDetail.tsx",
      "src/pages/OldHouseRenovation.tsx", "src/routes/publicRoutes.tsx",
      "src/components/services/DesignServiceContent.tsx", "src/hooks/useSiteSettings.ts", "src/backend/modules/settings/repository/siteSettingsRepository.ts", ...Object.keys(result.metafile.inputs)
      .map((path) => resolve(root, path)).filter((path) => path.startsWith(`${root}/src/`) || path.startsWith(`${root}/functions/`))
      .map((path) => path.slice(root.length + 1))]);
    const sourceSha256 = Object.fromEntries([...files].sort().map((file) => [file, hash(readFileSync(resolve(root, file)))]));
    const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
    return { derive: module.deriveMetadata, sourceSha256 };
  })();
  return bundlePromise;
}
export async function deriveReviewedPublicMetadata({ entry, row, language, path, identity }) {
  assert(["en", "zh"].includes(language) && ["services", "blog_posts"].includes(entry?.table)
    && row?.id === entry.recordId && row?.slug === entry.slug && path === `/${language}/${entry.table === "blog_posts" ? "blog" : "services"}/${entry.slug}`
    && identity?.id === "default" && ["company_name", "brand_name"].every((key) => identity[key] === null || typeof identity[key] === "string")
    && typeof identity.updated_at === "string" && ["seo_title", "seo_description"].every((key) => typeof row[`${key}_${language}`] === "string" && row[`${key}_${language}`].trim()),
  "Exact reviewed row, route, language and current public identity required");
  const bundle = await reviewedMetadataBundle();
  return { ...bundle.derive(row, language, path, identity, entry.table), sourceSha256: bundle.sourceSha256 };
}
export async function readReviewedPublicIdentity(environment, expected) {
  assert(environment.VITE_SUPABASE_URL === "https://rbsnyexjifounogswrjp.supabase.co" && environment.VITE_SUPABASE_ANON_KEY,
    "Only the existing public project identity may be read");
  const url = new URL("/rest/v1/site_settings", environment.VITE_SUPABASE_URL);
  url.searchParams.set("select", "id,company_name,brand_name,updated_at"); url.searchParams.set("id", "eq.default"); url.searchParams.set("limit", "1");
  const response = await fetch(url, { method: "GET", cache: "no-store", headers: { apikey: environment.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${environment.VITE_SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(20000) });
  assert(response.ok, "Current public identity readonly GET failed"); const rows = await response.json();
  assert(Array.isArray(rows) && rows.length === 1 && rows[0].id === "default", "Exact current public identity unavailable");
  assert(["id", "company_name", "brand_name", "updated_at"].every((key) => rows[0][key] === expected?.[key]), "Current public identity changed; review exact metadata before any preview or write");
  return rows[0];
}
