import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { withCompanyBrandSuffix } from './publisher-public-readback.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const clean = text => text.replace(/\s+/g, ' ').trim();
export const plain = html => clean(new JSDOM(html.replace(/<\/p>/gi, '</p> ')).window.document.body.textContent || '');
export const write = (path, value) => { mkdirSync(resolve(path, '..'), {recursive:true}); writeFileSync(path, JSON.stringify(value,null,2)+'\n'); };
let labels;
async function displayLabels() {
  if (!labels) labels = (async () => {
    const {build} = await import('esbuild');
    const result = await build({stdin:{contents:`export {translateDisplayText} from ${JSON.stringify(resolve(root,'src/i18n/displayLabels.ts'))};`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',alias:{'@':resolve(root,'src')},define:{'import.meta.env':'{}'},logLevel:'silent'});
    return (await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)).translateDisplayText;
  })();
  return labels;
}
export async function expectedMetadata(row, lang, identity) {
  const display = await displayLabels();
  return {title:withCompanyBrandSuffix(display(row[`seo_title_${lang}`],lang),{brandName:identity.brand_name,companyName:identity.company_name}),description:display(row[`seo_description_${lang}`],lang)};
}
export async function checkRawMetadata(row, lang, identity) {
  const url=`https://flashcast.com.my/${lang}/locations/${row.slug}`;
  const expected=await expectedMetadata(row,lang,identity);
  let lastError;
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetch(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(25000)});
      const doc=new JSDOM(await response.text()).window.document;
      assert.equal(response.status,200);
      assert.equal(doc.title,expected.title);
      assert.equal(doc.querySelector('meta[name="description"]')?.content,expected.description);
      assert.equal(doc.querySelector('link[rel="canonical"]')?.href,url);
      for(const [property,value] of [['og:title',expected.title],['og:description',expected.description],['twitter:title',expected.title],['twitter:description',expected.description]]) {
        assert.equal(doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)?.content,value);
      }
      assert(!doc.querySelector('meta[name="robots"]')?.content.includes('noindex'));
      return {url,status:200,expected,canonical:true,sharingMetadata:true,indexable:true};
    } catch(error) {lastError=error;}
  }
  throw lastError;
}
// Retry transport timeouts only. Status, content, metadata and layout assertions
// stay outside this retry so a real acceptance failure cannot become a pass.
export async function navigateLocation(page,url) {
  for(let attempt=1;attempt<=3;attempt++) {
    try {return {response:await page.goto(url,{waitUntil:'commit',timeout:20000}),attempts:attempt};}
    catch(error) {if(attempt===3||error?.name!=='TimeoutError')throw error;}
  }
}
async function waitForLocationReady(page) {
  await page.waitForFunction(()=>{
    const content=document.querySelector('#main-content')?.closest('.public-route-content');
    if(!content||content.hasAttribute('inert')||content.getAttribute('aria-busy')==='true'||content.dataset.routeVisualState!=='ready')return false;
    if(document.documentElement.hasAttribute('data-public-boot'))return false;
    return [...document.querySelectorAll('#flashcast-public-boot,.scheme-a-page-loader--overlay')].every(el=>{
      const style=getComputedStyle(el);return style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||el.getClientRects().length===0;
    });
  },undefined,{timeout:45000});
}
export async function checkAreaBrowser({browser,row,body,identity,widths,output,mode,baseline=[],languages=['en','zh']}) {
  const results=[];
  const display=await displayLabels();
  for(const lang of languages) for(const width of widths) {
    const context=await browser.newContext({viewport:{width,height:900},locale:lang==='en'?'en-MY':'zh-CN'});
    try {
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const url=`https://flashcast.com.my/${lang}/locations/${row.slug}`;
      const expected=plain(display(body[`content_${lang}`],lang));
      const {response,attempts:navigationAttempts}=await navigateLocation(page,url);
      await page.waitForFunction(expected=>{
        const header=document.querySelector('#main-content .fc-route-section-head');
        return header && [...header.querySelectorAll(':scope > p')].map(p=>p.innerText).join(' ').replace(/\s+/g,' ').trim()===expected;
      },expected,{timeout:45000});
      await page.evaluate(()=>document.fonts.ready);
      await waitForLocationReady(page);
      const data=await page.evaluate(()=>{
        const main=document.querySelector('#main-content'), header=main.querySelector('.fc-route-section-head');
        const ps=[...header.querySelectorAll(':scope > p')];
        const style=el=>{const s=getComputedStyle(el);return {fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,marginTop:s.marginTop,marginBottom:s.marginBottom};};
        return {title:document.title,description:document.querySelector('meta[name=description]')?.content,
          canonical:document.querySelector('link[rel=canonical]')?.href,
          hreflang:[...document.querySelectorAll('link[rel=alternate][hreflang]')].map(el=>({lang:el.hreflang,href:el.href})),
          paragraphCount:ps.length,paragraphStyle:style(ps[0]),introText:ps.map(p=>p.innerText).join(' '),mainText:main.innerText,
          headings:[...header.querySelectorAll('strong')].map(el=>({text:el.innerText,weight:getComputedStyle(el).fontWeight,parentWeight:getComputedStyle(el.parentElement).fontWeight})),
          overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(response.status(),200);assert.equal(data.overflow,false);assert.deepEqual(errors,[]);
      assert.equal(clean(data.introText),expected); assert(!data.mainText.includes('\uFFFD'));
      const meta=await expectedMetadata(row,lang,identity);
      assert.equal(data.title,meta.title);assert.equal(data.description,meta.description);assert.equal(data.canonical,url);
      for(const [locale,code] of [['en','en'],['zh','zh-CN']]) assert(data.hreflang.some(h=>h.lang===code&&h.href===`https://flashcast.com.my/${locale}/locations/${row.slug}`));
      if(mode==='after') {
        assert.equal(data.paragraphCount,9);assert.equal(data.headings.length,4);
        assert(data.headings.every(h=>Number(h.weight)>=600&&Number(h.weight)>Number(h.parentWeight)));
        const prior=baseline.find(r=>r.lang===lang);
        assert(prior,'Missing mobile baseline'); assert.deepEqual(data.paragraphStyle,prior.paragraphStyle);
        assert.deepEqual(data.hreflang,prior.hreflang);
      }
      const {mainText,introText,...details}=data;
      const result={slug:row.slug,lang,width,mode,status:response.status(),browser:'bundled Chromium',navigationAttempts,routeReady:true,...details,introCharacters:clean(introText).length,visibleMainCharacters:clean(mainText).length,exactApprovedText:true,errors};
      results.push(result);
      write(resolve(output,`${mode}-browser.json`),results);
      if(width===390||width===1440) {
        await page.locator('#main-content .fc-route-section-head').first().evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-110));
        await waitForLocationReady(page);
        await page.screenshot({path:resolve(output,`${mode}-${lang}-${width}.png`)});
      }
      console.log(JSON.stringify({slug:row.slug,lang,width,mode,introCharacters:result.introCharacters,strong:result.headings.length,overflow:result.overflow}));
    } finally {await context.close();}
  }
  return results;
}
export async function checkAreaSitemap(slugs) {
  const response=await fetch('https://flashcast.com.my/sitemap.xml',{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(30000)});
  const xml=await response.text();assert.equal(response.status,200);
  const paths=slugs.flatMap(slug=>['en','zh'].map(lang=>({path:`/${lang}/locations/${slug}`,present:xml.includes(`https://flashcast.com.my/${lang}/locations/${slug}</loc>`)})));
  assert(paths.every(p=>p.present));return {status:200,paths};
}
