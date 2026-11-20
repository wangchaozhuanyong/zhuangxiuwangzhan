import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,copyFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {lookup} from 'node:dns/promises';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
import {LOCATION_SEVEN_BODY_TARGETS} from '../supabase/functions/_shared/location-seven-body-targets.ts';
import {verifyGithubOidcToken} from '../supabase/functions/content-publish/github-oidc.ts';
import {issueManagedPermit,readManagedPermit} from '../supabase/functions/content-publish/permit-issuer.ts';
import {write,checkRawMetadata,checkAreaBrowser,checkAreaSitemap} from './lib/location-body-acceptance.mjs';

export const TARGET='location-seven-body-20261119-v1';
export const CHERAS_TARGET='location-cheras-final-20261119-v1';
export const APPROVAL_ID='owner-approved-location-seven-after-kl-20261119';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const WORKFLOW='wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main';
const SOURCE='docs/seo/location-pages-batch-1.md';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const project=(row,fields)=>Object.fromEntries(fields.map(f=>[f,row[f]??null]));
const selection=t=>({taskId:t.taskId,actionId:t.actionId,scope:t.scope,candidateVersion:t.candidateVersion,operation:'publish'});
export const COMPLETED_RECEIPTS=JSON.parse(readFileSync(resolve(ROOT,'scripts/location-seven-completed-receipts.json'),'utf8'));
export function assertCompletedRow(t,row,receipt) {
  assert.equal(receipt.id,t.id);assert.equal(row.id,t.id);assert.equal(row.slug,t.slug);assert.equal(row.status,'published');
  assert.equal(row.updated_at,receipt.savedUpdatedAt,'Completed row version changed; do not overwrite it');
  assert.equal(digest(project(row,t.changedFields)),t.desiredFieldsSha256,'Completed body changed');
  assert.equal(digest(project(row,t.retainedProjectionFields)),t.retainedFieldsSha256,'Completed retained fields changed');
}
export function assertCompletedPermit(t,row,receipt,permit) {
  assertCompletedRow(t,row,receipt);assert(permit,'Completed permit is absent');
  const expected={permit_id:receipt.permitId,status:'completed',operation:'publish',task_id:t.taskId,action_id:t.actionId,
    candidate_version:t.candidateVersion,scope:t.scope,record_id:t.id,slug:t.slug,saved_id:t.id,
    expected_updated_at:t.expectedUpdatedAt,saved_updated_at:receipt.savedUpdatedAt,payload_sha256:t.desiredFieldsSha256,
    rollback_payload_sha256:t.rollbackFieldsSha256,github_workflow_ref:WORKFLOW,github_workflow_sha:receipt.githubWorkflowSha};
  for(const [field,value] of Object.entries(expected))assert.equal(permit[field],value,`Completed permit ${field} differs`);
  assert.equal(Number(permit.github_repository_id),1248188229);assert.equal(Number(permit.github_run_id),receipt.githubRunId);
  assert.equal(Number(permit.github_run_attempt),receipt.githubRunAttempt);assert.equal(Number(permit.github_actor_id),receipt.githubActorId);
}
function readCompletedEvidence() {
  assert.equal(COMPLETED_RECEIPTS.schema,'location-seven-completed-receipts/v1');
  assert.equal(COMPLETED_RECEIPTS.parentRunId,44527250913);
  assert.deepEqual(COMPLETED_RECEIPTS.receipts.map(r=>r.slug),['petaling-jaya','subang-jaya']);
  const source=resolve(ROOT,'audits/previous-location-seven-44527250913/location-seven');
  const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
  assert.equal(hash(join(source,'identity-probe.json')),COMPLETED_RECEIPTS.identitySha256);
  const identity=JSON.parse(readFileSync(join(source,'identity-probe.json'),'utf8')).identity;
  assert.equal(identity.runId,44527250913);assert.equal(identity.repositoryId,1248188229);assert.equal(identity.workflowRef,WORKFLOW);
  return new Map(COMPLETED_RECEIPTS.receipts.map(receipt=>{
    const dir=join(source,receipt.slug);
    assert.equal(identity.workflowSha,receipt.githubWorkflowSha);assert.equal(identity.actorId,receipt.githubActorId);
    for(const name of ['completion.json','permit-issued.json','publish-receipt.json','before-browser.json'])assert.equal(hash(join(dir,name)),receipt.filesSha256[name]);
    const completion=JSON.parse(readFileSync(join(dir,'completion.json'),'utf8'));
    const published=JSON.parse(readFileSync(join(dir,'publish-receipt.json'),'utf8'));
    const issued=JSON.parse(readFileSync(join(dir,'permit-issued.json'),'utf8'));
    assert(completion.ok&&completion.rollbackPreviewOnly);assert.equal(completion.slug,receipt.slug);
    assert.equal(completion.savedUpdatedAt,receipt.savedUpdatedAt);assert.equal(published.saved_id,receipt.id);
    assert.equal(published.saved_updated_at,receipt.savedUpdatedAt);assert.equal(published.dry_run,false);assert.equal(issued.permitId,receipt.permitId);
    return [receipt.slug,{...receipt,dir,beforeBrowser:JSON.parse(readFileSync(join(dir,'before-browser.json'),'utf8'))}];
  }));
}
export function readCandidates() {
  const source=readFileSync(resolve(ROOT,SOURCE),'utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(source).digest('hex'),'77f9d5eb3b751863247ccf9e919edf63c33f0a2b607edb4e9e68566aaf4b9b17');
  assert.equal(LOCATION_SEVEN_BODY_TARGETS.length,7);
  return LOCATION_SEVEN_BODY_TARGETS.map(t=>{
    assert.notEqual(t.slug,'kuala-lumpur');
    const section=source.split('## `/locations/'+t.slug+'`')[1]?.split('\n## ')[0];
    assert(section,'Missing approved source');
    const blocks=[...section.matchAll(/```html\n([\s\S]*?)\n```/g)].map(m=>m[1]);
    assert.equal(blocks.length,2);
    const desired={content_en:blocks[0],content_zh:blocks[1]};
    assert.equal(digest(desired),t.desiredFieldsSha256);
    return {t,desired};
  });
}
export function selectCandidates(target) {
  assert([TARGET,CHERAS_TARGET].includes(target),'Unknown regional publishing selector');
  const candidates=readCandidates();
  return target===CHERAS_TARGET?candidates.filter(c=>c.t.slug==='cheras'):candidates;
}
export function assertBaseline(t,row) {
  assert.equal(row.id,t.id);assert.equal(row.slug,t.slug);assert.equal(row.status,'published');
  assert.equal(row.updated_at,t.expectedUpdatedAt,'Version changed; refresh the candidate');
  assert.equal(digest(project(row,t.baselineProjectionFields)),t.baselineFieldsSha256,'Baseline changed');
}
export function assertEnvironment(e,sha) {
  assert.equal(e.GITHUB_ACTIONS,'true');assert.equal(e.GITHUB_REF,'refs/heads/main');
  assert.equal(e.GITHUB_REPOSITORY,'wangchaozhuanyong/zhuangxiuwangzhan');assert.equal(e.GITHUB_REPOSITORY_ID,'1248188229');
  assert.equal(e.GITHUB_WORKFLOW_REF,WORKFLOW);assert.equal(e.GITHUB_EVENT_NAME,'workflow_dispatch');
  assert.equal(e.GITHUB_SHA,sha);assert.match(sha,/^[a-f0-9]{40}$/);
  assert([TARGET,CHERAS_TARGET].includes(e.PUBLISH_TARGET));assert.equal(e.APPROVAL_ID,APPROVAL_ID);
  assert.equal(e.MANAGED_OPERATION,'publish');assert(!e.MANAGED_PERMIT_ID&&!e.PARENT_RUN_ID);
  assert(['dry-run','publish'].includes(e.PUBLISH_MODE));
  assert.equal(new URL(e.VITE_SUPABASE_URL).origin,'https://rbsnyexjifounogswrjp.supabase.co');
  assert.equal(e.VITE_SITE_URL,'https://flashcast.com.my');
  for(const key of ['CONTENT_PUBLISH_SECRET','VITE_SUPABASE_ANON_KEY','ACTIONS_ID_TOKEN_REQUEST_TOKEN','ACTIONS_ID_TOKEN_REQUEST_URL'])assert(e[key]);
  if(e.PUBLISH_MODE==='publish')assert(e.SUPABASE_SERVICE_ROLE_KEY);
}
async function main() {
  const e=process.env;assert.equal(resolve(process.cwd()),resolve(ROOT));
  assertEnvironment(e,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
  const candidates=selectCandidates(e.PUBLISH_TARGET),previous=e.PUBLISH_TARGET===TARGET?readCompletedEvidence():new Map(),output=resolve(ROOT,'audits',`content-publish-${e.GITHUB_RUN_ID}`,'location-seven');
  const reader=createClient(e.VITE_SUPABASE_URL,e.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  const issuer=e.PUBLISH_MODE==='publish'?createClient(e.VITE_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}):null;
  const completedPermit=async receipt=>{const {data,error}=await issuer.from('managed_cms_release_permits').select('*').eq('permit_id',receipt.permitId).maybeSingle();assert(!error,'Completed permit lookup failed');return data;};
  const read=async t=>{const {data,error}=await reader.from('service_areas').select(t.baselineProjectionFields.join(',')).eq('id',t.id).maybeSingle();assert(!error&&data,'Read failed');return data;};
  const {data:identity,error:identityError}=await reader.from('site_settings').select('id,company_name,brand_name,updated_at').eq('id','default').single();
  assert(!identityError&&identity?.company_name&&identity?.brand_name,'Public identity unavailable');write(join(output,'site-identity.json'),identity);
  const oidcUrl=new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL);oidcUrl.searchParams.set('audience','api://flashcast-managed-cms-publish');
  const oidcResponse=await fetch(oidcUrl,{headers:{Authorization:`Bearer ${e.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}});assert(oidcResponse.ok);
  const oidc=(await oidcResponse.json()).value,verified=await verifyGithubOidcToken(oidc);
  assert.deepEqual(verified,{repositoryId:1248188229,actorId:Number(e.GITHUB_ACTOR_ID),workflowRef:WORKFLOW,workflowSha:e.GITHUB_SHA,runId:Number(e.GITHUB_RUN_ID),runAttempt:Number(e.GITHUB_RUN_ATTEMPT)});
  const post=async body=>{const response=await fetch(`${e.VITE_SUPABASE_URL}/functions/v1/content-publish`,{method:'POST',headers:{'content-type':'application/json','x-cron-secret':e.CONTENT_PUBLISH_SECRET,'x-managed-github-oidc':oidc},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});const result=await response.json();assert(response.ok&&result.ok===true,`Protected publisher HTTP ${response.status}: ${result.error||'failed'}`);return result;};
  const probe=await post({managedIdentityProbe:true});assert.equal(probe.performed_write,false);assert.deepEqual(probe.identity,verified);write(join(output,'identity-probe.json'),probe);
  const klTarget={id:'4e2cd77f-ac25-4a16-87bc-03652c4121b1',baselineProjectionFields:candidates[0].t.baselineProjectionFields};
  const klBefore=await read(klTarget);write(join(output,'kl-before.json'),klBefore);
  // Verify the two immutable completed receipts without replaying them; preview
  // all five untouched baselines before any fresh one-use permit is issued.
  for(const c of candidates) {
    c.before=await read(c.t);c.completed=previous.get(c.t.slug);
    if(c.completed) {
      assertCompletedRow(c.t,c.before,c.completed);
      if(issuer)assertCompletedPermit(c.t,c.before,c.completed,await completedPermit(c.completed));
      write(join(output,c.t.slug,'completed-receipt-check.json'),{ok:true,readOnly:true,originalRunId:c.completed.githubRunId,permitId:c.completed.permitId,savedUpdatedAt:c.completed.savedUpdatedAt,bodySha256:c.t.desiredFieldsSha256,retainedFieldsSha256:c.t.retainedFieldsSha256,serverPermitVerified:Boolean(issuer)});
      for(const name of ['permit-issued.json','publish-receipt.json','before-browser.json'])copyFileSync(join(c.completed.dir,name),join(output,c.t.slug,name));
      continue;
    }
    assertBaseline(c.t,c.before);
    c.rollback=project(c.before,c.t.changedFields);
    assert.equal(digest(c.rollback),c.t.rollbackFieldsSha256);
    c.request={contentType:'service_area',mode:'dry-run',nextStatus:'published',expectedUpdatedAt:c.t.expectedUpdatedAt,record:{...c.before,...c.desired},managedCandidate:selection(c.t)};
    const preview=await post(c.request);assert.equal(preview.dry_run,true);assert.deepEqual(preview.payload_preview,c.desired);
    assert.equal(digest(await read(c.t)),digest(c.before));
    write(join(output,c.t.slug,'preview.json'),{before:c.before,desired:c.desired,rollback:c.rollback,preview,productionWrites:0});
  }
  const allSlugs=['kuala-lumpur',...readCandidates().map(c=>c.t.slug)];
  const alreadyPublished=candidates.filter(c=>c.completed).length,pendingPreviews=candidates.length-alreadyPublished;
  write(join(output,'before-sitemap.json'),await checkAreaSitemap(allSlugs));
  if(!issuer){write(join(output,'completion.json'),{ok:true,mode:'dry-run',records:candidates.length,alreadyPublished,pendingPreviews,productionWrites:0});return;}
  const ipv4=await lookup('flashcast.com.my',{family:4});
  write(join(output,'browser-transport.json'),{host:'flashcast.com.my',currentPublicDnsAddress:ipv4.address,quic:false,httpsCertificateValidation:true});
  const browser=await chromium.launch({headless:true,args:['--disable-quic',`--host-resolver-rules=MAP flashcast.com.my ${ipv4.address}`]});
  try {
    for(const c of candidates) {
      const {t}=c,dir=join(output,t.slug);
      if(c.completed) {
        assertCompletedPermit(t,await read(t),c.completed,await completedPermit(c.completed));
        const metadata=[];for(const lang of ['en','zh'])metadata.push(await checkRawMetadata(c.before,lang,identity));write(join(dir,'public-metadata.json'),metadata);
        await checkAreaBrowser({browser,row:c.before,body:c.desired,identity,widths:[360,390,768,1024,1440],output:dir,mode:'after',baseline:c.completed.beforeBrowser});
        assertCompletedRow(t,await read(t),c.completed);
        write(join(dir,'completion.json'),{ok:true,slug:t.slug,savedUpdatedAt:c.completed.savedUpdatedAt,records:1,fields:2,retainedFields:t.retainedProjectionFields.length,rollbackPreviewOnly:true,readOnly:true,originalRunId:c.completed.githubRunId});
        continue;
      }
      assertBaseline(t,await read(t));
      const beforeBrowser=await checkAreaBrowser({browser,row:c.before,body:c.before,identity,widths:[390],output:dir,mode:'before'});
      assertBaseline(t,await read(t));
      const {data:prior,error}=await issuer.from('managed_cms_release_permits').select('permit_id,status,expires_at').eq('task_id',t.taskId).eq('record_id',t.id).eq('candidate_version',t.candidateVersion);
      assert(!error);assert(!(prior||[]).some(p=>['completed','writing','uncertain'].includes(p.status)||['issued','claimed'].includes(p.status)&&Date.parse(p.expires_at)>Date.now()),'Prior active/completed permit: inspect without replay');
      const evidence={approvalId:APPROVAL_ID,ownerApproved:true,explicitExecution:true,source:SOURCE,sourceSha256:'77f9d5eb3b751863247ccf9e919edf63c33f0a2b607edb4e9e68566aaf4b9b17',approvalSource:'Owner accepted KL layout and explicitly authorized the remaining seven in this Codex conversation on 2026-11-19',baselineSha256:t.baselineFieldsSha256,desiredSha256:t.desiredFieldsSha256,identity:verified};
      write(join(dir,'issuer-evidence.json'),evidence);
      const issued=await issueManagedPermit(issuer,{permitId:randomUUID(),...selection(t),actionClass:'cms_write',recordId:t.id,slug:t.slug,expectedUpdatedAt:t.expectedUpdatedAt,payloadSha256:t.desiredFieldsSha256,rollbackPayloadSha256:t.rollbackFieldsSha256,githubActorId:verified.actorId,githubWorkflowSha:verified.workflowSha,qaReceiptId:`location-seven-${t.slug}-${e.GITHUB_RUN_ID}`,operationsDecisionId:APPROVAL_ID,policyDecisionId:'exact-bilingual-body-cas-oidc-v1',issuerEvidenceSha256:digest(evidence),expiresAt:new Date(Date.now()+10*60000).toISOString()});
      write(join(dir,'permit-issued.json'),issued);
      const request={...c.request,mode:'publish',ownerApproved:true,explicitExecution:true,approvalId:APPROVAL_ID,managedPermit:{...selection(t),permitId:issued.permitId}};delete request.managedCandidate;
      const receipt=await post(request);write(join(dir,'publish-receipt.json'),receipt);
      const saved=await read(t),completed=await readManagedPermit(issuer,issued.permitId);write(join(dir,'readback.json'),{saved,completed});
      assert.equal(receipt.dry_run,false);assert.equal(receipt.saved_id,t.id);assert.notEqual(saved.updated_at,t.expectedUpdatedAt);
      assert.equal(digest(project(saved,t.changedFields)),t.desiredFieldsSha256);assert.equal(digest(project(saved,t.retainedProjectionFields)),t.retainedFieldsSha256);
      assert.equal(completed?.status,'completed');assert.equal(completed.githubRunId,verified.runId);assert.equal(completed.githubRunAttempt,verified.runAttempt);assert.equal(completed.savedId,t.id);assert.equal(Date.parse(completed.savedUpdatedAt),Date.parse(saved.updated_at));
      const rollbackRequest={contentType:'service_area',mode:'dry-run',nextStatus:'published',expectedUpdatedAt:saved.updated_at,record:{...saved,...c.rollback},managedCandidate:{taskId:t.taskId,actionId:`rollback-${t.candidateVersion}`,scope:t.scope,candidateVersion:`${t.candidateVersion}-rollback-v1`,operation:'rollback'}};
      const rollbackPreview=await post(rollbackRequest);assert.equal(rollbackPreview.dry_run,true);assert.deepEqual(rollbackPreview.payload_preview,c.rollback);assert.equal(digest(await read(t)),digest(saved));
      write(join(dir,'rollback-plan.json'),{parentPermitId:issued.permitId,parentRunId:verified.runId,requiresFreshOneUsePermit:true,requiresStagingVerification:true,preview:rollbackPreview,request:rollbackRequest});
      const metadata=[];for(const lang of ['en','zh'])metadata.push(await checkRawMetadata(c.before,lang,identity));write(join(dir,'public-metadata.json'),metadata);
      await checkAreaBrowser({browser,row:c.before,body:c.desired,identity,widths:[360,390,768,1024,1440],output:dir,mode:'after',baseline:beforeBrowser});
      write(join(dir,'completion.json'),{ok:true,slug:t.slug,savedUpdatedAt:saved.updated_at,records:1,fields:2,retainedFields:t.retainedProjectionFields.length,rollbackPreviewOnly:true});
    }
  } finally {await browser.close();}
  assert.equal(digest(await read(klTarget)),digest(klBefore),'KL changed during this batch');
  write(join(output,'after-sitemap.json'),await checkAreaSitemap(allSlugs));
  write(join(output,'completion.json'),{ok:true,mode:'publish',records:candidates.length,newWrites:pendingPreviews,alreadyPublished,fieldsPerRecord:2,credentialMode:'x-cron-secret',identity:verified,klUnchanged:true});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  let message=String(error?.message||'Seven-area publication failed');
  for(const key of ['CONTENT_PUBLISH_SECRET','SUPABASE_SERVICE_ROLE_KEY','VITE_SUPABASE_ANON_KEY','ACTIONS_ID_TOKEN_REQUEST_TOKEN'])if(process.env[key])message=message.split(process.env[key]).join('[redacted]');
  console.error(message);process.exitCode=1;
});
