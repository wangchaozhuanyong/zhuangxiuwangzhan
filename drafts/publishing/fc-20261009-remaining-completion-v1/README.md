# 2026-10-09 剩余内容固定发布批次

本包覆盖 20 条不同的公开 CMS 行，引用此前实际完成的 22 份精确内容 QA。`registry.json` 及所有 QA 原始字节有固定摘要；它记录本会话用户直接授权和 root 执行决定，不声称存在未发生的部门 controller 审核。

Design 的正文与 v20 FAQ 合并为 `design-body-faq-unified-20261009-v1`。Bathroom 的正文与 v6 首步骤补充合并为 `bathroom-body-step-unified-20261009-v1`。每条仅保存四个列；Bathroom 的两个数组仅第一项 `desc` 增补，其他项目、顺序和键全部保留。不得再顺序执行这些行的旧独立候选。

两个新入口必须先随 main 发布，并部署 `content-publish` 的完整函数闭包（包含 `_shared/managed-targets.ts` 与 `_shared/unified-content-targets.ts`）。翻译函数也导入共享 registry，但本轮没有新增受保护行 ID；新许可和写入行为仅在 `content-publish` 中执行。

实际网站 `https://flashcast.com.my/__flashcast/version` 的 `deploymentVersion` 必须等于本次 workflow 的 `GITHUB_SHA`。批次在任何行的预览、许可或保存前读取并保存这个版本证明；不匹配立即停止。

沿用 `.github/workflows/content-publish-approved.yml`，只能从 main 手动执行：

- `target=remaining-completion-20261009`
- `approval_id=owner-authorized-remaining-completion-20261009`
- `managed_operation=publish`
- `managed_permit_id` 与 `parent_run_id` 留空
- 先 `mode=dry-run` 核验全部 20 行；确认实际证据后执行 `mode=publish`

`dry-run` 不加载 service-role client、不签发许可、不写 CMS。`publish` 步骤只针对本固定批次注入项目已有 `SUPABASE_SERVICE_ROLE_KEY`；它在每行真实 protected preview、当前行/QA 字段摘要与实际 OIDC SHA/actor/run 一致后调用已有 `issueManagedPermit` 导出函数。许可 10 分钟有效，仍由原保护接口执行 claim/begin/CAS/finish；HTTP issuer secret 鉴权保持原样，不能将本入口推广到其他候选。

每行按预览、许可、保存、真实 permit completed、行及双语页面读回的顺序执行。任何失败或不确定结果立即停止；后续行保持 `NOT_STARTED`。始终上传 `audits/content-publish-<run-id>`，包含线上版本、逐行原生预览、恢复字段摘要、许可证据、保存 receipt 和去敏的有界阶段诊断。签发响应不确定时保留 UUID 供实际查询；保存不确定时不声称未写入。已完成行再运行会被原 CAS 阻断，不允许重放许可或覆盖新内容。

两个合并入口仅支持向前发布，禁止直接恢复旧完整快照。恢复需要读取实际新行，重新审核精确的向前修正；旧字段快照只提供恢复准备和本次 prior digest。发布成功仍需 root 验证浏览器实际显示新增内容；页面 HTTP/Meta 检查不替代可见内容验收或业务结果。
