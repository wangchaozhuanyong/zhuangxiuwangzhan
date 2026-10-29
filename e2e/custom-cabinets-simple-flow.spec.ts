import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import p from '../src/i18n/cabinetPaletteText.json' with { type:'json' };
import t from '../src/i18n/cabinetStudioText.json' with { type:'json' };
import l from '../src/i18n/cabinetStudioCatalog.json' with { type:'json' };
import { studioStyles, studioSchemes, cabinetDefaults } from '../src/data/cabinetStudio';
const evidence=resolve('reports/custom-cabinets-20261024/multi-part-20261026/browser');mkdirSync(evidence,{recursive:true});
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url());const read=r.method()==='POST'&&u.pathname==='/rest/v1/rpc/get_public_home_bundle';if((!['GET','HEAD','OPTIONS'].includes(r.method())&&!read)||/google-analytics|googletagmanager|cloudflareinsights|doubleclick/.test(u.hostname)||/\/(?:__visit|functions\/v1\/(?:submit-lead|notify-lead))\b/.test(u.pathname))return route.abort();return route.continue();});
});
const ready=async(page:Page)=>expect(page.locator('.studio-product [data-room-render-state]')).toHaveAttribute('data-room-render-state','ready');
async function start(page:Page,lang:'zh'|'en'|'ms'='zh',id='cream-1'){
  await page.locator(`[data-scheme="${id}"] .studio-card__actions`).getByRole('button',{name:p[lang].details,exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);await ready(page);
  await page.getByRole('button',{name:p[lang].customize,exact:true}).click();await expect(page.locator('.studio-product')).toHaveAttribute('data-mode','colours');await ready(page);await expect.poll(()=>page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement))).toBe(true);
}
async function roomRaster(page:Page){return page.locator('.studio-product [data-room-layer]').evaluate(async e=>{const image=e.querySelector('img')!;await image.decode();const ref=document.createElement('canvas');ref.width=1536;ref.height=1024;ref.getContext('2d',{willReadFrequently:true})!.drawImage(e.getAttribute('data-room-layer')==='photo'?image:e.querySelector('canvas')!,0,0,1536,1024);return ref.toDataURL();});}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);}
async function partPicker(page:Page) {
  const picker=page.locator('.studio-parts details');if(await picker.getAttribute('open')===null)await picker.locator('summary').click();return picker;
}
async function onlyPart(page:Page,id:string) {
  const picker=await partPicker(page);await picker.locator(`[data-part="${id}"]`).check();
  for(const other of await picker.locator('[data-part]').evaluateAll(items=>items.map(e=>e.getAttribute('data-part')!)))if(other!==id)await picker.locator(`[data-part="${other}"]`).uncheck();
  await picker.locator('summary').click();
}
for(const lang of ['zh','en','ms'] as const)for(const width of [360,390,768,1024,1440])test(`simple catalogue to recolour to enquiry ${lang} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:width<600?844:1000});await page.goto(`/${lang}/custom-cabinets?fc_test=1`);
  await expect(page.locator('[data-scheme]')).toHaveCount(12);await expect(page.locator('.studio-workbench,.studio-package-panel,.studio-compare-tray,.studio-heading,.studio-tabs')).toHaveCount(0);
  const columns=await page.locator('.studio-gallery').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);expect(columns).toBe(width<600?1:width<1180?2:3);
  await page.locator('[data-scheme="cream-1"] img').evaluate((img:HTMLImageElement)=>img.decode());
  const ratio=await page.locator('[data-scheme="cream-1"] img').evaluate(e=>e.getBoundingClientRect().width/e.getBoundingClientRect().height);expect(ratio).toBeCloseTo(1.5,2);
  await page.screenshot({path:resolve(evidence,`catalogue-${lang}-${width}.png`)});
  await start(page,lang);const dialog=page.getByRole('dialog');await noOverflow(page);
  await expect(dialog.getByRole('button',{name:l[lang].scenes.living,exact:true})).toHaveCount(0);
  const original=await roomRaster(page);
  await onlyPart(page,'wall-front');await dialog.locator('[data-finish="walnut"]').click();await ready(page);
  expect(await roomRaster(page)).not.toBe(original);
  await expect(dialog.locator('[data-room-image]')).toHaveAttribute('data-room-image','/images/custom-cabinets/v2/cream-1-kitchen.webp');
  await expect(dialog.locator('.studio-product__footer [data-price-state]')).toHaveAttribute('data-price-state','adjusted');
  await expect(dialog.getByRole('link',{name:p[lang].consult,exact:true})).toBeVisible();
  const link=await dialog.getByRole('link',{name:p[lang].consult,exact:true}).getAttribute('href');const quote=new URL(link!,'http://localhost');
  expect(quote.pathname).toBe(`/${lang}/quote`);expect(quote.searchParams.get('projectType')).toBe('Custom Built-In Furniture');expect(quote.searchParams.get('details')).toContain(l[lang].finishes.walnut);
  await expect(dialog.getByRole('link',{name:p[lang].consult,exact:true})).toBeInViewport();
  await expect(dialog.getByRole('button',{name:t[lang].close,exact:true})).toBeInViewport();
  await page.screenshot({path:resolve(evidence,`colours-${lang}-${width}.png`)});
  await dialog.getByRole('button',{name:t[lang].save,exact:true}).click();await expect(dialog).toContainText(t[lang].savedOk);
  await page.reload();await ready(page);await onlyPart(page,'wall-front');await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('dialog').getByRole('button',{name:l[lang].scenes.bedroom,exact:true}).click();await ready(page);
  await expect(page.locator('.studio-parts')).not.toContainText(p[lang].parts['base-top']);
  await page.getByRole('dialog').getByRole('button',{name:l[lang].scenes.kitchen,exact:true}).click();await ready(page);
  await expect(page.locator('[data-part="wall-front"]')).toBeChecked();await expect(page.locator('[data-part="base-front"]')).not.toBeChecked();await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:p[lang].restore,exact:true}).click();await ready(page);expect(await roomRaster(page)).toBe(original);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await page.locator('.studio-collection-entry').click();await expect(page.locator('[data-saved-id]')).toHaveCount(1);await expect(page.getByRole('dialog')).toContainText(p[lang].savedNote);await noOverflow(page);
  await page.keyboard.press('Escape');await expect(page.locator('.studio-collection-entry')).toBeFocused();
});
for(const style of studioStyles)test(`all three curated schemes keep their scene and support mapped recolouring ${style.id}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const scheme of studioSchemes.filter(s=>s.style===style.id))for(const scene of ['kitchen','bedroom','living'] as const){
    const cabinets=Object.entries(cabinetDefaults).map(([kind,size])=>[kind,kind,size.width,size.height,size.depth,...['front','body','open','top'].map(role=>scheme.finishes[role as keyof typeof scheme.finishes]),style.door,style.handles,'vertical',[]]);
    const d=Buffer.from(JSON.stringify([2,scheme.id,style.id,scene,cabinets])).toString('base64url');
    await page.goto(`/zh/custom-cabinets?fc_test=1&view=design&v=2&d=${d}`);await ready(page);
    const expectedScene=scheme.id==='cream-1'&&scene==='living'?'kitchen':scene;const expected=`/images/custom-cabinets/v2/${scheme.id}-${expectedScene}.webp`;
    const preview=page.locator('.studio-product [data-room-image]');await expect(preview).toHaveAttribute('data-room-image',expected);
    await expect(preview).toHaveAttribute('data-room-layer','photo');await page.getByRole('dialog').locator('img').evaluate((img:HTMLImageElement)=>img.decode());await expect(page.locator('.studio-product canvas')).not.toHaveClass('is-painted');
    const before=await roomRaster(page);
    const finish=scheme.finishes.front==='walnut'?'cream':'walnut';
    if(!await page.locator(`[data-finish="${finish}"]`).isVisible())await page.getByRole('button',{name:p.zh.more,exact:true}).click();
    await page.locator(`[data-finish="${finish}"]`).click();await ready(page);expect(await roomRaster(page)).not.toBe(before);
  }expect(errors).toEqual([]);
});
test('old links, browser history, saved storage failure and image retry stay usable',async({page})=>{
  await page.goto('/zh/custom-cabinets?fc_test=1&o=cream-essential&p=kitchen-wardrobe&s=cream&c=cream-oak&m=kitchen%2Cwardrobe&r=kitchen');await ready(page);await expect(page.locator('.studio-workbench')).toHaveCount(0);
  await page.keyboard.press('Escape');await page.getByRole('combobox',{name:t.zh.style,exact:true}).selectOption('chinese');await expect(page.locator('[data-scheme]')).toHaveCount(3);
  await page.locator('[data-scheme="chinese-1"] .studio-card__actions button').click();await ready(page);await page.getByRole('button',{name:p.zh.customize,exact:true}).click();await ready(page);
  await page.locator('[data-finish="cream"]').click();await ready(page);const changed=page.url();
  await page.goBack();await ready(page);await expect(page.locator('[data-finish="dark-walnut"]')).toHaveAttribute('aria-pressed','true');
  await page.goForward();await ready(page);expect(page.url()).toBe(changed);
  await page.goto(changed.replace('/zh/','/ms/'));await ready(page);await expect(page.getByRole('link',{name:p.ms.consult,exact:true})).toBeVisible();await expect(page.locator('[data-finish="cream"]')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Quota');};});await page.getByRole('button',{name:t.ms.save,exact:true}).click();await expect(page.getByRole('dialog')).toContainText(t.ms.saveFailed);await expect(page.getByRole('dialog')).not.toContainText(t.ms.savedOk);
});

test('failed textures retry and fast changes retain the final selected material',async({page})=>{
  let fail=true;await page.route('**/textures/black-oak.webp*',r=>fail?r.fulfill({status:503,body:''}):r.continue());
  await page.goto('/zh/custom-cabinets?fc_test=1');await start(page);
  await page.getByRole('button',{name:p.zh.more,exact:true}).click();await page.locator('[data-finish="black-oak"]').click();
  await expect(page.locator('.studio-product [data-room-render-state]')).toHaveAttribute('data-room-render-state','error');
  await expect(page.getByText(t.zh.roomPreviewError,{exact:true})).toBeVisible();fail=false;
  await page.getByRole('button',{name:t.zh.roomRetry,exact:true}).click();await ready(page);
  await page.locator('[data-finish="walnut"]').click();await page.locator('[data-finish="ivory"]').click();await ready(page);
  const canvas=page.getByRole('dialog').locator('canvas');const final=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  await page.reload();await ready(page);expect(await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(final);
});

test('catalogue selection starts with original colours and keeps filters and browsing position',async({page})=>{
  await page.goto('/zh/custom-cabinets?fc_test=1');await page.getByRole('button',{name:t.zh.more,exact:true}).click();await expect(page.locator('[data-scheme]')).toHaveCount(24);
  await page.locator('[data-scheme="cream-2"] .studio-card__actions button').click();await ready(page);
  await page.getByRole('button',{name:p.zh.customize,exact:true}).click();await page.locator('[data-finish="walnut"]').click();await ready(page);await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);await page.locator('[data-scheme="cream-2"] .studio-card__actions button').scrollIntoViewIfNeeded();
  const scroll=await page.evaluate(()=>scrollY);await page.locator('[data-scheme="cream-2"] .studio-card__actions button').click();await ready(page);
  await page.getByRole('button',{name:p.zh.customize,exact:true}).click();await expect(page.locator('[data-finish="oat"]')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('[data-scheme]')).toHaveCount(24);expect(Math.abs(await page.evaluate(()=>scrollY)-scroll)).toBeLessThan(5);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://flashcast.com.my/zh/custom-cabinets');
});

test('home entry and existing service and material links stay localized',async({page})=>{
  for(const lang of ['zh','en','ms']){
    await page.goto(`/${lang}?fc_test=1`);
    const entry=page.locator('[data-home-section="custom-cabinets"]');await expect(entry).toBeVisible();
    await entry.locator('.home-cabinets__actions a').first().click();await expect(page.locator('[data-scheme]')).toHaveCount(12);
    await page.locator('.studio-support details').first().locator('summary').click();
    const links=await page.locator('.studio-support details').first().locator('a').evaluateAll(items=>items.map(a=>a.getAttribute('href')));
    expect(links).toContain(`/${lang}/materials/category/whole-house-custom`);expect(links).toContain(`/${lang}/services/builtin`);
  }
});

for(const height of [600,720])test(`short desktop keeps the full room and enquiry visible at height ${height}`,async({page})=>{
  await page.setViewportSize({width:1440,height});await page.goto('/zh/custom-cabinets?fc_test=1');await start(page);
  const bounds=await page.locator('.studio-room-preview__frame').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.studio-product__layout')!.getBoundingClientRect();return {top:a.top,bottom:a.bottom,bodyTop:b.top,bodyBottom:b.bottom,ratio:a.width/a.height};});
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.bodyTop-1);expect(bounds.bottom).toBeLessThanOrEqual(bounds.bodyBottom+1);expect(bounds.ratio).toBeCloseTo(1.5,2);
  await expect(page.getByRole('link',{name:p.zh.consult,exact:true})).toBeInViewport();await page.screenshot({path:resolve(evidence,`short-desktop-${height}.png`)});
});

