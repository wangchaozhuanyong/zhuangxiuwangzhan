import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';
const profile = process.argv[2] || 'baseline';
const server = await start(profile), browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport:{width:1440,height:900},serviceWorkers:'block' });
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname)) return route.fulfill({status:200,contentType:'text/javascript',body:'/* disabled */'});
    if(!['GET','HEAD','OPTIONS'].includes(request.method()) && !(request.method()==='POST' && url.pathname==='/rest/v1/rpc/get_public_home_bundle')) return route.fulfill({status:200,contentType:'application/json',body:'{}'});
    return route.continue();
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    window.__listenerProfile={hiddenDockReads:0,fullCinematicScans:0,fullCinematicScanMs:0};
    const query=Element.prototype.querySelectorAll,bounds=Element.prototype.getBoundingClientRect;
    Element.prototype.querySelectorAll=function(selector){
      if(selector.includes('[data-cinematic-section]')&&this.matches('.scheme-a-public-shell')){
        const at=performance.now(),result=query.call(this,selector);window.__listenerProfile.fullCinematicScans++;window.__listenerProfile.fullCinematicScanMs+=performance.now()-at;return result;
      }
      return query.call(this,selector);
    };
    Element.prototype.getBoundingClientRect=function(){if(this.matches('.scheme-a-mobile-switcher'))window.__listenerProfile.hiddenDockReads++;return bounds.call(this);};
  });
  await page.goto(server.url+'/en/services',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','ready',{timeout:60000});
  await page.waitForFunction(()=>document.querySelector('[data-cinematic-state]'));
  for(let step=0;step<16;step++){
    await page.evaluate(step=>scrollTo(0,step*350),step);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
  await page.locator('button.fc-contact-entry').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(()=>page.getByRole('dialog').evaluate(node=>node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result=await page.evaluate(()=>({...window.__listenerProfile,dockDisplay:getComputedStyle(document.querySelector('.scheme-a-mobile-switcher')).display}));
  fs.writeFileSync(`tmp/performance-evidence/${profile}-listener-profile.json`,JSON.stringify({profile,...result},null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();await server.close();}
