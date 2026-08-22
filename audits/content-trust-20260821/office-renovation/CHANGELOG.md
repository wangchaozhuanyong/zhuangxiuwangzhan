# office-renovation content trust change

> Verification note: the first publish attempt was automatically rolled back after a false-negative JSON object-key-order comparison. Public HTML was healthy and the previous row was restored. The verifier was corrected to compare recursively canonicalized JSON, then the same reviewed bilingual payload was republished and passed row and public-page checks.

- Operation: optimize
- Content type: service
- Bilingual paths: /en/services/office-renovation, /zh/services/office-renovation
- Backup: `backup.json`
- Desired payload: `desired.json`
- Dry run: `dry-run.json`
- Rollback command: `npm run content:trust-fixes -- --target=office-renovation --execute --approval-id=OWNER-STANDING-WEBSITE-CONTENT-2026-08-14 --rollback-from=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-content-trust-20260821/audits/content-trust-20260821/office-renovation/backup.json --env-dir=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`
