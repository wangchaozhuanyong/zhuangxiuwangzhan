# Flashcast Agent Instructions

本文件是本仓库的强制入口规则。所有 Codex / Agent / 人工协作者在修改代码前都必须先阅读并遵守。

完整开发规则见：`docs/DEVELOPMENT_RULES.md`。
固定架构边界见：`docs/ARCHITECTURE.md`。
专项规则索引见：`docs/rules/README.md`。

## 回复语言

- 默认使用中文回复。
- 除代码、命令、文件名、错误日志、API 字段名等必须保留英文的内容外，解释部分全部用中文。
- 面向用户的说明必须用大白话，保证非专业开发者也能看懂。

## 工作方式

- 必须先定位根因，再修改代码。
- 当前仓库信息足够时，直接修复，不要只给建议。
- 没写完、没验证、验证失败、不确定，都必须明确告诉用户。
- 不要随意扩大需求；顺手修复、可选优化、拓展功能必须和本次必须修复内容分开说明。
- 删除、清理、迁移、权限、安全、缓存、生产配置、真实数据相关改动必须先说明风险、影响范围和回滚方案。
- 涉及 UI、多语言、表单、SEO、CMS 发布、依赖、安全日志时，必须同时遵守 `docs/DEVELOPMENT_RULES.md` 的专项规则。
- 专项规则细节分散在 `docs/rules/*.md`，修改对应方向前必须按需读取。

## Backend Application Architecture Specification

本项目采用：模块化单体架构 + 分层设计 + 业务域划分 + 统一 API 规范。

英文固定表述：Modular Monolith + Layered Architecture。

强制原则：

- 不要使用微服务架构。
- 不要为了复杂而拆分模块。
- 所有代码必须优先保证模块边界清晰、层级职责清晰、业务归属清晰。
- 新增模块前，必须先确认现有 16 个一级模块无法承接该功能；否则禁止新增一级模块。
- 新增 API 前，必须先确认现有 Supabase Edge Function 或既有模块边界无法承接；否则禁止为了单个功能临时造新 API 体系。

当前网站真实运行形态：

- Vite + React 前端单页应用。
- React Router 管理前台和后台路由。
- Supabase 提供数据库、Auth、Storage。
- Supabase Edge Functions 作为后端函数入口。
- Cloudflare Pages 负责部署、缓存和静态托管。

后端边界包括：

- `supabase/functions/**`
- `supabase/migrations/**`
- `src/lib/**` 中封装 Supabase 访问、业务规则、权限、校验、缓存刷新、错误处理的兼容代码
- `src/backend/modules/**`

## Recommended Backend Modules / 推荐后端一级模块

本项目固定使用 16 个一级模块。这里的模块是业务归属边界，不代表每个功能都必须物理拆很多文件。

1. `home`
2. `company`
3. `services`
4. `projects`
5. `materials`
6. `blog`
7. `cms`
8. `leads`
9. `quotes`
10. `followups`
11. `media`
12. `seo`
13. `admin-auth`
14. `admin-users`
15. `settings`
16. `system`

禁止在未同步更新 `AGENTS.md`、`docs/ARCHITECTURE.md` 和 `scripts/arch-check.mjs` 的情况下新增一级模块。

子模块归属：

- `company`: `about`、`process`、`faqs`、`before-after`、`brand-partners`、`cta`
- `services`: 服务列表、服务详情、服务区域、旧屋翻新服务页
- `projects`: 案例列表、案例详情、案例图片
- `materials`: 材料列表、材料分类、材料详情
- `cms`: `cms_pages`、`cms_sections`、`cms_content_entries`、`cms_revisions`、`site_pages`
- `leads`: 联系表单线索、表单防刷记录
- `quotes`: 报价请求、报价表单上下文
- `followups`: 线索跟进、报价跟进
- `media`: 媒体库、图片上传、Supabase Storage 文件记录
- `seo`: SEO 审计、sitemap、robots、SEO manifest、GEO 内容
- `settings`: 网站设置、联系方式、地图、通知配置
- `system`: 系统健康检查、系统日志、维护提醒、翻译任务

如果一个功能跨多个模块，必须先说明跨模块风险，不允许直接调用其他模块内部实现。

## 固定层级职责

新增本地后端模块的固定路径是：`src/backend/modules/<module>/{routes,controller,service,repository}`。

固定层级：

- `routes`: 只负责路由绑定，不写业务逻辑。
- `controller`: 只负责接收参数、调用 service、返回结果，不直接写业务规则或数据库查询。
- `service`: 只负责业务逻辑、流程编排、业务判断，不直接操作 SQL 或散落 Supabase 查询。
- `repository`: 只负责数据库读取、写入、查询条件，不包含业务判断。
- `schemas`: 按需放请求、响应、表单、数据校验 schema。

