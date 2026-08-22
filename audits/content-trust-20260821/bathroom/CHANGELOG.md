# bathroom content trust change

- Operation: optimize
- Content type: service
- Bilingual paths: /en/services/bathroom, /zh/services/bathroom
- Backup: `backup.json`
- Desired payload: `desired.json`
- Dry run: `dry-run.json`
- Rollback command: `npm run content:trust-fixes -- --target=bathroom --execute --approval-id=OWNER-STANDING-WEBSITE-CONTENT-2026-08-14 --rollback-from=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-content-trust-20260821/audits/content-trust-20260821/bathroom/backup.json --env-dir=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`
