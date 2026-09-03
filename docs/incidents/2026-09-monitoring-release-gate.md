# 2026-09 生产详情监控与合并门禁修复

## 根因

### 持续故障错误显示成功

`production-monitor.yml` 为了在失败后继续创建或更新事故 Issue，对监控步骤设置了 `continue-on-error: true`。原最终步骤只在 Issue 动作为 `new_failure` 时执行 `exit 1`。同一个事故进入 `ongoing_failure` 后，监控仍失败但最终步骤被跳过，job 因而可能变绿。浏览器 smoke 使用了相同模式。

### 详情页没有进入生产监控

原脚本只检查首页、列表页、静态文件和版本端点，不从生产 sitemap 选择博客、项目、材料、服务、地区详情。因此单个详情路由返回 404/5xx、通用首页或错误 canonical 时，列表页健康仍可让监控通过。

### 坏代码可先合并再检查

`prelaunch.yml` 在 `main` push 后运行，不能阻止合并。修复前 `main` 分支保护只有 `i18n-locale-integrity`，没有聚合 build、preview 和 Chromium E2E 的稳定 required check。

## 修改文件

- `.github/workflows/production-monitor.yml`
  - 事故 Issue 处理后始终根据原始 `monitor` / `browser` step outcome 决定 job 成败。
- `scripts/monitor-production-site.mjs`
  - 从生产 sitemap 运行稳定详情抽样、普通与 refresh 双路径验证、延迟判定和完整诊断报告。
- `scripts/production-detail-monitor.mjs`
  - 提供同源详情 URL 提取、确定性抽样、报告 URL 脱敏和 HTML 语义校验。
- `scripts/production-detail-monitor.test.mjs`
  - 覆盖每类每语言最少两条、额外固定 DBKL、抽样不足、通用首页/错误页/体积异常和查询参数脱敏。
- `.github/workflows/pull-request-quality-gate.yml`
  - 在 PR 合并前运行静态质量与 release candidate 两个 mandatory jobs，由 `required-release-gate` 聚合；preview 后的 Chromium E2E 复用同一份受控构建服务器，避免端口竞争。
- `scripts/production-release-policy.test.mjs`
  - 锁定持续故障红灯和 required gate 结构、命令及安全配置。
- `package.json`
  - 增加 `test:monitor-policy` 命令。

## 监控行为

- 分组：`blog`、`projects`、`materials`、`services`、`locations`。
- 覆盖：英文和中文每组稳定选择至少 2 条，并额外固定 DBKL 博客；当前生产共选择 22 条详情。
- 每条详情同时请求 canonical URL 和 `__flashcast_refresh=monitor`，共 44 个详情响应。
- 语义检查：HTTP 200、HTML content type、`html/title/h1`、品牌、错误页标记、canonical、en/zh-CN/x-default hreflang、最终路径和 1 KB–250 KB 响应体积。
- 延迟：2.5 秒以下通过；2.5–5 秒 warning；超过 5 秒确认一次后持续超时则失败；超过 8 秒立即失败。
- 诊断：DNS/TLS、TTFB/总耗时、状态、最终 URL、缓存、部署/内容版本、失败阶段和网络重试记录。报告 URL 删除所有查询参数，不保存正文、密钥或客户数据。

## 测试结果

- `npm run arch:check`：通过。
- `npm run i18n:check`：通过。
- `npm run typecheck`、`npm run typecheck:strict-core`：通过。
- `npm run lint`：通过。
- `npm test`：64 files，323 passed。
- `npm run test:release-policy`：11 passed。
- `npm run test:monitor-policy`：7 passed。
- `npm run verify:edge-security`：通过。
- `npm run build`：在现有本机只读环境下通过；为避免重复等待无关图片机械重编码，本地验证将响应式图片目录指向空目录，GitHub required gate 不使用该覆盖并运行完整构建。
- `npm run verify:performance-budget`：通过；initial JS 145.3 KiB gzip、initial CSS 20.3 KiB、最大公开路由 CSS 41.5 KiB。
- `npm run verify:seo-html`：通过；本机构建 sitemap 460 URLs。
- `npm run verify:preview:server`：10 条路由通过，0 console/page/asset errors。
- `npm run test:e2e -- --project=chromium`：162 passed、0 failed、1 skipped；`submit-lead` 由既有测试路由拦截，没有生产写入。

本机 Node 为 24.19.0，而仓库声明 `>=20 <23`；最终 required gate 固定 Node 22。完整响应式图片生成的首次本机尝试在任务交互中断时尚未结束，不能将其写成通过，最终以 GitHub Actions 的完整构建结果为准。

GitHub required gate 首次运行确认完整 build、性能预算、SEO 与 preview 均通过，同时发现 `verify:preview:server` 启动的 Vite 子进程在 job 内短暂占用 Playwright 默认端口。Chromium E2E 因端口竞争失败，聚合 gate 按设计变红。workflow 随后显式启用仓库已有的 `PLAYWRIGHT_REUSE_SERVER` 支持，让 E2E 复用同一受控 `dist` preview；最终结果以修复后的重跑为准。

## 生产验证

2026-09-03T19:52:48.209Z 对 `https://flashcast.com.my` 的最后一轮只读监控结果：75 passed、1 warning、0 failed，总耗时 2,815 ms。唯一 warning 是本地未提供 `MONITOR_SUPABASE_URL`，所以未重复调用 health-check；网页、详情、静态资产和安全头均通过。

DBKL 固定路径结果：

| 路径 | 模式 | HTTP | cache | TTFB / total | HTML |
| --- | --- | ---: | --- | ---: | ---: |
| `/en/blog/renovation-permit-dbkl-guide` | canonical | 200 | stale | 59 / 64 ms | 9,663 B |
| `/en/blog/renovation-permit-dbkl-guide` | refresh | 200 | stale | 79 / 81 ms | 9,663 B |
| `/zh/blog/renovation-permit-dbkl-guide` | canonical | 200 | stale | 272 / 275 ms | 9,352 B |
| `/zh/blog/renovation-permit-dbkl-guide` | refresh | 200 | hit | 56 / 59 ms | 9,352 B |

四项均为 deploymentVersion `850482bc1a2b7849d65f6579fd4cb0e0e50c2bdb`、contentVersion `2026-08-30T12:49:06.186554+00:00`，failureStage 为 `none`。本 PR 尚未合并，定时工作流与 required gate 尚未在 `main` 生效。

## 安全与隐私

- workflow 只引用 GitHub Secrets，不硬编码 Supabase 或 Turnstile 值。
- build/preview 读取已发布公开内容；Chromium 表单写入由测试拦截。
- 未修改公开 `submit-lead`、Turnstile 校验、数据库、RLS 或生产配置。
- 监控报告不记录请求查询参数、响应正文、密钥或客户数据。

## 风险与回滚

- 每 15 分钟轻量监控新增 44 个详情请求；并发限制为 4，避免瞬时冲击。若监控成本或速率受限，可先调低抽样频率，但不能删除 DBKL 固定检查或让失败变绿。
- PR gate 的 release candidate 需要仓库现有公开构建 Secrets；来自 fork 的 PR 若拿不到 Secrets 会安全失败，需要受信任维护者在同仓分支重跑，不能改成硬编码。
- required gate 首次运行若暴露既有 build/E2E 问题，应修复或明确处置，不能绕过最终聚合 job。
- 回滚代码：revert 本 PR。无数据库迁移。
- 回滚分支规则：从 `main` 的 required status checks 中移除 `required-release-gate`，保留原 `i18n-locale-integrity`；仅在 workflow 本身导致仓库无法恢复时使用。