当前 Supabase Edge Functions 可以作为后端入口适配层，但新增复杂业务时必须把业务规则拆到对应模块的 service / repository 中，不允许长期堆在 `index.ts` 里。

## 当前目录固定规则

- 前台公开页面：`src/pages`
- 后台管理页面：`src/pages/admin`
- 前台路由：`src/routes/publicRoutes.tsx`
- 后台路由：`src/routes/adminRoutes.tsx`、`src/routes/AdminRouteTree.tsx`
- 应用总入口：`src/App.tsx`
- 公共组件：`src/components`
- 后台专用组件：`src/components/admin`
- 基础 UI：`src/components/ui`
- 页面数据状态和 React Query：`src/hooks`
- Supabase 查询、保存、删除、缓存刷新、错误转换：`src/lib`
- 新增本地后端模块：`src/backend/modules`
- 静态兜底内容：`src/data`
- 多语言文案：`src/i18n`
- 样式：`src/styles`
- 数据库迁移：`supabase/migrations`
- 后端云函数：`supabase/functions`
- Cloudflare Pages 中间件：`functions/_middleware.ts`
- 静态缓存和响应头：`public/_headers`
- SPA fallback 和重定向说明：`public/_redirects`

## 高频专项规则

- 多语言：所有用户可见系统文案必须走 `src/i18n` 或 CMS 多语言字段；中文页不能漏英文 UI，英文页不能漏中文 UI。
- 技术字段展示：用户界面禁止直出 `system_health_check`、`health-check`、`permission_denied`、`error_code` 这类技术字段，必须映射成人能看懂的当前语言文案。
- 组件复用：同类 UI 出现 2 次必须考虑抽组件，出现 3 次必须抽组件；优先复用 `src/components/ui` 和 `src/components/admin`。
- 表单提交：必须有校验、loading、成功、失败、防重复提交；服务端必须再校验，不能只信前端。
- SEO / CMS：公开页面必须考虑 title、description、canonical、hreflang、OG；后台保存内容后必须验证前台真实显示。
- 可访问性：图片、表单、按钮、弹窗、错误提示必须有基本无障碍支持，不能只靠颜色表达状态。
- 依赖管理：新增依赖前必须说明原因、替代方案、体积/维护/安全风险，不能为了方便随手加大包。
- 日志隐私：日志不能输出密钥、token、密码、完整客户隐私信息；敏感后台操作要考虑 audit log 或 system log。

专项细则：

- `docs/rules/i18n.md`
- `docs/rules/user-facing-technical-fields.md`
- `docs/rules/component-reuse.md`
- `docs/rules/forms-and-submissions.md`
- `docs/rules/accessibility-responsive.md`
- `docs/rules/seo-cms-publishing.md`
- `docs/rules/dependencies.md`
- `docs/rules/logging-privacy.md`

## 路由和 API 规则

- 公开页面继续使用语言前缀：`/:lang/...`，例如 `/zh/services`、`/en/projects`。
- 老路径继续由 `LegacyLanguageRedirect` 处理，不要随便删除。
- 后台页面继续使用 `/admin/*`，不能迁到其他路径。
- `/admin` 是登录入口。
- 后台内页必须经过 `AdminAuthProvider`、`AdminRoute` 和 `AdminRoleGate`。
- 动态 CMS 兜底路由是 `/:lang/* -> CmsDynamicPage`，新增公开页面时不能误伤这个兜底逻辑。
- 当前没有本地统一 `/api` 后端。
- 表单提交固定走 Supabase Edge Function `submit-lead`。
- 通知相关固定走 `notify-lead`、`notification-settings`、`maintenance-reminder`。
- 地理编码固定走 `geocode-address`。
- 英文生成固定走 `generate-english-content`。
- 健康检查固定走 `health-check`。
- sitemap 动态生成固定走 `sitemap`。
- SEO/GEO 审核通过的后台内容发布固定走受保护 Edge Function `content-publish`；当前第一版只支持 `service` 内容类型，可以使用管理员 Bearer token，或使用 `CONTENT_PUBLISH_SECRET` 对应的 `x-cron-secret` 机器密钥。管理员角色必须是 `super_admin` 或 `content_editor`，机器密钥只允许作为内容发布自动化路径，发布模式必须包含 `ownerApproved: true` 和 `explicitExecution: true`。禁止 Codex 或脚本直接写内容数据库表来绕过后台发布链路。

