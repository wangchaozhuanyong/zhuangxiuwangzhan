import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readCandidates,selectCandidates,CHERAS_TARGET,assertBaseline,assertEnvironment,digest,COMPLETED_RECEIPTS,assertCompletedRow,assertCompletedPermit} from '../../scripts/publish-location-seven-bodies.mjs';
import {navigateLocation} from '../../scripts/lib/location-body-acceptance.mjs';
import {MANAGED_AREAS,findManagedTarget,managedAction} from '../../supabase/functions/_shared/managed-targets.ts';
import {issueManagedPermit} from '../../supabase/functions/content-publish/permit-issuer.ts';
import type {ContentPublishClient} from '../../supabase/functions/content-publish/types.ts';

const candidates=readCandidates();
describe('remaining seven exact regional body releases',()=>{
  it('contains exactly the seven owner-approved rows and keeps KL out',()=>{
    expect(candidates.map(c=>c.t.slug)).toEqual(['petaling-jaya','subang-jaya','mont-kiara','puchong','klang','shah-alam','cheras']);
    expect(new Set(candidates.map(c=>c.t.id)).size).toBe(7);
    expect(()=>assertEnvironment({},'a'.repeat(40))).toThrow();
  });
  it('selects only the still-untouched Cheras tuple without including any completed row',()=>{
    const selected=selectCandidates(CHERAS_TARGET);
    expect(selected.map(c=>c.t.slug)).toEqual(['cheras']);
    expect(selected[0].t).toBe(candidates.find(c=>c.t.slug==='cheras')!.t);
    expect(()=>selectCandidates('another-area')).toThrow();
  });
  it.each(candidates)('$t.slug freezes exact bilingual source and resolves its own tuple despite historical targets',({t,desired})=>{
    expect(Object.keys(desired).sort()).toEqual(['content_en','content_zh']);
    expect(digest(desired)).toBe(t.desiredFieldsSha256);
    for(const body of Object.values(desired)) {
      expect(String(body).match(/<strong>/g)).toHaveLength(4);
      expect(String(body).match(/<p>/g)).toHaveLength(9);
    }
    expect(t.baselineProjectionFields).toHaveLength(32);
    expect(t.retainedProjectionFields).toHaveLength(28);
    expect(findManagedTarget(MANAGED_AREAS,t.id,t.slug,{...managedAction(t,'publish'),operation:'publish'})).toBe(t);
    expect(()=>assertBaseline(t,{id:t.id,slug:t.slug,status:'published',updated_at:'2020-01-01'})).toThrow();
    expect(()=>assertBaseline(t,{id:t.id,slug:t.slug,status:'published',updated_at:t.expectedUpdatedAt})).toThrow();
  });
  it.each(candidates)('$t.slug binds one-use permits to the exact body, version, and rollback hash',async({t})=>{
    const inserted:Record<string,unknown>[]=[];
    const client={from(){const builder={select(){return builder;},eq(){return builder;},insert(row:Record<string,unknown>){inserted.push(row);return builder;},single:async()=>({data:inserted.at(-1),error:null}),maybeSingle:async()=>({data:null,error:null})};return builder;}} as unknown as ContentPublishClient;
    const now=Date.parse('2026-11-19T11:00:00Z');
    const input={permitId:'11111111-1111-4111-8111-111111111111',...managedAction(t,'publish'),actionClass:'cms_write' as const,operation:'publish' as const,recordId:t.id,slug:t.slug,expectedUpdatedAt:t.expectedUpdatedAt!,payloadSha256:t.desiredFieldsSha256!,rollbackPayloadSha256:t.rollbackFieldsSha256!,githubActorId:98765,githubWorkflowSha:'a'.repeat(40),qaReceiptId:'qa-seven-record-12345',operationsDecisionId:'ops-seven-record-12345',policyDecisionId:'pol-seven-record-12345',issuerEvidenceSha256:'b'.repeat(64),expiresAt:'2026-11-19T11:10:00Z'};
    await expect(issueManagedPermit(client,input,now)).resolves.toMatchObject({operation:'publish'});
    const count=inserted.length;
    for(const altered of [{...input,payloadSha256:'c'.repeat(64)},{...input,rollbackPayloadSha256:'c'.repeat(64)},{...input,expectedUpdatedAt:'2026-11-19T10:00:00Z'}])await expect(issueManagedPermit(client,altered,now)).rejects.toThrow();
    expect(inserted).toHaveLength(count);
  });
  it('uses actual display translations and the company suffix in public title expectations',()=>{
    const helper=pathToFileURL(resolve('scripts/lib/location-body-acceptance.mjs')).href;
    const code=`import {expectedMetadata} from ${JSON.stringify(helper)}; console.log(JSON.stringify(await expectedMetadata({slug:'kuala-lumpur',seo_title_en:'Kuala Lumpur Renovation',seo_description_en:'Original English description',seo_title_zh:'Kuala Lumpur 装修公司',seo_description_zh:'中文说明'},'zh',{brand_name:'FLASH CAST',company_name:'FLASH CAST SDN. BHD.'})));`;
    const metadata=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'}));
    expect(metadata.title).toBe('吉隆坡装修公司 | FLASH CAST');
    expect(metadata.description).toBe('中文说明');
  });
  it('guards the exact approval before credentials and keeps all writes in content-publish',()=>{
    const workflow=readFileSync('.github/workflows/content-publish-approved.yml','utf8');
    const script=readFileSync('scripts/publish-location-seven-bodies.mjs','utf8');
    expect(workflow).toContain("runs-on: ${{ (inputs.target == 'location-seven-body-20261119-v1' || inputs.target == 'location-cheras-final-20261119-v1') && 'ubuntu-24.04' || 'ubuntu-latest' }}");
    expect(workflow.indexOf('owner-approved-location-seven-after-kl-20261119')).toBeLessThan(workflow.indexOf('Confirm production source and required secrets'));
    expect(workflow).toContain("(inputs.target == 'location-seven-body-20261119-v1' || inputs.target == 'location-cheras-final-20261119-v1') && inputs.mode == 'publish' && secrets.SUPABASE_SERVICE_ROLE_KEY || ''");
    expect(script).not.toMatch(/\.from\(['"]service_areas['"]\)\s*\.(?:update|insert|upsert|delete)\(/);
    expect(script).toContain('ownerApproved:true,explicitExecution:true');
    expect(script).toContain("mode:'dry-run'");
  });
});

describe('resume only the two independently confirmed completed rows',()=>{
  it('freezes the original run, exactly two receipts, and immutable evidence digests',()=>{
    expect(COMPLETED_RECEIPTS.parentRunId).toBe(44527250913);
    expect(COMPLETED_RECEIPTS.receipts.map(r=>r.slug)).toEqual(['petaling-jaya','subang-jaya']);
    expect(COMPLETED_RECEIPTS.identitySha256).toMatch(/^[a-f0-9]{64}$/);
    for(const r of COMPLETED_RECEIPTS.receipts) {
      expect(r.githubRunId).toBe(44527250913);
      expect(Object.keys(r.filesSha256).sort()).toEqual(['before-browser.json','completion.json','permit-issued.json','publish-receipt.json']);
      expect(Object.values(r.filesSha256).every(hash=>/^[a-f0-9]{64}$/.test(String(hash)))).toBe(true);
    }
    const workflow=readFileSync('.github/workflows/content-publish-approved.yml','utf8');
    expect(workflow).toContain('name: approved-content-publish-44527250913');
    expect(workflow).toContain('run-id: 44527250913');
  });
  it.each(COMPLETED_RECEIPTS.receipts)('$slug accepts read-only completion evidence and rejects any row or permit drift',receipt=>{
    const {t,desired}=candidates.find(c=>c.t.slug===receipt.slug)!;
    const row={id:t.id,slug:t.slug,status:'published',updated_at:receipt.savedUpdatedAt,...desired,title_en:'Original retained title'};
    const retainedProjectionFields=['id','slug','status','title_en'];
    const target={...t,retainedProjectionFields,retainedFieldsSha256:digest(Object.fromEntries(retainedProjectionFields.map(f=>[f,row[f]])))};
    const permit={permit_id:receipt.permitId,status:'completed',operation:'publish',task_id:t.taskId,action_id:t.actionId,candidate_version:t.candidateVersion,
      scope:t.scope,record_id:t.id,slug:t.slug,saved_id:t.id,expected_updated_at:t.expectedUpdatedAt,saved_updated_at:receipt.savedUpdatedAt,
      payload_sha256:t.desiredFieldsSha256,rollback_payload_sha256:t.rollbackFieldsSha256,github_repository_id:1248188229,
      github_run_id:receipt.githubRunId,github_run_attempt:receipt.githubRunAttempt,github_actor_id:receipt.githubActorId,
      github_workflow_sha:receipt.githubWorkflowSha,github_workflow_ref:'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main'};
    const before=structuredClone(row);
    expect(()=>assertCompletedRow(target,row,receipt)).not.toThrow();
    expect(()=>assertCompletedPermit(target,row,receipt,permit)).not.toThrow();
    expect(row).toEqual(before);
    for(const patch of [{updated_at:'changed'}, {content_en:'changed'}, {title_en:'changed'}, {id:'other-record'}])expect(()=>assertCompletedRow(target,{...row,...patch},receipt)).toThrow();
    for(const patch of [{status:'issued'},{status:'uncertain'},{github_run_id:999},{github_workflow_sha:'a'.repeat(40)}, {payload_sha256:'a'.repeat(64)},{saved_updated_at:'changed'},{operation:'rollback'},{record_id:'other-record'}])expect(()=>assertCompletedPermit(target,row,receipt,{...permit,...patch})).toThrow();
  });
});

describe('bounded read-only navigation retries',()=>{
  it('retries transport timeouts and returns the successful GET',async()=>{
    const timeout=Object.assign(new Error('Navigation timed out'),{name:'TimeoutError'});
    const response={status:()=>200},page={goto:vi.fn().mockRejectedValueOnce(timeout).mockResolvedValueOnce(response)};
    await expect(navigateLocation(page,'https://flashcast.com.my/en/locations/mont-kiara')).resolves.toEqual({response,attempts:2});
    expect(page.goto).toHaveBeenCalledTimes(2);
  });
  it('stops after three timeouts and does not retry other errors or HTTP failures',async()=>{
    const timeout=Object.assign(new Error('Navigation timed out'),{name:'TimeoutError'});
    const page={goto:vi.fn().mockRejectedValue(timeout)};
    await expect(navigateLocation(page,'https://flashcast.com.my')).rejects.toThrow('Navigation timed out');expect(page.goto).toHaveBeenCalledTimes(3);
    const broken={goto:vi.fn().mockRejectedValue(new Error('A real acceptance failure'))};
    await expect(navigateLocation(broken,'https://flashcast.com.my')).rejects.toThrow('A real acceptance failure');expect(broken.goto).toHaveBeenCalledTimes(1);
    const response={status:()=>404},missing={goto:vi.fn().mockResolvedValue(response)};
    await expect(navigateLocation(missing,'https://flashcast.com.my/missing')).resolves.toEqual({response,attempts:1});expect(missing.goto).toHaveBeenCalledTimes(1);
  });
});
