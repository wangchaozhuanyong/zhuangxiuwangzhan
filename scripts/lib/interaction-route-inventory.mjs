import fs from 'node:fs';
import ts from 'typescript';
/** Read the finite route definition syntax without evaluating project code. */
export function readAdminRouteDefinitionPaths(text) {
  const tree = ts.createSourceFile('adminRouteDefinitions.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const paths = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'adminRouteDefinitions') {
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) throw new Error('Admin route definitions must remain a static object');
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isCallExpression(property.initializer)
          || property.initializer.expression.getText(tree) !== 'defineRoute'
          || !property.initializer.arguments[0] || !ts.isStringLiteral(property.initializer.arguments[0])) {
          throw new Error('Admin route paths must remain literal defineRoute arguments');
        }
        paths.set(property.name.getText(tree), property.initializer.arguments[0].text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return paths;
}
/** Derive inventory from Route JSX, including nested admin paths and aliases. */
export function readInteractionRoutes(root = process.cwd()) {
  const rows = [];
  const definitionFile = `${root}/src/routes/adminRouteDefinitions.ts`;
  const adminPaths = fs.existsSync(definitionFile) ? readAdminRouteDefinitionPaths(fs.readFileSync(definitionFile, 'utf8')) : new Map();
  for (const [source, surface] of [['src/routes/publicRoutes.tsx','public'],['src/routes/adminRoutes.tsx','admin']]) {
    const text = fs.readFileSync(`${root}/${source}`, 'utf8');
    const tree = ts.createSourceFile(source, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node, parent = '') {
      let nextParent = parent;
      const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
      if (opening?.tagName.getText(tree) === 'Route') {
        const path = opening.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(tree) === 'path');
        if (path?.initializer) {
          let value;
          if (ts.isStringLiteral(path.initializer)) value = path.initializer.text;
          else if (surface === 'admin' && ts.isJsxExpression(path.initializer)) {
            const expression = path.initializer.expression;
            if (expression && ts.isPropertyAccessExpression(expression) && expression.name.text === 'path'
              && ts.isPropertyAccessExpression(expression.expression)
              && ts.isIdentifier(expression.expression.expression) && expression.expression.expression.text === 'adminRouteDefinitions') {
              value = adminPaths.get(expression.expression.name.text);
            }
          }
          if (value === undefined) throw new Error(`${source}: unsupported route path expression; update inventory parsing before adding it`);
          nextParent = value.startsWith('/') ? value : `${parent}/${value}`.replace(/\/+/g, '/');
          const element = opening.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(tree) === 'element');
          const component = element?.initializer?.getText(tree).match(/<([A-Z][A-Za-z0-9]*)\b/)?.[1] || 'Layout';
          rows.push({ path: nextParent, surface, source, component });
        }
      }
      ts.forEachChild(node, child => visit(child, nextParent));
    }
    visit(tree);
  }
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.surface}:${row.path}`, previous = unique.get(key);
    unique.set(key, previous ? { ...row, component: [...new Set([...previous.component.split(' + '), row.component])].join(' + ') } : row);
  }
  return [...unique.values()].sort((a,b)=>`${a.surface}:${a.path}`.localeCompare(`${b.surface}:${b.path}`));
}
