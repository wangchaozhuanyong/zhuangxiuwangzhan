# Three managed Blog rows: restore procedure

This is a local R3 code candidate. No CMS row has been written. The six copied
candidate/baseline JSON files are immutable offline evidence; each publish run
must also create its own `backup.json` before any write. A rollback is a new,
independently approved, single-use action for **one** target.

| Workflow target | Original task | Original baseline SHA-256 |
| --- | --- | --- |
| `blog-kitchen-cabinet-cost-r1-v1` | `fc-20260925-organic-query-page-completion-v1` | `7821ff2f84daf4ab01cf707ef2f75fe29c80efefe941f095c349dacef8c7c3e9` |
| `blog-renovation-quotation-links-r1-v1` | `fc-20260925-existing-page-content-gap-v1` | `05472cd1f81b495e1f6efbfea741a06440cbf414ce12a5ebff60bbd29853126c` |
| `blog-office-checklist-links-r1-v1` | `fc-20260925-existing-page-content-gap-v1` | `e2a94385407078a28b7dd5f8f27c5df8cad5ba228d1433bbecf00401f9749001` |

For the one published target, read back the exact CMS ID, slug, changed fields,
`published_at`, and microsecond `updated_at`. Locate the successful parent
publish run and its completed permit. Confirm its uploaded `backup.json` has
the same target, row ID, slug and baseline field digest. Obtain separate QA,
operations and policy receipts for this rollback. If any identity, version or
result is uncertain, stop and read back the row and permit before retrying.

After the Blog issuer supports the exact target and `parentRunId` binding, run
the protected workflow from `main` with the selected target only:

```sh
TARGET=blog-kitchen-cabinet-cost-r1-v1 # replace with exactly one table target
PARENT_RUN_ID=123456789 # replace with the verified completed publish run
gh workflow run content-publish-approved.yml -R wangchaozhuanyong/zhuangxiuwangzhan --ref main \
  -f mode=dry-run -f target="$TARGET" -f managed_operation=rollback -f parent_run_id="$PARENT_RUN_ID"
```

Inspect the dry-run audit artifact: `performed_write=false`, unchanged row,
`payload_preview` limited to that target's 3 or 2 locked fields, and a digest
matching the planned SQL patch. Then the protected operator sets fresh values
for the following variables and invokes the issuer from the business project:

```sh
python3 tools/managed_cms_permit_issuer.py \
  --target "$TARGET" --operation rollback \
  --dry-run-run-id "$DRY_RUN_ID" \
  --operations-decision "$DECISION_PATH" \
  --policy-decision-id "$POLICY_ID" \
  --github-actor-id "$ACTOR_ID" \
  --parent-permit-id "$PARENT_PERMIT_ID" \
  --parent-run-id "$PARENT_RUN_ID" --issue-and-dispatch
```

That issuer dispatches one publish workflow run; do not
dispatch it separately or reuse a failed/uncertain permit. The Edge issuer
requires `parentRunId` to equal the completed parent permit's GitHub run ID,
and the SQL write compares `updated_at` atomically.

On success, record the restored CMS Saved ID and new `updated_at`, read back
the exact row, and verify both language URLs. The restore patch never includes
`published_at`, status, slug, or any unrelated field. A failed public check
requires a new evidence-backed decision; it does not authorize replay.

The business-project issuer has a local four-target patch, but its independent
QA and the website R3 capability release are separate gates. This procedure
remains blocked until the exact issuer and website code pass QA and deployment,
then each content action receives its own fresh permit and preflight.
