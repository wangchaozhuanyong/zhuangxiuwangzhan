# Original Google four-row channel candidate

This is local channel code for `fc-20260920-google-ads-rm100-budget-plan`. Paid1 remains business owner; original publishing remains the sole CMS executor. No source file, target registration, test, lookup or local commit grants a permit, Save or deployment.

The original candidate SHA256 is `2a47c39c4b6349c55c83130bec81f3309d67fb8af5a0ced02523b8d674f994e6`; owner adoption is `370591bdbd8369cda523598403c78e6c0fccba4cc147436dc2bc6c1f493d2601`. Current metadata source is `e52769d4a792e085aed9977a5b03cf75c19e4aa5b3815fe3bfdee03cb32f7ea8`, event `bcffa7d9-e7ad-40f6-b6de-db2b90ded472`. These preserve the original closed parent and human/native lineage; they are not production grants.

| service | record ID | action suffix / namespace suffix |
| --- | --- | --- |
| design | 0af89b93-8938-4a98-ba65-6525fbbe92c1 | 21a1a1ad2a3b66a30ac7b011 |
| kitchen | ce4156db-9034-42c8-ba29-b35724ea7d6d | 621f604c3a2e460c60b61438 |
| shop-renovation | 32f5374f-9919-41ea-80c7-00b5ac917532 | 0f31548d5b630ef286d45894 |
| office-renovation | a87541ac-1cba-4f1a-972d-428dccdbcc0f | 18538003e7a4ec9d9c54533b |

Each action is `current-stage-cms-<suffix>`; candidate version, CLI alias and proposed issuer namespace are `current-stage-source-<suffix>`. The physical scope is `flashcast.com.my:services:<record ID>:content_zh`. Only `content_zh` may change. Existing full41 is pinned with raw microsecond CAS; stable37 includes all11MS. Other40 values remain server/readback protection, never a write payload. Runtime inversion is disabled (`rollbackAllowed=false`). The source inverse patch restores code only and grants no CMS inverse.

## Actual Node/publisher integration

`scripts/managed-cms-targets-paid-four-current-v1.mjs` reads the immutable full41 source, verifies its byte SHA and exact four identities/digests/lineage, and exports four frozen candidates. Existing `publish-content-trust-fixes.mjs` consumes these through `targetConfigs`; existing `content-publish-approved.yml` lists all four aliases and retains main, verified workflow identity, exact permit, CAS, owner and single-use gates. The workflow adds an early forward-only/no-parent guard for these four aliases. No local production execution or local Node artifact upload is allowed.

`supabase/functions/_shared/paid-four-current-targets.ts` is consumed by the existing `MANAGED_SERVICES` registry. The existing publisher produces a single-field patch; no renderer or service body code changes are required. Official exact-head Node22 CI is mandatory after any future permitted push; local Node22 tests are not official CI.

## Existing issuer endpoint: bounded read-only discovery

The candidate adds `controlAction: "lookup"` to the existing `POST /functions/v1/content-publish` issuer control branch. It retains the original issuer-secret verification. It is not accepted as an ordinary admin Save or as a permission obtained by CMS login. No new secret, auth role, RLS rule, table, function deployment or endpoint is created by this local candidate.

Request fields are exactly `controlAction`, `taskId`, `actionId`, `candidateVersion`, `scope`, `recordId`, `slug`; the tuple must match one of the four fixed targets. `buildPaidFourPermitLookup(alias)` generates the request body without reading credentials or sending HTTP. Wrong/missing/extra identity fields are refused before querying.

After original issuer authentication, the reader selects only nonsecret permit/run/status metadata from `managed_cms_release_permits`, filtered by the fixed original task, exact record ID and slug. It reads up to26 rows and returns at most25. This deliberately discovers real prior action/version/scope values for that same original-task object without guessing permit IDs. Returned prior values are never renamed to the new namespace; `matchesRequestedNamespace` tells whether each actual row matches it. Other tasks/objects are refused. It never inserts, updates, claims, finishes, revokes or issues a permit.

Successful response contains `performed_write:false`, exact requested identity, `auditStatus`, `completeForOriginalTaskObject`, `historicalOrOtherNamespaceEffects:"UNKNOWN"`, and `permits` containing actual permitId/status/operation/actionId/candidateVersion/scope/run/attempt/saved ID/CAS. At26 rows the result is `INCOMPLETE_TOO_MANY_MATCHES`, never complete; another original task or an unknown external request remains outside this bounded lookup. An empty result is `NO_ORIGINAL_TASK_OBJECT_RECORDS`, not proof of all historical zero effects. Errors preserve UNKNOWN: malformed control body returns400; invalid exact tuple/query/returned identity returns403; absent issuer configuration503; invalid issuer authentication403. The existing single-permit `status` operation remains unchanged. Cache behavior is unchanged; no allow/effect cache is introduced.

## Normal issuer adoption dependency

The current department consumer `professional_cms_issuer.validate_contract` matches only sources returned by `professional_cms_execution.records`. The adopted legacy stage source is in `professional_cms_legacy_stage.execution_catalog`, under the original maintenance event, so it must not be presented as a different historical `goal_delivery` source. WEB prepares exact contracts with target/CLI/source pins for that normal consumer. Only its original SYS maintainer may make the necessary bounded consumer integration/adoption; WEB does not edit department runtime, rewrite the closed parent, issue permissions or substitute another task's contract.

After genuine consumer adoption and lawful code release, the original normal issuer must invoke the existing protected `endpoint_request` route with the source-validated exact lookup body, through its own lawful read capability. The candidate does not instruct PUB to extract a token, guess an ID or directly query the database. Prior IDs and effects stay DATA_MISSING/UNKNOWN until actual returned records and their original source are reconciled.

## Release boundary

Only local implementation/checks are authorized by the current continuation. Push/PR/merge/Pages/R3/environment/Edge require a real grant for the actual frozen head, fresh source/build/runtime backup and independent per-stage gates. No dispatch, approval, cancellation, TTL change or new attempt of the old shared R3 runs is covered. Current runtime/CLI/issuer loading must be read back separately; local tests do not prove remote loading. Before each later PUB Save, obtain original-key effects, fresh full41/CAS/server version, protected/MS readback, backup, zero-write preview and each original independent new single-use gate. No four-row batch permit or Save replay is permitted.

## 2026-10-30 current readback supplement

The original SYS custody repair preserves events cf2e9746, bcffa7d9 and 0b8681cb. Current normal target-status now discovers four professional_cms_current_stage_pending_v1 rows, all actual_action_allowed=false. This supersedes the historical missing-path/undiscoverable observation above; it does not establish executable issuer acceptance. Actual Dashboard inspection confirms deployment88 and no exact four-row target/lookup in that loaded source. An existing authenticated project-owner SQL Editor SELECT-only query has now returned the original task/action/same-record effects without needing a permit ID; its dated evidence is in the original WEB report. No new HTTP lookup is claimed loaded. Normal PUB read capability and future fresh CAS must still be established through its lawful route.

This local causal successor preserves current e2ef peer content, adds the original four-row delta, updates only affected exact registry count/catalog assertions, and does not grant push/deploy/CMS authority.
