// Only c08-c15 may continue after four truthful stopped runs. Never replay a saved permit.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APPROVAL_ID, REGISTRY_PATH, REGISTRY_SHA256, runFrozenCommand, assertActualPublish, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { readRemainder9Registry, REMAINDER9_PATH, REMAINDER9_SHA256, assertElevenCompletedPermit, verifyElevenBeforeRemainder9 } from "./publish-remainder9-after-37903094390.mjs";
import { assertCompletedRow } from "./publish-remainder18-after-37893433883.mjs";
import { targetConfigs, stableDigest } from "./publish-content-trust-fixes.mjs";
import { deriveReviewedPublicMetadata, readReviewedPublicIdentity } from "./lib/publisher-reviewed-metadata.mjs";
import { verifyPublicPage, reviewedRenderedBodyPhrases, verifyCandidateTextContracts } from "./lib/publisher-public-readback.mjs";
import { samePgTimestamp, pgEpochMicros } from "../supabase/functions/content-publish/managed-timestamp.ts";
export const REMAINDER8_NAME = "remaining-completion-after-38037667102";
export const REMAINDER8_PATH = "drafts/publishing/fc-20261010-remainder8-after-38037667102-v1/registry.json";
export const REMAINDER8_SHA256 = "3a24f1dcabcb53ad61af0c5503be9317d593ffb06db69b8243a5217e0392b6c4";
const assert = (value, message) => { if (!value) throw Error(message); };
const same = (left, right) => stableDigest(left) === stableDigest(right);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const fourth = { runId: 38037667102, releaseSha: "5a00afc782e16f7d11575a3f529ea49e2fdc09b5", outcome: "FAILED_STOPPED", actualCompletedRows: 1 };
const nativeFiles = ["supabase/functions/content-publish/index.ts", "supabase/functions/_shared/public-content-sync.ts",
  "supabase/functions/_shared/cache-invalidation.ts", "supabase/functions/content-publish/service.ts", "supabase/functions/content-publish/repository.ts",
  "supabase/functions/content-publish/managed-timestamp.ts"];

