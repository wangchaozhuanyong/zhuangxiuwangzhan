import path from "node:path";
import ts from "typescript";

const moduleInfo = (file) => {
  const match = file.match(/^src\/backend\/modules\/([^/]+)(?:\/([^/]+))?/);
  return match ? { module: match[1], layer: match[2] } : null;
};

const frontendAdapters = new Set([
  "@/lib/adminMutation", "@/lib/adminInvalidate", "@/lib/publicSyncRecovery",
  "@/lib/adminQueryCore", "@/lib/userFacingText",
]);
const frontendAdapterTargets = new Set([...frontendAdapters].map((specifier) => `src/${specifier.slice(2)}`));

const resolveImport = (file, specifier, sources) => {
  const base = specifier.startsWith("@/") ? `src/${specifier.slice(2)}`
    : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)) : null;
  if (!base) return null;
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    .find((candidate) => sources.has(candidate)) || base;
};

/** Parse imports and re-exports without running the source being checked. */
export function readArchitectureImports(file, source) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const imports = [];
  const add = (node, specifier, typeOnly = false) => imports.push({
    specifier, typeOnly, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
  });
  for (const node of ast.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const names = clause?.namedBindings;
      const allNamedTypes = names && ts.isNamedImports(names) && names.elements.length > 0
        && names.elements.every((element) => element.isTypeOnly) && !clause.name;
      add(node, node.moduleSpecifier.text, Boolean(clause?.isTypeOnly || allNamedTypes));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const names = node.exportClause;
      const allNamedTypes = names && ts.isNamedExports(names) && names.elements.length > 0
        && names.elements.every((element) => element.isTypeOnly);
      add(node, node.moduleSpecifier.text, Boolean(node.isTypeOnly || allNamedTypes));
    }
  }
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) add(node, node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(ast, visit);
  return imports;
}

/** Recognize SDK imports and simple aliases; this is not whole-program dataflow analysis. */
export function findDirectDatabaseCalls(file, source) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const clients = new Set();
  const factories = new Set();
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const specifier = node.moduleSpecifier.text;
    const localTarget = resolveImport(file, specifier, new Map());
    if (specifier !== "@supabase/supabase-js" && localTarget?.replace(/\.tsx?$/, "") !== "src/lib/supabase") continue;
    const names = node.importClause?.namedBindings;
    if (names && ts.isNamedImports(names)) {
      for (const element of names.elements) {
        const original = (element.propertyName || element.name).text;
        if (original === "supabase") clients.add(element.name.text);
        if (["requireSupabase", "createClient"].includes(original)) factories.add(element.name.text);
      }
    }
  }
  const scanBindings = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if ((ts.isCallExpression(init) && ts.isIdentifier(init.expression) && factories.has(init.expression.text))
        || (ts.isIdentifier(init) && clients.has(init.text))) clients.add(node.name.text);
    }
    ts.forEachChild(node, scanBindings);
  };
  ts.forEachChild(ast, scanBindings);
  const calls = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      let expression = node.expression;
      while (ts.isPropertyAccessExpression(expression) || ts.isNonNullExpression(expression)) expression = expression.expression;
      if (ts.isIdentifier(expression) && clients.has(expression.text)) {
        const text = node.expression.getText(ast);
        if (/\.(from|rpc|functions|storage|auth)(?:\.|$)/.test(text)) calls.push(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1);
      }
      if (ts.isIdentifier(node.expression) && factories.has(node.expression.text)) calls.push(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(ast, visit);
  return [...new Set(calls)];
}

export const architectureDebtKey = ({ rule, source, specifier }) => `${rule}|${source}|${specifier}`;

/** Fixed-layer direction and public cross-module entry checks. Tests are excluded by callers. */
export function findArchitectureBoundaryIssues(sources, debt = []) {
  const issues = [];
  const graph = new Map();
  const add = (rule, source, entry, message) => issues.push({ rule, source, ...entry, message });
  for (const [file, content] of sources) {
    const sourceInfo = moduleInfo(file);
    if (!sourceInfo) continue;
    const imports = readArchitectureImports(file, content);
    const edges = [];
    for (const entry of imports) {
      const target = resolveImport(file, entry.specifier, sources);
      const targetInfo = target && moduleInfo(target);
      if (!entry.typeOnly && target && sources.has(target)) edges.push(target);
      const publicEntry = targetInfo && ["", ".ts", ".tsx"].some((extension) => target === `src/backend/modules/${targetInfo.module}/index${extension}`);
      if (targetInfo && targetInfo.module !== sourceInfo.module && !publicEntry) {
        add("cross-module-private", file, entry, "Cross-module dependencies must use the target module's public index entry.");
      }
      if (sourceInfo.layer === "repository" && targetInfo && ["service", "controller", "routes"].includes(targetInfo.layer)) {
        add("repository-upward", file, entry, "Repository cannot import a higher execution layer.");
      }
      if (sourceInfo.layer === "service" && targetInfo && ["controller", "routes"].includes(targetInfo.layer)) {
        add("service-upward", file, entry, "Service cannot depend on its entry adapters.");
      }
      if (sourceInfo.layer === "controller" && targetInfo?.layer === "repository") {
        add("controller-repository", file, entry, "Controller must call a service, not a repository.");
      }
      if (sourceInfo.layer === "routes" && targetInfo && ["service", "repository"].includes(targetInfo.layer)) {
        add("route-business", file, entry, "Routes must bind controllers rather than data/business execution.");
      }
      if (entry.specifier === "react" || entry.specifier === "@tanstack/react-query"
        || /^(?:@\/|src\/)(?:pages|components|hooks)\//.test(entry.specifier)
        || (target && /^src\/(?:pages|components|hooks)\//.test(target))) {
        add("frontend-dependency", file, entry, "Backend layers cannot acquire UI/query-state dependencies.");
      }
      if (frontendAdapters.has(entry.specifier) || (target && frontendAdapterTargets.has(target.replace(/\.tsx?$/, "")))) {
        add("frontend-adapter", file, entry, "UI invalidation and presentation adapters belong outside the domain/data core.");
      }
    }
    if (["service", "controller", "routes"].includes(sourceInfo.layer)) {
      for (const line of findDirectDatabaseCalls(file, content)) add("direct-database", file, { specifier: "Supabase", line }, "Database access belongs in a repository.");
    }
    graph.set(file, edges.filter((target) => moduleInfo(target)));
  }
  const visiting = new Set(); const complete = new Set();
  const visit = (file, trail) => {
    if (visiting.has(file)) {
      add("runtime-cycle", file, { specifier: file, line: 1 }, `Runtime module cycle: ${[...trail.slice(trail.indexOf(file)), file].join(" -> ")}`);
      return;
    }
    if (complete.has(file)) return;
    visiting.add(file);
    for (const next of graph.get(file) || []) visit(next, [...trail, file]);
    visiting.delete(file); complete.add(file);
  };
  for (const file of graph.keys()) visit(file, []);
  const known = new Map(debt.map((item) => [architectureDebtKey(item), item]));
  return { errors: issues.filter((item) => !known.has(architectureDebtKey(item))),
    legacy: issues.filter((item) => known.has(architectureDebtKey(item))) };
}
