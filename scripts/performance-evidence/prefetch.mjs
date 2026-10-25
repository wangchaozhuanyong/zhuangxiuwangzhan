import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';
const profile=process.argv[2]||'candidate',server=await start(profile),browser=await chromium.launch(),results=[];
const ready=async page=>{await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','ready',{timeout:60000});await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-public-boot'));};
async function create(){
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),requests=[];
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname))return route.fulfill({status:200,contentType:'text/javascript',body:'/* disabled */'});
    if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!(request.method()==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
    requests.push({path:url.pathname,query:url.search,type:request.resourceType(),method:request.method()});return route.continue();
  });
  await page.goto(server.url+'/en/privacy',{waitUntil:'domcontentloaded'});await ready(page);
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('PublicRouteEnhancements-')));
  return{context,page,requests};
}
try{
  const first=await create();
  const contact=first.page.locator('a[href="/en/contact"]:visible').first();
  await contact.focus();await contact.hover();
  await expect.poll(()=>first.requests.filter(request=>/\/Contact-[^/]+\.js$/.test(request.path)).length).toBe(1);
  await first.page.waitForFunction(()=>performance.getEntriesByType('resource').some(entry=>/\/Contact-[^/]+\.js$/.test(new URL(entry.name).pathname)));
  await contact.click();await ready(first.page);await expect(first.page.locator('#main-content h1').first()).toHaveText('Contact Us');
  const count=first.requests.filter(request=>/\/Contact-[^/]+\.js$/.test(request.path)).length;expect(count).toBe(1);
  results.push({name:'contact-focus-hover-click-shares-one-module',codeRequests:count,formCssRequests:first.requests.filter(request=>/public-forms-[^/]+\.css$/.test(request.path)).length});
  await first.context.close();
  const second=await create();
  await second.page.locator('a[href="/en/blog"]:visible').first().click();await ready(second.page);
  await expect.poll(()=>second.requests.filter(request=>request.path==='/rest/v1/blog_posts'&&!request.query.includes('slug=')).length).toBeGreaterThan(0);
  const link=second.page.locator('#main-content a.fc-route-card[href^="/en/blog/"]').first();
  const destination=await link.getAttribute('href');await link.focus();await link.hover();await link.click();await ready(second.page);
  const detailRequests=second.requests.filter(request=>request.method==='GET'&&request.path==='/rest/v1/blog_posts'&&request.query.includes('slug='));
  const detailReads=detailRequests.length;
  if(profile==='candidate')expect(detailReads).toBe(0);
  results.push({name:'complete-SPA-blog-list-to-detail',destination,detailReads,detailRequests,bodyText:await second.page.locator('#main-content').innerText()});
  await second.context.close();
}finally{await browser.close();await server.close();fs.writeFileSync(`tmp/performance-evidence/${profile}-prefetch.json`,JSON.stringify({profile,results},null,2)+'\n');}
console.log(JSON.stringify(results.map(({bodyText,...row})=>row)));