// A revision is accepted only from this exact successful native write, not from a later GET or a clock guess.
export function assertOwnNativeRevision({ entry, receipt, stage, row, permits, previousIdentity, context, permitFields, issuedEvidence, audit }) {
  const active = permits.filter(permit => permit.status !== "revoked"), permit = active[0];
  assert(active.length === 1 && same(Object.keys(permit).sort(), [...permitFields].sort()) && permit.permit_id === context.permitId
    && permit.status === "completed" && permit.action_class === "cms_write" && permit.operation === "publish" && permit.parent_permit_id === null
    && permit.task_id === entry.taskId && permit.action_id === entry.actionId && permit.candidate_version === entry.candidateVersion
    && permit.scope === entry.scope && permit.record_id === entry.recordId && permit.slug === entry.slug
    && permit.payload_sha256 === entry.desiredFieldsSha256 && permit.rollback_payload_sha256 === entry.rollbackFieldsSha256
    && samePgTimestamp(permit.expected_updated_at, entry.expectedUpdatedAt) && permit.github_repository_id === context.repositoryId
    && permit.github_workflow_ref === context.workflowRef && permit.github_workflow_sha === context.releaseSha
    && Number(permit.github_run_id) === context.runId && Number(permit.github_run_attempt) === context.runAttempt
    && Number(permit.github_actor_id) === context.actorId && permit.operations_decision_id === context.operationsDecisionId
    && permit.policy_decision_id === context.policyDecisionId && entry.qaProofs.some(qa => qa.receiptId === permit.qa_receipt_id),
  "Own exact completed permit/31-field identity changed; no revision may be consumed");
  assertActualPublish(entry, receipt, row, { status: permit.status, operation: permit.operation, taskId: permit.task_id,
    actionId: permit.action_id, candidateVersion: permit.candidate_version, githubRunId: Number(permit.github_run_id),
    githubRunAttempt: Number(permit.github_run_attempt), savedId: permit.saved_id, savedUpdatedAt: permit.saved_updated_at },
  { runId: context.runId, runAttempt: context.runAttempt });
  const evidence = issuedEvidence?.evidence, issued = issuedEvidence?.issued;
  assert(issued?.permitId === permit.permit_id && issued.status === "issued" && issued.operation === "publish"
    && samePgTimestamp(issued.expiresAt, permit.expires_at) && stableDigest(evidence) === permit.issuer_evidence_sha256
    && evidence.registrySha256 === context.registrySha256 && evidence.target === entry.target && evidence.entrySha256 === stableDigest(entry)
    && evidence.authorizationId === APPROVAL_ID && evidence.operationsDecisionId === context.operationsDecisionId
    && evidence.policyDecisionId === context.policyDecisionId && same(evidence.identity, { repositoryId: context.repositoryId,
      actorId: context.actorId, workflowRef: context.workflowRef, runId: context.runId, runAttempt: context.runAttempt, workflowSha: context.releaseSha })
    && evidence.actualPayloadSha256 === entry.desiredFieldsSha256 && evidence.actualPriorSha256 === entry.rollbackFieldsSha256
    && same(evidence.actualQa, entry.qaProofs.map(qa => ({ id: qa.receiptId, sha256: qa.sha256 })))
    && [evidence.actualPreviewSha256, evidence.actualPreviewReceiptSha256].every(value => /^[0-9a-f]{64}$/.test(value)),
  "Actual issuer evidence and its full-permit digest must bind this native write");
  const published = receipt.published, cache = published.cache_invalidation, purge = cache?.edge_purge_requested;
  assert(stage.target === entry.target && stage.stage === "publish" && stage.exitCode === 0 && stage.signal === null && stage.processErrorCode === null
    && receipt.operation === "optimize" && published.dry_run === false && published.content_type === "blog" && published.action === "publish"
    && published.slug === entry.slug && published.status === "published" && published.existing_id === entry.recordId
    && Array.isArray(published.warnings) && published.warnings.length === 0 && cache?.ok === true && cache.strategy === "content-revision"
    && typeof cache.revision === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(cache.revision)
    && Number.isFinite(Date.parse(cache.revision)) && cache.revision !== previousIdentity.updated_at
    && purge?.ok === true && purge.attempted === true && purge.tag === "flashcast-public-html" && purge.status === 200,
  "Successful own native receipt, exact cache revision and actual edge purge are required");
  const times = [permit.issued_at, permit.claimed_at, permit.writing_at, permit.saved_updated_at, permit.completed_at,
    audit?.[0]?.created_at, cache.revision, stage.checkedAt].map(pgEpochMicros);
  const expires = pgEpochMicros(permit.expires_at), previous = pgEpochMicros(previousIdentity.updated_at);
  assert(Array.isArray(audit) && audit.length === 1 && typeof audit[0].id === "string" && audit[0].id.length > 0
    && same(Object.keys(audit[0]).sort(), ["id", "action", "table_name", "record_id", "created_at"].sort())
    && audit[0].action === "publish" && audit[0].table_name === entry.table && audit[0].record_id === entry.recordId
    && times.every(value => value !== null) && expires !== null && previous !== null
    && times.every((value, index) => index === 0 || value >= times[index - 1])
    && times[2] < expires && expires > times[0] && expires - times[0] <= 900_000_000
    && times[6] > times[3] && times[6] > times[4] && times[6] > previous,
  "Exact single publish audit and native permit/cache microsecond chronology are required");
  return { ...previousIdentity, updated_at: cache.revision };
}
export function assertTwelveCompletedPermit(entry, proof, permits, index) {
  if (index < 11) return assertElevenCompletedPermit(entry, proof, permits, index);
  assert(index === 11 && proof.originRunId === fourth.runId && proof.originReleaseSha === fourth.releaseSha
    && same(permits.filter(permit => permit.status !== "revoked"), [proof.permit]) && proof.permit.status === "completed"
    && proof.permit.permit_id === "9361bea1-246d-4947-a5ce-91f573e58884" && Number(proof.permit.github_run_id) === fourth.runId
    && proof.permit.github_workflow_sha === fourth.releaseSha && proof.permit.saved_id === entry.recordId
    && samePgTimestamp(proof.permit.saved_updated_at, proof.actualUpdatedAt), "Fourth saved permit changed, duplicated or uncertain; never replay");
}
export function assertStrictSavedPage(page) {
  assert(page.ok===true&&page.strictMetadata===true&&page.ready===true&&page.renderedOk===true
    &&page.status===200&&page.rawStatus===200&&page.runtimeErrors===0&&page.productionWrites===0
    &&page.metadata?.titleFound===true&&page.metadata?.descriptionMatches===true
    &&page.hydratedMetadata?.titleFound===true&&page.hydratedMetadata?.descriptionMatches===true
    &&Array.isArray(page.requiredText)&&page.requiredText.length>0&&page.requiredText.every(text=>typeof text==="string"&&text.length>0)
    &&Array.isArray(page.missingRequired)&&page.missingRequired.length===0,"Strict real saved body and exact raw/hydrated metadata are required");
}
export function installRevisionIdentityGuards(dependencies, readIdentity, getExpectedIdentity, onPublish) {
  const preview=dependencies.preview,publish=dependencies.publish;
  dependencies.preview=async entry=>{await readIdentity(getExpectedIdentity());return preview(entry);};
  dependencies.publish=async(entry,permitId)=>{await readIdentity(getExpectedIdentity());onPublish(permitId);return publish(entry,permitId);};
}
export async function readScopedPublishAudit(entry,permit,environment,fetchImpl=fetch) {
  const url=new URL("/rest/v1/admin_audit_logs",environment.VITE_SUPABASE_URL);
  for(const [key,value] of Object.entries({select:"id,action,table_name,record_id,created_at",table_name:`eq.${entry.table}`,record_id:`eq.${entry.recordId}`,created_at:`gte.${permit.writing_at}`,limit:"20"}))url.searchParams.set(key,value);
  const response=await fetchImpl(url,{method:"GET",cache:"no-store",headers:{apikey:environment.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(20000)});
  assert(response.ok,"Exact current-row machine audit readonly lookup failed");const rows=await response.json();assert(Array.isArray(rows)&&rows.length<20,"Exact audit lookup truncated");return rows;
}
export function readRemainder8Registry(bytes = readFileSync(REMAINDER8_PATH)) {
  assert(hash(bytes) === REMAINDER8_SHA256, "Frozen exact remainder8 registry hash differs");
  const binding = JSON.parse(bytes), historical = readRemainder9Registry(), original = historical.original;
  assert(binding.schemaVersion === 1 && binding.batch === REMAINDER8_NAME && binding.sourceRegistryPath === REGISTRY_PATH && binding.sourceRegistrySha256 === REGISTRY_SHA256
    && binding.previousRemainder9Sha256 === REMAINDER9_SHA256 && binding.previousRemainder9Path === REMAINDER9_PATH
    && binding.authorizationId === APPROVAL_ID
    && binding.executionDecision.id === "owner-directed-remainder8-after-38037667102-v1"
    && binding.executionDecision.policyDecisionId === "exact-reviewed-remainder8-20261010-v1"
    && binding.freshPermitReadRequiredBeforePublish === true && binding.dryRunPrivatePermitRead === false
    && binding.completedProofPath === "drafts/publishing/fc-20261010-remainder8-after-38037667102-v1/completed-twelve-rechecked-proof.json"
    && binding.executionDecision.departmentControllerReviewClaimed === false && binding.remainingRowCount === 8 && binding.remainingQaCount === 8
    && same(binding.excludedCompletedTargets, original.entries.slice(0,12).map(entry => entry.target))
    && same(binding.remainingTargets, original.entries.slice(12).map(entry => entry.target)), "Only fixed c08-c15 forward scope is admitted");
  const proofBytes = readFileSync(binding.completedProofPath); assert(hash(proofBytes) === binding.completedProofSha256, "Actual twelve-row proof hash differs");
  const proof = JSON.parse(proofBytes);
  assert(proof.schemaVersion === 1 && proof.actualCompletedRows === 12 && proof.actualQaCount === 14 && proof.completed.length === 12
    && proof.productionWrites === 0 && proof.credentialsPersisted === false && proof.customerReads === 0 && proof.notifications === 0
    && same(proof.stoppedRuns, [...historical.proof.stoppedRuns, fourth])
    && same(proof.stoppedRunSummaries.slice(0,3), historical.proof.stoppedRunSummaries) && proof.stoppedRunSummaries.length === 4
    && same(proof.sourceRendererSha256, historical.proof.sourceRendererSha256)
    && same(proof.reviewedPipelineSourceSha256, historical.proof.reviewedPipelineSourceSha256)
    && same(proof.metadataSourceSha256, historical.proof.metadataSourceSha256)
    && same(Object.keys(proof.nativeRevisionSourceSha256).sort(), [...nativeFiles].sort()), "All four failures and unchanged product source closures must remain frozen");
  for (const set of [proof.sourceRendererSha256, proof.reviewedPipelineSourceSha256, proof.metadataSourceSha256, proof.nativeRevisionSourceSha256])
    for (const [path, sha256] of Object.entries(set)) assert(hash(readFileSync(path)) === sha256, "Frozen exact remainder8 source differs before any preview");
  const stopped = proof.stoppedRunSummaries[3].summary;
  assert(stopped.batch === historical.binding.batch && stopped.registrySha256 === REMAINDER9_SHA256 && stopped.mode === "publish"
    && stopped.stoppedAt === original.entries[11].target && stopped.rows[0].status === "FAILED_STOPPED" && stopped.rows[0].performedWrite === null
    && stopped.rows[0].failedAt === "PERMIT_ISSUED" && stopped.rows[0].permitId === proof.completed[11].permit.permit_id
    && stopped.rows[0].writeOutcome === "INSPECT_ACTUAL_SINGLE_USE_PERMIT_AND_RECEIPT_DO_NOT_REPLAY"
    && same(stopped.rows.map(row => row.target), original.entries.slice(11).map(entry => entry.target))
    && stopped.rows.slice(1).every(row => row.status === "NOT_STARTED" && row.performedWrite === false), "Fourth failed summary cannot become a successful batch");
  const c07 = proof.completed[11], native = proof.fourthNativeEvidence;
  assert(c07.originalPublisherStatus.nativeStageExitCode === 0 && c07.originalPublisherStatus.receiptOk === true
    && c07.originalPublisherStatus.savedOk === true && c07.originalPublisherStatus.originalNativePostcheckOk === true
    && c07.originalPublisherStatus.originalRealBodyPostcheckOk === false && same(c07.originalPublisherStatus.originalRealBodyPages, []), "Fourth save and failed hook must both remain truthful");
  const expected = assertOwnNativeRevision({ entry: original.entries[11], receipt: native.receipt, stage: native.stage,
    row: c07.publicCurrentProjection, permits: [c07.permit], previousIdentity: proof.previousPublicIdentity,
    context: proof.fourthRunContext, permitFields: Object.keys(historical.proof.completed[0].permit), issuedEvidence: native.issuedEvidence, audit: native.audit });
  assert(same(proof.previousPublicIdentity, historical.proof.publicIdentity) && same(expected, proof.publicIdentity), "Only fourth native own revision may advance the frozen public identity");
  for (const [index, entry] of original.entries.slice(0,12).entries()) {
    const item = proof.completed[index]; assertCompletedRow(entry, item, item.publicCurrentProjection); assertTwelveCompletedPermit(entry,item,[item.permit],index);
    if(index < 11) assert(same(item.originalPublisherStatus, historical.proof.completed[index].originalPublisherStatus), "Historical failed body evidence must remain exact");
    assert(item.pass === true && same(item.qa, entry.qaProofs.map(qa => ({ receiptId: qa.receiptId, expected: qa.reviewedPayloadSha256, actual: qa.reviewedPayloadSha256 })))
      && same(item.freshBilingualReadback.map(page => page.path), targetConfigs[entry.target].publicPaths.map(page => page.path))
      && item.freshBilingualReadback.length===2,
    "All twelve exact QA and twenty-four strict real body/metadata pages required");
    item.freshBilingualReadback.forEach(assertStrictSavedPage);
  }
  const entries = original.entries.slice(12), qaIds = new Set(entries.flatMap(entry => entry.qaProofs.map(qa => qa.receiptId)));
  assert(qaIds.size === 8 && proof.remainingCandidateContracts.checkedCandidates === 16 && proof.remainingCandidateContracts.ok === true
    && proof.remainingCandidateContracts.fixtureOnly === true && proof.remainingCandidateContracts.livePageAcceptance === false
    && proof.remainingCandidateContracts.productionWrites === 0 && proof.remainingCandidateContracts.rows.length === 16
    && same(proof.remainingCandidateContracts.rows.map(row => [row.target,row.language]), entries.flatMap(entry => ["en","zh"].map(language => [entry.target,language])))
    && proof.remainingCandidateContracts.rows.every(row => row.ok === true && row.actualProductPipeline === true && same(row.pipelineSourceSha256,proof.reviewedPipelineSourceSha256)),
  "Exactly sixteen local remaining candidates and eight QA are required");
  return { binding, proof, original, historical, registry: { ...original, batch: REMAINDER8_NAME, uniqueRows: 8, sourceQaCount: 8,
    entries, sourceQaReceipts: original.sourceQaReceipts.filter(qa => qaIds.has(qa.id)), executionDecision: { ...original.executionDecision, ...binding.executionDecision } } };
}
export async function verifyTwelveBeforeRemainder8({ prepared, mode, readCurrent, readPermits, publicIdentity = prepared.proof.publicIdentity,
  checkPage = verifyPublicPage, deriveBody = reviewedRenderedBodyPhrases, deriveMetadata = deriveReviewedPublicMetadata, save }) {
  const receipt = await verifyElevenBeforeRemainder9({ prepared: { ...prepared, proof: { ...prepared.proof, completed: prepared.proof.completed.slice(0,11) } },
    mode, readCurrent, readPermits, publicIdentity, checkPage, deriveBody, deriveMetadata, save: value => save({ ...value, actualCompletedRows: 12, ok: false }) });
  receipt.actualCompletedRows = 12; receipt.stoppedRuns = prepared.proof.stoppedRuns; receipt.ok = false;
  const entry = prepared.original.entries[11], proof = prepared.proof.completed[11], state = { target: entry.target, originRunId:proof.originRunId,
    permitId:proof.permit.permit_id,stage: "READ_CURRENT_STARTED", pages: [] };
  receipt.rows.push(state); receipt.failedTarget = entry.target; save(receipt);
  try {
    const row = await readCurrent(entry); assertCompletedRow(entry, proof, row);
    assert(entry.qaProofs.every(qa => stableDigest(Object.fromEntries(qa.coverageFields.map(field => [field,row[field] ?? null]))) === qa.reviewedPayloadSha256), "Fourth saved QA drifted");
    Object.assign(state,{stage:"CURRENT_ROW_AND_QA_PASS",actualUpdatedAt:row.updated_at,
      desiredSha256:stableDigest(Object.fromEntries(entry.changedFields.map(field=>[field,row[field]??null]))),
      retainedSha256:stableDigest(Object.fromEntries(entry.retainedProjectionFields.map(field=>[field,row[field]??null]))),qaReceiptIds:entry.qaProofs.map(qa=>qa.receiptId)});save(receipt);
    if (mode === "publish") {state.stage="PRIVATE_PERMIT_READ_STARTED";save(receipt);assertTwelveCompletedPermit(entry,proof,await readPermits(entry,proof),11);}
    state.permitStatus = mode === "publish" ? "FRESH_COMPLETED" : "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED";
    for (const config of targetConfigs[entry.target].publicPaths) {
      state.stage = "PUBLIC_PAGE_STARTED"; receipt.failedPath = config.path; save(receipt);
      const language = config.path.startsWith("/zh/") ? "zh" : "en", expected = await deriveMetadata({ entry,row,language,path:config.path,identity:publicIdentity });
      assert(same(expected.sourceSha256,prepared.proof.metadataSourceSha256), "Fourth saved exact metadata source changed");
      const page = await checkPage({ site: prepared.original.site,path:config.path,title:expected.raw.title,description:expected.raw.description,
        strictMetadata:true,hydratedMetadata:expected.hydrated,requiredText:await deriveBody({entry,row,language}) });
      state.pages.push(page); save(receipt); assertStrictSavedPage(page);
    }
    state.stage = "COMPLETED_ROW_GUARD_PASS"; delete receipt.failedTarget; delete receipt.failedPath; receipt.ok = true; save(receipt); return receipt;
  } catch(error) { receipt.diagnostic = sanitizePublisherDiagnostic(error.message); save(receipt); throw error; }
}
export async function runRemainder8Command() {
  assert(process.argv.slice(2).every(arg => /^--(?:mode|artifact-dir)=/.test(arg)), "This command accepts only mode and an in-project audit directory");
  assert(process.env.PUBLISH_TARGET === REMAINDER8_NAME, "Only fixed c08-c15 is accepted; no skip or replay");
  const prepared = readRemainder8Registry(); let expectedIdentity = prepared.proof.publicIdentity, runtimeDependencies, executingPermitId;
  const environment = process.env, permitFields = Object.keys(prepared.proof.completed[0].permit);
  const readPermits = async entry => {
    assert(environment.SUPABASE_SERVICE_ROLE_KEY, "Only publish may read exact private permits");
    const url = new URL("/rest/v1/managed_cms_release_permits",environment.VITE_SUPABASE_URL);
    for (const [key,value] of Object.entries({select:permitFields.join(","),task_id:`eq.${entry.taskId}`,action_id:`eq.${entry.actionId}`,candidate_version:`eq.${entry.candidateVersion}`})) url.searchParams.set(key,value);
    const response = await fetch(url,{method:"GET",cache:"no-store",headers:{apikey:environment.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(20000)});
    assert(response.ok,"Exact completed permit readonly lookup failed"); const rows = await response.json(); assert(Array.isArray(rows)&&rows.length<1000,"Exact permit lookup truncated"); return rows;
  };
  return runFrozenCommand({ registry:prepared.registry,binding:{batch:REMAINDER8_NAME,sha256:REMAINDER8_SHA256},
    beforeExecute:async({mode,dependencies,write,artifactRoot})=>{
      runtimeDependencies=dependencies; const identity=await readReviewedPublicIdentity(environment,expectedIdentity);
      write(join(artifactRoot,"current-public-identity-receipt.json"),{checkedAt:new Date().toISOString(),identity,productionWrites:0,publicReadOnly:true});
      const contracts=await verifyCandidateTextContracts(prepared.registry.entries.flatMap(entry=>["en","zh"].map(language=>({entry,target:entry.target,language,
        row:targetConfigs[entry.target].buildRecord(read(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath))}))));
      write(join(artifactRoot,"candidate-text-contract.json"),contracts);
      assert(contracts.checkedCandidates===16&&contracts.ok===true&&contracts.fixtureOnly===true&&contracts.livePageAcceptance===false
        && contracts.productionWrites===0&&contracts.rows.length===16
        && same(contracts.rows.map(row=>[row.target,row.language]),prepared.registry.entries.flatMap(entry=>["en","zh"].map(language=>[entry.target,language])))
        && contracts.rows.every(row=>row.ok===true&&row.actualProductPipeline===true&&same(row.pipelineSourceSha256,prepared.proof.reviewedPipelineSourceSha256)),"Fixed eight actual local pipeline contract differs");
      await verifyTwelveBeforeRemainder8({prepared,mode,publicIdentity:identity,readCurrent:dependencies.readCurrent,readPermits,
        save:value=>write(join(artifactRoot,"completed-twelve-rows-fresh-guard.json"),value)});
      installRevisionIdentityGuards(dependencies,expected=>readReviewedPublicIdentity(environment,expected),()=>expectedIdentity,permitId=>{executingPermitId=permitId;});
    },
    afterPublish:async({entry,write,artifactRoot})=>{
      const path=join(artifactRoot,entry.target),pages=[],post={target:entry.target,checkedAt:new Date().toISOString(),previousIdentity:expectedIdentity,
        stage:"NATIVE_REVISION_VALIDATION_STARTED",permitId:executingPermitId,pages,ok:false,productionWrites:0};
      const save=()=>{write(join(path,"own-native-revision-receipt.json"),post);write(join(path,"batch-rendered-body-postcheck.json"),post);};save();
      try {
      const receipt=read(join(path,"publish-receipt.json")),stage=read(join(path,"publisher-publish-stage.json"));
      const row=await runtimeDependencies.readCurrent(entry),permits=await readPermits(entry),previousIdentity=expectedIdentity;
      const permit=permits.find(item=>item.permit_id===executingPermitId);assert(permit,"This native completed permit is missing");
      const audit=await readScopedPublishAudit(entry,permit,environment),issuedEvidence=read(join(path,"batch-permit-evidence.json"));
      const next=assertOwnNativeRevision({entry,receipt,stage,row,permits,previousIdentity,permitFields,context:{permitId:executingPermitId,
        repositoryId:prepared.original.repositoryId,workflowRef:prepared.original.workflowRef,releaseSha:environment.GITHUB_SHA,
        runId:Number(environment.GITHUB_RUN_ID),runAttempt:Number(environment.GITHUB_RUN_ATTEMPT),actorId:Number(environment.GITHUB_ACTOR_ID),
        operationsDecisionId:prepared.registry.executionDecision.id,policyDecisionId:prepared.registry.executionDecision.policyDecisionId,
        registrySha256:REMAINDER8_SHA256},issuedEvidence,audit});
      Object.assign(post,{previousIdentity,ownNativeCacheRevision:next.updated_at,nativeReceiptSha256:hash(readFileSync(join(path,"publish-receipt.json"))),nativeStageSha256:hash(readFileSync(join(path,"publisher-publish-stage.json"))),
        savedId:row.id,savedUpdatedAt:row.updated_at,permitId:executingPermitId,issuerEvidenceSha256:permit.issuer_evidence_sha256,
        nativeIssuerArtifactSha256:hash(readFileSync(join(path,"batch-permit-evidence.json"))),fullCompletedPermit:permit,scopedAudit:audit});save();
      const identity=await readReviewedPublicIdentity(environment,next);post.identity=identity;post.stage="STRICT_REAL_BODY_STARTED";save();
      for(const config of targetConfigs[entry.target].publicPaths){
        const language=config.path.startsWith("/zh/")?"zh":"en",expected=await deriveReviewedPublicMetadata({entry,row,language,path:config.path,identity});
        assert(same(expected.sourceSha256,prepared.proof.metadataSourceSha256),"Actual post-publish metadata source changed");
        const page=await verifyPublicPage({site:prepared.original.site,path:config.path,title:expected.raw.title,description:expected.raw.description,
          strictMetadata:true,hydratedMetadata:expected.hydrated,requiredText:await reviewedRenderedBodyPhrases({entry,row,language})});
        pages.push(page);save();assertStrictSavedPage(page);
      }
      await readReviewedPublicIdentity(environment,next); expectedIdentity=next;post.stage="OWN_REVISION_AND_STRICT_REAL_BODY_PASS";post.ok=true;save();
      }catch(error){post.diagnostic=sanitizePublisherDiagnostic(error.message);save();throw error;}
    }});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runRemainder8Command().catch(error=>{
  console.error(sanitizePublisherDiagnostic(error.message,[process.env.CONTENT_PUBLISH_SECRET,process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.VITE_SUPABASE_ANON_KEY,process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]));process.exitCode=1;
});
