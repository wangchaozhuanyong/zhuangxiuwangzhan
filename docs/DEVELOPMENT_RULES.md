# Flashcast Development Rules

本文档是 Flashcast 网站的完整开发规则。它面向人工开发者和 Codex / Agent 协作者，目的很简单：代码放对地方、业务判断放对层、上线出问题能追、真实数据不被误伤。

当前项目真实技术栈：

- `Vite + React + TypeScript` 前端单页应用。
- `React Router` 管理前台和后台路由。
- `Supabase` 提供数据库、Auth、Storage。
- `Supabase Edge Functions` 提供后端函数入口。
- `Cloudflare Pages` 负责静态托管、缓存、响应头和部署。

专项规则已经拆分到 `docs/rules`，主索引见 `docs/rules/README.md`。需要细看某个方向时，优先读对应文件：

| 方向 | 规则文件 |
| --- | --- |
| 多语言 i18n | `docs/rules/i18n.md` |
| 用户界面禁止直出技术字段 | `docs/rules/user-facing-technical-fields.md` |
| 组件复用和设计系统 | `docs/rules/component-reuse.md` |
| 表单和数据提交 | `docs/rules/forms-and-submissions.md` |
| 可访问性和响应式 | `docs/rules/accessibility-responsive.md` |
| SEO / GEO / CMS 发布 | `docs/rules/seo-cms-publishing.md` |
| 依赖管理 | `docs/rules/dependencies.md` |
| 日志、审计和隐私 | `docs/rules/logging-privacy.md` |

## 1. 项目结构规则

固定目录边界如下，新增代码必须优先放进现有边界：

| 类型 | 固定位置 |
| --- | --- |
| 应用入口 | `src/App.tsx`、`src/main.tsx` |
| 前台公开页面 | `src/pages` |
| 后台管理页面 | `src/pages/admin` |
| 前台路由 | `src/routes/publicRoutes.tsx` |
| 后台路由 | `src/routes/adminRoutes.tsx`、`src/routes/AdminRouteTree.tsx` |
| 公共组件 | `src/components` |
| 后台专用组件 | `src/components/admin` |
| 基础 UI 组件 | `src/components/ui` |
| 页面数据状态和 React Query | `src/hooks` |
| 前端数据访问、业务封装、缓存刷新、错误转换 | `src/lib` |
| 新增本地后端模块 | `src/backend/modules/<module>/{routes,controller,service,repository}` |
| 静态兜底内容 | `src/data` |
| 多语言文案 | `src/i18n` |
| 全站样式 | `src/styles` |
| 静态资源 | `src/assets`、`public` |
| 数据库迁移 | `supabase/migrations` |
| Supabase Edge Functions | `supabase/functions` |
| Supabase 共享函数代码 | `supabase/functions/_shared` |
| Cloudflare Pages 中间件 | `functions/_middleware.ts` |
| Cloudflare 缓存和安全响应头 | `public/_headers` |
| Cloudflare 重定向和 SPA 兜底说明 | `public/_redirects` |
| 工程脚本 | `scripts` |
| E2E 测试 | `e2e` |
| 架构和开发文档 | `docs` |

不允许为了方便把代码随手塞进页面文件、组件文件或脚本文件里。页面只负责页面，组件只负责 UI，业务和数据库访问必须放到对应封装层。

## 2. 前后端分工规则

前端可以做：

- 页面展示、交互反馈、表单体验。
- 基础表单校验，例如必填、格式提示、按钮 loading。
- `loading`、`empty`、`error`、成功提示和兜底联系方式。
- 根据角色隐藏菜单或按钮，提升后台使用体验。

前端不能单独决定：

- 后台权限、角色、是否能读写数据。
- 线索、报价、通知配置、媒体上传是否允许。
- 数据库写入范围、删除范围、批量修改范围。
- 防刷、限流、敏感操作、审计日志。
- 未来如果新增价格、库存、订单、支付状态，也不能只靠前端判断。

必须放在后端或数据库判断：

