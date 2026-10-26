import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';
const profile = process.argv[2] || 'baseline';
const buildProfile=process.env.PERFORMANCE_BUILD_PROFILE||profile;
const receiptPath=path.resolve('tmp/performance-evidence',buildProfile+'-build-receipt.json');
const sourceVersion=fs.existsSync(receiptPath)?JSON.parse(fs.readFileSync(receiptPath,'utf8')).sourceSha:profile==='baseline'?'c502ed547ff28be63b226e2f87f3ea9e29e2347d':undefined;
const directory = path.resolve('tmp/performance-evidence', `${profile}-evidence`);
fs.mkdirSync(directory, { recursive: true });
const external=process.env.PERFORMANCE_TARGET_URL;
if(external&&external!=='https://flashcast.com.my')throw new Error('Use the reviewed production origin.');
const isolatedProductionHost=process.env.PERFORMANCE_PRODUCTION_HOST==='1'&&!external;
const productionGuards=isolatedProductionHost||Boolean(external);
const server = external ? {url:external.replace(/\/$/,''),reads:[],close:async()=>{}} : await start(buildProfile,{secure:isolatedProductionHost});
const browserUrl=isolatedProductionHost?'https://flashcast.com.my':server.url;
const externalVersion=external ? await fetch(server.url+'/__flashcast/version',{cache:'no-store'}).then(response=>response.json()) : undefined;
if(externalVersion&&process.env.PERFORMANCE_EXPECTED_SHA)expect(externalVersion.deploymentVersion).toBe(process.env.PERFORMANCE_EXPECTED_SHA);
let externalVersionAtEnd;
const browser = await chromium.launch(isolatedProductionHost?{args:[`--host-resolver-rules=MAP flashcast.com.my 127.0.0.1:${new URL(server.url).port}`,'--no-proxy-server',`--ignore-certificate-errors-spki-list=${server.certificatePin}`]}:{});
const replaceLanguage=process.env.PERFORMANCE_REPLACE_LANGUAGE;
const priorPath=path.join(directory,'results.json');
const prior = (process.env.PERF_JOURNEYS_ONLY || process.env.PERF_LIMITED_ONLY || replaceLanguage)&&fs.existsSync(priorPath) ? JSON.parse(fs.readFileSync(priorPath, 'utf8')) : undefined;
const results = (prior?.results || []).filter(row=>!replaceLanguage||row.key!=='/'+replaceLanguage||row.network!=='unthrottled'), snapshots = prior?.snapshots || {}, journeys = process.env.PERF_LIMITED_ONLY||replaceLanguage ? prior?.journeys||[] : [];
let writes = 0, analytics = 0, collectionBlocked = 0;
const blockedExternal=[];
function allowedIsolatedRead(url,method){
  if(/collect|\/pagead\/|\/cdn-cgi\/rum/.test(url.pathname))return false;
  const library=method==='GET'&&((url.hostname==='www.googletagmanager.com'&&/^\/gtag\/(js|destination)$/.test(url.pathname))||(url.hostname==='static.cloudflareinsights.com'&&/^\/beacon(?:\.min)?\.js(?:\/v[a-f0-9]+)?$/.test(url.pathname)));
  const rpc=['POST','OPTIONS'].includes(method)&&url.hostname.endsWith('.supabase.co')&&url.pathname==='/rest/v1/rpc/get_public_home_bundle';
  const publicGet=['GET','HEAD','OPTIONS'].includes(method)&&((url.hostname.endsWith('.supabase.co')&&(url.pathname.startsWith('/rest/v1/')&&!url.pathname.startsWith('/rest/v1/rpc/')||url.pathname.startsWith('/storage/v1/')))||url.origin===browserUrl||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname));
  return library||rpc||publicGet;
}
const painted = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const networkRecords = new WeakMap();
async function context(width, network = 'unthrottled') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.__measurementErrors=[];
  page.on('pageerror',error=>page.__measurementErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')page.__measurementErrors.push(message.text());});
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  const requests = new Map();
  networkRecords.set(page, requests);
  session.on('Network.requestWillBeSent', event => requests.set(event.requestId, { url: event.request.url, method: event.request.method, wallStart: event.wallTime * 1000, type: event.type }));
  session.on('Network.responseReceived', event => Object.assign(requests.get(event.requestId) || {}, { status: event.response.status, mime: event.response.mimeType, cached: Boolean(event.response.fromDiskCache || event.response.fromPrefetchCache), ...(event.type==='Document'?{servedFromLoopback:event.response.remoteIPAddress==='127.0.0.1'&&event.response.remotePort===Number(new URL(server.url).port)}:{}) }));
  session.on('Network.loadingFinished', event => Object.assign(requests.get(event.requestId) || {}, { encoded: event.encodedDataLength, finished: true }));
  session.on('Network.loadingFailed', event => Object.assign(requests.get(event.requestId) || {}, { failed: event.errorText, canceled: event.canceled }));
  session.on('Fetch.requestPaused', async event => {
    const { request, requestId } = event, url = new URL(request.url);
    if (productionGuards) {
      if(!allowedIsolatedRead(url,request.method)){
        collectionBlocked++;Object.assign(requests.get(event.networkId)||{},{blocked:true});
        blockedExternal.push({host:url.hostname,path:url.pathname,type:event.resourceType,method:request.method,collector:/collect|\/pagead\/|\/cdn-cgi\/rum|ga-audiences/.test(url.pathname)||/google-analytics|doubleclick/.test(url.hostname)});
        return session.send('Fetch.fulfillRequest',{requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Methods',value:'GET, POST, OPTIONS'}],body:''}).catch(()=>{});
      }
    } else if (/google-analytics|googletagmanager|doubleclick|googleadservices|connect\.facebook/.test(url.hostname)) {
      analytics++; return session.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from('/* analytics disabled */').toString('base64') }).catch(() => {});
    }
    const readOnly = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) || request.method === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle';
    if (!readOnly) { writes++; return session.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from('{}').toString('base64') }).catch(() => {}); }
    return session.send('Fetch.continueRequest', { requestId }).catch(() => {});
  });
  await session.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  if (network === 'limited') {
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.addInitScript(protectCollectors => {
    window.__evidence = { ready: [], lcp: 0, cls: 0, longTasks: [], events: [], cinematicScans: 0, cinematicScanMs: 0, hiddenDockReads: 0 };
    const audit = window.__evidence;
    // The browser-side layer also covers page-dismissal keepalive traffic,
    // before a closing target can detach its CDP network session.
    if(protectCollectors){
      audit.suppressedCollectors=0;
      const collection=(input,options)=>{
        const url=new URL(input instanceof Request?input.url:String(input),location.href);
        const method=String(options?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
        return /collect|\/pagead\/|\/cdn-cgi\/rum/.test(url.pathname)||!['GET','HEAD','OPTIONS'].includes(method)&&!(url.hostname.endsWith('.supabase.co')&&url.pathname==='/rest/v1/rpc/get_public_home_bundle'&&method==='POST');
      };
      Object.defineProperty(navigator,'sendBeacon',{configurable:true,value:()=>{audit.suppressedCollectors++;return true;}});
      const nativeFetch=window.fetch.bind(window);
      window.fetch=(input,options)=>{
        if(collection(input,options)){audit.suppressedCollectors++;return Promise.resolve(new Response('{}',{status:200,headers:{'Content-Type':'application/json'}}));}
        return nativeFetch(input,options);
      };
      const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send,blocked=new WeakSet();
      XMLHttpRequest.prototype.open=function(method,url,...args){if(collection(url,{method}))blocked.add(this);else blocked.delete(this);return open.call(this,method,url,...args);};
      XMLHttpRequest.prototype.send=function(...args){if(blocked.has(this)){audit.suppressedCollectors++;this.abort();return;}return send.apply(this,args);};
    }
    window.addEventListener('public-route-ready', event => audit.ready.push({ at: performance.now(), degraded: event.detail?.degraded, path: location.pathname }));
    for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask', 'event']) {
      try { new PerformanceObserver(list => list.getEntries().forEach(entry => {
        if (type === 'largest-contentful-paint') {
          audit.lcp = entry.startTime;
          (audit.lcpCandidates ||= []).push({ at: entry.startTime, tag: entry.element?.tagName, id: entry.element?.id, className: entry.element?.className, url: entry.url ? new URL(entry.url).pathname : '', size: entry.size });
        }
        if (type === 'layout-shift' && !entry.hadRecentInput) audit.cls += entry.value;
        if (type === 'longtask') audit.longTasks.push({ at: entry.startTime, duration: entry.duration });
        if (type === 'event' && entry.interactionId) audit.events.push({ name: entry.name, duration: entry.duration, interactionId: entry.interactionId });
      })).observe(type === 'event' ? { type, buffered: true, durationThreshold: 16 } : { type, buffered: true }); } catch {}
    }
    const query = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = function(selector) {
      if (selector.includes('[data-cinematic-section]') && this.matches('.scheme-a-public-shell')) {
        const at = performance.now(), result = query.call(this, selector); audit.cinematicScans++; audit.cinematicScanMs += performance.now() - at; return result;
      }
      return query.call(this, selector);
    };
    const bounds = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function() {
      if (innerWidth >= 768 && this.matches('.scheme-a-mobile-switcher')) audit.hiddenDockReads++;
      return bounds.call(this);
    };
  },productionGuards);
  if(process.env.PERFORMANCE_TRACE_READINESS==='1')await context.addInitScript(()=>{
    window.__gateTrace=[];
    new MutationObserver(records=>{
      for(const record of records){
        const node=record.target;
        if(node instanceof HTMLElement&&(node.matches('.public-route-content,img[data-critical-image]')||node.closest('.scheme-a-chrome__brand'))){
          window.__gateTrace.push({at:performance.now(),tag:node.tagName,attribute:record.attributeName,state:node.dataset.routeVisualState,wait:node.dataset.routeWaitReason,image:node.dataset.imageState,decoded:node.dataset.decodedSrc,src:node instanceof HTMLImageElement?node.currentSrc:undefined});
          if(window.__gateTrace.length>160)window.__gateTrace.shift();
        }
      }
    }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-route-visual-state','data-route-wait-reason','data-image-state','data-decoded-src']});
  });
  return { context, page, session };
}
const ready = async page => {
  await painted(page);
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('.public-route-content[data-route-visual-state="ready"]') && document.querySelector('#main-content h1') && !document.querySelector('#main-content [data-route-pending="true"]'))), { timeout: Number(process.env.PERFORMANCE_READY_TIMEOUT||60000) }).toBe(true);
};
async function snapshot(page, key) {
  await painted(page);
  snapshots[key] = await page.evaluate(() => ({ title: document.title, heading: document.querySelector('#main-content h1')?.textContent?.replace(/\s+/g, ' ').trim(), text: document.querySelector('#main-content')?.textContent?.replace(/\s+/g, ' ').trim(), images: [...document.querySelectorAll('#main-content img')].map(image => ({ src: image.getAttribute('src'), alt: image.alt, width: image.getAttribute('width'), height: image.getAttribute('height') })), horizontalOverflow: document.documentElement.scrollWidth > innerWidth, path: location.pathname + location.search }));
  await page.screenshot({ path: path.join(directory, key.replaceAll('/', '_') + '.png') });
}
async function metrics(page, key, width, cache, sample, network) {
  if (network === "limited") await expect.poll(() => page.locator(".public-route-content").getAttribute("data-route-visual-state"), { timeout: 60000 }).toMatch(/^(ready|degraded|timeout)$/);
  else try{await ready(page);}catch(error){
    const diagnostic=await page.evaluate(()=>({url:location.href,title:document.title,body:document.body?.textContent?.slice(0,600),routeState:document.querySelector('.public-route-content')?.dataset.routeVisualState,gateTrace:window.__gateTrace,events:window.__evidence.ready,boot:{state:window.__flashcastPublicBoot?.state,deadline:window.__flashcastPublicBoot?.deadline},criticalImages:[...document.querySelectorAll('img[data-critical-image],.scheme-a-chrome__brand img')].map(image=>({src:image.currentSrc,complete:image.complete,width:image.naturalWidth,state:image.dataset.imageState,decoded:image.dataset.decodedSrc})),pending:[...document.querySelectorAll('[data-route-pending="true"]')].map(node=>({tag:node.tagName,className:node.className}))}));
    fs.writeFileSync(path.join(directory,'failure-diagnostic.json'),JSON.stringify({diagnostic,errors:page.__measurementErrors,requests:[...networkRecords.get(page).values()].map(({url,...record})=>({...record,path:new URL(url).host+new URL(url).pathname}))},null,2)+'\n');
    await page.screenshot({path:path.join(directory,'failure.png')});throw error;
  }
  await painted(page);
  const gate = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin, readyAt: window.__evidence.ready.find(event => !event.degraded)?.at || window.__evidence.ready[0]?.at || performance.now() }));
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-public-boot'), { timeout: 60000 });
  const visibleAt = await page.evaluate(() => performance.now());
  // Collect requests already in flight at the application gate as well. The
  // resource timeline otherwise omits unfinished CSS/fonts and understates work.
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  await painted(page);
  for(let frame=0;frame<2;frame++){
    await expect.poll(()=>[...networkRecords.get(page).values()].filter(record=>record.type==='Script'&&record.wallStart>=gate.timeOrigin-2&&(!productionGuards||allowedIsolatedRead(new URL(record.url),record.method))).every(record=>record.finished||record.failed),{timeout:60000}).toBe(true);
    await painted(page);
  }
  const value = await page.evaluate(({ readyAt: ready, visibleAt }) => {
    const audit = window.__evidence;
    const resources = performance.getEntriesByType('resource').filter(entry => entry.startTime <= ready).map(entry => ({ path: new URL(entry.name).pathname, initiator: entry.initiatorType, start: entry.startTime, end: entry.responseEnd, transfer: entry.transferSize, decoded: entry.decodedBodySize, priority: document.querySelector(`img[src="${new URL(entry.name).pathname}"]`)?.fetchPriority }));
    const usableResources = performance.getEntriesByType('resource').filter(entry=>entry.startTime<=visibleAt);
    return { ...audit, routeState: document.querySelector(".public-route-content")?.dataset.routeVisualState, readyAt: ready, fullyVisibleObservedAt: visibleAt, fontStableObservedAt: performance.now(), resources, bytesFetchedBeforeReady: resources.reduce((sum, entry) => sum + entry.transfer, 0), decodedBytesBeforeReady: resources.reduce((sum, entry) => sum + entry.decoded, 0), jsBytesBeforeReady: resources.filter(entry => entry.path.endsWith('.js')).reduce((sum, entry) => sum + entry.decoded, 0), jsBytesBeforeVisible:usableResources.filter(entry=>new URL(entry.name).pathname.endsWith('.js')).reduce((sum,entry)=>sum+entry.decodedBodySize,0), navigation: performance.getEntriesByType('navigation').map(entry => ({ ttfb: entry.responseStart, domContentLoaded: entry.domContentLoadedEventEnd })) };
  }, {...gate,visibleAt});
  const requests = [...networkRecords.get(page).values()].filter(record => record.wallStart >= gate.timeOrigin - 2).map(({url,wallStart,...record}) => ({...record, blocked:record.blocked||productionGuards&&!allowedIsolatedRead(new URL(url),record.method), path:new URL(url).origin === browserUrl ? new URL(url).pathname : new URL(url).host + new URL(url).pathname, start:wallStart-gate.timeOrigin}));
  if(isolatedProductionHost)expect(requests.some(record=>record.type==='Document'&&record.servedFromLoopback)).toBe(true);
  const initiated = requests.filter(record => record.start <= gate.readyAt);
  const transmitted=requests.filter(record=>!record.blocked);
  results.push({ key, width, cache, sample, network, ...value, runtimeErrors:page.__measurementErrors, requests, initiatedBeforeReadyWireBytes: initiated.filter(record=>!record.blocked).reduce((sum, record)=>sum+(record.encoded||0),0), initiatedBeforeVisibleWireBytes:transmitted.filter(record=>record.start<=visibleAt).reduce((sum,record)=>sum+(record.encoded||0),0), allScriptWireBytesBeforeVisible:transmitted.filter(record=>record.type==='Script'&&record.start<=visibleAt).reduce((sum,record)=>sum+(record.encoded||0),0), allScriptWireBytesSettled:transmitted.filter(record=>record.type==='Script').reduce((sum,record)=>sum+(record.encoded||0),0), settledWireBytes: transmitted.reduce((sum, record)=>sum+(record.encoded||0),0), pendingRequests:transmitted.filter(record=>!record.finished&&!record.failed).length });
  console.log(JSON.stringify({profile,key,width,cache,sample,network,readyAt:value.readyAt,visibleAt:value.fullyVisibleObservedAt}));
}
try {
  // Warm only the Node middleware before both profiles; each cold browser starts
  // with a new real HTTP cache. This is not a Malaysian edge or device test.
  for (const language of ['en', 'zh', 'ms']) { if(server.warm)await server.warm('/'+language);else await fetch(server.url+'/'+language); }
  if (!process.env.PERF_JOURNEYS_ONLY && !process.env.PERF_LIMITED_ONLY) for (const width of (process.env.PERFORMANCE_WIDTHS||'390,1440').split(',').map(Number)) for (const language of (process.env.PERFORMANCE_LANGUAGES||'en,zh,ms').split(',')) for (let sample = 1; sample <= Number(process.env.PERFORMANCE_SAMPLES||3); sample++) {
    const { context: ctx, page } = await context(width);
    await page.goto(`${browserUrl}/${language}`, { waitUntil: 'domcontentloaded' });
    await metrics(page, '/' + language, width, 'cold browser / warm middleware', sample, 'unthrottled');
    if (sample === 1) await snapshot(page, `${language}-${width}-home`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await metrics(page, '/' + language, width, 'reload / warm browser', sample, 'unthrottled');
    await ctx.close();
  }
  if (!process.env.PERF_LIMITED_ONLY && !process.env.PERFORMANCE_HOME_ONLY) {
  const { context: ctx, page } = await context(390);
  for (const section of ['services', 'projects', 'materials', 'furniture', 'blog']) {
    await page.goto(`${browserUrl}/en/${section}`, { waitUntil: 'domcontentloaded' }); await ready(page);
    await snapshot(page, `${section}-list`);
    const match = section === 'furniture' ? /^\/en\/furniture\/product\/[^/]+$/ : new RegExp(`^/en/${section}/(?!category(?:/|$))[^/]+$`);
    let destination;
    for (let depth = 0; depth < 3; depth++) {
      destination = await page.locator('#main-content a[href]').evaluateAll((links, pattern) => links.map(link => link.getAttribute('href')).find(href => new RegExp(pattern).test(href)), match.source);
      if (destination) break;
      const category = await page.locator('#main-content a[href]').evaluateAll((links, section) => links.map(link => link.getAttribute('href')).filter(href => href !== location.pathname).find(href => section === 'materials' ? /^\/en\/materials\/category\//.test(href) : /^\/en\/furniture\/(?!product\/)/.test(href)), section);
      if (!category) break;
      await page.locator(`#main-content a[href="${category}"]`).first().focus();
      await page.keyboard.press('Enter'); await ready(page);
    }
    if (!destination) throw new Error('No actual detail link for ' + section);
    const listPath = new URL(page.url()).pathname;
    await snapshot(page, `${section}-actual-list`);
    const link = page.locator(`#main-content a[href="${destination}"]`).first();
    const began = performance.now(); await link.click(); await ready(page);
    await snapshot(page, `${section}-detail`);
    await page.goBack(); await ready(page);
    expect(new URL(page.url()).pathname).toBe(listPath);
    const interaction = await page.evaluate(() => ({ events: window.__evidence.events, longTasks: window.__evidence.longTasks, reads: performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.startsWith('/rest/v1/')).map(entry => ({ path: new URL(entry.name).pathname, query: new URL(entry.name).search, transferred: entry.transferSize, decoded: entry.decodedBodySize, start: entry.startTime })), hiddenDockReads: window.__evidence.hiddenDockReads }));
    journeys.push({ section, detail: destination, listPath, returned: new URL(page.url()).pathname, completedMs: performance.now() - began, interaction });
  }
  await ctx.close();
  }
  if(!process.env.PERFORMANCE_HOME_ONLY&&!process.env.PERF_JOURNEYS_ONLY){
  for(const width of (process.env.PERFORMANCE_LIMITED_WIDTHS||'390').split(',').map(Number))for(const language of (process.env.PERFORMANCE_LIMITED_LANGUAGES||'en').split(','))for(let sample=1;sample<=Number(process.env.PERFORMANCE_LIMITED_SAMPLES||1);sample++){
    const limited = await context(width, 'limited');
    await limited.page.goto(browserUrl + '/'+language, { waitUntil: 'domcontentloaded' });
    await metrics(limited.page, '/'+language, width, 'cold browser / warm middleware', sample, 'limited');
    await limited.context.close();
  }
  }
  if(external){
    externalVersionAtEnd=await fetch(server.url+'/__flashcast/version',{cache:'no-store'}).then(response=>response.json());
    expect(externalVersionAtEnd.deploymentVersion).toBe(externalVersion.deploymentVersion);
  }
} finally {
  fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify({ profile, testedAt: new Date().toISOString(), sourceVersion: externalVersion?.deploymentVersion || sourceVersion, browserVersion: browser.version(), isolatedProductionHost, productionGuards, externalVersionAtEnd:externalVersionAtEnd?.deploymentVersion, analyticsLibraries:productionGuards?'Real gtag/destination scripts; local profiles use browser-only loopback DNS; collectors and unknown writes are blocked in JS and CDP.':'Disabled by local hostname or replaced by inert scripts; not a complete production analytics profile.', environment: external ? 'Read-only live production reference; CDP write guard; headless desktop browser with configured viewport. No physical-device or field INP claim.' : 'Local Node adapter of Pages middleware with real anonymous public reads; CDP write guard preserves actual HTTP caching. No physical-device or field INP claim.', limitedNetwork: '1.6 Mbps down, 750 Kbps up, 150 ms latency, CPU 4x', writesBlocked: writes, analyticsStubbed: analytics, collectionBlocked, blockedExternal, results, journeys, snapshots, serverReads: server.reads }, null, 2));
  await browser.close(); await server.close();
}
console.log(JSON.stringify({ profile, samples: results.length, journeys: journeys.length }));
