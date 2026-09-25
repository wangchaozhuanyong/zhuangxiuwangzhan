# Four-target protected CMS capability: recovery boundaries

This commit is a local R3 code candidate. It does not change a CMS row or the
production Edge Function. The original QA-locked content tasks retain their
own task, action, target and permit identities.

The local pre-change source package is
`backups/fc-20260926-protected-cms-four-target-capability-v1/site-code-before.tar.gz`
with file hashes in the adjacent `manifest.json`. It captures seven relevant
files from `main@75f474922c908a6af3bdf2ba68e0a849c9503ab8`; it is not a
production Edge backup.

## Before any capability release

Record the current production website SHA (`/__flashcast/version`), the
currently deployed `content-publish` Edge source hash and deploy identity, and
the working versions of `content-publish-approved.yml`, the publisher and
target table. Save those files in the website project's `backups/` before
deployment. The capability path requires separate QA, protected CI, main,
same-SHA website deployment and a guarded Edge deployment. A code deploy is
not a CMS Saved ID or content publication.

## If the capability fails

Stop new permit issuance and content writes. Read back the Edge version and
the exact files on main. Restore the verified pre-release Edge source through
the existing protected Edge workflow; restore the website code through a
reviewed forward fix or revert and the normal same-SHA release. Do not edit
CMS tables, replay a permit, or restore an unrelated deployment.

## If a later content write needs rollback

Use only the target's successful parent publish run and its uploaded
`backup.json`. Verify the completed parent permit, run ID, target, row ID,
slug, fields, baseline digest and current microsecond `updated_at`. Obtain a
new QA/operations/policy decision and one-time rollback permit. For all three
Blog targets the Edge issuer requires `parentRunId` to equal the completed
parent permit's `github_run_id`; a different Blog, stale version or reused
permit must fail before writing. The Office Service restore is limited to
`content_en` and `content_zh`. Each target requires separate EN/ZH public
verification and a recorded CMS Saved ID after the protected workflow.

Original Office baseline: `office-service-scope-r1-v1-baseline.json`, SHA-256
`7857a4eea39bbd96d546cbf379af9d6ae9eaf3d481c4d719aa920f82800c9f70`.
The three Blog baseline snapshots and their hashes are in the sibling
`fc-20260925-three-blog-managed-target-code-v1/ROLLBACK.md`.
