import fs from 'node:fs';
import ts from 'typescript';
/** Derive inventory from Route JSX, including nested admin paths and aliases. */
export function readInteractionRoutes(root = process.cwd()) {
  const rows = [];
  for (const [source, surface] of [['src/routes/publicRoutes.tsx','public'],['src/routes/adminRoutes.tsx','admin']]) {
    const text = fs.readFileSync(`${root}/${source}`, 'utf8');
    const tree = ts.createSourceFile(source, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node, parent = '') {
      let nextParent = parent;
      const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
      if (opening?.tagName.getText(tree) === 'Route') {
        const path = opening.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(tree) === 'path');
        if (path?.initializer && ts.isStringLiteral(path.initializer)) {
          const value = path.initializer.text;
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
