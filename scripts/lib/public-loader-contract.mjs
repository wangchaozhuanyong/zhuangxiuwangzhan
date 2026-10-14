import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const initialFile = 'src/components/PublicInitialLoader.tsx';
const navigationFile = 'src/components/PublicRouteFeedback.tsx';
const gateFile = 'src/components/PublicRouteImageGate.tsx';
const brandFile = 'src/components/PublicLoadingBrand.tsx';
const unwrap = node => ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;

/** Verify render/import ownership rather than trusting loader labels or comments. */
export function checkPublicLoaderContract(sources) {
  const failures = [];
  const trees = new Map([...sources].map(([file, source]) => [file, ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)]));
  const resolve = (from, specifier) => {
    const base = specifier.startsWith('@/') ? `src/${specifier.slice(2)}` : specifier.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier)) : null;
    return base && [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`].find(file => trees.has(file));
  };
  const imports = new Map();
  for (const [file, tree] of trees) {
    const bindings = new Map();
    for (const node of tree.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || node.importClause?.isTypeOnly) continue;
      const target = resolve(file, node.moduleSpecifier.text);
      if (!target) continue;
      if (node.importClause?.name) bindings.set(node.importClause.name.text, { target, name: 'default' });
      const named = node.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) for (const entry of named.elements) {
        if (!entry.isTypeOnly) bindings.set(entry.name.text, { target, name: (entry.propertyName || entry.name).text });
      }
      else if (named) bindings.set(named.name.text, { target, name: '*' });
    }
    imports.set(file, bindings);
  }
  const exportedFrom = (file, name, seen = new Set()) => {
    const key = `${file}:${name}`;
    if (seen.has(key)) return undefined;
    seen.add(key);
    const tree = trees.get(file);
    if (!tree) return undefined;
    for (const node of tree.statements) {
      if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause && ts.isNamedExports(node.exportClause)) {
        const entry = node.exportClause.elements.find(entry => entry.name.text === name);
        const binding = entry && imports.get(file)?.get((entry.propertyName || entry.name).text);
        if (binding) return exportedFrom(binding.target, binding.name, seen);
      }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const target = resolve(file, node.moduleSpecifier.text);
        if (!target) continue;
        if (!node.exportClause) {
          const found = exportedFrom(target, name, seen);
          if (found) return found;
        } else if (ts.isNamedExports(node.exportClause)) {
          const entry = node.exportClause.elements.find(entry => entry.name.text === name);
          if (entry) return exportedFrom(target, (entry.propertyName || entry.name).text, seen);
        }
      }
      const declared = node.name && ts.isIdentifier(node.name) ? node.name.text : undefined;
      if (declared === name || name === 'default' && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) return file;
      if (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(tree) === name)) return file;
    }
    return undefined;
  };
  const jsxSource = (file, tag) => {
    const binding = imports.get(file)?.get(tag.split('.')[0]);
    if (!binding) return tag === 'PublicInitialLoader' && file === initialFile ? initialFile : undefined;
    return exportedFrom(binding.target, binding.name === '*' ? tag.split('.')[1] : binding.name);
  };
  for (const file of [initialFile, navigationFile, gateFile, brandFile]) if (!trees.has(file)) failures.push(`${file}: required loading owner is missing`);

  const declarationsByFile = new Map();
  for (const [file, tree] of trees) {
    const declarations = new Map();
    const collect = node => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) declarations.set(node.name.text, node.initializer);
      ts.forEachChild(node, collect);
    };
    collect(tree);
    declarationsByFile.set(file, declarations);
  }
  // Only facts guaranteed by every true branch count. In particular, an OR
  // cannot make region/ready/timeout states eligible for page branding.
  const pageWaitFacts = (file, expression, seen = new Set()) => {
    const node = unwrap(expression);
    if (ts.isIdentifier(node)) {
      if (seen.has(node.text)) return new Set();
      const initializer = declarationsByFile.get(file)?.get(node.text);
      if (initializer) return pageWaitFacts(file, initializer, new Set([...seen, node.text]));
      return new Set(node.text === 'busy' ? ['busy'] : []);
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken
      && ts.isIdentifier(unwrap(node.operand)) && unwrap(node.operand).text === 'timedOut') return new Set(['not-timeout']);
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return new Set([...pageWaitFacts(file, node.left, new Set(seen)), ...pageWaitFacts(file, node.right, new Set(seen))]);
      if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        const left = pageWaitFacts(file, node.left, new Set(seen));
        const right = pageWaitFacts(file, node.right, new Set(seen));
        return new Set([...left].filter(fact => right.has(fact)));
      }
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
        const left = unwrap(node.left); const right = unwrap(node.right);
        if (ts.isIdentifier(left) && left.text === 'scope' && ts.isStringLiteral(right) && right.text === 'page'
          || ts.isIdentifier(right) && right.text === 'scope' && ts.isStringLiteral(left) && left.text === 'page') return new Set(['page']);
      }
    }
    return new Set();
  };
  const hasPageWait = facts => ['page', 'busy', 'not-timeout'].every(fact => facts.has(fact));
  const guardedPageWait = (file, node) => {
    const facts = new Set();
    for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
      if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && parent.right === child) for (const fact of pageWaitFacts(file, parent.left)) facts.add(fact);
      if (ts.isConditionalExpression(parent) && parent.whenTrue === child) for (const fact of pageWaitFacts(file, parent.condition)) facts.add(fact);
    }
    return hasPageWait(facts);
  };
  const brandLayout = /scheme-a-page-loader/;
  const guardedNavigationLayout = (file, node, tree) => {
    if (file !== navigationFile) return false;
    if (guardedPageWait(file, node)) return true;
    const expression = ts.isJsxExpression(node.initializer) && node.initializer.expression && unwrap(node.initializer.expression);
    return expression && ts.isConditionalExpression(expression) && hasPageWait(pageWaitFacts(file, expression.condition))
      && brandLayout.test(expression.whenTrue.getText(tree)) && !brandLayout.test(expression.whenFalse.getText(tree));
  };

  // Follow local imports and re-exports so moving the brand into a child or a
  // barrel cannot evade document ownership. The one shared visual is allowed;
  // its mounts are checked separately against actual page-wait render guards.
  // Shared translation dictionaries may contain first-load copy.
  const visited = new Set();
  const inspectNavigation = file => {
    if (visited.has(file)) return;
    visited.add(file);
    if (file === initialFile || file === 'src/lib/publicBoot.ts') {
      failures.push(`${navigationFile}: navigation must not depend on ${file}`);
      return;
    }
    const tree = trees.get(file);
    if (!tree) return;
    const check = node => {
      if (file !== brandFile && ts.isJsxText(node) && /\b(?:FLASH|CAST|FLASHCAST)\b/i.test(node.text)) failures.push(`${file}: brand text must use the guarded shared brand visual, not inline navigation feedback`);
      if (ts.isJsxAttribute(node) && node.initializer && /flashcast-public-boot/.test(node.initializer.getText(tree))) failures.push(`${file}: document boot styles cannot be used by navigation feedback`);
      if (file !== brandFile && ts.isJsxAttribute(node) && node.initializer && brandLayout.test(node.initializer.getText(tree)) && !guardedNavigationLayout(file, node, tree)) failures.push(`${file}: brand layout must be guarded by a busy non-timeout page branch in navigation feedback`);
      if (file !== brandFile && ts.isJsxExpression(node) && node.expression && /\b(?:loaderBrand|loaderPending)\b|["'`]\s*(?:FLASH|CAST|FLASHCAST)\b/i.test(node.expression.getText(tree))) failures.push(`${file}: brand copy must use the guarded shared brand visual, not inline navigation feedback`);
      ts.forEachChild(node, check);
    };
    check(tree);
    for (const node of tree.statements) if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.isTypeOnly || ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) continue;
      const target = resolve(file, node.moduleSpecifier.text);
      if (target) inspectNavigation(target);
    }
  };
  inspectNavigation(navigationFile);

  let initialBrandMounts = 0;
  let navigationBrandMounts = 0;
  for (const [file, tree] of trees) {
    const declarations = declarationsByFile.get(file);
    const impliesInitial = (expression, seen = new Set()) => {
      const node = unwrap(expression);
      if (ts.isIdentifier(node)) {
        if (seen.has(node.text)) return false;
        seen.add(node.text);
        const initializer = declarations.get(node.text);
        if (!initializer) return false;
        // This readiness owner records a presented route and the document boot
        // terminal states. All three conditions are necessary for first entry.
        if (node.text === 'showBrandScreen') {
          const terms = [];
          const flatten = expression => {
            const current = unwrap(expression);
            if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) { flatten(current.left); flatten(current.right); }
            else terms.push(current.getText(tree).replace(/\s/g, ''));
          };
          flatten(initializer);
          return terms.includes('!presentedRoute.current') && terms.some(term => /^boot\?\.state!==(["'])ready\1$/.test(term)) && terms.some(term => /^boot\?\.state!==(["'])degraded\1$/.test(term));
        }
        return impliesInitial(initializer, seen);
      }
      if (ts.isBinaryExpression(node)) {
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return impliesInitial(node.left, new Set(seen)) || impliesInitial(node.right, new Set(seen));
        if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) return impliesInitial(node.left, new Set(seen)) && impliesInitial(node.right, new Set(seen));
      }
      return false;
    };
    const inspect = node => {
      if (file !== brandFile && ts.isJsxAttribute(node) && node.initializer && /scheme-a-page-loader__brand/.test(node.initializer.getText(tree))) failures.push(`${file}: brand markup belongs to PublicLoadingBrand only`);
      if (ts.isCallExpression(node) && jsxSource(file, node.expression.getText(tree)) === brandFile) failures.push(`${file}: PublicLoadingBrand must mount through a checked JSX branch`);
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && jsxSource(file, node.tagName.getText(tree)) === brandFile) {
        if (file === initialFile) initialBrandMounts++;
        else if (file === navigationFile && guardedPageWait(file, node)) navigationBrandMounts++;
        else failures.push(`${file}: PublicLoadingBrand may only mount in initial feedback or a busy non-timeout page navigation branch`);
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && jsxSource(file, node.tagName.getText(tree)) === initialFile) {
        let guarded = false;
        for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
          if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && parent.right === child && impliesInitial(parent.left)) guarded = true;
          if (ts.isConditionalExpression(parent) && parent.whenTrue === child && impliesInitial(parent.condition)) guarded = true;
        }
        if (file !== gateFile || !guarded) failures.push(`${file}: PublicInitialLoader may only mount in the gate's first-document branch`);
      }
      ts.forEachChild(node, inspect);
    };
    inspect(tree);
  }
  if (!initialBrandMounts) failures.push(`${initialFile}: initial feedback must retain the shared brand visual`);
  if (!navigationBrandMounts) failures.push(`${navigationFile}: real page waits must retain a guarded shared brand visual`);
  return [...new Set(failures)];
}

export function readPublicLoaderContract(root) {
  const sources = new Map();
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) sources.set(path.relative(root, file).split(path.sep).join('/'), fs.readFileSync(file, 'utf8'));
    }
  };
  walk(path.join(root, 'src'));
  return checkPublicLoaderContract(sources);
}
