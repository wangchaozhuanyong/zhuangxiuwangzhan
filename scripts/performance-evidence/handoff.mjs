import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';
const profile=process.argv[2]||'candidate',server=await start(profile),browser=await chromium.launch(),results=[];
try{
  for(const language of ['en','zh','ms'])for(const route of ['services/renovation','blog/renovation-handover-defect-checklist-malaysia','contact','materials/spc-flooring-natural-oak','projects','furniture/product/ws-2102-wooden-bunk-bed-white']){
    const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage(),reads=[];
    await context.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());
      if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname))return route.fulfill({status:200,contentType:'text/javascript',body:'/* disabled */'});
      if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!(request.method()==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
      return route.continue();
    });
    page.on('request',request=>{const url=new URL(request.url());if(url.pathname.startsWith('/rest/v1/'))reads.push(url.pathname+url.search);});
    const from=server.reads.length;
    await page.goto(`${server.url}/${language}/${route}`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','ready',{timeout:60000});
    await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-public-boot'));
    await page.waitForLoadState('load');
    const content=await page.evaluate(()=>({heading:document.querySelector('#main-content h1')?.textContent,text:document.querySelector('#main-content')?.textContent?.replace(/\s+/g,' ').trim(),images:[...document.querySelectorAll('#main-content img')].map(image=>({src:image.getAttribute('src'),alt:image.alt})),seedBytes:new TextEncoder().encode(document.querySelector('#flashcast-public-data')?.textContent||'').length,seedKeys:Object.keys(JSON.parse(document.querySelector('#flashcast-public-data')?.textContent||'{}'))}));
    results.push({path:`/${language}/${route}`,browserReads:reads,serverReads:server.reads.slice(from),...content});
    await context.close();
  }
}finally{await browser.close();await server.close();fs.writeFileSync(`tmp/performance-evidence/${profile}-handoff.json`,JSON.stringify({profile,results},null,2)+'\n');}
console.log(JSON.stringify({profile,routes:results.length,browserReads:results.reduce((sum,row)=>sum+row.browserReads.length,0)}));
