import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import postcss from 'postcss';

// Input is the frozen, original static-weight Google Fonts response. Reordering
// equal subsets improves gzip without broadening any font-face weight range.
const checking = process.argv.includes('--check');
const input = path.resolve(process.argv.slice(2).find(argument => argument !== '--check') || 'scripts/fixtures/noto-sc-static-weights.css');
const original = fs.readFileSync(input, 'utf8');
const faces = postcss.parse(original).nodes.filter(node => node.type === 'atrule' && node.name === 'font-face');
if (!faces.length) throw new Error('Expected the frozen original font-face declarations.');
const declarations = face => Object.fromEntries(face.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
const groups = new Map();
for (const face of faces) {
  const fields = declarations(face);
  const key = JSON.stringify(Object.entries(fields).filter(([key]) => key !== 'font-weight'));
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(face);
}
const ordered = [...groups.values()].flat();
const matchingOrder = items => {
  const byWeight = {};
  for (const face of items) {
    const fields = declarations(face), key = JSON.stringify([fields['font-family'], fields['font-style'], fields['font-weight']]);
    (byWeight[key] ||= []).push(fields);
  }
  return byWeight;
};
const before = matchingOrder(faces), after = matchingOrder(ordered);
if (Object.keys(before).some(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))) throw new Error('Font matching order changed; do not generate an asset.');
const css = '/* Original static font faces; subset order per family/style/weight preserved. */\n' + ordered.map(face => '@font-face{' + face.nodes.filter(node => node.type === 'decl').map(node => `${node.prop}:${node.value};`).join('') + '}').join('\n') + '\n';
const digest = createHash('sha256').update(css).digest('hex');
const filename = `noto-sc-static-${digest.slice(0, 12)}.css`;
const output = path.resolve('public/fonts', filename);
if (fs.existsSync(output) && fs.readFileSync(output, 'utf8') !== css) throw new Error('Preserve an existing asset with a different body.');
if (checking) {
  if (!fs.existsSync(output) || !fs.readFileSync('index.html', 'utf8').includes('/fonts/' + filename)) throw new Error('The committed font asset and HTML reference must match.');
} else fs.writeFileSync(output, css);
const record = { inputSha256: createHash('sha256').update(original).digest('hex'), outputSha256: digest, file: '/fonts/' + filename, faceCount: faces.length, matchingOrderPreserved: true, beforeGzip: gzipSync(original).length, afterGzip: gzipSync(css).length };
if (!checking) {
  fs.mkdirSync('tmp/performance-evidence/font-static-order', { recursive: true });
  fs.writeFileSync('tmp/performance-evidence/font-static-order/generation.json', JSON.stringify(record, null, 2) + '\n');
  fs.writeFileSync('tmp/performance-evidence/font-static-order/before.css', original);
  fs.writeFileSync('tmp/performance-evidence/font-static-order/range.css', css);
}
console.log(JSON.stringify(record));
