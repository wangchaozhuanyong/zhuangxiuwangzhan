import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

/** Follow only static ESM imports/re-exports; lazy routes are a separate budget.
 * Counting HTML modulepreload tags alone misses required nested dependencies.
 */
export function collectInitialJavaScriptAssets(distDir, entryRefs) {
  const assets = new Set();
  const origin = "https://flashcast-build.invalid";
  const root = path.resolve(distDir);

  const visit = (ref) => {
    if (assets.has(ref)) return;
    const filePath = path.resolve(root, `.${ref}`);
    const relative = path.relative(root, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Initial module escapes the build directory: ${ref}`);
    }
    let source;
    try {
      source = readFileSync(filePath, "utf8");
    } catch {
      throw new Error(`Referenced initial module is missing: ${ref}`);
    }
    assets.add(ref);
    const module = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
    for (const statement of module.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteralLike(specifier)) continue;
      const dependency = new URL(specifier.text, `${origin}${ref}`);
      if (dependency.origin !== origin) {
        throw new Error(`Initial module has an unmeasured external dependency: ${specifier.text}`);
      }
      visit(dependency.pathname);
    }
  };

  for (const ref of entryRefs) visit(ref);
  return [...assets];
}

/** Read real HTML tags; inline scripts may contain route-only href strings. */
export function collectHtmlAssetReferences(html) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, "$1</script>")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  const refs = [];
  for (const [tag] of markup.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    for (const [, ref] of tag.matchAll(/\s(?:src|href)\s*=\s*["'](\/assets\/[^"']+)["']/gi)) refs.push(ref);
  }
  return refs;
}
