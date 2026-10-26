import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';
import { start } from './server.mjs';

const profile=process.argv[2]||'candidate',directory=path.resolve('tmp/performance-evidence',profile+'-acceptance');
fs.mkdirSync(directory,{recursive:true});
const referenceProfile=process.env.PERFORMANCE_REFERENCE_PROFILE||'baseline';
const external=process.env.PERFORMANCE_ACCEPTANCE_TARGET_URL;
if(external&&external!=='https://flashcast.com.my')throw new Error('Use the reviewed production origin.');
const server=external?{url:external,reads:[],close:async()=>{}}:await start(profile),results=[],snapshots={},reference=JSON.parse(fs.readFileSync(`tmp/performance-evidence/${referenceProfile}-evidence/results.json`,'utf8'));
if(external&&process.env.PERFORMANCE_EXPECTED_SHA){
  const version=await fetch(external+'/__flashcast/version',{cache:'no-store'}).then(response=>response.json());
  expect(version.deploymentVersion).toBe(process.env.PERFORMANCE_EXPECTED_SHA);
}
const selectedCase=process.env.PERFORMANCE_ACCEPTANCE_CASE,selectedTest=process.env.PERFORMANCE_ACCEPTANCE_TEST;
if((selectedCase||selectedTest)&&fs.existsSync(path.join(directory,'results.json'))){
  const previous=JSON.parse(fs.readFileSync(path.join(directory,'results.json'),'utf8'));
  results.push(...previous.results.filter(result=>!((!selectedCase||result.name.startsWith(selectedCase))&&(!selectedTest||result.name.endsWith(selectedTest)))));Object.assign(snapshots,previous.snapshots);
}
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ready=async page=>{
  await frames(page);
  await expect.poll(()=>page.evaluate(()=>Boolean(document.querySelector('.public-route-content[data-route-visual-state="ready"]')&&document.querySelector('#main-content h1')&&!document.querySelector('#main-content [data-route-pending="true"]'))),{timeout:45000}).toBe(true);
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-public-boot'));
};
const summary=page=>page.evaluate(()=>({path:location.pathname+location.search,text:document.querySelector('#main-content')?.textContent?.replace(/\s+/g,' ').trim(),images:[...document.querySelectorAll('#main-content img')].map(image=>({src:image.getAttribute('src'),alt:image.alt})),overflow:document.documentElement.scrollWidth>innerWidth}));
async function protect(context){
  let writes=0;
  // Keep dismissal/keepalive writes blocked even after Playwright detaches the
  // closing target's route handlers. Read-only home RPCs retain real responses.
  await context.addInitScript(()=>{
    Object.defineProperty(navigator,'sendBeacon',{configurable:true,value:()=>true});
    const permitted=(input,options)=>{
      const url=new URL(input instanceof Request?input.url:String(input),location.href);
      const method=String(options?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
      return ['GET','HEAD','OPTIONS'].includes(method)||method==='POST'&&url.hostname.endsWith('.supabase.co')&&url.pathname==='/rest/v1/rpc/get_public_home_bundle';
    };
    const nativeFetch=window.fetch.bind(window);
    window.fetch=(input,options)=>permitted(input,options)?nativeFetch(input,options):Promise.resolve(new Response('{}',{status:200,headers:{'Content-Type':'application/json'}}));
    const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send,blocked=new WeakSet();
    XMLHttpRequest.prototype.open=function(method,url,...args){if(!permitted(url,{method}))blocked.add(this);else blocked.delete(this);return open.call(this,method,url,...args);};
    XMLHttpRequest.prototype.send=function(...args){if(blocked.has(this)){this.abort();return;}return send.apply(this,args);};
  });
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(/google-analytics|googletagmanager|doubleclick|googleadservices|connect\.facebook/.test(url.hostname))return route.fulfill({status:200,contentType:'application/javascript',body:'/* analytics disabled */'});
    if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!(request.method()==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle')){writes++;return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'});}
    return route.continue();
  });
  return()=>writes;
}
async function run(name,task,pageProvider,setup){
  if(selectedCase&&!name.startsWith(selectedCase)||selectedTest&&!name.endsWith(selectedTest))return;
  if(setup)await setup();
  const page=typeof pageProvider==='function'?pageProvider():pageProvider;
  console.log('[acceptance] start '+name);
  const firstError=page?.__performanceErrors?.length||0;
  try{const value=await task();expect(page?.__performanceErrors?.slice(firstError)||[]).toEqual([]);results.push({name,status:'passed',...value});}
  catch(error){results.push({name,status:'failed',error:String(error.message).slice(0,600)});console.log('[acceptance] failure '+name+' '+String(error.message).slice(0,300));if(page)await page.screenshot({path:path.join(directory,name.replaceAll('/','_')+'-failure.png')}).catch(()=>{});}
}
try{
  for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
    if(selectedCase&&!selectedCase.startsWith(engine))continue;
    const browser=await type.launch();
    try{for(const width of [390,1440]){
      if(selectedCase&&selectedCase!==`${engine}-${width}`)continue;
      let context,blocked,page,errors,failedRequests;
      const prepare=async()=>{
      await context?.close();
      context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});blocked=await protect(context);page=await context.newPage();
      const caseErrors=[],caseFailures=[],casePage=page;
      errors=caseErrors;failedRequests=caseFailures;
      page.__performanceErrors=caseErrors;
      page.on('pageerror',error=>caseErrors.push(error.message));
      let documentRevision=0;
      const started=new WeakMap();
      page.on('request',request=>started.set(request,documentRevision));
      page.on('framenavigated',frame=>{if(frame===casePage.mainFrame())documentRevision++;});
      page.on('requestfailed',request=>caseFailures.push({path:new URL(request.url()).pathname,error:request.failure()?.errorText,startedRevision:started.get(request),currentRevision:documentRevision}));
      };
      const prefix=engine+'-'+width;
      await run(prefix+'-languages',async()=>{
        for(const language of ['en','zh','ms']){
          await page.goto(`${server.url}/${language}`,{waitUntil:'domcontentloaded'});await ready(page);
          const heading=await page.locator('#main-content h1').innerText();
          await page.reload({waitUntil:'domcontentloaded'});await ready(page);
          expect(await page.locator('#main-content h1').innerText()).toBe(heading);
          snapshots[`${prefix}-${language}-home`]=await summary(page);
        }
        return{browserVersion:browser.version(),failedRequests:[...failedRequests]};
      },()=>page,prepare);
      await run(prefix+'-direct-lists-details',async()=>{
        for(const language of ['en','zh','ms'])for(const journey of reference.journeys){
          for(const [kind,url]of [['list','/en/'+journey.section],['detail',journey.detail]]){
            const target=url.replace(/^\/en(?=\/|$)/,'/'+language);
            // Each direct entry owns a fresh document. Rapid changes within a
            // living document remain covered by the separate navigation cases.
            const direct=await context.newPage(),directErrors=[];
            direct.on('pageerror',error=>directErrors.push(error.message));
            try{
              await direct.goto(server.url+target,{waitUntil:'domcontentloaded'});await ready(direct);
              const value=await summary(direct);expect(value.overflow).toBe(false);expect(directErrors).toEqual([]);
              snapshots[`${prefix}-${language}-${journey.section}-${kind}`]=value;
            }finally{await direct.close();}
          }
        }
      },()=>page,prepare);
      for(const section of ['projects','blog'])await run(prefix+'-'+section+'-filter-return',async()=>{
        await page.goto(`${server.url}/en/${section}`,{waitUntil:'domcontentloaded'});await ready(page);
        const filter=page.locator('.fc-route-filter button[aria-pressed="false"]').first(),requested=await filter.innerText();await filter.click();
        await expect(page.locator('.fc-route-filter button[aria-pressed="true"]')).toHaveText(requested);
        const selected=await page.locator('.fc-route-filter button[aria-pressed="true"]').innerText(),search=new URL(page.url()).search;
        const link=page.locator(`#main-content a.fc-route-card[href^="/en/${section}/"]`).first();await link.focus();
        await link.evaluate(node=>node.addEventListener('click',()=>{window.__performanceDepartureTop=scrollY;},{once:true,capture:true}));
        await page.keyboard.press('Enter');const top=await page.evaluate(()=>window.__performanceDepartureTop);expect(typeof top).toBe('number');await ready(page);
        await page.goBack({waitUntil:'domcontentloaded'});await ready(page);
        expect(new URL(page.url()).search).toBe(search);expect(await page.locator('.fc-route-filter button[aria-pressed="true"]').innerText()).toBe(selected);
        await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-top),{timeout:5000}).toBeLessThanOrEqual(12);
        const restored=await page.evaluate(()=>scrollY);
        return{selected,search,scrollBefore:top,scrollAfter:restored};
      },()=>page,prepare);
      await run(prefix+'-furniture-pagination-gallery',async()=>{
        await page.goto(server.url+'/en/furniture',{waitUntil:'domcontentloaded'});await ready(page);
        await page.locator('.fc-furniture-pagination a[href*="page=2"]').click();await ready(page);
        expect(new URL(page.url()).searchParams.get('page')).toBe('2');
        const link=page.locator('#main-content a[href^="/en/furniture/product/"]').first();await link.focus();
        await link.evaluate(node=>node.addEventListener('click',()=>{window.__performanceDepartureTop=scrollY;},{once:true,capture:true}));
        await page.keyboard.press('Enter');const top=await page.evaluate(()=>window.__performanceDepartureTop);expect(typeof top).toBe('number');await ready(page);
        const buttons=page.locator('.fc-furniture-gallery__thumbs button'),count=await buttons.count(),switches=[];
        for(let index=0;index<Math.min(count,5);index++){
          const button=buttons.nth(index),source=await button.locator('img').getAttribute('src'),started=performance.now();
          await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
          await expect.poll(()=>page.locator('.fc-furniture-gallery__main img').evaluate(image=>({complete:image.complete&&image.naturalWidth>0,src:new URL(image.currentSrc||image.src).pathname}))).toEqual({complete:true,src:source});
          switches.push({index,durationMs:performance.now()-started,source});
        }
        await page.goBack({waitUntil:'domcontentloaded'});await ready(page);
        expect(new URL(page.url()).searchParams.get('page')).toBe('2');
        await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-top),{timeout:5000}).toBeLessThanOrEqual(12);
        const restored=await page.evaluate(()=>scrollY);
        return{photos:count,switches,scrollBefore:top,scrollAfter:restored};
      },()=>page,prepare);
      await run(prefix+'-fast-navigation-pop',async()=>{
        await page.goto(server.url+'/en/privacy',{waitUntil:'domcontentloaded'});await ready(page);
        for(const target of ['projects','materials','projects']){
          if(width<1180){
            await page.locator('.scheme-a-chrome__menu-trigger--compact').click();
            await expect(page.locator('#scheme-a-directory')).toBeVisible();
            const panel='scheme-a-directory-group-'+(target==='projects'?'spaces':'services');
            if(!await page.locator('#'+panel).isVisible())await page.locator(`button[aria-controls="${panel}"]`).click();
            await page.locator(`#scheme-a-directory a[href="/en/${target}"]:visible`).first().click();
            await expect(page.locator('#scheme-a-directory')).not.toBeVisible();
          } else await page.locator(`.scheme-a-chrome__primary a[href="/en/${target}"]`).click();
          await expect(page).toHaveURL(new RegExp('/en/'+target+'$'));
        }
        await ready(page);await expect(page.locator('#main-content h1').first()).toHaveText('Our Projects');
        await page.goBack({waitUntil:'domcontentloaded'});await ready(page);await page.goForward({waitUntil:'domcontentloaded'});await ready(page);
      },()=>page,prepare);
      await run(prefix+'-menu-form-panel-locale',async()=>{
        await page.goto(server.url+'/en/contact',{waitUntil:'domcontentloaded'});await ready(page);
        const trigger=page.locator(width<1180?'.scheme-a-chrome__menu-trigger--compact':'.scheme-a-chrome__nav-more');
        await trigger.click();await expect(page.locator('#scheme-a-directory')).toBeVisible();
        await page.locator('.scheme-a-directory__close').click();await expect(page.locator('#scheme-a-directory')).not.toBeVisible();
        const name=page.locator('input[name="name"]');await name.fill('Local performance check - do not submit');
        await page.locator('input[name="phone"]').focus();
        if(width<768)await expect(page.locator('[data-testid="mobile-bottom-dock"]')).toHaveAttribute('data-mode','hidden');
        await page.locator('#contact-form-title').click();
        await expect(page.locator('button.fc-contact-entry')).toBeVisible();
        await page.locator('button.fc-contact-entry').click();await expect(page.getByRole('dialog')).toBeVisible();
        await expect.poll(()=>page.getByRole('dialog').evaluate(node=>node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
        for(const language of ['zh','ms','en']){
          await page.locator('.language-selector--header').click();
          await page.locator(`.language-drawer__option[hreflang="${language==='zh'?'zh-CN':language==='ms'?'ms-MY':'en'}"]:visible`).click();await ready(page);
          await expect(name).toHaveValue('Local performance check - do not submit');
        }
        await page.screenshot({path:path.join(directory,prefix+'-contact.png')});
        return{writesBlocked:blocked(),pageErrors:[...errors]};
      },()=>page,prepare);
      await context?.close();
    }}finally{await browser.close();}
  }
  // CSS boundary round trip, with the same mounted form and no business submit.
  const browser=await chromium.launch();
  try{
    const context=await browser.newContext({serviceWorkers:'block'});await protect(context);const page=await context.newPage();
    await run('responsive-boundary-roundtrip',async()=>{
      await page.setViewportSize({width:1440,height:900});await page.goto(server.url+'/en/contact');await ready(page);
      const name=page.locator('input[name="name"]');await name.fill('Keep local input');
      for(const width of [360,390,768,1024,1440,390]){
        await page.setViewportSize({width,height:900});await frames(page);
        await expect(name).toHaveValue('Keep local input');
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.locator('input[name="phone"]').focus();
        if(width<=767)await expect(page.locator('[data-testid="mobile-bottom-dock"]')).toHaveAttribute('data-mode','hidden');
        else expect(await page.locator('[data-testid="mobile-bottom-dock"]').evaluate(node=>getComputedStyle(node).display)).toBe('none');
      }
    },page);
  }finally{await browser.close();}
  if(external&&process.env.PERFORMANCE_EXPECTED_SHA){
    const version=await fetch(external+'/__flashcast/version',{cache:'no-store'}).then(response=>response.json());
    expect(version.deploymentVersion).toBe(process.env.PERFORMANCE_EXPECTED_SHA);
  }
}finally{
  await server.close();fs.writeFileSync(path.join(directory,'results.json'),JSON.stringify({profile,external,expectedSha:process.env.PERFORMANCE_EXPECTED_SHA,results,snapshots,limitation:'Local compiled code or the explicit production target with real anonymous reads; JS and route guards block business writes. Interception disables HTTP cache; cache measurements are separate. No physical or Malaysia-device claim.'},null,2)+'\n');
}
console.log(JSON.stringify(results.map(({name,status,error})=>({name,status,error}))));
if(results.some(result=>result.status==='failed'))process.exitCode=1;
