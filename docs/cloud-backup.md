# 云端每日加密备份

目标：每天马来西亚时间 03:00，在 GitHub 临时执行机生成数据库、Auth、结构和真实媒体文件的完整加密包，永久副本只保存到 Cloudflare 私有 R2 的 `flashcast-recovery-backups`，上传满 7 天自动过期。没有 30 天或每周/月长期副本。执行不依赖个人电脑、Codex、Wrangler 交互登录或 Docker。

工作流：`.github/workflows/supabase-cloud-backup.yml`，名称 `FLASH CAST cloud encrypted backup`。沿用项目锁定 npm 依赖、Node 22 和 PostgreSQL 官方仓库的原生 17 版客户端。数据库一致性快照、包解密认证、表行数、结构/账号覆盖、逐个图片摘要、私有桶检查、7 天生命周期及无保留锁检查继续保留。通过后写回并读回真实运维摘要，再删除临时执行机上的加密副本，不将备份上传为 GitHub Artifact。

所需 GitHub 加密 Secrets：

| 名称 | 当前只读检查 |
| --- | --- |
| `VITE_SUPABASE_URL` | 已存在 |
| `SUPABASE_ACCESS_TOKEN` | 已存在 |
| `SUPABASE_DB_PASSWORD` | 已存在 |
| `SUPABASE_SERVICE_ROLE_KEY` | 缺少；需仅在加密 Secrets 配置，本地已有私有配置可用于核对 |
| `CLOUDFLARE_ACCOUNT_ID` | 已存在 |
| `CLOUDFLARE_API_TOKEN` | 已存在；未证明 R2 权限及有效期，不替换现有发布 Token |

若现有 Cloudflare Token 无效或不能访问 R2，先确认独立备份凭据方案；不要导出 Wrangler OAuth 登录、替换网站发布凭据或扩大旧 Token 的权限。秘密不进入代码、聊天、审计、环境示例或日志。云端直接读取进程内加密 Secrets，不写 `.env.production.local`。

启用步骤：

1. 审查仅含备份脚本和本工作流的独立候选分支；网站界面修复留在原本地候选。
2. 用户确认仅发布备份任务与必要加密凭据后，再推送并合入 default main。发布控制已对独立备份文件作精确排除；测试要求本次纯运维变更跳过 Pages 发布，混有页面/函数改动时仍识别为网站发布，不能混入未授权业务代码。
3. 配置缺少的加密 Secret，验证 Supabase 和 R2 项目归属及实际权限。
4. 先手动触发真实云端任务，核对 Actions 成功、R2 新包和实际下载认证、生产运维摘要读回及临时副本清理。
5. 云端首轮确认成功后，将原本机 Codex 每日任务设为 PAUSED，完成交接；无需电脑常开。

不能将本地模拟测试或文件存在冒充云端首轮成功。当前候选尚未推送、未启用，以上启用动作尚待授权。

GitHub 计划任务使用 default branch；可能延迟，公开仓库 60 天无活动可能被停用。备份失败会在 Actions 标记失败，R2 的 7 天清理仍独立继续，因此要检查失败与任务停用状态。规则到期后的删除通常在 24 小时内完成。数据库和媒体包仍不包含外部 SMTP/OAuth/Edge secrets 的完整恢复配置，新包不能继承旧包的实际恢复验收。

回滚：云端失败时保留现场和 R2 已有包，恢复原本机任务；不恢复生产数据库，不重置账号或 MFA，不改变网站发布凭据。

参考：[GitHub 定时事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)、[PostgreSQL 官方 Ubuntu 客户端](https://www.postgresql.org/download/linux/ubuntu/)、[Cloudflare 生命周期](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)。
