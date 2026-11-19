import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readCandidates,assertBaseline,assertEnvironment,digest} from '../../scripts/publish-location-seven-bodies.mjs';
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
    expect(metadata.title).toBe('吉隆坡装修公司 | FLASH CAST SDN. BHD.');
    expect(metadata.description).toBe('中文说明');
  });
  it('guards the exact approval before credentials and keeps all writes in content-publish',()=>{
    const workflow=readFileSync('.github/workflows/content-publish-approved.yml','utf8');
    const script=readFileSync('scripts/publish-location-seven-bodies.mjs','utf8');
    expect(workflow).toContain("runs-on: ${{ inputs.target == 'location-seven-body-20261119-v1' && 'ubuntu-24.04' || 'ubuntu-latest' }}");
    expect(workflow.indexOf('owner-approved-location-seven-after-kl-20261119')).toBeLessThan(workflow.indexOf('Confirm production source and required secrets'));
    expect(workflow).toContain("inputs.target == 'location-seven-body-20261119-v1' && inputs.mode == 'publish' && secrets.SUPABASE_SERVICE_ROLE_KEY || ''");
    expect(script).not.toMatch(/\.from\(['"]service_areas['"]\)\s*\.(?:update|insert|upsert|delete)\(/);
    expect(script).toContain('ownerApproved:true,explicitExecution:true');
    expect(script).toContain("mode:'dry-run'");
  });
});
