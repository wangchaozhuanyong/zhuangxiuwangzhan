# Flashcast Architecture

本文档只描述 Flashcast 网站的固定架构边界。完整开发流程、质量门禁、安全、缓存、部署和回滚规则见 `docs/DEVELOPMENT_RULES.md`。

## 1. Current Real Architecture

本项目不是传统 Express / Fastify 后端单体，也不是自由目录结构。

当前运行架构：

- `Vite + React` 前端单页应用。
- `React Router` 管理前台和后台路由。
- `Supabase` 提供数据库、Auth、Storage。
- `Supabase Edge Functions` 承担后端函数入口。
- `Cloudflare Pages` 承担静态托管、缓存和部署。

关键目录：

- `src/App.tsx`: 应用总入口和前后台 shell 分流。
- `src/routes/publicRoutes.tsx`: 前台公开路由。
- `src/routes/adminRoutes.tsx`: 后台管理路由。
- `src/routes/AdminRouteTree.tsx`: 后台路由树懒加载入口。
- `src/pages`: 前台页面。
- `src/pages/admin`: 后台页面。
- `src/lib`: Supabase 访问、业务工具、权限、校验、缓存刷新、错误转换等兼容封装。
- `src/hooks`: React Query 和页面数据状态。
- `src/components`: 公共组件。
- `src/components/admin`: 后台专用组件。
- `src/components/ui`: 基础 UI 组件。
- `src/data`: 静态兜底内容。
- `src/i18n`: 多语言文案。
- `src/styles`: 全站样式。
- `src/backend/modules`: 新增本地后端模块。
- `supabase/functions`: Supabase Edge Functions。
- `supabase/migrations`: 数据库结构、RLS、函数、索引、默认数据。
- `public/_headers`: 缓存头和安全响应头。
- `public/_redirects`: Cloudflare Pages 重定向和 SPA fallback 说明。
- `functions/_middleware.ts`: Cloudflare Pages 中间件。

## 2. Architecture Style

本项目采用：模块化单体架构 + 分层设计 + 业务域划分 + 统一 API 规范。

英文固定表述：Modular Monolith + Layered Architecture。

最高优先级原则：

- 不要使用微服务架构。
- 不要为了复杂而拆分模块。
- 所有代码必须优先保证模块边界清晰、层级职责清晰、业务归属清晰。
- 新增模块前，必须先确认现有 16 个一级模块无法承接该功能；否则禁止新增一级模块。
- 新增 API 前，必须先确认现有 Supabase Edge Function 或既有模块边界无法承接；否则禁止为了单个功能临时造新 API 体系。

用大白话说：

- Modular Monolith: 业务按模块分清楚，但仍然在一个项目里维护。
- Layered Architecture: 每个模块内部按层级分清楚，不能页面、业务、数据库逻辑混在一起。

当前 Supabase Edge Functions 是后端入口层。`src/lib` 里已有很多 Supabase 查询和业务封装，属于现阶段兼容层。以后新增复杂后端能力时，必须逐步向固定模块和固定层级靠拢，不能继续把复杂业务堆在页面或函数入口里。

## 3. Recommended Backend Modules

本项目固定使用 16 个一级模块：

| No. | Module | Main responsibility |
| --- | --- | --- |
| 1 | `home` | 首页内容、首页组合数据、首页公开展示 |
| 2 | `company` | 关于我们、流程、FAQ、品牌合作、改造前后、CTA |
| 3 | `services` | 服务列表、服务详情、服务区域、服务发布内容 |
| 4 | `projects` | 项目案例、项目图片、案例发布内容 |
| 5 | `materials` | 材料目录、分类、材料详情 |
| 6 | `blog` | 博客文章、博客列表、博客详情 |
| 7 | `cms` | CMS 页面、区块、模板、内容条目、版本记录、通用页面 |
| 8 | `leads` | 联系表单线索、表单防刷记录 |
| 9 | `quotes` | 报价请求、报价表单上下文 |
| 10 | `followups` | 线索跟进、报价跟进 |
| 11 | `media` | 媒体库、图片上传、Storage 文件记录 |
| 12 | `seo` | SEO 审计、sitemap、robots、SEO manifest、GEO |
| 13 | `admin-auth` | 后台登录、鉴权、角色入口保护 |
| 14 | `admin-users` | 后台用户、角色、账号管理 |
| 15 | `settings` | 网站设置、联系方式、地图、通知配置 |
| 16 | `system` | 健康检查、系统日志、维护提醒、翻译任务 |