新增或修改 API 时，必须说明请求字段、响应字段、错误格式、权限要求、缓存影响和兼容策略。现有 `submit-lead` 的 `{ ok, id }` / `{ error }` 返回方式先保持不动。

## 修改和验证规则

- 必须先判断模块归属，再写代码。
- 必须先判断层级归属，再实现逻辑。
- 严禁跨模块直接调用内部实现。
- 严禁在 controller / service / repository / routes 混写逻辑。
- 涉及后台内容管理时，不能只验证后台保存成功，还必须验证前台真实读到并显示。
- 涉及前端页面时，默认检查桌面端和移动端，重点看导航遮挡、文字重叠、横向溢出、高度不一致、乱码和逻辑冲突。
- 涉及多语言文案时，必须检查中英文是否都补齐，并运行或说明未运行 `npm run i18n:check`。
- 涉及状态、日志、错误、通知、后台表格时，必须检查是否有技术字段直接出现在用户界面。
- 涉及公开页面时，必须检查 SEO、语言切换、响应式和可访问性是否受影响。
- 涉及新增依赖时，必须先说明必要性和风险，不能直接安装后再解释。
- 涉及线上白屏、chunk 加载失败、路由异常时，必须同时检查前端代码、构建产物、`public/_headers`、`public/_redirects`、`functions/_middleware.ts`、CDN/缓存策略和部署脚本。
- 涉及数据库结构变化时，只能通过 `supabase/migrations` 增量迁移，不直接手改生产数据。
- 涉及删除时，优先归档或标记 deprecated；确认没有路由、后台菜单、动态 import、脚本、函数、测试引用后再删除。

## 公开页面性能防回归规则

- 涉及公开页面、首页模块、项目案例、服务、材料、博客、CMS 内容或媒体图片时，必须判断是否会影响图片加载速度。
- 凡是动态图片列表超过 6 张，必须优先考虑 HTML 预注入、Edge 短缓存、React Query 复用或其它数据预加载方案；禁止让图片 URL 完全依赖滚动后才触发的客户端数据库请求。
- 动态图片必须优先使用 `SmartImage` 或 `DeferredSmartImage`，不要在页面里随手写裸 `<img>`。
- 滚动区域图片不能只靠很近的 lazy load；非首屏但用户容易快速滚到的图片应提前进入请求队列。
- 首批可见或快速滚动可见的关键图片应设置合理的 `loading`、`fetchPriority`、`sizes`、`width`、`height` 和 Supabase WebP 转换参数。
- 公开页面不能因为同一个模块同时请求详情数据和列表数据，导致图片 URL 被重复或延迟获取；项目详情、首页项目模块、项目列表尤其要检查。
- 涉及线上白屏、chunk、缓存、图片慢、滚动空白时，必须同时检查 `functions/_middleware.ts`、`public/_headers`、`public/_redirects`、构建产物保留脚本、HTML 缓存和 Supabase 图片请求启动时间。
- 修改公开页面性能相关代码后，优先运行 `npm run verify:public-performance`；该脚本需要针对 Cloudflare Pages preview 或线上 URL 运行。

## 写代码前必须输出 Architecture Decision

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

如果无法判断模块归属，必须停止，不允许自己创建新模块。

如果需要跨模块调用，必须先说明风险和边界，不允许直接 import 其他模块内部实现。

如果任务会导致 controller / service / repository / routes 职责混写，必须停止。

## 完成后必须输出 Architecture Compliance Report

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

最终回复尽量使用：

```text
【问题原因】
【修复内容】
【修改文件】
【验证结果】
【是否完成】
【需要我确认】
```

## 自动检查

- 本项目提供 `npm run arch:check`。
- 修改架构文档、开发规则、模块列表、脚本、CI 或后端目录后，必须运行 `npm run arch:check`。
- 普通代码改动至少按影响范围运行 `npm run lint`、`npm run typecheck`、相关测试。
- 公开页面、动态图片、媒体加载、HTML 预注入、Edge 缓存相关改动必须运行或说明未运行 `npm run verify:public-performance`。
- 多语言文案改动运行 `npm run i18n:check`。
- 涉及用户可见错误、状态、日志、来源字段时运行 `npm run ui:text-check`。
- 前台 UI 改动必须检查真实桌面端和移动端页面。
- SEO / CMS 发布链路改动必须验证后台保存、前台展示、SEO metadata、sitemap 或相关生成物是否一致。
- 表单、线索、报价、通知相关改动必须验证成功、失败、防重复提交和缓存刷新。
- CI 必须执行 `npm run arch:check`。
