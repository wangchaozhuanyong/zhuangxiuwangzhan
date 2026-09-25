# ORG-026 服务概念图 R2 网站代码回滚

- 原任务：`fc-20260926-website-placeholder-media-audit-v1`；本候选：`service-media-original-concepts-r2-v2`。
- 基线是原本地 R2 候选 `5ec33db698c25d641fca1e8114f68b74f56981f6`。本站工作树 `backups/fc-20260926-service-media-original-concepts-r2-v2/manifest.json` 保存九个修改前源码文件的 SHA256 和副本；三张新增主图及其 SHA256 也列入清单。十八张响应式变体由三张主图生成。
- 三张新图路径属于网站代码/静态文件发布；CMS 的 `image_url/alt_en/alt_zh` 是独立 R1 候选，不能用代码回滚冒充 CMS 回滚。

## 回滚步骤

1. **未发布阶段：** 停止本候选推进即可。需要撤销本地分支时，在隔离工作树 `git revert <本候选提交 SHA>` 并复跑定向测试、类型检查和构建，不覆盖主工作树或其他分支。
2. **R2 已上线后：** 如果新图加载、可见真实性标签或链接/CTA 失败，先核生产 SHA 和失败 URL。运营按原发布门禁选择修复提交或 revert 提交，经过 Git/PR/required CI/main/同 SHA 部署，公开复核英中列表与三详情、390px/桌面、图片 HTTP/内容哈希、双语披露及报价路径。旧图片缺逐图权属证据，回到旧生产 SHA 只可作为记录在案的应急恢复，不得把它视为合规完成。
3. **R1 CMS 若已单独保存：** 必须按每一行发布时完整备份、保存版本和受保护 `cms_write` 回执逐行恢复仅 `image_url/alt_en/alt_zh`；先确认旧媒体权属风险和当前代码是否仍能呈现概念披露。代码回滚不得直接重写 CMS。

本文件是候选回滚方案，不代表已有 PR、生产部署、CMS Saved ID 或已执行回滚。
