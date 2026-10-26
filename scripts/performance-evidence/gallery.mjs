import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { start } from './server.mjs';

const profile=process.argv[2]||'candidate';
const output=path.resolve('tmp/performance-evidence',profile+'-gallery'+(process.env.PERFORMANCE_GALLERY_SUFFIX?'-'+process.env.PERFORMANCE_GALLERY_SUFFIX:''));
const productPath=process.env.PERFORMANCE_GALLERY_PATH||'/en/furniture/product/ws-2102-wooden-bunk-bed-white';
fs.mkdirSync(output,{recursive:true});
const server=await start(profile),browser=await chromium.launch(),results=[];
let writesBlocked=0;
try{
  for(const [width,dpr,limited]of (process.env.PERFORMANCE_GALLERY_LIMITED_ONLY?[[390,3,true]]:[[390,1,false],[390,3,false],[1440,1,false],[390,3,true]])){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:dpr,serviceWorkers:'block'});
    const page=await context.newPage(),cdp=await context.newCDPSession(page),requests=new Map();
    await cdp.send('Network.enable');
    cdp.on('Network.requestWillBeSent',event=>requests.set(event.requestId,{path:new URL(event.request.url).pathname,type:event.type}));
    cdp.on('Network.responseReceived',event=>Object.assign(requests.get(event.requestId)||{},{mime:event.response.mimeType,cached:Boolean(event.response.fromDiskCache)}));
    cdp.on('Network.loadingFinished',event=>Object.assign(requests.get(event.requestId)||{},{bytes:event.encodedDataLength,complete:true}));
    cdp.on('Fetch.requestPaused',async({request,requestId})=>{
      const url=new URL(request.url);
      const stub=(body,type='application/json')=>cdp.send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:type},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(body).toString('base64')}).catch(()=>{});
      if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname))return stub('/* analytics disabled */','text/javascript');
      if(!['GET','HEAD','OPTIONS'].includes(request.method)&&!(request.method==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle')){writesBlocked++;return stub('{}');}
      return cdp.send('Fetch.continueRequest',{requestId}).catch(()=>{});
    });
    await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    if(limited){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
    for(const cache of ['cold','reload']){
      requests.clear();
      const began=performance.now();
      if(cache==='cold')await page.goto(server.url+productPath,{waitUntil:'domcontentloaded'});
      else await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','ready',{timeout:60000});
      const main=page.locator('.fc-furniture-gallery__main img');
      await expect.poll(()=>main.evaluate(image=>image.complete&&image.naturalWidth>0),{timeout:60000}).toBe(true);
      const mainReadyMs=performance.now()-began;
      await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-public-boot'));
      await expect.poll(()=>page.locator('.fc-furniture-gallery__thumbs img').evaluateAll(images=>{
        const box=document.querySelector('.fc-furniture-gallery__thumbs').getBoundingClientRect();
        return images.filter(image=>{const rect=image.getBoundingClientRect();return rect.top<Math.min(innerHeight,box.bottom)&&rect.bottom>Math.max(0,box.top)&&rect.left<Math.min(innerWidth,box.right)&&rect.right>Math.max(0,box.left);}).every(image=>image.complete&&image.naturalWidth>0);
      }),{timeout:60000}).toBe(true);
      await page.waitForLoadState('load');
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const initial=[...requests.values()].filter(record=>record.mime?.startsWith('image/'));
      const thumbs=await page.locator('.fc-furniture-gallery__thumbs img').evaluateAll(images=>images.map(image=>({original:new URL(image.src).pathname,selected:new URL(image.currentSrc||image.src).pathname,cssWidth:image.getBoundingClientRect().width,naturalWidth:image.naturalWidth})));
      const switches=[],buttons=page.locator('.fc-furniture-gallery__thumbs button');
      for(let index=1;index<Math.min(6,await buttons.count());index++){
        const button=buttons.nth(index),original=await button.locator('img').getAttribute('src'),start=performance.now();
        await button.click();
        await expect.poll(()=>main.evaluate(image=>({ready:image.complete&&image.naturalWidth>0,path:new URL(image.currentSrc||image.src).pathname})),{timeout:60000}).toEqual({ready:true,path:original});
        switches.push({index,ms:performance.now()-start,original});
      }
      const total=[...requests.values()].filter(record=>record.mime?.startsWith('image/'));
      results.push({width,dpr,limited,cache,mainReadyMs,photos:thumbs.length,thumbs,initialImageBytes:initial.reduce((sum,item)=>sum+(item.bytes||0),0),initialRequests:initial,imageBytesAfterSwitches:total.reduce((sum,item)=>sum+(item.bytes||0),0),switches});
      if(cache==='cold'&&!limited)await page.screenshot({path:path.join(output,`${width}-${dpr}.png`)});
    }
    await context.close();
  }
}finally{await browser.close();await server.close();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({profile,productPath,realHTTPBrowserCache:true,writesBlocked,results},null,2)+'\n');}
console.log(JSON.stringify({profile,cases:results.length,writesBlocked}));
