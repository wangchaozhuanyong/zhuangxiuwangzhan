> 当前每日备份已由 GitHub Actions 云端执行，配置与验收见 [cloud-backup.md](cloud-backup.md)。旧本机 Codex 定时任务已经暂停。本文中的每日/异地命令仅作为人工维护与恢复演练入口，不用于重新启用旧定时任务。恢复脚本仅限指定的本地空实验库，发布这些工具不会执行恢复或改变生产账号。

# FLASH CAST 本地环境与恢复操作

项目根目录：`/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`。使用 Node 20–22、npm 和本机 Docker；CLI 固定为 `supabase@2.119.0`。以下命令均在项目根目录执行。

## 环境归属

| 文件或环境 | 用途 |
| --- | --- |
| `.env` | 默认 `APP_ENV=development`、本地网站地址；不含生产凭据 |
| `.env.development.local` | 本地开发 Supabase 地址及本地凭据，权限 0600，Git 忽略 |
| `.env.production.local` | 原有生产配置，权限 0600，Git 忽略；仅显式生产操作读取 |
| 开发库 | `flashcast-dev-20261003`，API `http://127.0.0.1:56221`，数据库端口 56222 |
| 恢复库 | `flashcast-full-restore-20261003`，API `http://127.0.0.1:56321`，数据库端口 56322 |

两套库使用独立 Docker 网络及卷，端口只绑定本机；旧恢复环境和其他项目容器保留。开发库采用项目迁移，不复制真实客户或生产 Auth 账号。恢复库包含真实备份，只用于验收，验收结束后停止服务并保留卷。

重新启动开发库：

```sh
npx --yes supabase@2.119.0 start --workdir backups/environment-recovery-20261003/development-lab --network-id supabase_network_flashcast-dev-20261003 --exclude studio,logflare,vector,edge-runtime,imgproxy,supavisor
node scripts/bind-local-supabase.mjs flashcast-dev-20261003
npm run verify:env
npm run dev
```

CLI 会在用户自己的终端显示本地密钥；不要复制到聊天、日志或版本库。`bind-local-supabase` 保留卷和网关运行文件，并启用与项目一致的本地 TOTP 配置。开发库没有生产账号；外部通知凭据和云端函数 secrets 不自动复制。开发库尚未启用 Edge Functions，涉及表单、通知等函数开发时还需启动对应函数。

恢复库的后续验收已单独启用 `content-publish`、`sitemap` 与官方 `imgproxy:v3.26.0`。图片服务仅在恢复库 Docker 网络内可达，图片卷向 imgproxy 只读挂载；Storage 启用优先配置 `IMAGE_TRANSFORMATION_ENABLED`，原容器保留为回滚点。恢复库配置的 `[storage.image_transformation] enabled=true` 保持重启行为一致。受保护发布仍检查原管理员、原 MFA 和现有权限，未加入生产通知或 Cloudflare 密钥。函数验收环境的 `SITE_URL` 使用正式 canonical 域名，API 仍是本机 56321，显式 CORS 验收地址仍是本机 4232。

生产环境检查、旧脚本或构建需要显式加载环境：

```sh
node scripts/verify-env-separation.mjs --mode production
node scripts/run-with-env.mjs production -- node scripts/validate-env.mjs --strict
```

加载顺序是 `.env`、`.env.local`、`.env.MODE`、`.env.MODE.local`；显式进程变量优先，包括空值。模式错误、生产库被用于开发或生产地址不匹配时，检查失败。

## 新备份与实际恢复

```sh
npm run backup:supabase:full
npm run verify:backup -- backups/TIMESTAMP
npm run restore:backup:dry-run -- backups/TIMESTAMP
```

完整备份将生产只读快照中的 `public`、`auth`、`storage`、`supabase_migrations` 数据与结构，以及逐页枚举并下载的 Storage 文件保存为单个加密包。包含账号身份、密码哈希和 MFA 因子；排除活动会话、刷新令牌、一次性令牌及 OAuth 临时授权。生产只执行读取；日常开发库与恢复库分开。

文件使用 AES-256-GCM 和 scrypt 加密，解密依赖备份时的生产数据库密码。密码必须保存在受控密码管理器；将来轮换数据库密码时，旧备份仍需原密码。不要把密码或明文 SQL 放在备份目录。当前备份只保存在本机；异地保管和定期执行尚未配置。

实际导入只允许指定的独立本地空恢复库，并在 SQL 前完成密文认证。目标环境仅在本机操作，原始生产账号、权限和结构不修改。恢复操作在事务内替换该空实验库的托管 schema，失败时回滚；已有导入标记会阻止重复替换。

以下恢复命令绑定本次专用实验室。以后验证其他备份时，先建立并核对新的空实验室，再调整专用恢复目标；不要清空或覆盖已经验收的库。

```sh
npx --yes supabase@2.119.0 start --workdir backups/environment-recovery-20261003/restore-lab --network-id supabase_network_flashcast-full-restore-20261003 --exclude studio,logflare,vector,edge-runtime,supavisor
node scripts/bind-local-supabase.mjs flashcast-full-restore-20261003
npm run restore:backup:full -- backups/TIMESTAMP
```

表数据逐字段摘要和数量在导入完成、文件上传及账号验收之前比对。Storage 上传会更新本地对象的维护字段，登录会增加本地 Auth 审计和临时会话。结构比对采用与源库相同的读取角色；保留可见列的顺序，只归一化已删除列留下的位置空档。约束、索引、RLS、策略、触发器及函数仍逐项比对。

