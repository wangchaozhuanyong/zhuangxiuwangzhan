import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {join,resolve} from 'node:path';
import {readCompleteSeoSources,qualifiesLocale,currentSourcePath} from './seo-material-pages.mjs';
import {buildQualifiedManifest} from './generate-seo-manifest.mjs';
import {buildQualifiedSitemap} from './generate-sitemap.mjs';
import {buildQualifiedLlms} from './generate-llms.mjs';
const tables=['projects','blog_posts','materials','service_areas','landing_pages','services','site_pages','cms_pages'];
const prefix={projects:'/projects',blog_posts:'/blog',materials:'/materials',service_areas:'/locations',landing_pages:'/landing',services:'/services',site_pages:'',cms_pages:''};
const evidenceRoot=process.env.FIXTURE_OUTPUT_ROOT;
if(!evidenceRoot)throw new Error('project-owned FIXTURE_OUTPUT_ROOT required');
mkdirSync(evidenceRoot,{recursive:true});
const row=(table,i)=>({id:String(i).padStart(8,'0'),status:'published',slug:`current-${table}-${i}`,path:`/current-${table}-${i}`,title_en:`Current ${i}`,title_zh:`当前${i}`,content_en:'Actual selected language body',content_zh:'当前中文正文',cms_sections:[{status:'published',deleted_at:null,content_en:{rich_text:'Published EN child'},content_zh:{rich_text:'已发布中文子块'}}],category:'flooring',subcategory:'spc-vinyl',excerpt_en:'Selected excerpt',excerpt_zh:'中文摘要'});
const records=n=>Object.fromEntries(tables.map(table=>[table,Array.from({length:n},(_,i)=>row(table,i+1))]));
const snapshot=async(rows,cap=500,failure)=>readCompleteSeoSources({url:'http://127.0.0.1',key:'synthetic-public-fixture',readAt:'2026-10-03T06:40:00.000Z',fetchImpl:async url=>{
 const table=url.pathname.split('/').pop();const cursor=url.searchParams.get('id')?.slice(3)||'';
 if(failure?.table===table&&(failure.first||cursor)) {
  if(failure.kind==='throw')throw new Error('synthetic timeout');
  if(failure.kind==='null')return {ok:true,json:async()=>null};
  if(failure.kind==='cursor')return {ok:true,json:async()=>[rows[table][0]]};
  return {ok:false,status:503};
 }
 return {ok:true,json:async()=>rows[table].filter(r=>r.id>cursor).slice(0,Math.min(cap,500))};
}});
const outputs=['public/sitemap.xml','public/seo-manifest.json','functions/seo-manifest.json','public/llms.txt'];
const assertDocuments=manifest=>{
 const xml=buildQualifiedSitemap(manifest),llms=buildQualifiedLlms(manifest);
 const expected=Object.values(manifest).map(m=>m.canonical).sort();
 assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort(),expected);
 assert.deepEqual(llms.split('## Canonical URL List\n')[1].split('\n## Notes')[0].split('\n').filter(s=>s.startsWith('- ')).map(s=>s.slice(2)).sort(),expected);
 assert.equal(new Set(Object.values(manifest).map(m=>m.source_version)).size,1);
 for(const m of Object.values(manifest))for(const url of Object.values(m.hreflang))assert.ok(expected.includes(url));
 return {xml,llms};
};
for(const cap of [100,1000])test(`8 tables x 551 complete exact URLs at server cap ${cap}`,async()=>{
 const rows=records(551);const source=await snapshot(rows,cap);const empty=await snapshot(records(0));
 const base=await buildQualifiedManifest(empty);const manifest=await buildQualifiedManifest(source);
 const expected=new Set(Object.keys(base));
 for(const [table,items]of Object.entries(rows))for(const item of items)for(const lang of ['en','zh'])expected.add(`/${lang}${prefix[table]}${prefix[table]?'/'+item.slug:item.path}`);
 assert.deepEqual(Object.keys(manifest).sort(),[...expected].sort());assertDocuments(manifest);
});
test('withdraw/delete/restore/slug/language + CMS child eligibility + static protections',async()=>{
 const rows=records(1);const original=await buildQualifiedManifest(await snapshot(rows));
 const old='/en/blog/current-blog_posts-1';assert.ok(original[old]);
 rows.blog_posts=[];rows.cms_pages=[];let m=await buildQualifiedManifest(await snapshot(rows));assert.ok(!m[old]);assert.ok(!m['/en/current-cms_pages-1']);
 assert.ok(m['/en/services/old-house']);assert.ok(m['/zh/materials/category/whole-house-custom/wardrobes']);assert.ok(m['/en/furniture']);assert.ok(!m['/en/services/office']);assertDocuments(m);
 rows.blog_posts=[row('blog_posts',1)];rows.blog_posts[0].slug='moved';rows.blog_posts[0].content_zh='';rows.blog_posts[0].seo_title_zh='SEO-only must not qualify';
 m=await buildQualifiedManifest(await snapshot(rows));assert.ok(!m[old]);assert.ok(m['/en/blog/moved']);assert.ok(!m['/zh/blog/moved']);assert.deepEqual(m['/en/blog/moved'].available_locales,['en']);assertDocuments(m);
 rows.blog_posts[0].content_zh='恢复中文';m=await buildQualifiedManifest(await snapshot(rows));assert.ok(m['/zh/blog/moved']);assertDocuments(m);
 const cms=row('cms_pages',1);cms.content_en='table content is not CMS child evidence';cms.cms_sections[0].status='draft';assert.equal(qualifiesLocale(cms,'cms_page','en'),false);
 cms.cms_sections[0].status='published';cms.cms_sections[0].deleted_at='2026-10-03';assert.equal(qualifiesLocale(cms,'cms_page','en'),false);
 const material=row('materials',1);material.content_en='';material.price=null;material.stock=null;assert.equal(qualifiesLocale(material,'material','en'),true);
});
for(const table of tables)for(const first of [true,false])test(`${table} ${first?'initial':'later'} failure rejects whole snapshot`,async()=>assert.rejects(snapshot(records(551),100,{table,first})));
for(const kind of ['null','cursor','throw'])test(`${kind} later page rejects`,async()=>assert.rejects(snapshot(records(551),100,{table:'blog_posts',kind})));
test('missing configured source rejects instead of empty success',async()=>assert.rejects(readCompleteSeoSources({url:'',key:''})));
test('mixed/incomplete manifest rejected by AI builder',()=>{assert.throws(()=>buildQualifiedLlms({a:{source_version:'one',source_hash:'h',source_complete:true,qualification:'eligible'},b:{source_version:'two',source_hash:'h',source_complete:true,qualification:'eligible'}}));});
test('current source owner cannot be revived by a second owner; renderer-owned fallback survives metadata override',async()=>{
 const rows=records(0);
 rows.blog_posts=[{...row('blog_posts',1),content_en:'',content_zh:''}];
 rows.site_pages=[{...row('site_pages',1),path:'/blog/current-blog_posts-1'},{...row('site_pages',2),path:'/about',title_en:'First current owner'}];
 rows.cms_pages=[{...row('cms_pages',1),path:'/about',title_en:'Later generic owner'}];
 let m=await buildQualifiedManifest(await snapshot(rows));
 assert.ok(!m['/en/blog/current-blog_posts-1']);assert.ok(!m['/zh/blog/current-blog_posts-1']);
 assert.equal(m['/en/about'].owned_static,true);assert.match(m['/en/about'].title,/First current owner/);assertDocuments(m);
 rows.site_pages=[];rows.cms_pages=[];m=await buildQualifiedManifest(await snapshot(rows));
 assert.equal(m['/en/about'].owned_static,true);assert.equal(m['/zh/about'].owned_static,true);assertDocuments(m);
});

