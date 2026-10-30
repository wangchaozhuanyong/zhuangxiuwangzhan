import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { CONTACT_CMS_PAGE_TITLE_TARGETS, MANAGED_TARGETS, findManagedTarget, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { issueManagedPermit, type ManagedPermitIssue } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { targetConfigs, buildLockedDryRunRequest, assertLockedServiceCandidate, inspectPublicReadback } from "../../scripts/publish-content-trust-fixes.mjs";
import { readContactCmsPageTitleCandidate } from "../../scripts/managed-cms-targets-contact-three-titles-v1.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
type Row = Record<string, unknown>;
const bytes=readFileSync("drafts/publishing/fc-20261019-contact-conversion-malay-followthrough-v1/frozen-contact-cms-pages-three-titles.json");
const source=JSON.parse(bytes.toString()) as {before:Row;desired:Row};
const target=CONTACT_CMS_PAGE_TITLE_TARGETS[0],config=targetConfigs[target.candidateVersion];
const savedTime="2026-10-27T06:10:00.123456+00:00",permitId="11111111-1111-4111-8111-111111111111";
const context={role:"content_editor",authMode:"cron",managedIdentity:{repositoryId:1248188229,actorId:98765,
  workflowRef:"wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",workflowSha:"a".repeat(40),runId:12345,runAttempt:1}};

// Actual service/repository/validator code, synthetic transport; no real preview/permit/Save.
function database(initial:Row,options:{race?:boolean;uncertain?:boolean;corrupt?:boolean;auditFail?:boolean;nextCAS?:string}={}){
 let row={...initial},claimed=false;const writes:Row[]=[],tables:string[]=[],predicates:Array<[string,unknown]>=[],rpcs:string[]=[];
 const client={from(table:string){tables.push(table);if(table==="admin_audit_logs")return{insert:async()=>({data:null,error:options.auditFail?{message:"synthetic audit error"}:null})};
  if(table!=="cms_pages")throw new Error("No legacy page or section may be written/read by this exact path");
  let patch:Row|null=null;const filters:Array<[string,unknown]>=[];
  const result=async()=>{if(filters.some(([k,v])=>row[k]!==v)||patch&&options.race)return{data:null,error:null};
   if(patch){row={...row,...patch,updated_at:options.nextCAS||savedTime,version:Number(row.version)+1};writes.push(patch);if(options.corrupt)row.seo_title_ms="unapproved corruption";}return{data:{...row},error:null};};
  const q={select(){return q;},eq(k:string,v:unknown){filters.push([k,v]);if(patch)predicates.push([k,v]);return q;},maybeSingle:result,single:result,update(x:Row){patch=x;return q;}};return q;
 },async rpc(name:string){rpcs.push(name);if(name==="claim_managed_cms_release_permit"){if(claimed)return{data:[],error:null};claimed=true;}
  if(name==="finish_managed_cms_release_write"&&options.uncertain)return{data:[],error:null};return{data:[{}],error:null};}};
 return{client:withPublishedLinkTargets(client as unknown as ContentPublishClient),writes,tables,predicates,rpcs,row:()=>row};
}
function request(mode:"dry-run"|"publish"="dry-run"):ContentPublishRequest{return{
 ...buildLockedDryRunRequest(config.lockedCandidate,config.buildRecord(source.before),"synthetic-local-contract"),mode,
 ownerApproved:true,explicitExecution:true,approvalId:"synthetic-local-only",
 ...(mode==="publish"?{managedPermit:{...managedAction(target,"publish"),operation:"publish",permitId}}:{}),
};}

describe("original Contact cms_pages three titles",()=>{
 it("pins the original business action and existing site_page API shape to exactly one cms_pages row",()=>{
  expect(target).toMatchObject({contentType:"site_page",table:"cms_pages",id:"4c328eda-a21d-4c34-bd5a-895d90122b23",slug:"contact",taskId:"fc-20261019-contact-conversion-malay-followthrough-v1",actionId:"contact-conversion-first-batch-content-save",rollbackAllowed:true,requiresParentRun:true});
  expect(target.changedFields).toEqual(["title_zh","title_en","title_ms"]);expect(target.baselineProjectionFields).toHaveLength(24);expect(target.retainedProjectionFields).toHaveLength(19);
  expect(config.table).toBe("cms_pages");expect(config.fields).toHaveLength(24);expect(config.lockedCandidate).toMatchObject({...target,recordId:target.id});
  expect(findManagedTarget(MANAGED_TARGETS,target.id,"contact",{...managedAction(target,"publish"),operation:"publish"})).toBe(target);
  expect(()=>assertLockedServiceCandidate(config.lockedCandidate,source.before)).not.toThrow();
 });
 it("previews only the three exact titles without legacy normalizer, other tables, claims or writes",async()=>{
  const db=database(source.before),result=await publishContent(request(),db.client,context);
  expect(result.status||200).toBe(200);expect(result.body.payload_preview).toEqual({title_zh:"联系 FLASH CAST",title_en:"Contact FLASH CAST",title_ms:"Hubungi FLASH CAST"});
  expect(db.tables).toEqual(["cms_pages"]);expect(db.writes).toEqual([]);expect(db.rpcs).toEqual([]);
 });
 it("performs one exact microsecond CAS update, preserves protected19 fields and returns the actual server version",async()=>{
  const db=database(source.before),result=await publishContent(request("publish"),db.client,context);
  expect(result.status||200).toBe(200);expect(db.writes).toEqual([source.desired]);expect(db.predicates).toContainEqual(["id",target.id]);expect(db.predicates).toContainEqual(["updated_at",source.before.updated_at]);
  expect(result.body.saved_updated_at).toBe(savedTime);expect(result.body.saved_version).toBe(4);
  for(const f of target.retainedProjectionFields!)expect(db.row()[f]).toEqual(source.before[f]);
  expect(db.tables.every(t=>["cms_pages","admin_audit_logs"].includes(t))).toBe(true);
  expect(db.rpcs).toEqual(["claim_managed_cms_release_permit","begin_managed_cms_release_write","finish_managed_cms_release_write"]);
  expect((await publishContent(request("publish"),db.client,context)).status).toBe(409);expect(db.writes).toHaveLength(1);
 });
 it.each(["seo_title_ms","seo_description_zh","path","status","deleted_at","version","new_column"])("rejects full24 baseline drift in %s before claiming",async field=>{
  const db=database({...source.before,[field]:"unapproved"});expect((await publishContent(request("publish"),db.client,context)).status).toBe(409);expect(db.writes).toEqual([]);expect(db.rpcs).toEqual([]);
 });
 it.each(["seo_title_en","seo_title_ms","page_key","path","version","description_en","cms_sections"])("rejects non-target request edits to %s",async field=>{
  const db=database(source.before),req=request("publish");req.record![field]="unapproved";expect((await publishContent(req,db.client,context)).status).toBe(403);expect(db.writes).toEqual([]);expect(db.rpcs).toEqual([]);
 });
 it("rejects generic/uppercase/mismatched-task execution and missing trusted identity",async()=>{
  const db=database(source.before),req=request("publish");delete req.managedPermit;
  expect((await publishContent(req,db.client,context)).status).toBe(403);req.record!.id=target.id.toUpperCase();expect((await publishContent(req,db.client,context)).status).toBe(403);
  const wrong=request("publish");wrong.managedPermit!.taskId="another-task";expect((await publishContent(wrong,db.client,context)).status).toBe(403);
  expect((await publishContent(request("publish"),db.client,{role:"content_editor",authMode:"cron"})).status).toBe(403);expect(db.writes).toEqual([]);expect(db.rpcs).toEqual([]);
 });
 it("admits only the exact own inverse under current postSave CAS; no whole row or metadata restoration",async()=>{
  const current={...source.before,...source.desired,updated_at:savedTime,version:4};const db=database(current,{nextCAS:"2026-10-27T06:20:00.987654+00:00"});
  const req=request("publish");req.expectedUpdatedAt=savedTime;req.record={...current,...Object.fromEntries(target.changedFields!.map(f=>[f,source.before[f]]))};req.managedPermit={...managedAction(target,"rollback"),operation:"rollback",permitId};
  const result=await publishContent(req,db.client,context);expect(result.status||200).toBe(200);expect(db.writes).toEqual([Object.fromEntries(target.changedFields!.map(f=>[f,source.before[f]]))]);
  for(const f of target.retainedProjectionFields!)expect(db.row()[f]).toEqual(current[f]);
  const drift=database({...current,seo_title_ms:"new professional metadata"});expect((await publishContent(req,drift.client,context)).status).toBe(409);expect(drift.rpcs).toEqual([]);
 });
 it("requires an actual own completed parent permit/run and its Saved CAS for conditional inverse issuance",async()=>{
  const input:ManagedPermitIssue={...managedAction(target,"rollback"),operation:"rollback",actionClass:"cms_write",permitId,recordId:target.id,slug:target.slug,
   expectedUpdatedAt:savedTime,payloadSha256:target.rollbackFieldsSha256!,parentPermitId:"22222222-2222-4222-8222-222222222222",parentRunId:12345,
   githubActorId:98765,githubWorkflowSha:"a".repeat(40),qaReceiptId:"synthetic-qa",operationsDecisionId:"synthetic-operations",policyDecisionId:"synthetic-policy",issuerEvidenceSha256:"b".repeat(64),expiresAt:new Date(Date.now()+60000).toISOString()};
  const parent={status:"completed",operation:"publish",task_id:target.taskId,record_id:target.id,slug:target.slug,scope:target.scope,candidate_version:target.candidateVersion,github_run_id:12345,rollback_payload_sha256:target.rollbackFieldsSha256,saved_updated_at:savedTime};
  const client=(row:Row)=>({from(){const b={select(){return b;},eq(){return b;},maybeSingle:async()=>({data:row,error:null}),insert:()=>b,single:async()=>({data:{},error:null})};return b;}})as unknown as ContentPublishClient;
  expect((await issueManagedPermit(client(parent),input)).status).toBe("issued");
  for(const patch of [{status:"issued"},{github_run_id:12346},{scope:"another-scope"},{record_id:"another-record"},{saved_updated_at:"2026-10-27T06:10:00.123457+00:00"}])await expect(issueManagedPermit(client({...parent,...patch}),input)).rejects.toThrow("completed candidate");
  await expect(issueManagedPermit(client(parent),{...input,parentRunId:undefined})).rejects.toThrow("parent run ID");
 });
 it.each([{race:true},{uncertain:true},{corrupt:true}])("reports an unknown result and never retries: %j",async options=>{
  const db=database(source.before,options),result=await publishContent(request("publish"),db.client,context);expect(result.status).toBe(409);expect(result.body.uncertain).toBe(true);expect(db.writes.length).toBeLessThanOrEqual(1);expect(db.rpcs.filter(x=>x==="claim_managed_cms_release_permit")).toHaveLength(1);
 });
 it("returns a warning for a failed audit after a confirmed single write without hiding the actual Saved result",async()=>{
  const db=database(source.before,{auditFail:true}),result=await publishContent(request("publish"),db.client,context);
  expect(result.status||200).toBe(200);expect(result.body.saved_updated_at).toBe(savedTime);expect(result.body.warnings).toEqual(["Contact title audit log could not be confirmed."]);expect(db.writes).toHaveLength(1);
 });
 it("preserves strict unchanged SEO metadata checks for all three public routes, including negative body-only matches",()=>{
  expect(config.publicPaths).toHaveLength(3);
  for(const page of config.publicPaths){expect(page.strictMetadataTitle).toBe(true);expect(inspectPublicReadback(page,200,`<title>${page.expected}</title>`).found).toBe(true);expect(inspectPublicReadback(page,200,`<title>Wrong metadata</title><p>${page.expected}</p>`).found).toBe(false);}
 });
 it("rejects modified frozen bytes and direct local production execution",()=>{
  expect(()=>readContactCmsPageTitleCandidate(Buffer.concat([bytes,Buffer.from("\n")]))).toThrow("source bytes differ");
  const result=spawnSync(process.execPath,["scripts/publish-content-trust-fixes.mjs",`--target=${target.candidateVersion}`,"--execute","--approval-id=synthetic-untrusted"],{encoding:"utf8"});expect(result.status).toBe(1);expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
 });
});
