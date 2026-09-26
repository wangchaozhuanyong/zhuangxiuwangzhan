# Four-target protected CMS capability recovery

This package is a local R3 code candidate based on production website source `ac753cdae2532bb324fac86794acc41fe49f795b`. It does not authorize publishing the capability or any CMS content.

## Frozen inputs

- KL R1 candidate: `kuala-lumpur-location-cms-candidate-v2.json`; read-only row: `kuala-lumpur-baseline.json`.
- Builtin, Warehouse, Office R1 candidate: `service-media-fields-r1-v5.json`; read-only rows: `<slug>-baseline.json`.
- The protected publisher pins each source file's SHA-256, full selected-field baseline hash, desired-field hash, row ID, slug, original task/action, candidate version, exact scope, and `updated_at`. These baselines are QA evidence, not write-time backups.

## Code release and recovery

After independent capability QA and an exact R3 decision, use the website's protected PR, required CI, `main`, Pages and Edge workflow for the same SHA. The release operator must first capture the current Edge source/version and production website SHA through the existing protected release backup. If code postcheck fails, stop CMS writes and restore the prior verified Edge/site source from that protected backup with a separate approved release; verify both production SHAs and the old target list. Do not reset unrelated `main` changes.

## Content writes and recovery

Each original R1 task needs its own fresh full-row read, current `updated_at`, zero-write protected dry-run, QA PASS, operations `AUTO_RELEASE`, exact one-use `cms_write` permit and independent public postcheck. A saved ID for one row never proves another row was saved. Unknown results require readback before a new permit.

- KL: write only `content_en,content_zh`. Keep the actual pre-write full row and parent run artifact. An exact separately permitted rollback may restore those two prior fields if the parent run, current saved version and unchanged other fields match.
- Three service-media rows: write only `image_url,alt_en,alt_zh`, one row per permit. The prior images have unresolved usage rights. The protected issuer, Edge and workflow therefore reject automatic rollback to those old URLs. If a new media save or public check fails, preserve the saved ID/row evidence, stop further writes, and escalate a separately reviewed forward correction or temporary concealment of the affected image. Do not make the old placeholder image public again merely to satisfy a rollback checklist.

Public acceptance for the media work checks settled CMS hydration across EN/ZH, list/detail, 390/1280, including image bytes, same-language alt, visible AI-concept disclosure and Quote path. No local test or instantaneous fallback render is production acceptance.