test('published metadata-only built-in pages override seeds without admitting empty dynamic pages',async()=>{
 const rows=records(0);
 rows.site_pages=[{...row('site_pages',1),path:'/contact',content_en:'',content_zh:'',items_en:[],items_zh:[],seo_title_en:'Current contact metadata',seo_title_zh:'当前联系元信息',seo_description_en:'Current description',seo_description_zh:'当前说明'}, {...row('site_pages',2),path:'/metadata-only-dynamic',content_en:'',content_zh:'',items_en:[],items_zh:[],seo_title_en:'Metadata alone is not a body'}];
 const manifest=await buildQualifiedManifest(await snapshot(rows));
 assert.equal(manifest['/en/contact'].title,'Current contact metadata | FLASH CAST SDN. BHD.');
 assert.equal(manifest['/zh/contact'].description,'当前说明');
 assert.equal(manifest['/en/contact'].owned_static,true);
 assert.deepEqual(manifest['/en/contact'].available_locales,['en','zh']);
 assert.ok(!manifest['/en/metadata-only-dynamic']);
 assert.ok(!manifest['/zh/metadata-only-dynamic']);
 assertDocuments(manifest);
});
test('metadata-only builtin retains its localized seed title and validates relative sharing images',async()=>{
 const seed=await buildQualifiedManifest(await snapshot(records(0)));
 for(const [image_url,expected] of [['images/current.webp','https://flashcast.com.my/images/current.webp'],['http://','https://flashcast.com.my/og-image.webp'],['javascript:alert(1)','https://flashcast.com.my/og-image.webp']]){
  const rows=records(0);
  rows.site_pages=[{...row('site_pages',1),path:'/contact',title_zh:'',content_zh:'',content_en:'',items_zh:[],items_en:[],seo_description_zh:'当前联系说明',image_url}];
  const manifest=await buildQualifiedManifest(await snapshot(rows));
  assert.equal(manifest['/zh/contact'].title,seed['/zh/contact'].title);
  assert.equal(manifest['/zh/contact'].ogImage,expected);
 }
});
test('real three script entrypoints write coherent documents; failing source preserves all prior bytes',async()=>{
 const runRoot=mkdtempSync(join(evidenceRoot,'actual-entrypoints-'));symlinkSync(resolve('src'),join(runRoot,'src'));symlinkSync(resolve('node_modules'),join(runRoot,'node_modules'));
 for(const f of outputs){mkdirSync(join(runRoot,f,'..'),{recursive:true});writeFileSync(join(runRoot,f),'prior legal fixture');}
 let fail=false;const rows=records(2);
 rows.site_pages[0].path='/services/office';rows.cms_pages[0].path='/services/office';rows.materials[0].category='furniture';rows.services[0].slug='service 中文';rows.landing_pages[0].slug='landing space';
 const server=createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');const table=u.pathname.split('/').pop();if(fail){res.writeHead(503);res.end('{}');return;}const cursor=u.searchParams.get('id')?.slice(3)||'';res.setHeader('Content-Type','application/json');res.end(JSON.stringify((rows[table]||[]).filter(r=>r.id>cursor).slice(0,1)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const run=script=>new Promise(r=>{let log='';const p=spawn(process.execPath,[resolve('scripts',script)],{cwd:runRoot,env:{...process.env,VITE_SUPABASE_URL:`http://127.0.0.1:${server.address().port}`,VITE_SUPABASE_ANON_KEY:'synthetic-public-fixture'}});p.stdout.on('data',d=>log+=d);p.stderr.on('data',d=>log+=d);p.on('exit',code=>r({code,log}));});
 const checks=[];
 try{for(const script of ['generate-sitemap.mjs','generate-seo-manifest.mjs','generate-llms.mjs']){let r=await run(script);assert.equal(r.code,0,r.log);const m=JSON.parse(readFileSync(join(runRoot,'public/seo-manifest.json')));assertDocuments(m);assert.equal(readFileSync(join(runRoot,outputs[1]),'utf8'),readFileSync(join(runRoot,outputs[2]),'utf8'));checks.push({script,success:true,urls:Object.keys(m).length});}
 const prior=Object.fromEntries(outputs.map(f=>[f,readFileSync(join(runRoot,f),'utf8')]));fail=true;for(const script of ['generate-sitemap.mjs','generate-seo-manifest.mjs','generate-llms.mjs']){const r=await run(script);assert.notEqual(r.code,0);for(const f of outputs)assert.equal(readFileSync(join(runRoot,f),'utf8'),prior[f]);checks.push({script,failure_preserves_all:true});}
 writeFileSync(join(runRoot,'actual-entrypoint-proof.json'),JSON.stringify(checks,null,2));
 }finally{await new Promise(r=>server.close(r));}
});