- Supabase RLS 和 `public.has_admin_role(...)` 控制真实读写权限。
- Edge Function 负责表单提交、防刷、通知、健康检查、维护提醒等服务端流程。
- 后台高风险操作必须经过后端模块、RLS 或 Edge Function 校验。
- `SUPABASE_SERVICE_ROLE_KEY` 只能用于服务端脚本或 Edge Function，禁止进入前端代码。

一句话：前端可以拦一遍，让用户体验更好；真正安全必须后端和数据库再拦一遍。

## 3. API 契约规则

路由和函数入口必须稳定：

- 公开页面继续使用 `/:lang/...`，例如 `/zh/services`、`/en/projects`。
- 老路径继续由 `LegacyLanguageRedirect` 处理，不能随便删除。
- 后台页面固定使用 `/admin/*`。
- `/admin` 是后台登录入口。
- 动态 CMS 兜底路由固定是 `/:lang/* -> CmsDynamicPage`，新增公开页面时不能误伤它。
- 当前没有本地统一 `/api` 后端，不要为了一个功能临时创建新 `/api` 体系。

现有 Edge Function 契约：

| 功能 | 固定入口 |
| --- | --- |
| 联系/报价表单提交 | `submit-lead` |
| 线索通知 | `notify-lead` |
| 通知配置 | `notification-settings` |
| 维护提醒 | `maintenance-reminder` |
| 地址地理编码 | `geocode-address` |
| 英文内容生成 | `generate-english-content` |
| 健康检查 | `health-check` |
| 动态 sitemap | `sitemap` |

新增或修改 API 必须说明：

- 请求方法和路径。
- 请求字段、必填字段、字段类型。
- 响应字段和错误字段。
- 权限要求。
- 缓存影响。
- 前端兼容策略。

字段不能随便改名，返回格式不能随便换。现有 `submit-lead` 的 `{ ok, id }` / `{ error }` 先保持不动，避免破坏前端和测试；新接口可以逐步统一响应格式。

## 4. 数据库规则

所有数据库结构变化必须走 `supabase/migrations`：

- 新表、新字段、新索引、新函数、新 RLS、新默认数据，都必须写迁移。
- 禁止直接手改生产数据库结构。
- 禁止把临时 SQL 改动只留在 Supabase 控制台里。
- 迁移文件名继续使用时间戳前缀，按现有风格追加，不改历史迁移。

生产数据规则：

- 涉及真实内容、线索、报价、管理员、媒体、通知配置，必须先判断风险。
- 高风险数据操作前先跑备份：`npm run backup:supabase`。
- 备份后必须验证：`npm run verify:backup`。
- 回滚前必须先 dry run：`npm run restore:backup:dry-run`。
- 真正恢复生产数据前，需要先在 staging 或测试项目验证。

删除规则：

- 优先软删除、归档或标记 `deprecated`。
- 确认没有路由、后台菜单、动态 import、脚本、Edge Function、测试、第三方调用引用后，才允许物理删除。
- 不确定是否有生产用途时，不要删除。

## 5. 安全规则

后台访问：

- 后台内页必须经过 `AdminAuthProvider`、`AdminRoute`、`AdminRoleGate`。
- 前端角色判断只是体验层，不是最终安全边界。
- 最终权限必须由 Supabase RLS、`admin_users`、`public.has_admin_role(...)` 或 Edge Function 鉴权控制。

敏感密钥：

- `.env`、Supabase secrets、Cloudflare secrets 不允许提交真实密钥。
- `VITE_*` 会暴露给前端，只能放公开可用值。
- `SUPABASE_SERVICE_ROLE_KEY`、`SERVICE_ROLE_KEY`、cron secret、Webhook secret 只能在服务端环境使用。

文件上传：

- 必须限制 bucket、角色、大小、MIME 类型。
- 图片、视频、原始媒体分别遵守现有 Storage bucket 策略。
- 不能允许任意扩展名、任意 MIME、任意路径写入。

Web 安全：

