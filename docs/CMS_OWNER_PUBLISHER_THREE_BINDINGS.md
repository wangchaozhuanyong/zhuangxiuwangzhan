# 三项精确 CMS 候选绑定

本轮只新增原任务 `fc-20260928-keyword-page-answer-implementation-v1` 的三个后端目标，不保存或发布 CMS 内容。

| CLI target | 记录 | 精确修改字段 |
| --- | --- | --- |
| `v17-owner-publisher-native-preparation-v2-20261007` | services / old-house | faqs_en、faqs_zh |
| `v18-owner-publisher-native-preparation-v2-20261007` | blog_posts / renovation-quotation-checklist-malaysia | content_en、content_zh |
| `v20-owner-publisher-native-preparation-v2-20261007` | services / design | faqs_en、faqs_zh |

`owner-publisher-three-targets.ts` 仅包含后端目标、精确业务身份、批准投影摘要和原始微秒 CAS。固定 CLI 适配器只读取 `drafts/seo/fc-20261007-publisher-three-designated-binding-v1/{v17,v18,v20}.json`，校验整个包装的摘要、原制作方 pin、原稿 pin 和精确两字段摘要。包装保留六个原字段值，不包含完整修改前记录，不导入前端。

每项的受保护预览命令（从仓库根目录执行，环境目录使用原流程的受管配置）：

```sh
node scripts/publish-content-trust-fixes.mjs \
  --target=v17-owner-publisher-native-preparation-v2-20261007 \
  --env-dir=<受管配置目录> \
  --artifact-dir=backups/publisher-three-preview-v17
```

另外两项替换 `--target` 和各自的私有输出目录。该命令默认 dry-run；实际预览前先核对部署的后端版本、当前记录投影、状态、版本、六位微秒更新时间和制作方 pin。原基线变化必须停止并获得新的准确候选，不能现场修改摘要绕过检查。

正式 Save 继续归固定发布部：独立准确性 QA、部署能力观察、正向受保护 preview、本轮真实主线/运行及单次短期许可齐备后，才使用 `content-publish-approved.yml` 的准确 target。CLI 直接 `--execute` 仍要求 main Actions/OIDC 和准确许可；选择项不会授予发布权。

这三项 `rollbackAllowed=false`，CLI 和流程在读取生产凭据前拒绝旧版恢复。若实际 Save 后需要修正，必须依据真实 saved CAS 准备新的正向修正，重新审核和授权；不得复用旧 parent/permit。既有 writer、鉴权、单次许可、完整发布字段校验和数据库结构均沿用。

后端目标代码合入主线不代表 Supabase 已部署。Edge 发布仍必须走既有 `supabase-content-publish-r3.yml`，具备本轮主线 SHA/真实运行的有效受保护审批。Pages 发布不能替代这个步骤，代码部署也不能当作三项正文已发布。
