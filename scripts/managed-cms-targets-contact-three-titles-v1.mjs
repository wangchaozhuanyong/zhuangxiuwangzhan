import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const sourcePath="drafts/publishing/fc-20261019-contact-conversion-malay-followthrough-v1/frozen-contact-cms-pages-three-titles.json", sourceSha256="adcab17f4e24ea9ff670769fd9eee06a2ecfaad21d8851ca8df1cf6013e70809";
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==="object"?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x??null;
const digest=x=>createHash("sha256").update(JSON.stringify(stable(x))).digest("hex");
const freeze=x=>{if(x&&typeof x==="object"){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
export function readContactCmsPageTitleCandidate(bytes){
 if(createHash("sha256").update(bytes).digest("hex")!==sourceSha256)throw new Error("Contact exact title source bytes differ.");
 const s=JSON.parse(bytes.toString("utf8")),t=s.runtime_target,b=s.before;
 if(s.schema!=="contact-exact-cms-pages-three-title-frozen-source/v1"||s.task_id!=="fc-20261019-contact-conversion-malay-followthrough-v1"||s.business_scope!=="project:flashcast:contact-conversion-malay:20261019:v1"
  ||s.execution_department!=="publishing"||s.registration_grants_write_authority!==false||s.baseline_is_future_Save_CAS!==false
  ||t.id!=="4c328eda-a21d-4c34-bd5a-895d90122b23"||t.slug!=="contact"||t.contentType!=="site_page"||t.table!=="cms_pages"
  ||t.taskId!=="fc-20261019-contact-conversion-malay-followthrough-v1"||t.actionId!=="contact-conversion-first-batch-content-save"||t.candidateVersion!=="contact-three-locale-title-4c328eda-cms-v1"
  ||t.scope!==`flashcast.com.my:cms_pages:${t.id}:title_zh,title_en,title_ms`
  ||digest(t.changedFields)!==digest(["title_zh","title_en","title_ms"])||Object.keys(b).length!==24||t.baselineProjectionFields.length!==24
  ||t.retainedProjectionFields.length!==19||b.id!==t.id||b.page_key!==t.slug||b.path!=="/contact"||b.status!=="published"||b.deleted_at!==null
  ||b.updated_at!==t.expectedUpdatedAt||digest(b)!==t.baselineFieldsSha256||digest(s.desired)!==t.desiredFieldsSha256
  ||digest(Object.fromEntries(t.changedFields.map(f=>[f,b[f]])))!==t.rollbackFieldsSha256
  ||digest(Object.fromEntries(t.retainedProjectionFields.map(f=>[f,b[f]])))!==t.retainedFieldsSha256
  ||t.rollbackAllowed!==true||t.requiresParentRun!==true||s.conditional_inverse.requiresParentRun!==true
  ||s.conditional_inverse.parentPermitId!==null||s.conditional_inverse.parentRunId!==null||s.conditional_inverse.postSaveCAS!==null)
  throw new Error("Contact exact row/full24/protected19/original action/conditional inverse differs.");
 return freeze({["contact-three-locale-title-4c328eda-cms-v1"]:{...t,recordId:t.id,keyField:"id",status:"published",actionClass:"cms_write",exactPatchOnly:true,
  desiredFields:s.desired,sourceCandidatePath:sourcePath,sourceCandidateSha256:sourceSha256,qaEvidenceVersion:"contact-three-locale-title-4c328eda-cms-v1",
  publicPaths:s.public_paths,rollbackPublicPaths:s.public_paths}});
}
export const lockedContactCmsPageTitleCandidate=readContactCmsPageTitleCandidate(readFileSync(resolve(process.cwd(),sourcePath)));