禁止未规划就创建新一级模块。确实需要新增一级模块时，必须先更新：

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `scripts/arch-check.mjs`

## 4. Submodule Ownership

这些功能不是一级模块，必须归到已有模块里：

- `about` -> `company`
- `process` -> `company`
- `faqs` -> `company`
- `before-after` -> `company`
- `brand-partners` -> `company`
- `cta_blocks` -> `company` 或具体页面所属模块
- `site_pages` -> `cms`
- `cms_pages` -> `cms`
- `cms_sections` -> `cms`
- `cms_content_entries` -> `cms`
- `cms_revisions` -> `cms`
- `service_areas` -> `services`
- `project_images` -> `projects`
- `form_submission_attempts` -> `leads`
- `quote_requests` -> `quotes`
- `lead_followups` -> `followups`
- `notification_settings` -> `settings`
- `maintenance_reminder_items` -> `system`
- `system_event_logs` -> `system`
- `translation_jobs` -> `system`

如果一个功能跨多个模块，必须先写清楚跨模块风险和调用边界，不允许直接 import 其他模块内部实现。

## 5. Fixed Layers

新增本地后端模块的固定路径是：`src/backend/modules/<module>/{routes,controller,service,repository}`。

标准层级：

| Layer | Responsibility |
| --- | --- |
| `routes` | 只负责路由绑定，不写逻辑 |
| `controller` | 只负责收参数、调用 service、返回结果 |
| `service` | 只负责业务规则、流程编排、业务判断 |
| `repository` | 只负责数据库读取、写入、查询条件 |
| `schemas` | 按需负责请求、响应、表单、数据校验 schema |

严格禁止：

- `controller` 直接写业务判断。
- `controller` 直接查数据库。
- `service` 直接拼 SQL 或直接散落 Supabase 查询。
- `repository` 写业务规则。
- `routes` 写业务逻辑。
- 页面组件直接写复杂数据库逻辑。

## 6. Presentation Boundary Rules

展示层边界规则：

- 后端、数据库、Edge Function 可以保存稳定技术代码，例如 `system_health_check`、`health-check`、`permission_denied`。
- 用户界面不能直接展示后端原始技术字段，包括 `source`、`event_type`、`status`、`error_code`、英文 `message`。
- `src/pages`、`src/pages/admin`、`src/components`、`src/components/admin` 只能展示已经转换好的当前语言文案。
- 技术字段到用户文案的转换应放在 `src/i18n`、`src/lib` 的显示转换工具或现有 UI 字典中，不要散落在页面 JSX 里。
- `system_event_logs` 归属 `system` 模块；日志可以保存技术字段用于排查，但后台日志页面必须按 `docs/rules/user-facing-technical-fields.md` 转换成人能看懂的文案。

一句话：数据层存稳定代码，展示层说人话。

## 7. Current Compatibility Rules

因为当前项目已经存在大量 `src/lib` 和 `supabase/functions` 代码，现阶段采用兼容规则：

- 已存在的 `src/lib/*Api.ts`、`*Queries.ts`、`*Mutation.ts` 可以继续作为对应模块的数据访问封装。
- 已存在的 Supabase Edge Function 可以继续作为入口，但新增复杂业务不能长期堆在 `index.ts`。
- 新增本地后端模块时，必须使用 `src/backend/modules/<module>/{routes,controller,service,repository}`。
- `schemas` 按需创建。
- `src/backend/modules` 下只能出现推荐的 16 个一级模块名。
- 当前没有 `src/backend/modules` 目录时，表示还没有新增本地后端模块，不代表可以绕过模块归属判断。

