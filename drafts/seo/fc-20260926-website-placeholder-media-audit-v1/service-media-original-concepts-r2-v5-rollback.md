# ORG-026 服务图片 R2 V5 候选备份与恢复

- 原 task_id：`fc-20260926-service-media-original-concepts-implementation-v2`，原图片任务 `fc-20260926-website-placeholder-media-audit-v1`；动作 `org026-service-media-site-code-r2-v4`，候选版本 `service-media-original-concepts-r2-v5`。PR #104 仅为待复验草稿；本文件不表示 QA 通过或已发布。
- V5 基线为包含 KL 段落修复的 main `9e77b95e1f7ead6cdcb722a9634579ee6d48b84b`。隔离工作树 `backups/fc-20260926-service-media-original-concepts-r2-v5/manifest.json` 锁定新候选 SHA、逐文件前后哈希和完整二进制补丁；`baseline-source.tar.gz` 保存被修改文件的基线字节。核验 `git apply --reverse --check`，保留三张主图的视觉权利台账哈希。
- 唯一通道为 `site_code_candidate → site_publish`；三条 CMS 图片字段走独立 `cms_content_candidate → cms_write`，本代码备份不能替代 CMS 全行备份、Saved ID 或回滚。

## 未发布时

保留 PR #104 为草稿，停止合并即可。若撤回候选，按当前 main 新建隔离分支，只撤销本候选差异并核对补丁，不重置或覆盖其他工作树。旧图片的权属问题尚在，不能把重新显示旧图视作问题解决。

## 发布后发现问题时

1. 记录线上 SHA、具体 URL、图片 HTTP/哈希、双语可见披露、alt 和报价路径。若 CMS 已保存三行媒体字段，先按每行发布时记录的完整行版本与受保护通道办理独立恢复；不直接改数据库。
2. 在最新 main 上制作最小前向修复或 revert PR；核对与后续改动的冲突，重新跑相关测试、typecheck、i18n、图片/移动端检查及严格 CI，再通过同 SHA Pages 通道部署。不能整站回退到旧 `4ec9a3a` 或覆盖已上线 KL 段落行为。
3. 公开复核 EN/ZH 服务列表和 Builtin、Warehouse、Office 三项详情共 12 个位置，并核对运行 SHA。任何不确定写入先回读真实线上状态，不盲目重复执行。
