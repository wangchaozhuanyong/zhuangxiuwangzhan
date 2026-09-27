import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const root = process.cwd();
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
function run(mode, execute = false, existing = null) {
  const dir = mkdtempSync(resolve(root, 'audits/repair-unified-release-20260927/publisher-test-'));
  const preload = `
    import fs from 'node:fs';
    let saved=${JSON.stringify(existing)};const writes=[];const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reorder(x)])):v;const mode=${JSON.stringify(mode)};
    globalThis.fetch=async (url,options={})=>{
      if(url.includes('/rest/v1/services'))return Response.json(saved?[reorder(saved)]:mode==='conflict'?[{id:'existing',status:'published',title_en:'Changed'}]:[]);
      if(url.endsWith('/__flashcast/version'))return Response.json({deploymentVersion:mode==='wrong-deployment'?'old':${JSON.stringify(head)}});
      if(url.includes('/images/'))return new Response(null,{headers:{'content-type':'image/webp'}});
      const body=JSON.parse(options.body);
      if(body.mode==='dry-run')return Response.json({ok:true,existing_id:mode==='hidden-record'?'unpublished':null,payload_preview:body.record});
      writes.push(body);saved=reorder({...body.record,id:'created',status:'published',updated_at:'2026-09-27T00:00:00Z'});
      return Response.json({ok:true,saved_id:'created',saved_updated_at:saved.updated_at});
    };
    process.on('exit',()=>fs.writeFileSync(${JSON.stringify(resolve(dir,'requests.json'))},JSON.stringify(writes)));
  `;
  const args = ['--import',`data:text/javascript,${encodeURIComponent(preload)}`,'scripts/publish-surface-repair.mjs',`--artifact-dir=${dir}`];
  if(execute)args.push('--execute','--approval-id=owner-test',`--expected-source-sha=${head}`);
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',env:{...process.env,VITE_SUPABASE_URL:'https://rbsnyexjifounogswrjp.supabase.co',VITE_SUPABASE_ANON_KEY:'fixture-key',CONTENT_PUBLISH_SECRET:'fixture-secret'}});
  const writes=JSON.parse(readFileSync(resolve(dir,'requests.json'),'utf8'));
  rmSync(dir,{recursive:true});return {result,writes};
}
test('dry-run never sends a write',()=>{const {result,writes}=run('new');assert.equal(result.status,0,result.stderr);assert.equal(writes.length,0);});
for(const mode of ['conflict','hidden-record','wrong-deployment'])test(`rejects ${mode} before writing`,()=>{const {result,writes}=run(mode,true);assert.equal(result.status,1);assert.equal(writes.length,0);});
test('publishes and verifies nested JSONB objects regardless of database key order',()=>{
  const {result,writes}=run('new',true);assert.equal(result.status,0,result.stderr);assert.equal(writes.length,1);
  assert.equal(writes[0].record.slug,'surface-repair');assert.equal(writes[0].ownerApproved,true);assert.equal(writes[0].explicitExecution,true);
  assert.equal(writes[0].expectedUpdatedAt,'1970-01-01T00:00:00.000Z');assert.equal(writes[0].record.scope_items_zh.length,8);assert.equal(writes[0].record.scope_items_en.length,8);
});

test('an identical saved record with reordered JSONB keys is verified without a second write',()=>{
  const first=run('new',true);assert.equal(first.result.status,0,first.result.stderr);
  const existing={...first.writes[0].record,id:'created',status:'published',updated_at:'2026-09-27T00:00:00Z'};
  const {result,writes}=run('same',true,existing);assert.equal(result.status,0,result.stderr);assert.equal(writes.length,0);
  assert.equal(JSON.parse(result.stdout).alreadyPublished,true);
});
