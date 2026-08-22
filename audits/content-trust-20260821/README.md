# Content trust execution summary

- Authorization: `OWNER-STANDING-WEBSITE-CONTENT-2026-08-14`
- Execution window: 2026-08-22 UTC
- Publish path: protected `content-publish` API only
- Languages: English and Simplified Chinese for every target
- Gates: current-record backup, dry run, optimistic timestamp check, publish, cache purge, row comparison, public HTML verification, rollback command

## Published targets

| Target | Content type | Result |
| --- | --- | --- |
| `office-renovation` | Service | Passed after verifier correction and safe republish |
| `design` | Service | Passed |
| `builtin` | Service | Passed |
| `kitchen` | Service | Passed; legacy JPG reference normalized to the existing WebP asset |
| `bathroom` | Service | Passed |
| `shop-renovation` | Service | Passed |
| `warehouse` | Service | Passed |
| `approval` | Service | Passed; removed fixed approval-time and full-process promises |
| `mont-kiara-concept` | Project | Passed |
| `about-metadata` | Site page | Passed |

The committed receipts and postchecks contain no credentials. Full pre-change backups and desired payloads remain local in each target directory for rollback and are intentionally excluded from version control because they can contain superseded public copy.
