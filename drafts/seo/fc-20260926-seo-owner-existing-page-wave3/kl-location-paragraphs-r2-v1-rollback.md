# KL Location 段落呈现 R2 回滚包

- 原任务：`fc-20260926-seo-owner-existing-page-wave3`；代码候选：`kl-location-paragraphs-r2-v1`。
- 网站基线：`75f474922c908a6af3bdf2ba68e0a849c9503ab8`。本候选仅更改 `src/lib/text.ts`、`src/pages/LocationPage.tsx`、`src/components/scheme-a/SchemeARoutePrimitives.tsx` 及定向测试，不更改 CMS 字段、数据库或路由。
- 基线文件的逐文件 SHA256 与原文保存在本工作树 `backups/fc-20260926-kl-location-paragraphs-r2-v1/manifest.json`；备份位于网站项目内，未推送至远端。

## 撤销方法

1. 未发布时：停止候选推进；不需要生产回滚。若要撤销本分支，针对候选提交执行 `git revert <候选 SHA>` 并复验 `npm run typecheck`、定向测试和构建。不要直接覆盖其他工作树。
2. 若未来经 QA、PR、CI 和同 SHA 部署后出现本改动引起的段落/链接/CTA 故障：运营按原发布流程批准回滚版本，在隔离工作树 revert 候选提交，复验并沿 Git/PR/CI/main/同 SHA 通道重新部署；记录新生产 SHA，公开检查英中 KL 页面、三段/单段回退结果、服务链接及报价入口。不得借此更改 CMS 内容。
3. 如伴随 R1 CMS 内容发布，CMS 回滚须按其独立的受保护 `cms_write` 回执和发布时完整行备份执行；本代码备份不代替 CMS 备份。

本文件是可执行回滚计划，不表示已发布或已回滚。QA 复验及运营 `AUTO_RELEASE` 前不得推进生产。