- CSP 以 `scripts/site-csp.mjs` 和 `public/_headers` 为准，必须保持同步。
- 生产 CSP 禁止加入 `unsafe-eval`。
- 后台 HTML 必须 `no-store`。
- 用户可编辑 HTML 必须经过清理，避免 XSS。
- CORS 不能因为调试就永久放宽到危险状态。
- 支付回调、Webhook、定时任务如果以后新增，必须校验签名或 secret，并保证幂等。

## 6. UI/设计规则

视觉基础必须沿用现有系统：

- 颜色、字体、圆角、阴影、间距优先看 `tailwind.config.ts` 和 `src/styles/base.css`。
- 公共按钮、弹窗、表格、空状态、错误提示、loading 优先复用现有组件。
- 后台页面优先复用 `src/components/admin`。
- 基础控件优先复用 `src/components/ui`。

前台页面完成标准：

- 桌面端和移动端都要看真实页面。
- 不能有导航遮挡、文字重叠、横向溢出、高度不一致、按钮文字挤出、图片比例异常。
- 不能出现乱码、`�`、明显中英文混杂错误。
- 不能把 `system_health_check`、`permission_denied`、`health-check` 这类技术字段直接展示给用户；具体见 `docs/rules/user-facing-technical-fields.md`。
- 表单必须有 loading、成功、失败、兜底联系方式。
- 后台改内容后，前台必须真实读到并显示，不能只验证后台保存。

后台页面完成标准：

- 表格、表单、弹窗、删除确认、空状态、权限不足状态都要完整。
- 删除、归档、高风险保存必须有确认和错误提示。
- 移动端后台至少不能遮挡、不能横向溢出到不可操作。

## 7. 专项规则索引

以下专项规则由 `docs/rules` 维护。主文档只保留入口，避免长期重复维护：

- 多语言 i18n：见 `docs/rules/i18n.md`。
- 用户界面禁止直出技术字段：见 `docs/rules/user-facing-technical-fields.md`。
- 组件复用和设计系统：见 `docs/rules/component-reuse.md`。
- 表单和数据提交：见 `docs/rules/forms-and-submissions.md`。
- 可访问性和响应式：见 `docs/rules/accessibility-responsive.md`。
- SEO / GEO / CMS 发布：见 `docs/rules/seo-cms-publishing.md`。
- 依赖管理：见 `docs/rules/dependencies.md`。
- 日志、审计和隐私：见 `docs/rules/logging-privacy.md`。

## 8. 状态和缓存规则

React Query 规则：

- 公共内容继续使用 `["published"]`。
- 网站设置继续使用 `["site-settings"]`。
- 后台数据继续使用 `["admin", ...]` 分组。
- 后台保存内容后，必须刷新对应后台列表和前台 published cache。
- 网站设置保存后，必须刷新 `["site-settings"]`。

本地缓存规则：

- `localStorage`、`sessionStorage` 只能存 UI 偏好或恢复状态，不能作为真实业务数据来源。
- 缓存读写要考虑浏览器禁用存储的情况，不能让后台不可用。

Cloudflare / HTML / 静态资源缓存：

- 公开 HTML 可短缓存：`public, max-age=60, stale-while-revalidate=300`。
- 后台 HTML 必须 `no-store`。
- hashed assets、图片、视频可以长期 immutable。
- 白屏、chunk 加载失败、路由异常时，必须同时检查 `public/_headers`、`public/_redirects`、`functions/_middleware.ts`、构建产物和资源保留脚本。

Service Worker / PWA：

- 当前项目默认不新增 Service Worker/PWA。
- 如果以后要新增，必须先设计版本失效、后台内容更新、静态资源更新和回滚策略。

## 9. 质量门禁规则

按改动范围选择验证命令：