test('direct enquiry fills the existing form with the exact preview configuration without submitting',async({page})=>{
  const businessWrites:string[]=[];page.on('request',r=>{if(/functions\/v1\/(submit-lead|notify-lead)/.test(r.url()))businessWrites.push(r.url());});
  await page.goto('/zh/custom-cabinets?fc_test=1');await start(page);await page.locator('[data-finish="walnut"]').click();await ready(page);
  const link=page.getByRole('link',{name:p.zh.consult,exact:true}),href=await link.getAttribute('href');const expected=new URL(href!,'http://localhost').searchParams.get('details');
  await link.click();await expect(page.locator('#quote-details')).toHaveValue(expected!);await expect(page.locator('#quote-form')).toBeInViewport();
  await page.goBack();await ready(page);await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');expect(businessWrites).toEqual([]);
});

test('a saved colour design resumes directly from the compact favourites panel',async({page})=>{
  await page.goto('/zh/custom-cabinets?fc_test=1');await start(page);await page.locator('[data-finish="walnut"]').click();await ready(page);
  await page.getByRole('button',{name:t.zh.save,exact:true}).click();await expect(page.getByRole('dialog')).toContainText(t.zh.savedOk);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await page.locator('.studio-collection-entry').click();
  await page.locator('[data-saved-id]').getByRole('button',{name:p.zh.customize,exact:true}).click();await ready(page);
  await expect(page.getByRole('dialog')).toHaveCount(1);await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.studio-workbench,.studio-steps,.studio-compare-tray')).toHaveCount(0);
});