媒体操作中断时可用同一备份的 `--resume` 继续读回验证及上传；它不重新导入表数据。最终摘要位于 `audits/environment-recovery-20261003/restore-result.json`。恢复库的平台版本升级若改变托管 schema，必须区分原结构导入核验和升级后的运行验证，不得忽略差异。

## 原管理员密码与 MFA

macOS 推荐使用本机隐藏输入框，脚本自动识别恢复的管理员及原 MFA 因子；只需输入原登录密码，不保存密码：

```sh
node scripts/verify-recovered-admin.mjs --prompt-password
```

也支持从受控运行进程传入已有的 `ADMIN_TEST_EMAIL`、`ADMIN_TEST_PASSWORD`、`ADMIN_TEST_TOTP_SECRET`；私有环境文件中的同名项用于用户自行配置的验收环境。不要把值写入聊天或报告。没有原密码时，不带提示选项运行会仅在本地使用恢复链接建立原账号会话，不发送邮件；若恢复的 TOTP 因子可读取，可验证原 MFA 和实际权限，但 `original_admin_login_verified` 保持 false。不得通过重置生产密码或重建 MFA 来声称原账号恢复成功。

最终可将真实摘要写入生产运维日志：

```sh
node scripts/record-recovery-status.mjs backups/TIMESTAMP
```

该步骤只写 `system_event_logs`，并读取确认；重复摘要不会重复插入。缺少原密码验证时，恢复验收及兼容旧健康检查的记录保持警告。完整验收还要求所有记录对应同一备份。云端 OAuth、SMTP、Edge secrets、域名配置及外部集成恢复不由数据库和媒体备份证明；本次没有改变这些生产配置，也没有推送或部署代码。

## 私有 R2 与每日备份

本网站使用现有 Cloudflare 账户中的独立桶 `flashcast-recovery-backups`。公开访问必须禁用，且不能连接自定义域名。只上传日期目录内的 `recovery.fcbackup` 与原始 `manifest.json`，不上传明文数据库、环境文件或恢复实验室。其他网站的桶不参与本流程。

```bash
# 使用官方 Wrangler CLI 内已有的登录，不读取或复制其 Token。
npm run backup:offsite -- backups/TIMESTAMP --auth=wrangler
npm run backup:supabase:daily -- --auth=wrangler
```

当前本地 Cloudflare API Token 已过期，因此日常操作明确选择 `--auth=wrangler`。该登录方式已获用户授权，只通过 CLI 执行本网站备份桶的状态检查和对象操作，不创建新权限或凭据；CLI 自身的标准登录缓存不属于项目交付物。默认 API Token 方式仍可供独立受控运维环境使用，但不可借用其他项目的凭据。

复制前验证本地密文和桶的私有状态，复制后实际下载归档及清单，核对字节摘要并认证密文；只有全部通过才生成 `offsite-readback.json`。已有不同内容会被拒绝，不覆盖旧备份。CLI 上传前再次检查对象是否存在，但 CLI 不提供原子条件写入；本流程使用本地运行锁和独立日期路径避免并发，不应再给同一路径安排其他写入任务。

每日流程按 `Asia/Kuala_Lumpur` 日期复用当天的完整包，没有当天包时才创建新快照。先完成私有桶预检、7 天生命周期及无保留锁检查，再生成、验证、异地复制及写回备份记录；只有上述步骤全部成功，才清理本地过期备份。运行结果为 `backups/daily-backup-result.json`。它只记录备份与包校验，不能把每日复制冒充当前备份的实际恢复演练。今后的新备份仍需在新的独立空恢复库完成验证，后台可以据此提示待演练。

`backups/.daily-backup.lock` 阻止同时执行。若上次中断留下锁，先核对锁中 PID、当前进程与结果文件，再处理该锁；不得为重跑清空备份目录。正常结束移除本次锁和本次加密传输临时文件。

保留期固定为 **7 天（168 小时）**，没有 30 天、每周或每月长期副本。本地依据清单的 `created_at` 删除达到 7 天的本项目数据库及媒体备份；只处理 `backups/` 下直接日期目录，校验项目标识、类型、内容及目录归属，保留当天成功校验的完整包。恢复实验室、源码快照、其他工作目录及无法确认归属的目录不参与此清理。清理前写入计划，逐个删除前再次核对目录与清单，结果保存在 `backups/retention-cleanup-result.json`；备份或远程校验失败时不启动本地清理。

私有 R2 桶已启用 `flashcast-backup-retention-7d`，所有对象上传满 7 天自动过期，不保留 30 天副本；原有未完成分段上传的中止规则保留。R2 过期清理由 Cloudflare 独立执行，即使本地电脑关机也继续生效，不依赖当天备份成功。对象通常在到期后 24 小时内删除，并非到期瞬间删除，见 [Cloudflare 生命周期说明](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)。每日脚本读回规则及保留锁；规则不是全桶 7 天或出现保留锁时报告失败，不静默降级。

Codex 中已配置本聊天的“FLASH CAST 每日加密备份”，每天马来西亚时间 03:00 执行。电脑需开机、Codex 运行、项目可访问、Docker 正常且 CLI 登录有效；无法执行时报告失败，不能声称已自动成功。2026-10-03 手动完整流程已通过，首次定时触发仍需后续实际记录证明。此类本地任务的运行条件见 [Codex 自动任务说明](https://learn.chatgpt.com/docs/automations?surface=app)。

R2 免费额度由整个账户共享，费用按账户实际用量计算，见 [R2 价格说明](https://developers.cloudflare.com/r2/pricing/)。解密仍需要备份时的数据库密码，应保留在受控密码管理器中。
