import path from "node:path";
import ts from "typescript";
import { findArchitectureBoundaryIssues } from "./architecture-boundaries.mjs";

const facadeFile = "src/lib/adminMutation.ts";
const coreFile = "src/backend/modules/system/service/adminMutationService.ts";
const indexFile = "src/backend/modules/system/index.ts";
const publicModule = "src/backend/modules/system";
const repository = "src/backend/modules/system/repository/adminMutationRepository";
const canonical = (file, specifier) => {
  const target = specifier.startsWith("@/") ? `src/${specifier.slice(2)}`
    : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)) : specifier;
  return target.replace(/\.tsx?$/, "").replace(/\/index$/, "");
};
const hasModifier = (node, kind) => node.modifiers?.some((modifier) => modifier.kind === kind);
const functionNamed = (ast, name) => ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
const calls = (node, name) => {
  let found = false;
  const visit = (child) => {
    if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === name) found = true;
    ts.forEachChild(child, visit);
  };
  if (node) visit(node);
  return found;
};
const runtimeImport = (ast, file, target, name) => {
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)
      || canonical(file, node.moduleSpecifier.text) !== target || node.importClause?.isTypeOnly) continue;
    const names = node.importClause?.namedBindings;
    if (!names || !ts.isNamedImports(names)) continue;
    const element = names.elements.find((item) => !item.isTypeOnly && (item.propertyName || item.name).text === name);
    if (element) return element.name.text;
  }
  return null;
};
const hasReExport = (ast, name, target, typeOnly = false) => ast.statements.some((node) => {
  if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)
    || canonical(indexFile, node.moduleSpecifier.text) !== target || !node.exportClause || !ts.isNamedExports(node.exportClause)) return false;
  return node.exportClause.elements.some((element) => element.name.text === name
    && (element.propertyName || element.name).text === name && Boolean(node.isTypeOnly || element.isTypeOnly) === typeOnly);
});

/** Static contract links, not execution/dataflow proof; runtime behavior has its own tests. */
export function verifyAdminMutationContracts(sources) {
  const failures = [];
  const ast = (file) => {
    if (!sources.has(file)) { failures.push(`${file} is missing`); return ts.createSourceFile(file, "", ts.ScriptTarget.Latest, true); }
    const parsed = ts.createSourceFile(file, sources.get(file), ts.ScriptTarget.Latest, true);
    if (parsed.parseDiagnostics.length) failures.push(`${file} cannot be parsed as TypeScript`);
    return parsed;
  };
  const facade = ast(facadeFile); const core = ast(coreFile); const entry = ast(indexFile);
  const exportedAsync = (parsed, file, name) => {
    const node = functionNamed(parsed, name);
    if (!node?.body || !hasModifier(node, ts.SyntaxKind.ExportKeyword) || !hasModifier(node, ts.SyntaxKind.AsyncKeyword)) {
      failures.push(`${file} must export async function ${name}`);
    }
    return node;
  };
  const delivery = functionNamed(facade, "completeMutationDelivery");
  for (const [name, target] of [
    ["invalidateAdminResource", "src/lib/adminInvalidate"],
    ["requestPublicContentInvalidation", publicModule],
    ["registerPublicSyncIssue", "src/lib/publicSyncRecovery"],
    ["resolvePublicSyncIssue", "src/lib/publicSyncRecovery"],
  ]) {
    const local = runtimeImport(facade, facadeFile, target, name);
    if (!local || !calls(delivery, local)) failures.push(`${facadeFile} delivery must call imported ${name} from ${target}`);
  }
  for (const [legacy, persistence] of [["saveAdminRecord", "persistAdminRecord"], ["archiveOrDeleteAdminRecord", "persistAdminRecordRemoval"]]) {
    const wrapper = exportedAsync(facade, facadeFile, legacy);
    const local = runtimeImport(facade, facadeFile, publicModule, persistence);
    if (!local || !calls(wrapper, local)) failures.push(`${facadeFile} ${legacy} must call ${persistence} through the system public entry`);
    if (!calls(wrapper, "completeMutationDelivery")) failures.push(`${facadeFile} ${legacy} must execute cache/public delivery`);
    exportedAsync(core, coreFile, persistence);
  }
  for (const name of ["AdminMutationError", "persistAdminRecord", "persistAdminRecordRemoval"]) {
    if (!hasReExport(entry, name, coreFile.replace(/\.ts$/, ""))) failures.push(`${indexFile} must publicly re-export ${name} from the persistence core`);
  }
  for (const name of ["AdminMutationResult", "PersistAdminRecordOptions", "PersistAdminRecordRemovalOptions"]) {
    if (!hasReExport(entry, name, coreFile.replace(/\.ts$/, ""), true)) failures.push(`${indexFile} must publicly re-export type ${name} from the persistence core`);
  }
  if (!hasReExport(entry, "requestPublicContentInvalidation", repository)) failures.push(`${indexFile} must publicly re-export requestPublicContentInvalidation from its repository`);
  if (!hasReExport(entry, "AdminMutationDbRecord", repository, true)) failures.push(`${indexFile} must publicly re-export type AdminMutationDbRecord from its repository`);
  const boundaries = findArchitectureBoundaryIssues(new Map([[coreFile, sources.get(coreFile) || ""]]));
  for (const issue of boundaries.errors.filter((item) => ["frontend-dependency", "frontend-adapter", "direct-database"].includes(item.rule))) {
    failures.push(`${coreFile}:${issue.line} persistence core violates ${issue.rule}: ${issue.specifier}`);
  }
  const visitCore = (node) => {
    if (ts.isIdentifier(node) && node.text === "QueryClient") failures.push(`${coreFile} persistence core must not own QueryClient`);
    ts.forEachChild(node, visitCore);
  };
  visitCore(core);
  return [...new Set(failures)];
}
