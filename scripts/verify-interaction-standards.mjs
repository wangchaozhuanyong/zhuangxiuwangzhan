import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { readInteractionRoutes } from './lib/interaction-route-inventory.mjs';
const root = process.cwd(); const failures = [];
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'docs/interaction-route-compliance.json'), 'utf8'));
const actual = readInteractionRoutes(root); const registered = new Map(matrix.routes.map(row => [`${row.surface}:${row.path}`,row]));
for (const row of actual) {
  const entry = registered.get(`${row.surface}:${row.path}`);
  if (!entry) { failures.push(`Missing route: ${row.path}`); continue; }
  for (const field of ['loading','refresh','navigation','editing','acceptance','samplePath','evidence','component']) if (!entry[field]) failures.push(`${row.path}: missing ${field}`);
  if (entry.component !== row.component) failures.push(`${row.path}: registered page component is stale`);
  if (!/^PASS_LOCAL_(?:SIMULATED|BROWSER)$/.test(entry.acceptance || '')) failures.push(`${row.path}: route acceptance remains pending`);
  if (/[:*]/.test(entry.samplePath || '')) failures.push(`${row.path}: sample must be a concrete tested path`);
}
if (registered.size !== matrix.routes.length) failures.push('Duplicate route registrations');
for (const key of registered.keys()) if (!actual.some(row=>`${row.surface}:${row.path}`===key)) failures.push(`Stale route registration: ${key}`);
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=> item.isDirectory()?walk(path.join(dir,item.name)):/\.(ts|tsx)$/.test(item.name)&&!item.name.includes('.test.')?[path.join(dir,item.name)]:[]);
const snapshotReaders = new Set(['src/lib/publicPreload.ts','src/lib/publicQuerySeed.ts','src/lib/publicQuerySeedCache.ts','src/lib/publicVersion.ts']);
for (const file of walk(path.join(root,'src'))) {
 const relative = path.relative(root,file); const text = fs.readFileSync(file,'utf8');
 if (relative !== 'src/lib/navigationProtection.ts' && /(?:window\.)?location\.reload\s*\(/.test(text)) failures.push(`${relative}: document reload must use reloadDocumentSafely`);
 if (!snapshotReaders.has(relative) && /\breadPreloadedPublicData\s*\(/.test(text)) failures.push(`${relative}: HTML must only seed query caches`);
 if (/ROUTE_SETTLE_MS|PENDING_NAV_FALLBACK_MS|setRouteSettling\(true\)/.test(text)) failures.push(`${relative}: simulated route completion`);
 if (relative.startsWith('src/pages/') && /addEventListener\(["']beforeunload/.test(text)) failures.push(`${relative}: use the shared navigation guard`);
 const tree = ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,relative.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function check(node) {
  if (relative === 'src/routes/adminRoutes.tsx' && ts.isVariableDeclaration(node) && node.name.getText(tree) === 'withRoleGate') {
   let hasLanguagePage = false;
   const inspectEntry = child => {
    if ((ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) && child.tagName.getText(tree) === 'AdminLanguagePage') hasLanguagePage = true;
    ts.forEachChild(child, inspectEntry);
   };
   if (node.initializer) inspectEntry(node.initializer);
   if (!hasLanguagePage) failures.push(`${relative}: cached admin pages must subscribe through AdminLanguagePage`);
  }
  if (ts.isCallExpression(node) && /(?:^|\.)setTimeout$/.test(node.expression.getText(tree))) {
   const callback=node.arguments[0];
   if (callback) {
    const inspectTimer = child => {
     if (ts.isCallExpression(child) && /^set(?:Route(?:Busy|Loading|Pending|Settling)|PendingNav(?:Path|igation)?|Nav(?:igation)?(?:Busy|Loading|Pending))$/.test(child.expression.getText(tree)) && /^(?:false|null|["']{2})$/.test(child.arguments[0]?.getText(tree) || '')) failures.push(`${relative}: timer cannot declare navigation complete`);
     ts.forEachChild(child, inspectTimer);
    };
    inspectTimer(callback);
   }
  }
  if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@tanstack/react-query' && relative !== 'src/hooks/useInteractionQuery.ts') {
   const imports=node.importClause?.namedBindings;
   if (imports && ts.isNamedImports(imports) && imports.elements.some(e=>(e.propertyName||e.name).text==='useQuery')) failures.push(`${relative}: use shared read lifecycle`);
  }
  if (ts.isObjectLiteralExpression(node)) {
   const key=node.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(tree)==='queryKey');
   const placeholder=node.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(tree)==='placeholderData');
   if(key&&placeholder&&/(\bdetail\b|,\s*id\s*\]|,\s*slug\s*[,\]])/.test(key.initializer.getText(tree))&&/keepPreviousData/.test(placeholder.initializer.getText(tree))) failures.push(`${relative}: another record cannot stand in for a detail`);
  }
  ts.forEachChild(node,check);
 }
 check(tree);
}
if(failures.length){ console.error(failures.join('\n')); process.exitCode=1; }
else console.log(`Interaction standards passed: ${actual.length} registered routes; shared reads, navigation, cache seeding and detail identity checked.`);