## 8. Route And API Boundaries

前台路由规则：

- 公开页面继续使用 `/:lang/...`。
- 示例：`/zh/services`、`/en/projects`。
- 老路径继续由 `LegacyLanguageRedirect` 处理。
- 动态 CMS 兜底路由固定为 `/:lang/* -> CmsDynamicPage`。

后台路由规则：

- 后台固定使用 `/admin/*`。
- `/admin` 是登录入口。
- 后台内页必须经过 `AdminAuthProvider`、`AdminRoute` 和 `AdminRoleGate`。

后端函数规则：

- 当前没有本地统一 `/api` 后端。
- `submit-lead`: 表单提交、防刷、线索/报价写入。
- `notify-lead`: 线索通知。
- `notification-settings`: 通知配置。
- `maintenance-reminder`: 维护提醒。
- `geocode-address`: 地址地理编码。
- `generate-english-content`: 英文生成和翻译任务。
- `health-check`: 健康检查。
- `sitemap`: 动态 sitemap。

新增或修改 API 时，必须说明请求字段、响应字段、错误格式、权限要求、缓存影响和兼容策略。现有 `submit-lead` 的 `{ ok, id }` / `{ error }` 返回方式先保持不动。

## 9. Public Performance Boundaries

公开页面性能属于 `media`、`seo`、`cms` 和具体内容模块的交叉边界，但实现时不能随便跨模块乱写。

固定规则：
- 图片来源是 Supabase Storage、CMS、后台管理内容或动态数据库内容时，必须先判断图片 URL 是否会太晚交给浏览器。
- 动态图片列表超过 6 张时，优先使用 HTML 预注入、Edge 短缓存、React Query 复用或已有数据 bundle；不要让图片 URL 完全依赖滚动后才触发的客户端数据库请求。
- 首页项目模块、项目列表、项目详情页是高风险区域；改动后必须检查 Supabase 图片请求启动时间。
- `routes` 只负责路由绑定，不得写图片预加载逻辑。
- `pages` 只负责展示和调用封装，不得堆复杂 Supabase 查询。
- `components` 负责图片展示和加载参数，优先使用 `SmartImage` / `DeferredSmartImage`。
- `lib` 负责读取预注入数据、Supabase 图片 URL 转换、数据复用、错误兜底。
- `functions/_middleware.ts` 负责公开 HTML 的 SEO、缓存、预注入和 Edge 短缓存边界。
- `public/_headers` 和 `public/_redirects` 负责缓存和路由兜底边界，不能让缺失 assets 被 SPA HTML 静默吞掉。

验证规则：
- 修改公开页面、动态图片、媒体加载、HTML 预注入或 Edge 缓存后，运行 `npm run verify:public-performance`。
- 该脚本必须检查 `/zh`、`/zh/projects`、一个项目详情页、`/zh/services`、`/zh/materials` 和 `/zh/blog`。
- 检查重点是：图片请求是否太晚、Supabase 请求是否重复、3.5 秒后是否还有大量图片才开始请求、是否横向溢出、是否破图。
- 如果脚本失败，不允许只靠口头解释通过；必须说明失败原因、影响范围和是否属于本次需求。

## 10. Architecture Task Templates

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

完成后必须输出：

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

## 11. Architecture Verification

- 架构规则变更：运行 `npm run arch:check`。
- 修改 `AGENTS.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT_RULES.md`、`scripts/arch-check.mjs` 或 `src/backend/modules` 后，必须运行 `npm run arch:check`。
- 修改公开页面性能、动态图片、媒体加载、HTML 预注入或 Edge 缓存后，必须运行或说明未运行 `npm run verify:public-performance`。
- CI 必须执行 `npm run arch:check`。
