# warehouse content trust change

- Operation: optimize
- Content type: service
- Bilingual paths: /en/services/warehouse, /zh/services/warehouse
- Backup: `backup.json`
- Desired payload: `desired.json`
- Dry run: `dry-run.json`
- Rollback command: `npm run content:trust-fixes -- --target=warehouse --execute --approval-id=OWNER-STANDING-WEBSITE-CONTENT-2026-08-14 --rollback-from=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-content-trust-20260821/audits/content-trust-20260821/warehouse/backup.json --env-dir=/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`
