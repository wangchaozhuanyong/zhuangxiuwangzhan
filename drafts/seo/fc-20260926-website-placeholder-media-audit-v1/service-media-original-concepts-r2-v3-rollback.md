# ORG-026 服务图片候选 V3 回滚与备份

- 当前待 QA 本地网站 SHA 以相邻备份 `manifest.json` 的 `candidate_sha` 为准；合入时已上线主线 SHA：`4ec9a3a888ea565f221571106d09272facd5f0cb`。
- 本工作树 `backups/fc-20260926-service-media-original-concepts-r2-v3/manifest.json` 列出相对当前主线的 46 条文件差异、13 条旧文件哈希和 33 条新路径；`baseline-source.tar.gz` 保存旧文件字节，`candidate.patch` 保存含三张主图与响应式图的完整二进制差异。它们是候选审查备份，发布时仍须重读最新生产 SHA 并生成新鲜备份。
- 发布通道为 `site_code_candidate → site_publish`。三条 CMS `image_url/alt_en/alt_zh` 属另一个受保护 R1 通道；网站回滚不能自动改 CMS，也不能跳过精确许可。

## 未发布

停止推进本地候选即可。需要撤销时只在隔离分支基于当前 HEAD 制作反向提交，保留现有主线新改动，不重置主工作树。先检查 `candidate.patch` 是否能反向应用，再运行定向测试、类型检查、双语检查、构建与图片解码验收。

## R2 已发布后

1. 先记录线上运行 SHA、异常 URL、图片响应/哈希、英中披露和 CTA。若 R1 CMS 已指向三张新图，先按每条行的发布时全行备份与受保护回滚流程恢复 CMS 指向；不能直接写数据库。旧图存在权利/事实问题，回滚只是应急恢复，不能算图片问题已解决。
2. 对 R2 在最新 main 上制作只撤销本任务差异的修复或 revert PR，经过 required CI、main、同 SHA 部署。不得整站回退到 `4ec9a3a` 覆盖后续无关发布。
3. 公开复核 EN/ZH 服务列表与三项详情共 12 位置、390px/桌面图像/双语披露/报价 CTA，并记录生产 SHA 或回滚失败与负责人。

当前没有 PR、部署、CMS Saved ID 或已执行回滚。
