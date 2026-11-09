import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative));
const digest = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(read('public/fonts/noto-public-glyphs-manifest.json'));
const base = read('public/fonts/noto-sc-static-902c20475ce5.css');
const css = read(`public/fonts/${manifest.css}`);
const corpus = read('scripts/fixtures/public-font-subset-characters.txt');
assert.equal(digest(base), manifest.sourceCssSha256, 'Original fallback font CSS changed');
assert.equal(digest(css), manifest.cssSha256, 'Subset CSS digest changed');
assert.equal(digest(corpus), manifest.corpusSha256, 'Regenerate subsets after changing the corpus');
assert.equal(manifest.css, `noto-public-glyphs-${digest(css).slice(0, 16)}.css`);
const html = read('index.html').toString();
const links = [...html.matchAll(/<link\b[^>]*data-public-fonts[^>]*>/g)].map(match => match[0]);
assert.equal(links.length, 1, 'Load original fallback and subset faces atomically');
assert(links[0].includes(`/fonts/${manifest.css}`));
assert(links.every(link => link.includes('media="print"')), 'Keep image-first font activation');

const glyphs = new Set(Array.from(corpus.toString(), character => character.codePointAt(0)));
const fonts = new Map();
for (const font of manifest.fonts) {
  assert.match(font.file, /^noto-public-glyphs-[a-f0-9]{16}\.woff2$/);
  const bytes = read(`public/fonts/${font.file}`);
  assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
  assert.equal(bytes.length, font.bytes);
  assert.equal(digest(bytes), font.sha256);
  assert.equal(font.file, `noto-public-glyphs-${font.sha256.slice(0, 16)}.woff2`);
  assert(font.glyphs.every(code => glyphs.has(code)), 'Subset contains an unrecorded glyph');
  fonts.set(font.file, new Set(font.glyphs));
}
const faces = body => postcss.parse(body).nodes.filter(node => node.type === 'atrule' && node.name === 'font-face')
  .map(face => Object.fromEntries(face.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value])));
assert(css.subarray(0, base.length).equals(base), 'Preserve the complete original fallback CSS prefix');
const originalFaces = faces(base);
const optimizedFaces = faces(css.subarray(base.length));
assert.equal(optimizedFaces.length, manifest.faces);
const contains = (ranges, code) => ranges.split(',').some(range => {
  const parts = range.trim().replace(/^U\+/i, '').split('-');
  const first = parseInt(parts[0].replace(/\?/g, '0'), 16);
  const last = parseInt((parts[1] || parts[0]).replace(/\?/g, 'F'), 16);
  return code >= first && code <= last;
});
for (const face of optimizedFaces) {
  assert.match(face['font-weight'], /^(400|500|600|700)$/, 'Keep original static weights');
  const filename = /url\("\/fonts\/([^"/]+)"\)/.exec(face.src)?.[1];
  const available = fonts.get(filename);
  assert(available, 'Unrecorded local font');
  const points = face['unicode-range'].split(',').map(range => parseInt(range.replace(/^U\+/i, ''), 16));
  assert(points.every(code => available.has(code)));
  assert(originalFaces.some(original => Object.keys(original).filter(key => key !== 'src' && key !== 'unicode-range')
    .every(key => original[key] === face[key]) && points.every(code => contains(original['unicode-range'], code))), 'Font matching or fallback coverage changed');
}
for (const license of ['OFL-notosanssc.txt', 'OFL-notoserifsc.txt']) assert(read(`public/fonts/${license}`).includes('SIL OPEN FONT LICENSE'));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify({ ok: true, faces: optimizedFaces.length, fonts: fonts.size,
  bytes: manifest.fonts.reduce((sum, font) => sum + font.bytes, 0), originalFallbackPreserved: true }));