| 改动范围 | 必跑或优先跑 |
| --- | --- |
| 架构/规则/模块边界 | `npm run arch:check` |
| 普通 TypeScript 改动 | `npm run typecheck` |
| 核心逻辑或严格类型区域 | `npm run typecheck:strict-core` |
| 普通代码质量 | `npm run lint` |
| 单元逻辑 | `npm test` 或相关测试 |
| 多语言文案 | `npm run i18n:check` |
| 用户界面技术字段直出 | `npm run ui:text-check` |
| 生产构建 | `npm run build` |
| 本地预览检查 | `npm run verify:preview` 或 `npm run verify:preview:server` |
| 部署缓存 | `npm run verify:deploy-cache` |
| 后台基础能力 | `npm run verify:admin-foundation` |
| E2E | `npm run test:e2e` |
| 可访问性/响应式 | Playwright 或真实浏览器检查 |
| SEO / CMS 发布链路 | `npm run verify:seo-html`、`npm run verify:preview` 或相关脚本 |
| 依赖变更 | `npm install` 后检查 lockfile、`npm run build` |

上线前参考 `.github/workflows/prelaunch.yml` 的顺序：

1. `npm ci`
2. `npm run arch:check`
3. `npm run build`
4. `npm run deploy:retain-assets`
5. `npm run verify:deploy-cache`
6. `npm run lint`
7. `npm test`
8. `npm run typecheck`
9. `npm run typecheck:strict-core`
10. `npm run verify:preview:server`
11. `npm run test:e2e -- --project=chromium`

如果没有运行某项验证，最终回复必须明确说明“未验证”，不能让人误以为已经通过。

## 10. 部署和回滚规则

上线前必须确认：

- 生产环境变量齐全，尤其 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、站点电话、邮箱、SSM、地址。
- Supabase migrations 已应用到目标项目。
- 必要的 Supabase Edge Functions 已部署。
- `public/_headers`、`public/_redirects`、`functions/_middleware.ts` 没破坏 HTML 缓存、后台 no-store、SPA fallback 和 hashed asset 404。
- 静态资源保留脚本和部署缓存校验通过。

回滚规则：

- 前端发布失败：优先回滚 Cloudflare Pages 上一个成功部署。
- 静态资源/chunk 问题：检查 retained assets 和缓存头，必要时恢复上一个 dist。
- 数据库问题：先停止继续写入，再根据备份、迁移回滚方案处理。
- Edge Function 问题：优先回滚对应函数版本，确认 secrets 没变坏。
- 高风险回滚必须记录影响范围、执行人、时间和验证结果。

## 11. 任务流程规则

改代码前必须先定位根因，不要只修表面现象。

写代码前必须输出：

```text
Architecture Decision:
1. Target module:
2. Why this module:
3. Target layer:
4. Why this layer:
5. Files allowed to edit:
6. Files forbidden to edit:
7. API paths affected:
8. Database access location:
9. Cross-module dependency risk:
10. Business behavior impact:
```

任务范围必须分清：

- 本次需求必须修复的内容。
- 顺手修复的相关问题。
- 可选优化。
- 拓展功能。
- 非本次需求范围。

涉及大改、重构、删除、数据库迁移、生产配置、支付、订单、用户数据、权限、安全、缓存、报表时，必须先说明风险、影响范围和回滚方案。

完成后最终回复尽量使用：

```text
【问题原因】
【修复内容】
【修改文件】
【验证结果】
【是否完成】
【需要我确认】
```

并补充架构合规报告：

```text
Architecture Compliance Report:
1. Target module:
2. Target layer:
3. Edited files:
4. Forbidden files touched: yes/no
5. API paths changed: yes/no
6. Database access changed: yes/no
7. Cross-module dependency introduced: yes/no
8. Business behavior changed: yes/no
9. arch:check result:
10. Remaining architecture risk:
```

## 12. 非本次默认范围

当前项目没有订单、库存、支付功能。相关规则只是未来扩展时的安全底线，不代表本次要开发这些功能。

当前项目没有 Service Worker/PWA。不要为了“优化缓存”顺手新增，除非单独评估和立项。

当前项目没有本地统一 `/api` 后端。不要为了单个功能临时创建新后端体系。
