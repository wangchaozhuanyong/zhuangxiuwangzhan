import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPublicLoaderContract } from './lib/public-loader-contract.mjs';

const fixture = () => new Map([
  ['src/components/PublicInitialLoader.tsx', 'export function PublicInitialLoader() { return <div className="scheme-a-page-loader__brand"><strong>FLASHCAST</strong></div>; }'],
  ['src/components/PublicRouteFeedback.tsx', 'import { PublicLoadingBar } from "./PublicLoadingBar"; import { copy } from "../i18n/copy"; export function PublicRouteFeedback() { return <div className="public-route-feedback"><PublicLoadingBar/><span>{copy.loaderRoutePending}</span></div>; }'],
  ['src/components/PublicLoadingBar.tsx', 'export function PublicLoadingBar() { return <i data-loading-progress="true" />; }'],
  ['src/i18n/copy.ts', 'export const copy = { loaderBrand: "FLASHCAST", loaderRoutePending: "Loading content" };'],
  ['src/components/PublicRouteImageGate.tsx', 'import { PublicInitialLoader as Initial } from "./PublicInitialLoader"; const showBrandScreen = !presentedRoute.current && boot?.state !== "ready" && boot?.state !== "degraded"; const showInitialFeedback = showBrandScreen && !boot && blocked; export function Gate() { return <>{showInitialFeedback && <Initial/>}</>; }'],
]);

test('isolated first entry and brand-free navigation allow shared dictionaries', () => {
  assert.deepEqual(checkPublicLoaderContract(fixture()), []);
});

test('navigation cannot hide a brand dependency behind a child or re-export', () => {
  const sources = fixture();
  sources.set('src/components/feedback/index.ts', 'export { PublicInitialLoader as Child } from "../PublicInitialLoader";');
  sources.set('src/components/PublicRouteFeedback.tsx', 'import { Child } from "./feedback"; export function PublicRouteFeedback() { return <Child data-route-loader="navigation"/>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /navigation must not depend on|first-document branch/);
});

test('rendered brand text, styles and initial-only copy are rejected', () => {
  for (const markup of ['<strong><span>FLASH</span><em>CAST</em></strong>', '<div className="scheme-a-page-loader--overlay"/>', '<span>{copy.loaderBrand}</span>', '<span>{copy.loaderPending}</span>']) {
    const sources = fixture();
    sources.set('src/components/PublicLoadingBar.tsx', `export function PublicLoadingBar() { return ${markup}; }`);
    assert.ok(checkPublicLoaderContract(sources).some(failure => /navigation feedback/.test(failure)), markup);
  }
});

test('unconditional and shared pending branches cannot mount first-entry branding', () => {
  for (const guard of ['blocked', 'showBrandScreen || blocked', 'true']) {
    const sources = fixture();
    sources.set('src/components/PublicRouteImageGate.tsx', sources.get('src/components/PublicRouteImageGate.tsx').replace('showInitialFeedback && <Initial', `${guard} && <Initial`));
    assert.match(checkPublicLoaderContract(sources).join('\n'), /first-document branch/);
  }
});

test('initial readiness guard must retain document terminal and presented-route checks', () => {
  for (const term of ['!presentedRoute.current && ', ' && boot?.state !== "ready"', ' && boot?.state !== "degraded"']) {
    const sources = fixture();
    sources.set('src/components/PublicRouteImageGate.tsx', sources.get('src/components/PublicRouteImageGate.tsx').replace(term, ''));
    assert.match(checkPublicLoaderContract(sources).join('\n'), /first-document branch/);
  }
});

test('aliased first-entry mount through a barrel is still checked', () => {
  const sources = fixture();
  sources.set('src/components/entry.ts', 'import { PublicInitialLoader as First } from "./PublicInitialLoader"; export { First as Initial };');
  sources.set('src/components/PublicRouteImageGate.tsx', 'import { Initial as Screen } from "./entry"; export function Gate() { return <Screen/>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /first-document branch/);
});

test('inline brand markup cannot re-enter a shared route gate', () => {
  const sources = fixture();
  sources.set('src/components/PublicRouteImageGate.tsx', 'export function Gate() { return <div className="scheme-a-page-loader__brand" data-route-loader="navigation">FLASHCAST</div>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /brand markup belongs to PublicInitialLoader/);
});