test('existing redirect sources cannot re-enter via site_pages or cms_pages',async()=>{
 const paths=['/services/office','/services/shoplot','/materials/acrylic-high-gloss-white','/materials/melamine-grey-oak','/materials/spc-vinyl-natural-oak','/products','/landing/office-renovation'];
 for(const table of ['site_pages','cms_pages'])for(const path of paths){
  const rows=records(0);rows[table]=[{...row(table,1),path}];const m=await buildQualifiedManifest(await snapshot(rows));const {xml,llms}=assertDocuments(m);
  for(const lang of ['en','zh']){const route=`/${lang}${path}`;assert.ok(!m[route]);assert.ok(!xml.includes(`https://flashcast.com.my${route}<`));assert.ok(!llms.includes(`https://flashcast.com.my${route}\n`));}
 }
});
test('nonstatic qualified furniture locales, withdrawal, restoration and static duplicate ownership',async()=>{
 const rows=records(0);const item={...row('materials',1),category:'furniture',slug:'qa-managed-furniture-not-static'};rows.materials=[item];
 let m=await buildQualifiedManifest(await snapshot(rows));const route='/furniture/product/'+item.slug;
 for(const lang of ['en','zh']){assert.ok(m[`/${lang}${route}`]);assert.equal(m[`/${lang}${route}`].owned_static,false);}assertDocuments(m);
 item.content_zh='';item.excerpt_zh='';m=await buildQualifiedManifest(await snapshot(rows));assert.ok(!m[`/zh${route}`]);assert.deepEqual(m[`/en${route}`].available_locales,['en']);assertDocuments(m);
 rows.materials=[];m=await buildQualifiedManifest(await snapshot(rows));assert.ok(!m[`/en${route}`]);assertDocuments(m);
 item.content_zh='恢复中文';rows.materials=[item];m=await buildQualifiedManifest(await snapshot(rows));assert.ok(m[`/zh${route}`]);assertDocuments(m);
 const base=await buildQualifiedManifest(await snapshot(records(0)));const staticEntry=Object.values(base).find(x=>x.path.startsWith('/furniture/product/'));
 item.slug=decodeURIComponent(staticEntry.path.split('/').pop());m=await buildQualifiedManifest(await snapshot(rows));
 for(const lang of ['en','zh']){assert.equal(m[`/${lang}${staticEntry.path}`].source_kind,'furniture_catalogue');assert.equal(m[`/${lang}${staticEntry.path}`].title,base[`/${lang}${staticEntry.path}`].title);}assertDocuments(m);
});
test('services and landing source serialization agrees with canonical, alternates and documents',async()=>{
 for(const table of ['services','landing_pages'])for(const slug of ['qa source item','空间 design','encoded%20space']){
  const rows=records(0);const item={...row(table,1),slug};rows[table]=[item];const path=currentSourcePath(item,table==='services'?'service':'landing_page');
  const m=await buildQualifiedManifest(await snapshot(rows));for(const lang of ['en','zh']){const route=`/${lang}${path}`;assert.ok(m[route]);assert.equal(m[route].canonical,'https://flashcast.com.my'+route);assert.equal(m[route].path,path);assert.deepEqual(m[route].available_locales,['en','zh']);}
  const {xml,llms}=assertDocuments(m);assert.ok(xml.includes('https://flashcast.com.my/en'+path));assert.ok(llms.includes('https://flashcast.com.my/zh'+path));
 }
});

