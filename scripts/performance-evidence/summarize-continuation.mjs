import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { collectInitialJavaScriptAssets } from '../lib/performance-budget.mjs';

const root = path.resolve('tmp/performance-evidence');
const output = path.resolve('reports/performance-evidence-2026-10-26');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const stats = values => {
  const sorted = values.slice().sort((a, b) => a - b), half = Math.floor(sorted.length / 2);
  return { median: sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2, min: sorted[0], max: sorted.at(-1) };
};
const profiles = {};
const raw = {};
for (const [label, profile, build] of [['before', 'continuation-final-control', 'continuation-baseline'], ['after', 'continuation-final', 'continuation-font-original']]) {
  const data = read(profile + '-evidence/results.json');
  if (data.results.length !== 54) throw new Error('Expected all 54 normal/reload/limited samples for ' + label);
  raw[label] = data;
  const dist = path.join(root, build), html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.js)["']/g)].map(match => match[1]);
  const initial = collectInitialJavaScriptAssets(dist, refs);
  const gzip = files => files.reduce((sum, file) => sum + gzipSync(fs.readFileSync(path.join(dist, file))).length, 0);
  const groups = new Map();
  for (const row of data.results) {
    const key = [row.key, row.width, row.cache, row.network].join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const cohorts = [...groups].map(([key, rows]) => {
    const [language, width, cache, network] = key.split('|');
    const metric = field => stats(rows.map(row => row[field]));
    return { language, width: Number(width), cache, network, samples: rows.length, readyMs: metric('readyAt'), visibleMs: metric('fullyVisibleObservedAt'), fontStableMs: metric('fontStableObservedAt'), lcpMs: metric('lcp'), cls: metric('cls'), totalWireBytes: metric('settledWireBytes'), allScriptWireBytes: metric('allScriptWireBytesSettled'), localJsGzipBeforeVisible: stats(rows.map(row => gzip([...new Set(row.requests.filter(request => request.path.startsWith('/assets/') && request.path.endsWith('.js') && request.start <= row.fullyVisibleObservedAt).map(request => request.path))]))), fontWireBytes: stats(rows.map(row => row.requests.filter(request => request.type === 'Font').reduce((sum, request) => sum + (request.encoded || 0), 0))), fontStyleWireBytes: stats(rows.map(row => row.requests.filter(request => request.path === 'fonts.googleapis.com/css2').reduce((sum, request) => sum + (request.encoded || 0), 0))), restRequests: stats(rows.map(row => row.requests.filter(request => ['Fetch', 'XHR'].includes(request.type) && request.path.includes('/rest/v1/')).length)), longTaskBeforeVisibleMs: stats(rows.map(row => row.longTasks.filter(task => task.at <= row.fullyVisibleObservedAt).reduce((sum, task) => sum + task.duration, 0))), longTaskTotalMs: stats(rows.map(row => row.longTasks.reduce((sum, task) => sum + task.duration, 0))), cinematicScans: metric('cinematicScans'), pendingRequests: rows.map(row => row.pendingRequests), routeStates: rows.map(row => row.routeState) };
  });
  profiles[label] = { profile, build, sourceVersion: data.sourceVersion, browserVersion: data.browserVersion, testedAt: data.testedAt, samples: data.results.length, staticJsGzip: gzip(initial), staticModules: initial.length, cohorts, journeys: data.journeys.map(row => ({ section: row.section, detail: row.detail, returned: row.returned, readCount: row.interaction.reads.length, eventDurations: row.interaction.events.map(event => event.duration) })) };
}
const homeParity = Object.keys(raw.before.snapshots).filter(key => key.endsWith('-home')).map(key => ({ key, textEqual: raw.before.snapshots[key].text === raw.after.snapshots[key].text, imagesAndOrderEqual: JSON.stringify(raw.before.snapshots[key].images) === JSON.stringify(raw.after.snapshots[key].images), beforeOverflow: raw.before.snapshots[key].horizontalOverflow, afterOverflow: raw.after.snapshots[key].horizontalOverflow }));
const fontExperiments = ['font-comparison', 'font-static-order'].map(run => {
  const comparison = read(run + '/comparison.json');
  return { run, adopted: false, beforeGzip: comparison.before.gzip, candidateGzip: comparison.range.gzip, beforeFaces: comparison.before.faces, candidateFaces: comparison.range.faces, fontUrlsEqual: comparison.fontUrlsEqual, rendering: read(run + '/render-comparison.json'), reason: 'Earlier font requests delayed the desktop Chinese hero; the original index.html font URL is retained.' };
});
const summary = { profiles, homeParity, fontResources: { changed: false, experiments: fontExperiments }, strictBuild: read('strict-final-build-receipt.json'), fieldMetrics: { mobileP75: 'NOT_MEASURED', desktopP75: 'NOT_MEASURED', physicalAndroidIPhone: 'NOT_MEASURED', installedSafari: 'Remote automation disabled; no settings changed.' } };
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'continuation-summary.json'), JSON.stringify(summary, null, 2) + '\n');
const columns = ['profile', 'language', 'width', 'cache', 'network', 'samples', 'readyMs', 'visibleMs', 'fontStableMs', 'lcpMs', 'cls', 'localJsGzipBeforeVisible', 'allScriptWireBytes', 'totalWireBytes', 'fontStyleWireBytes', 'fontWireBytes', 'restRequests', 'longTaskBeforeVisibleMs', 'longTaskTotalMs'];
const csv = [columns.join(',')];
for (const [profile, value] of Object.entries(profiles)) for (const row of value.cohorts) csv.push(columns.map(column => JSON.stringify(column === 'profile' ? profile : typeof row[column] === 'object' ? row[column].median : row[column])).join(','));
fs.writeFileSync(path.join(output, 'continuation-cohorts.csv'), csv.join('\n') + '\n');
console.log(JSON.stringify({ output, homeParity: homeParity.every(row => row.textEqual && row.imagesAndOrderEqual), beforeSamples: profiles.before.samples, afterSamples: profiles.after.samples }));
