import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPublicLoaderContract } from './lib/public-loader-contract.mjs';

const fixture = () => new Map([
  ['src/components/PublicInitialLoader.tsx', 'import { PublicLoadingBrand } from "./PublicLoadingBrand"; export function PublicInitialLoader() { return <div className="scheme-a-page-loader"><PublicLoadingBrand/></div>; }'],
  ['src/components/PublicRouteFeedback.tsx', 'import { PublicLoadingBar } from "./PublicLoadingBar"; import { PublicLoadingBrand } from "./PublicLoadingBrand"; import { copy } from "../i18n/copy"; export function PublicRouteFeedback({scope,busy,timedOut}) { const pageWait = scope === "page" && busy && !timedOut; return <div className={pageWait ? "public-route-feedback scheme-a-page-loader scheme-a-page-loader--navigation" : "public-route-feedback"}>{pageWait && <PublicLoadingBrand/>}<PublicLoadingBar/><span>{copy.loaderRoutePending}</span></div>; }'],
  ['src/components/PublicLoadingBrand.tsx', 'import { PublicLoadingBar } from "./PublicLoadingBar"; import { copy } from "../i18n/copy"; export function PublicLoadingBrand() { return <div className="scheme-a-page-loader__brand"><p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span><PublicLoadingBar/></div>; }'],
  ['src/components/PublicLoadingBar.tsx', 'export function PublicLoadingBar() { return <i data-loading-progress="true" />; }'],
  ['src/i18n/copy.ts', 'export const copy = { loaderBrand: "FLASHCAST", loaderRoutePending: "Loading content" };'],
  ['src/components/PublicRouteImageGate.tsx', 'import { PublicInitialLoader as Initial } from "./PublicInitialLoader"; const showBrandScreen = !presentedRoute.current && boot?.state !== "ready" && boot?.state !== "degraded"; const showInitialFeedback = showBrandScreen && !boot && blocked; export function Gate() { return <>{showInitialFeedback && <Initial/>}</>; }'],
]);

test('document ownership and guarded page-wait branding allow one shared visual and dictionaries', () => {
  assert.deepEqual(checkPublicLoaderContract(fixture()), []);
});

test('navigation cannot hide a brand dependency behind a child or re-export', () => {
  const sources = fixture();
  sources.set('src/components/feedback/index.ts', 'export { PublicInitialLoader as Child } from "../PublicInitialLoader";');
  sources.set('src/components/PublicRouteFeedback.tsx', 'import { Child } from "./feedback"; export function PublicRouteFeedback() { return <Child data-route-loader="navigation"/>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /navigation must not depend on|first-document branch/);
});

test('inline brand text, unguarded styles and brand copy are still rejected in navigation dependencies', () => {
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
  assert.match(checkPublicLoaderContract(sources).join('\n'), /brand markup belongs to PublicLoadingBrand/);
});

test('page branding can use direct conjunctions, nested guards and aliased shared visual exports', () => {
  for (const markup of ['{scope === "page" && busy && !timedOut && <Visual/>}', '{scope === "page" ? busy && !timedOut && <Visual/> : null}', '{scope === "page" && <>{busy && !timedOut && <Visual/>}</>}']) {
    const sources = fixture();
    sources.set('src/components/visual/index.ts', 'export { PublicLoadingBrand as Brand } from "../PublicLoadingBrand";');
    sources.set('src/components/PublicRouteFeedback.tsx', `import { Brand as Visual } from "./visual"; export function PublicRouteFeedback({scope,busy,timedOut}) { return <>${markup}</>; }`);
    assert.deepEqual(checkPublicLoaderContract(sources), [], markup);
  }
});

test('region, ready, timeout, unconditional and OR guards cannot render page branding', () => {
  for (const guard of ['scope === "region" && busy && !timedOut', 'scope === "page" && !timedOut', 'scope === "page" && busy', 'scope === "page" && busy && timedOut', 'busy', 'true', '(scope === "page" && busy && !timedOut) || busy', '(scope === "page" || scope === "region") && busy && !timedOut']) {
    const sources = fixture();
    sources.set('src/components/PublicRouteFeedback.tsx', `import { PublicLoadingBrand as Brand } from "./PublicLoadingBrand"; export function PublicRouteFeedback({scope,busy,timedOut}) { return <>{${guard} && <Brand data-route-loader="navigation"/>}</>; }`);
    assert.match(checkPublicLoaderContract(sources).join('\n'), /busy non-timeout page navigation branch/, guard);
  }
});

test('guarded parent cannot hide a shared brand mount in another child component', () => {
  const sources = fixture();
  sources.set('src/components/Child.tsx', 'import { PublicLoadingBrand } from "./PublicLoadingBrand"; export function Child() { return <PublicLoadingBrand/>; }');
  sources.set('src/components/PublicRouteFeedback.tsx', 'import { Child } from "./Child"; export function PublicRouteFeedback({scope,busy,timedOut}) { return <>{scope === "page" && busy && !timedOut && <Child/>}</>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /Child.tsx: PublicLoadingBrand may only mount/);
});

test('shared visual cannot depend on the document boot controller', () => {
  const sources = fixture();
  sources.set('src/lib/publicBoot.ts', 'export const boot = {};');
  sources.set('src/components/PublicLoadingBrand.tsx', `import { boot } from "../lib/publicBoot"; ${sources.get('src/components/PublicLoadingBrand.tsx')}`);
  assert.match(checkPublicLoaderContract(sources).join('\n'), /navigation must not depend on src\/lib\/publicBoot.ts/);
});

test('conditional layout must have the same genuine page-wait guard', () => {
  for (const condition of ['scope === "page"', 'busy && !timedOut', '(scope === "page" && busy && !timedOut) || timedOut']) {
    const sources = fixture();
    sources.set('src/components/PublicRouteFeedback.tsx', sources.get('src/components/PublicRouteFeedback.tsx').replace('className={pageWait ?', `className={${condition} ?`));
    assert.match(checkPublicLoaderContract(sources).join('\n'), /brand layout must be guarded/, condition);
  }
});

test('shared visual must remain mounted for both document entry and genuine page waits', () => {
  for (const file of ['src/components/PublicInitialLoader.tsx', 'src/components/PublicRouteFeedback.tsx']) {
    const sources = fixture();
    sources.set(file, sources.get(file).replace('<PublicLoadingBrand/>', '<span/>'));
    assert.match(checkPublicLoaderContract(sources).join('\n'), /must retain.*shared brand visual/, file);
  }
});

test('direct function calls cannot bypass the shared visual JSX guard', () => {
  const sources = fixture();
  sources.set('src/components/PublicRouteFeedback.tsx', 'import { PublicLoadingBrand as Brand } from "./PublicLoadingBrand"; export function PublicRouteFeedback({scope,busy,timedOut}) { return <>{scope === "page" && busy && !timedOut && Brand()}</>; }');
  assert.match(checkPublicLoaderContract(sources).join('\n'), /checked JSX branch/);
});