test('two exact published route templates in both source tables remain complete but never canonical documents',async()=>{
 for(const table of ['site_pages','cms_pages']){
  const rows=records(0);
  rows[table]=[
   {...row(table,1),path:'/materials/category/:categorySlug'},
   {...row(table,2),path:'/services/:slug'},
   {...row(table,3),path:'/materials/category/qa-actual-category'},
   {...row(table,4),path:'/services/qa-actual-service'},
  ];
  const source=await snapshot(rows,1),withoutTemplates=await snapshot({...rows,[table]:rows[table].slice(2)},1);
  assert.equal(source.complete,true);assert.deepEqual(source.rows[table],rows[table]);
  assert.notEqual(source.sourceHash,withoutTemplates.sourceHash);
  const manifest=await buildQualifiedManifest(source),{xml,llms}=assertDocuments(manifest);
  for(const item of rows[table].slice(0,2)){
   assert.equal(currentSourcePath(item,table==='site_pages'?'site_page':'cms_page'),null);
   for(const lang of ['en','zh'])assert.ok(!manifest[`/${lang}${item.path}`]);
  }
  for(const item of rows[table].slice(2))for(const lang of ['en','zh'])assert.ok(manifest[`/${lang}${item.path}`]);
  assert.ok(!xml.includes(':slug')&&!xml.includes(':categorySlug')&&!xml.includes('%3A'));
  assert.ok(!llms.includes(':slug')&&!llms.includes(':categorySlug')&&!llms.includes('%3A'));
 }
});
test('template exception cannot admit other invalid paths or bypass row eligibility',async()=>{
 for(const table of ['site_pages','cms_pages']){
  for(const path of ['/services/:other','/materials/category/:other','/unknown/:slug','/services/:slug?query=1','/services/:slug/extra','/admin/secret','/en/services/qa','/../secret','/services/qa#fragment','/services/qa.html']){
   const rows=records(0);rows[table]=[{...row(table,1),path}];
   await assert.rejects(snapshot(rows),new RegExp(`seo_source_invalid:${table}`));
  }
  for(const override of [{id:1},{status:'draft'}]){
   const rows=records(0);rows[table]=[{...row(table,1),path:'/services/:slug',...override}];
   await assert.rejects(snapshot(rows),new RegExp(`seo_source_invalid:${table}`));
  }
 }
 const deleted=records(0);deleted.cms_pages=[{...row('cms_pages',1),path:'/services/:slug',deleted_at:'2026-10-03'}];
 await assert.rejects(snapshot(deleted),/seo_source_invalid:cms_pages/);
});
