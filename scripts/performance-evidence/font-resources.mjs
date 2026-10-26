import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const run = process.env.PERFORMANCE_FONT_RUN || 'font-comparison';
if (!/^[a-z0-9-]{1,64}$/.test(run)) throw new Error('Use a project-local font run name.');
const directory = path.resolve('tmp/performance-evidence', run);
const base = process.env.PERFORMANCE_FONT_BASE_SHA || 'a48f4d3a04ef8033ce19246e13f8db4ced218f9a';
if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('Pin the original font source commit.');
const href = html => html.match(/<link\b[^>]*data-public-fonts[^>]*href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
const urls = { before: href(execFileSync('git', ['show', base + ':index.html'], { encoding: 'utf8' })), range: href(fs.readFileSync('index.html', 'utf8')) };
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';
fs.mkdirSync(directory, { recursive: true });
const results = {};
for (const [name, href] of Object.entries(urls)) {
  const url = new URL(href, 'https://flashcast.com.my');
  const local = name === 'range' && url.origin === 'https://flashcast.com.my' && /^\/fonts\/noto-sc-static-[a-f0-9]+\.css$/.test(url.pathname);
  if (!local && (url.origin !== 'https://fonts.googleapis.com' || url.pathname !== '/css2')) throw new Error('Expected the original font API or the verified local stylesheet.');
  const file = path.join(directory, name + '.css');
  // Existing files are frozen evidence. Use a new run name for a new API snapshot.
  if (!fs.existsSync(file)) {
    if (local) fs.copyFileSync(path.join('public', url.pathname), file);
    else if (name === 'before' && fs.existsSync('scripts/fixtures/noto-sc-static-weights.css')) fs.copyFileSync('scripts/fixtures/noto-sc-static-weights.css', file);
    else {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
      if (!response.ok) throw new Error('Font CSS read failed: ' + response.status);
      fs.writeFileSync(file, await response.text());
    }
  }
  if (local && fs.readFileSync(file, 'utf8') !== fs.readFileSync(path.join('public', url.pathname), 'utf8')) throw new Error('Use a new font run name; preserve the previous experiment.');
  const css = fs.readFileSync(file, 'utf8');
  results[name] = { bytes: Buffer.byteLength(css), gzip: gzipSync(css).length, faces: (css.match(/@font-face/g) || []).length, urls: [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]))], sha256: createHash('sha256').update(css).digest('hex') };
}
results.fontUrlsEqual = JSON.stringify(results.before.urls.slice().sort()) === JSON.stringify(results.range.urls.slice().sort());
fs.writeFileSync(path.join(directory, 'comparison.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify({ base, fontUrlsEqual: results.fontUrlsEqual, beforeGzip: results.before.gzip, afterGzip: results.range.gzip }));
if (!results.fontUrlsEqual) process.exitCode = 1;