test('default colour selection links every kitchen door, with local parts still available',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/zh/custom-cabinets?fc_test=1');await start(page);
  await expect(page.getByRole('button',{name:p.zh.doorsOnly,exact:true})).toHaveAttribute('aria-pressed','true');await page.locator('[data-finish="sage"]').click();await ready(page);
  const decode=()=>page.evaluate(()=>JSON.parse(atob(new URLSearchParams(location.search).get('d')!.replaceAll('-','+').replaceAll('_','/'))));
  let configuration=await decode();for(const kind of ['base','wall'])expect(configuration[4].find((c:unknown[])=>c[1]===kind)[5]).toBe('sage');
  expect(configuration[4].find((c:unknown[])=>c[1]==='wardrobe')[5]).toBe('cream');
  await page.screenshot({path:resolve(evidence,'linked-kitchen-doors-390.png')});
  await onlyPart(page,'base-front');await page.locator('[data-finish="ivory"]').click();await ready(page);
  configuration=await decode();expect(configuration[4].find((c:unknown[])=>c[1]==='base')[5]).toBe('ivory');expect(configuration[4].find((c:unknown[])=>c[1]==='wall')[5]).toBe('sage');
  await page.getByRole('button',{name:p.zh.doorsOnly,exact:true}).click();await expect(page.locator('.studio-palette__selection')).toContainText(p.zh.mixedColours);
});

