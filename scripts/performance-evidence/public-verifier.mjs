import { chromium } from '@playwright/test';
import { start } from './server.mjs';
const server=process.env.PERFORMANCE_TARGET_URL
  ? {url:process.env.PERFORMANCE_TARGET_URL.replace(/\/$/,''),close:async()=>{}}
  : await start('candidate');
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
  const browser=await launch(...args),newContext=browser.newContext.bind(browser);
  browser.newContext=async(...options)=>{
    const context=await newContext(...options);
    await context.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());
      if(/google-analytics|googletagmanager|doubleclick|googleadservices/.test(url.hostname))return route.fulfill({status:200,contentType:'text/javascript',body:'/* analytics disabled */'});
      if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!(request.method()==='POST'&&url.pathname==='/rest/v1/rpc/get_public_home_bundle'))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'});
      return route.continue();
    });
    return context;
  };
  return browser;
};
process.env.PUBLIC_PERFORMANCE_BASE_URL=server.url;
try{await import('../verify-public-performance.mjs');}finally{chromium.launch=launch;await server.close();}
