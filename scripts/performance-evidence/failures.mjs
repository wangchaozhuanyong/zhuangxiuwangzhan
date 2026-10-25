import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';
const server=await start('candidate'),browser=await chromium.launch(),results=[];
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ready=page=>expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','ready',{timeout:45000});
async function context(fault){
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});let blockedWrites=0;
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname))return route.fulfill({status:200,contentType:'text/javascript',body:'/* disabled */'});
    if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!(request.method()==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle')){blockedWrites++;return route.fulfill({status:200,contentType:'application/json',body:'{}'});}
    const action=fault?.(route,url);return action||route.continue();
  });return{context,writes:()=>blockedWrites};
}
async function run(name,task){try{results.push({name,status:'passed',...await task()});}catch(error){results.push({name,status:'failed',error:String(error.message).slice(0,700)});}}
try{
  await run('Malay-resource-failure-and-safe-reload-recovery',async()=>{
    let fail=true,requests=0;const {context:ctx,writes}=await context((route,url)=>{if(/\/malayContent-[^/]+\.js$/.test(url.pathname)){requests++;if(fail)return route.abort();}}),page=await ctx.newPage();
    await page.goto(server.url+'/en/privacy',{waitUntil:'domcontentloaded'});await ready(page);
    await page.locator('.language-selector--header').click();await page.locator('.language-drawer__option[hreflang="ms-MY"]:visible').click();
    await expect(page.locator('#main-content button').first()).toBeVisible({timeout:15000});
    expect(requests).toBeGreaterThan(0);fail=false;
    await page.locator('#main-content button').first().click();await ready(page);await expect(page).toHaveURL(/\/ms\/privacy$/);
    await ctx.close();return{dictionaryRequests:requests,blockedWrites:writes()};
  });
  await run('offline-navigation-and-existing-refresh-recovery',async()=>{
    const {context:ctx,writes}=await context(),page=await ctx.newPage();
    await page.goto(server.url+'/en/privacy',{waitUntil:'domcontentloaded'});await ready(page);
    await ctx.setOffline(true);
    await page.locator('a[href="/en/contact"]:visible').first().focus();await page.keyboard.press('Enter');
    await expect(page.locator('#main-content button').first()).toBeVisible({timeout:15000});
    await ctx.setOffline(false);await page.locator('#main-content button').first().click();await ready(page);
    await expect(page.locator('#main-content h1').first()).toHaveText('Contact Us');
    await ctx.close();return{blockedWrites:writes(),scope:'SPA dependency failure; existing sw.js has no offline fetch handler'};
  });
  await run('Save-Data-skips-speculation-but-keeps-real-navigation',async()=>{
    const {context:ctx,writes}=await context(),page=await ctx.newPage(),scripts=[];
    await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'2g'},configurable:true}));
    page.on('request',request=>{if(request.resourceType()==='script')scripts.push(new URL(request.url()).pathname);});
    await page.goto(server.url+'/en/privacy',{waitUntil:'domcontentloaded'});await ready(page);
    await page.waitForFunction(()=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('PublicRouteEnhancements-')));await frames(page);
    const link=page.locator('a[href="/en/contact"]:visible').first();await link.focus();await frames(page);
    expect(scripts.some(url=>/\/Contact-[^/]+\.js$/.test(url))).toBe(false);
    await page.keyboard.press('Enter');await ready(page);await expect(page.locator('#main-content h1').first()).toHaveText('Contact Us');
    await ctx.close();return{blockedWrites:writes(),connection:'simulated Save-Data + 2g; throughput measured separately'};
  });
}finally{await browser.close();await server.close();fs.writeFileSync('tmp/performance-evidence/failure-recovery.json',JSON.stringify({results},null,2)+'\n');}
console.log(JSON.stringify(results));if(results.some(result=>result.status!=='passed'))process.exitCode=1;
