# Kuala Lumpur 正文首发候选

授权：业主在 2026-11-19 明确批准八个区域，但本次只允许先发布 kuala-lumpur，其他七个区域等业主确认线上效果。本目录不提供其余七页的执行目标。

- 正文来源：docs/seo/location-pages-batch-1.md，两个 HTML 块逐字复制。
- 写入字段：content_en、content_zh。现有 SEO、FAQ、项目、图片与 ms 内容保留。
- 候选绑定：当前 updated_at、完整 32 字段基线摘要、两个新正文字段摘要、旧正文恢复摘要。
- 凭据：GitHub Actions 中 CONTENT_PUBLISH_SECRET 的 x-cron-secret；OIDC 验证原 workflow/main/SHA/run，执行前签发短期单次许可。service role 仅用于现有许可签发器，不直接写 service_areas。
- 执行入口：content-publish-approved.yml，target=kl-location-body-first-20261119-v1，approval_id=owner-approved-kl-location-first-20261119，managed_operation=publish。
- 发布先做 dry-run、基线及版本核对，保留 private Actions artifact 中的 preview/旧快照、receipt、许可完成状态和 readback。
- 发布后只读预演恢复旧正文，保存 rollback-plan.json；真正恢复需要独立新许可、完成的父许可/run、最新 updated_at，并按仓库恢复规则先验收。此任务不执行回滚。
- 英文新正文约 2,900 字符；中文按已批准原文保留，不为了字符指标补写内容。浏览器验收分别记录正文和页面可见文本长度。

原始临时 before.json 留在本地，候选 JSON 是公开内容的逐字段审核包。发布时再次从 CMS 读取原值，任何并发变化都会停止。
