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
| GEO source binding | Uncommitted five tracked edits and five untracked entries; no completed handoff or validation receipt | Unfinished: preserve source worktree, exclude from completed scope |
| Untracked local reports, screenshots, previews and old unreferenced material textures | Existing local artifacts | Preserve; not production application changes |

The CMS delivery binds 18 frozen producer candidates (8 service rows, 10 blog rows) to their original task, record, two changed body fields and source hashes. Explicit owner execution, OIDC identity, single-use permits, CAS and retained-field guards remain required. Rollback restores only the original two fields and checks unrelated drift. It does not publish these 18 bodies by merging code.

## Local validation on the integrated source

- Node 22.23.3, existing npm lockfile/dependencies; no dependency upgrades.
- lint, typecheck, arch:check, i18n:check, git diff --check: passed.
- 11 affected test files: 329/329 passed, including native target publish/rollback/race/replay/authorization rejection and existing repair interactions.
- Supabase and Pages release controls: 18/18 passed.
- Actual in-app browser process routes in zh/en at 390/1440px: 4/4; all six steps, changed scope/coordination/cleaning text, no overflow. Existing CMS override behavior is retained.

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
