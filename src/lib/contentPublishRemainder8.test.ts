import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { readRemainder8Registry, REMAINDER8_NAME, REMAINDER8_PATH, assertTwelveCompletedPermit, assertOwnNativeRevision, verifyTwelveBeforeRemainder8, readScopedPublishAudit, installRevisionIdentityGuards, assertStrictSavedPage } from "../../scripts/publish-remainder8-after-38037667102.mjs";
import { APPROVAL_ID } from "../../scripts/publish-remaining-completion-20261009.mjs";
import { assertCompletedRow } from "../../scripts/publish-remainder18-after-37893433883.mjs";
import { stableDigest, targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

const prepared=readRemainder8Registry();
const completed=prepared.original.entries.slice(0,12);
const proofFor=(entry)=>prepared.proof.completed.find(item=>item.target===entry.target);
const nativeArgs=()=>({entry:completed[11],receipt:structuredClone(prepared.proof.fourthNativeEvidence.receipt),stage:structuredClone(prepared.proof.fourthNativeEvidence.stage),
  row:structuredClone(prepared.proof.completed[11].publicCurrentProjection),permits:[structuredClone(prepared.proof.completed[11].permit)],
  previousIdentity:structuredClone(prepared.proof.previousPublicIdentity),context:structuredClone(prepared.proof.fourthRunContext),
  permitFields:Object.keys(prepared.proof.completed[11].permit),issuedEvidence:structuredClone(prepared.proof.fourthNativeEvidence.issuedEvidence),audit:structuredClone(prepared.proof.fourthNativeEvidence.audit)});
const deriveBodyFixture=async({entry,language})=>proofFor(entry).freshBilingualReadback.find(page=>page.path.startsWith(`/${language}/`)).requiredText;
const deriveMetadataFixture=async({path})=>({raw:{title:path,description:`exact ${path}`},hydrated:{title:`hydrated ${path}`,description:`exact hydrated ${path}`},sourceSha256:prepared.proof.metadataSourceSha256});
const checkPageFixture=async({path,title,description,strictMetadata,hydratedMetadata})=>{
  expect(strictMetadata).toBe(true);const expected=await deriveMetadataFixture({path});expect({title,description}).toEqual(expected.raw);expect(hydratedMetadata).toEqual(expected.hydrated);
  return structuredClone(prepared.proof.completed.flatMap(item=>item.freshBilingualReadback).find(page=>page.path===path));
};

describe("fixed eight after a truthful native save and failed identity hook",()=>{
  it("admits c08-c15 only and preserves all four stopped runs and native c07 success plus failed hook",()=>{
    expect(prepared.registry.entries.map(entry=>entry.target)).toEqual(Array.from({length:8},(_,i)=>`c${String(i+8).padStart(2,"0")}-bilingual-body-v1`));
    expect(prepared.registry.sourceQaReceipts).toHaveLength(8);expect(prepared.proof.actualQaCount).toBe(14);expect(prepared.proof.completed).toHaveLength(12);
    expect(prepared.proof.stoppedRuns.map(run=>[run.outcome,run.actualCompletedRows])).toEqual([["FAILED_STOPPED",2],["FAILED_STOPPED",7],["FAILED_STOPPED",2],["FAILED_STOPPED",1]]);
    expect(prepared.proof.stoppedRunSummaries[3].summary.rows[0]).toMatchObject({status:"FAILED_STOPPED",performedWrite:null,failedAt:"PERMIT_ISSUED"});
    expect(prepared.proof.completed[11].originalPublisherStatus).toMatchObject({nativeStageExitCode:0,receiptOk:true,savedOk:true,originalRealBodyPostcheckOk:false,originalRealBodyPages:[]});
    expect(Object.keys(prepared.proof.metadataSourceSha256)).toHaveLength(42);expect(Object.keys(prepared.proof.nativeRevisionSourceSha256)).toHaveLength(6);
    expect(prepared.proof.remainingCandidateContracts.rows).toHaveLength(16);
    expect(()=>readRemainder8Registry(Buffer.from(readFileSync(REMAINDER8_PATH,"utf8").replace('"remainingRowCount": 8','"remainingRowCount": 9')))).toThrow(/hash differs/);
  });
  it.each(completed)("rejects every full completed permit field, duplicate and current CAS/content drift for $target",entry=>{
    const proof=proofFor(entry),index=completed.indexOf(entry);expect(()=>assertCompletedRow(entry,proof,proof.publicCurrentProjection)).not.toThrow();
    expect(()=>assertTwelveCompletedPermit(entry,proof,[proof.permit],index)).not.toThrow();
    for(const [field,value] of Object.entries(proof.permit)){
      const changed=value===null?"forged":typeof value==="number"?value+1:`${value}-forged`;
      expect(()=>assertTwelveCompletedPermit(entry,proof,[{...proof.permit,[field]:changed}],index)).toThrow();
    }
    expect(()=>assertTwelveCompletedPermit(entry,proof,[proof.permit,{...proof.permit,permit_id:"duplicate"}],index)).toThrow();
    for(const drift of [{updated_at:"2026-10-10T10:00:00Z"},{[entry.changedFields[0]]:"newer content"},{title_en:"newer title"}])expect(()=>assertCompletedRow(entry,proof,{...proof.publicCurrentProjection,...drift})).toThrow();
  });
  it("accepts only exact own native revision with full issuer, permit, audit and successful independent purge",()=>{
    expect(assertOwnNativeRevision(nativeArgs())).toEqual(prepared.proof.publicIdentity);
    const late=nativeArgs();late.permits[0].expires_at="2026-10-10T08:25:20.500+00:00";late.issuedEvidence.issued.expiresAt="2026-10-10T08:25:20.500Z";
    expect(()=>assertOwnNativeRevision(late)).not.toThrow(); // Claim/write was valid; completion may finish after expiry.
  });
  const rejects:Array<[string,(args:ReturnType<typeof nativeArgs>)=>void]>=[
    ["failed native stage",a=>{a.stage.exitCode=1;}],["wrong target",a=>{a.stage.target="c08-bilingual-body-v1";}],
    ["dry response",a=>{a.receipt.published.dry_run=true;}],["native warnings",a=>{a.receipt.published.warnings=["invalidation failed"];}],
    ["revision failure",a=>{a.receipt.published.cache_invalidation.ok=false;}],["no revision",a=>{a.receipt.published.cache_invalidation.revision="";}],
    ["old revision",a=>{a.receipt.published.cache_invalidation.revision=a.previousIdentity.updated_at;}],
    ["future revision",a=>{a.receipt.published.cache_invalidation.revision="2027-10-10T08:25:21.86603+00:00";}],
    ["microsecond before complete",a=>{a.receipt.published.cache_invalidation.revision="2026-10-10T08:25:21.460948+00:00";}],
    ["microsecond regression",a=>{a.previousIdentity.updated_at="2026-10-10T08:25:21.866031+00:00";}],
    ["cache alone",a=>{a.receipt.published.cache_invalidation.edge_purge_requested.ok=false;}],
    ["purge not attempted",a=>{a.receipt.published.cache_invalidation.edge_purge_requested.attempted=false;}],
    ["wrong purge tag",a=>{a.receipt.published.cache_invalidation.edge_purge_requested.tag="other";}],
    ["wrong purge status",a=>{a.receipt.published.cache_invalidation.edge_purge_requested.status=500;}],
    ["forged issuer digest",a=>{a.permits[0].issuer_evidence_sha256="0".repeat(64);}],
    ["changed issuer evidence",a=>{a.issuedEvidence.evidence.actualPreviewSha256="0".repeat(64);}],
    ["forged issuer scope even with rebuilt digest",a=>{a.issuedEvidence.evidence.registrySha256="0".repeat(64);a.permits[0].issuer_evidence_sha256=stableDigest(a.issuedEvidence.evidence);}],
    ["issued response mismatch",a=>{a.issuedEvidence.issued.permitId="other";}],
    ["writing expired",a=>{a.permits[0].expires_at="2026-10-10T08:25:20.405218+00:00";a.issuedEvidence.issued.expiresAt=a.permits[0].expires_at;}],
    ["invalid timestamp",a=>{a.permits[0].issued_at="unknown";}],["backward claim",a=>{a.permits[0].claimed_at="2026-10-10T08:25:15Z";}],
    ["completion before save",a=>{a.permits[0].completed_at="2026-10-10T08:25:20.900843+00:00";}],
    ["missing audit",a=>{a.audit=[];}],["duplicate audit",a=>{a.audit.push({...a.audit[0],id:"another"});}],
    ["wrong audit action",a=>{a.audit[0].action="update";}],["other record audit",a=>{a.audit[0].record_id="other";}],
    ["audit before completion",a=>{a.audit[0].created_at="2026-10-10T08:25:21.460948+00:00";}],
    ["audit after cache",a=>{a.audit[0].created_at="2026-10-10T08:25:21.866031+00:00";}],
    ["native CAS row drift",a=>{a.row.updated_at="2026-10-10T08:25:20.900845+00:00";}],
  ];
  it.each(rejects)("refuses %s before advancing identity",(_name,mutate)=>{const args=nativeArgs();mutate(args);expect(()=>assertOwnNativeRevision(args)).toThrow();});
  it("reads only exact machine metadata from the actual admin_audit_logs table and rejects a truncated response",async()=>{
    const args=nativeArgs();let seen;
    const env={VITE_SUPABASE_URL:"https://rbsnyexjifounogswrjp.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"fixture-only"};
    const fetchFixture=async(url,options)=>{seen={url:new URL(url),options};return {ok:true,json:async()=>args.audit};};
    await expect(readScopedPublishAudit(args.entry,args.permits[0],env,fetchFixture)).resolves.toEqual(args.audit);
    expect(seen.url.pathname).toBe("/rest/v1/admin_audit_logs");expect(Object.fromEntries(seen.url.searchParams)).toEqual({select:"id,action,table_name,record_id,created_at",table_name:"eq.blog_posts",record_id:`eq.${args.entry.recordId}`,created_at:`gte.${args.permits[0].writing_at}`,limit:"20"});
    expect(seen.options).toMatchObject({method:"GET",cache:"no-store"});
    await expect(readScopedPublishAudit(args.entry,args.permits[0],env,async()=>({ok:true,json:async()=>Array.from({length:20},()=>args.audit[0])}))).rejects.toThrow(/truncated/);
  });
  it("checks the current exact identity before every preview/write and stops drift before invoking either",async()=>{
    let expected=prepared.proof.publicIdentity,current=expected,trace:string[]=[];
    const dependencies={preview:async entry=>{trace.push(`preview:${entry.target}`);},publish:async(entry,permit)=>{trace.push(`publish:${entry.target}:${permit}`);}};
    installRevisionIdentityGuards(dependencies,async identity=>{trace.push("identity");if(stableDigest(current)!==stableDigest(identity))throw Error("changed exact identity");},()=>expected,permit=>trace.push(`permit:${permit}`));
    await dependencies.preview(prepared.registry.entries[0]);await dependencies.publish(prepared.registry.entries[0],"own");
    expect(trace).toEqual(["identity",`preview:${prepared.registry.entries[0].target}`,"identity","permit:own",`publish:${prepared.registry.entries[0].target}:own`]);
    current={...expected,updated_at:"2026-10-10T09:00:00Z"};trace=[];
    await expect(dependencies.preview(prepared.registry.entries[1])).rejects.toThrow(/identity/);await expect(dependencies.publish(prepared.registry.entries[1],"next")).rejects.toThrow(/identity/);expect(trace).toEqual(["identity","identity"]);
    expected=current;await dependencies.preview(prepared.registry.entries[1]);expect(trace.at(-1)).toBe(`preview:${prepared.registry.entries[1].target}`);
  });
  it("rejects empty/partial metadata, hidden readiness, empty mapped body and missing body evidence",()=>{
    const original=prepared.proof.completed[11].freshBilingualReadback[0];expect(()=>assertStrictSavedPage(original)).not.toThrow();
    for(const drift of [{metadata:{}},{hydratedMetadata:{}},{metadata:{titleFound:true}},{hydratedMetadata:{descriptionMatches:true}},{renderedOk:false},{ready:false},{requiredText:[]},{missingRequired:["not visible"]}])expect(()=>assertStrictSavedPage({...original,...drift})).toThrow(/Strict real/);
  });
  it("dry-run refreshes twelve rows and twenty-four strict pages without any private permit lookup",async()=>{
    let saved;const result=await verifyTwelveBeforeRemainder8({prepared,mode:"dry-run",readCurrent:async entry=>proofFor(entry).publicCurrentProjection,
      readPermits:()=>{throw Error("private lookup forbidden in dry-run");},deriveBody:deriveBodyFixture,deriveMetadata:deriveMetadataFixture,checkPage:checkPageFixture,save:value=>{saved=structuredClone(value);}});
    expect(result.ok).toBe(true);expect(saved.rows).toHaveLength(12);expect(saved.rows.flatMap(row=>row.pages)).toHaveLength(24);expect(saved.privatePermitRead).toBe(false);
    const fourth=saved.rows[11],proof=prepared.proof.completed[11],entry=completed[11];
    expect(fourth).toMatchObject({originRunId:38037667102,permitId:proof.permit.permit_id,actualUpdatedAt:proof.actualUpdatedAt,
      desiredSha256:entry.desiredFieldsSha256,retainedSha256:entry.retainedFieldsSha256,qaReceiptIds:entry.qaProofs.map(qa=>qa.receiptId),stage:"COMPLETED_ROW_GUARD_PASS"});
  });
  it("publish stops on fourth saved permit drift before the remaining eight and preserves its failed guard",async()=>{
    let saved;const deps={prepared,mode:"publish",readCurrent:async entry=>proofFor(entry).publicCurrentProjection,readPermits:async entry=>[proofFor(entry).permit],
      deriveBody:deriveBodyFixture,deriveMetadata:deriveMetadataFixture,checkPage:checkPageFixture,save:value=>{saved=structuredClone(value);}};
    await expect(verifyTwelveBeforeRemainder8(deps)).resolves.toMatchObject({ok:true,privatePermitRead:true});
    await expect(verifyTwelveBeforeRemainder8({...deps,readPermits:async entry=>[{...proofFor(entry).permit,...(entry.target===completed[11].target?{status:"uncertain"}:{})}]})).rejects.toThrow(/never replay/);
    expect(saved.ok).toBe(false);expect(saved.failedTarget).toBe(completed[11].target);
  });
  it("workflow rejects rollback, supplied permits, forged approval and skipped targets before loading credentials",()=>{
    const workflow=readFileSync(".github/workflows/content-publish-approved.yml","utf8"),shell=workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map(line=>line.replace(/^ {10}/,"")).join("\n");
    const gate=drift=>spawnSync("bash",["-e","-c",shell],{encoding:"utf8",env:{PATH:process.env.PATH,GITHUB_REF:"refs/heads/main",PUBLISH_TARGET:REMAINDER8_NAME,PUBLISH_MODE:"publish",MANAGED_OPERATION:"publish",APPROVAL_ID,...drift}});
    expect(gate({}).status).toBe(0);expect(gate({PUBLISH_MODE:"dry-run"}).status).toBe(0);
    for(const drift of [{MANAGED_PERMIT_ID:"old"},{PARENT_RUN_ID:"38037667102"},{MANAGED_OPERATION:"rollback"},{APPROVAL_ID:"forged"}])expect(gate(drift).status).not.toBe(0);
    const dir=`audits/content-publish-rejected-eight-${process.pid}`;
    const invalid=spawnSync(process.execPath,["--experimental-strip-types","scripts/publish-remainder8-after-38037667102.mjs","--skip=c07",`--artifact-dir=${dir}`],{encoding:"utf8",env:{PATH:process.env.PATH,PUBLISH_TARGET:REMAINDER8_NAME}});
    expect(invalid.status).not.toBe(0);expect(invalid.stderr).toContain("accepts only mode");expect(existsSync(dir)).toBe(false);
    expect(workflow.split("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")).toHaveLength(2);
    expect(workflow).toContain("batch_script=scripts/publish-remainder8-after-38037667102.mjs");
    const ci=readFileSync(".github/workflows/r3-managed-cms-pr-ci.yml","utf8");expect(ci).toContain("src/lib/contentPublishRemainder8.test.ts");
    expect(targetConfigs[completed[11].target].publicPaths).toHaveLength(2);
  });
});
