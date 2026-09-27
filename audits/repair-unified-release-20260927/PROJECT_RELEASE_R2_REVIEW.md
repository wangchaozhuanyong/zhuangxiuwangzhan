# FLASH CAST completed-change release inventory, round 2

Owner request: collect all completed pending changes in this project, merge main, deploy once and verify production. Repository: wangchaozhuanyong/zhuangxiuwangzhan. Integration root: .worktrees/repair-unified-release-20260927. Main/live baseline: 8086a4ea2a249fff72bbafe2f49047e60fa53448.

## Inventory and source commits

Read-only inventory covers 52 worktrees. The earlier 49-tree classification is retained for unchanged branches and patches already merged or superseded; old branches are not blindly merged. The original root's HEAD and dirty state remain unchanged from the first inventory. No open PR existed at collection time.

| Item | Source | Disposition |
| --- | --- | --- |
| Repair service integration and shared layout | PR 123/124 | Already merged and published |
| Repair hero sharpness | PR 125 | Already merged and published |
| Repair assessment cards | PR 126 | Already merged and published |
| Bilingual process wording | fefb1734a7d9d1a961804fec39a800f69c1b5d39 | Included: 519a52d |
| CMS native body admission and frozen sources | 5f150be, 868837d | Included: 3713a41, 0915927 |
| GEO source binding | Initially unfinished; became a clean committed delivery at 17:33 MYT: db687ab and 88b8561 | Included in final completion PR as 3994bcf and 5d98626 |
| Untracked local reports, screenshots, previews and old unreferenced material textures | Existing local artifacts | Preserve; not production application changes |

The CMS delivery binds 18 frozen producer candidates (8 service rows, 10 blog rows) to their original task, record, two changed body fields and source hashes. Explicit owner execution, OIDC identity, single-use permits, CAS and retained-field guards remain required. Rollback restores only the original two fields and checks unrelated drift. It does not publish these 18 bodies by merging code.

## Local validation on the integrated source

- Node 22.23.3, existing npm lockfile/dependencies; no dependency upgrades.
- lint, typecheck, arch:check, i18n:check, git diff --check: passed.
- 11 affected test files: 329/329 passed, including native target publish/rollback/race/replay/authorization rejection and existing repair interactions.
- Supabase and Pages release controls: 18/18 passed.
- Actual in-app browser process routes in zh/en at 390/1440px: 4/4; all six steps, changed scope/coordination/cleaning text, no overflow. Existing CMS override behavior is retained.

The first CI run (36309107468) detected an additional existing workflow-contract test still expecting only the 12 old rollback targets: 351/352 passed. Updated that exact target-set assertion to include the 18 frozen native targets, keeping the old targets, main-only gate, credential ordering, non-rollback media restrictions and permit controls. The final CI run is recorded separately; the first failure is retained for traceability.

## Release boundaries

Use the existing Cloudflare Pages workflow once for the final merged SHA and compare the live version. The protected content-publish function uses its separate existing Supabase release workflow, tied to the same main/live SHA. That workflow requires a reviewed, expiring, single-use approval binding and required GitHub environment review before credentials. Current environment and repository approval-variable listings are empty; record/resolve that prerequisite before claiming the backend is deployed. Do not weaken the approval workflow or write the 18 CMS bodies as part of a function-code deployment.

The Edge workflow captures the prior function source and schema, verifies the permit migration is already applied, rejects pending migrations and restores prior function source on failure. No migration is included in this release.

## Architecture Compliance Report

1. Target module: company; cms.
2. Target layer: bilingual presentation copy; existing CMS service/permit validation and release adapters.
3. Edited files: processPageText.ts; native body target definitions, managed targets/service/permit issuer; existing publisher CLI and workflows; affected tests; frozen public candidate/baseline fixtures; this record.
4. Forbidden files touched: no. All source worktrees and original root preserved.
5. API paths changed: no new API; existing content-publish uses exact frozen targets.
6. Database access changed: no new table or migration; no CMS write executed during local validation.
7. Cross-module dependency introduced: no public-page import of backend frozen producer files; service/blog targets stay inside the CMS publisher boundary.
8. Business behavior changed: process wording now conditions coordination/deliverables on agreed scope; fixed native target admission extends the protected publisher while retaining explicit approvals and field restrictions.
9. arch:check result: passed.
10. Remaining architecture risk: production Edge rollout and candidate-body execution must be reported separately from main merge/Pages deployment.

## Final collection amendment: completed GEO delivery

PR 127 merged the process and native publisher controls as f26139e. While its Pages build was running, the GEO delivery became clean and committed. Cancelled run 36309700270 before its deployment step; public version was still 8086a4e. The final completion PR incorporates that newly completed delivery and extends the existing strict CI coverage to its source paths and GEO integration and existing cache tests (55/55 passed locally). Preserve the first inventory as a timestamped snapshot; the later delivery supersedes only its unfinished GEO classification.

### Architecture Decision

1. Target module: seo; projects.
2. Why this module: public metadata, robots rules and readable public-body fallback belong to SEO; project PageMeta consumes its existing public data adapter.
3. Target layer: public metadata resolver, existing data mapper and Cloudflare HTML presentation adapter.
4. Why this layer: preserve existing published-row reads and route contracts without adding a content-writing service.
5. Files allowed to edit: the ten GEO delivery files, the existing R3 PR workflow coverage and this release record.
6. Files forbidden to edit: authentication, schema/migrations, real CMS rows, dependency files, other source worktrees and original dirty checkout.
7. API paths affected: none added; three exact published paths get sanitized no-JS bodies, four project slugs share rendering metadata.
8. Database access location: existing fresh public-row middleware reader; the selected blog gets body fields in its existing metadata query, without an extra query.
9. Cross-module dependency risk: shared pure metadata and media-identity helpers are used only through existing adapters; no backend frozen-body import into frontend.
10. Business behavior impact: clearer concept provenance and readable published content without JavaScript; no lead, form or CMS content write.

### Architecture Compliance Report, final GEO amendment

1. Target module: seo; projects.
2. Target layer: public metadata and HTML/data adapters.
3. Edited files: functions/_middleware.ts, readablePublicBody.ts, public/robots.txt, generate-seo-manifest.mjs, contentApi.ts, projectPublicMetadata.mjs and declaration, ProjectDetail.tsx, GEO integration test and fixture, CI coverage, this report.
4. Forbidden files touched: no.
5. API paths changed: no.
6. Database access changed: existing select includes the targeted published blog body/status; no additional query, write, table or migration.
7. Cross-module dependency introduced: shared public metadata helper through existing adapters, no internal repository call.
8. Business behavior changed: rendering identity and bounded sanitized no-JS fallback; existing cache, authorization and forms retained.
9. arch:check result: passed; lint, typecheck, i18n and git diff checks also passed locally.
10. Remaining architecture risk: Pages version, actual no-JS production bodies and separate protected Supabase function rollout must each be verified before claiming completion. The 18 candidate body writes remain unpublished and await their own independent QA.