for(const lang of ['zh','en','ms'] as const)for(const width of [360,1440])test(`multiple selected parts and whole cabinet colours stay consistent ${lang} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:width<600?844:1000});await page.goto(`/${lang}/custom-cabinets?fc_test=1`);await start(page,lang);
  const picker=await partPicker(page);
  await picker.locator('[data-part="base-front"]').uncheck();
  await picker.locator('[data-part="wall-body"]').check();await picker.locator('[data-part="base-body"]').check();
  // A keyboard Space toggles the same native checkbox as a pointer/touch.
  await picker.locator('[data-part="wall-body"]').press('Space');await expect(picker.locator('[data-part="wall-body"]')).not.toBeChecked();
  await picker.locator('[data-part="wall-front"]').check();await picker.locator('[data-part="base-body"]').check();await picker.locator('summary').click();
  await page.locator('[data-finish="sage"]').click();await ready(page);
  const decode=()=>page.evaluate(()=>JSON.parse(atob(new URLSearchParams(location.search).get('d')!.replaceAll('-','+').replaceAll('_','/'))));
  let configuration=await decode(),base=configuration[4].find((c:unknown[])=>c[1]==='base');const wall=configuration[4].find((c:unknown[])=>c[1]==='wall');
  expect(base[5]).toBe('cream');expect(base[6]).toBe('sage');expect(wall[5]).toBe('sage');expect(wall[6]).toBe('pale-oak');
  const href=await page.getByRole('link',{name:p[lang].consult,exact:true}).getAttribute('href'),details=new URL(href!,'https://example.test').searchParams.get('details')!;
  expect(details).toContain(`${p[lang].parts['wall-front']}: ${l[lang].finishes.sage}`);expect(details).toContain(`${p[lang].parts['base-body']}: ${l[lang].finishes.sage}`);
  const subset=configuration;
  await page.getByRole('button',{name:p[lang].selectCabinetParts,exact:true}).click();await page.locator('[data-finish="walnut"]').click();await ready(page);
  configuration=await decode();for(const kind of ['base','wall']){const c=configuration[4].find((item:unknown[])=>item[1]===kind);expect(c[5]).toBe('walnut');expect(c[6]).toBe('walnut');expect(c[8]).toBe('warm-stone');}
  expect(configuration[4].find((c:unknown[])=>c[1]==='wardrobe')[5]).toBe('cream');
  await page.goBack();await ready(page);expect(await decode()).toEqual(subset);
  await page.goForward();await ready(page);expect(await decode()).toEqual(configuration);
  await partPicker(page);await noOverflow(page);
  expect(await picker.locator('summary').evaluate(e=>getComputedStyle(e,'::after').content)).toBe('none');
  expect(await picker.locator('label').first().evaluate(e=>getComputedStyle(e).flexDirection)).toBe('row');
  await page.screenshot({path:resolve(evidence,`multi-parts-${lang}-${width}.png`)});
  await picker.locator('[data-part="base-top"]').check();for(const id of ['base-front','wall-front','base-body','wall-body'])await expect(picker.locator(`[data-part="${id}"]`)).not.toBeChecked();
  await picker.locator('summary').click();await expect(page.locator('[data-finish="walnut"]')).toHaveCount(0);await page.locator('[data-finish="grey-stone"]').click();await ready(page);
  configuration=await decode();base=configuration[4].find((c:unknown[])=>c[1]==='base');expect(base[8]).toBe('grey-stone');expect(base[5]).toBe('walnut');
  await partPicker(page);await picker.locator('[data-part="base-top"]').uncheck();await picker.locator('summary').click();
  for(const swatch of await page.locator('[data-finish]').all())await expect(swatch).toBeDisabled();
  const unchanged=page.url();await page.getByRole('button',{name:p[lang].doorsOnly,exact:true}).click();expect(page.url()).toBe(unchanged);
  await page.getByRole('button',{name:t[lang].save,exact:true}).click();await expect(page.getByRole('dialog')).toContainText(t[lang].savedOk);
  const raster=await roomRaster(page);await page.reload();await ready(page);expect(await decode()).toEqual(configuration);expect(await roomRaster(page)).toBe(raster);
  await expect(page.getByRole('link',{name:p[lang].consult,exact:true})).toBeInViewport();
});
