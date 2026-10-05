# 加载、刷新、导航与编辑保护（唯一正文）

适用：全部公开页面、后台页面、弹窗编辑和新增功能。其他规则仅链接本文件，不另设冲突的刷新规则。路由登记在 `docs/interaction-route-compliance.json`。登记表中的逐路由验收是标有日期的历史证据；`verify:interaction-standards` 只核对登记和静态规则，不能证明当前版本全站浏览器验收通过。当前测试与浏览器证据必须另行记录，发布前按实际源码版本核验。

## 状态与反馈

共用状态：首次加载、后台更新、成功、空结果、首次错误、离线、提交。读取必须使用既有业务 query hook 或 `useInteractionQuery`。共享 hook 的显示层 `isLoading` / `isInitialLoading` 包含已启用查询首次 `pending + paused` 且 `data === undefined` 的离线等待；TanStack 的 `status`、`fetchStatus`、`isPending`、`isFetching` 保持原义。禁用的查询或 `skipToken` 不因 `pending` 而被标为加载。页面用 `isInitialError` 显示首次错误，用 `refreshError` 显示更新失败，禁止用错误结果代替“空内容”。有成功数据时保留内容、滚动、筛选、分页；错误仍可局部重试。结果更新期间必须通过 `aria-busy` 告知，旧结果依赖的编辑、选择和导出暂时暂停。

首次未知数据不是空结果：`data ?? []` 仅用于安全遍历，不能据此显示“暂无记录”、不存在、已全部完成或统计为零。空结果与零统计必须来自已确认的 `data !== undefined`；独立查询分别确认，不能用一个查询的成功替另一个查询背书。首次暂停使用共享 `AdminLoadingState` 或既有公开加载边界；首次错误显示既有错误反馈及重试入口，不显示空结果。`isFetching` 只说明正在请求，离线暂停时可能为 `false`，新增页面不得照抄旧页面用它判断首次加载。

组合读取仍须确认实际来源完整：内容健康 hook 会把单个来源失败转换为 `status: error` 项，此时整体 query 成功不代表全部内容已确认，不能显示全量零统计或“全部完成”，也不能将错误占位身份作为单条或批次生成目标；已确认的真实记录仍沿用原操作流程。依赖其他查询结果的读取，须等待依赖确认，且查询键包含影响结果的稳定身份集合；例如 CMS 版本查询等待模块列表确认，并跟随模块 ID 集合增减更新，保留既有资源键前缀供失效刷新使用。

集中配置 `src/lib/interactionPolicy.ts`：反馈延迟 180ms，慢请求恢复操作 5s，读取超时 15s，搜索防抖 300ms；公开缓存 60s，后台列表 5min，其他后台默认 2min，保留 30min。读取消信号必须传到 repository 和实际 transport；读取最多自动重试一次，写入不得自动重试。

公开首个文档保留品牌画面。`publicBoot` 管文档交接，`PublicRouteImageGate` 管路由真实就绪；必要数据由 `data-route-pending` 登记，关键图片由 `SmartImage critical` 登记。非首屏、非关键图片不得锁住整页；关键图片慢时降级为占位，失败显示单图重试。首屏不得按固定时间假装完成；路由准备不等待后台更新。保留导航和公共布局。CSS、chunk 错误必须保留可恢复入口。

HTML 预注入仅允许 `publicQuerySeed` 初始化查询缓存，`publicQuerySeedCache` 按 QueryClient/查询键消费一次并保留文档时间。失效或缓存清理之后不得重新读取旧 HTML 作为刷新结果。摘要不满足详情字段时不能初始化详情；正文必须来自完整记录。queryFn 始终读取真实数据源。

网站设置统一使用 `useSiteSettingsQuery`。请求失败必须保留查询错误和已成功缓存，默认设置只能用于显示兜底，不能写回成功缓存。后台设置首次读取成功前禁用编辑和保存；读取成功但没有记录时仍沿用既有初始化规则。保存保留提交快照、版本冲突检查与同步提交锁。

公共列表统一用 `PublicResultsBoundary` 管理首次加载、首次错误、空结果、结果区域和 `aria-busy`；后台刷新保留内容与焦点，由 `RouteReadFeedback` 提示失败并重试。原有材料与装修对比的静态兜底必须显式声明 `keepFallback`，不能将兜底视为读取成功。

悬浮推广统一由 `useFloatingOcclusion` 检测与正文、表单、可点击区域、弹窗和恢复提示的重叠，覆盖时暂时隐藏，空位恢复；焦点已经进入推广入口时保持可用。禁止按 pathname 添加专用侧栏、缩窄单页或减小正文字号。

## 导航与表单

根使用现有 React Router Data router；`NavigationProtectionProvider` 统一处理站内跳转、前进后退、跨文档更新确认。表单用 `useUnsavedChangesWarning(dirty || isSubmitting)` 登记；原生刷新、关闭由 beforeunload 保护。公开语言切换、同页 hash 不算离开业务页面；禁止用 hash 作为后台页面 remount key。需要清空当前页面编辑的动作也必须先确认。

后台权限提示与权限门内的页面统一由 `AdminLanguagePage` 订阅语言，重新渲染同一个页面实例；不可用语言作为 remount key，亦不可依赖查询刷新或下一次编辑才更新文案。无需各页面分别增加语言补丁，原有权限判断保持不变。

只通过 `reloadDocumentSafely` 更新程序版本；内容版本变化仅失效缓存。不可自动整页刷新。跨前后台的文档切换继续保留分析隔离，不改变登录、权限、MFA。

编辑必须区分最后确认的远端快照、提交快照、当前输入。`useAdminFormState` 保留 dirty 字段；`applyRemote(saved, submitted)` 合并保存响应并保留提交后的新输入；多区块、失焦保存用 `applyPatchRemote(savedPatch, submittedPatch)`，不得把未提交的兄弟区块标记为已保存。不同记录 resetKey 不同，不沿用前一条详情占位。读取失败、写入失败保留输入。用 `useSubmissionLock` 同步锁定相关提交动作，覆盖校验期间的重复点击。

既有记录编辑须先确认该记录的远端身份与快照；首次离线暂停或首次失败时不能用默认值制造 dirty 状态，也不能将带 ID 的读取失败当成新增保存。恢复联网后仍按原 ID、版本和提交锁保存。合法独立新增不依赖列表先读取成功；新建路由的禁用详情查询保持可用。已成功读取但无记录的初始化沿用既有规则；已有缓存或已确认编辑快照遇到后台刷新暂停/失败时继续保留正文及草稿，不能重新初始化或锁死所有新增功能。

筛选、分类、分页放 URL；客户、CRM 搜索词只放 `useAdminListingState` 当前标签页内存，不能写入 URL、持久存储、跨标签消息。详情返回和 POP 恢复原列表位置；后台更新不重置滚动。

## 保存与缓存

业务写入仍在既有模块 service/repository。`invalidateAdminResource` 协调资源列表、详情、统计和公开内容；同一路径禁止“invalidate 后又 refetch”。程序性批量操作可只在批次末失效。跨标签通过 `QueryInvalidationBridge` 仅发送资源名和失效标记，不传记录、表单、客户资料或搜索条件。

数据库写入失败按原错误处理。数据库已成功、公开同步失败则保留保存结果，`PublicSyncRecovery` 明确提示“已保存，公开同步待重试”，重试只执行 delivery invalidation，不能重复 insert/update。受保护发布继续使用现有 `content-publish` 入口，不能绕过审批或权限。

## 复用示例与新增页面验收

公开列表：参考 `src/pages/Projects.tsx` + `usePublicListingState` + `PublicResultsBoundary`；详情：`src/pages/BlogDetail.tsx`，只初始化完整正文；公开表单：`src/pages/Contact.tsx`/`Quote.tsx`，提交锁与未保存保护；后台编辑：`src/pages/admin/AdminServiceEditor.tsx`；多区块：`AdminHomeEditor.tsx`/`AdminAboutEditor.tsx`；失焦保存：`AdminLeadDetail.tsx`；后台列表：`AdminBlogList.tsx` + `AdminDataTable busy`。

| 新页面类型 | 必须接入的实现 | 状态与恢复示例 |
| --- | --- | --- |
| 公开列表 | 既有 `usePublished*` hook、`usePublicListingState`、`PublicResultsBoundary`、`SmartImage` | `isLoading` 登记首次必要数据；`isInitialError` 显示失败重试；`isFetching` 只标记结果更新；空结果必须来自成功读取 |
| 公开详情 | 按 `slug`/语言查询、`data-route-pending`、完整详情缓存、`SmartImage critical` | 首次骨架、真实读取失败、成功但不存在分别处理；禁止跨记录 `keepPreviousData`；图片失败只重试图片 |
| 公开表单 | `useSubmissionLock`、提交快照、`useUnsavedChangesWarning` | 提交前抓取本次输入；失败保留输入；成功只确认该快照，后来输入继续显示未提交；语言/hash 保留当前表单 |
| 后台编辑 | `useAdminFormState(remote, { resetKey: id, initial })`、`useSubmissionLock`、`useUnsavedChangesWarning`、资源失效 | 保存使用 `applyRemote(saved, submitted)`；失焦/区块使用 `applyPatchRemote`；远端刷新不能覆盖 dirty 字段；提交期间同样保护离开 |

保存按钮与发布按钮写同一记录时使用同一个提交锁 key。失焦保存使用 `queueSubmission`，不能用“忙时忽略”丢弃后续字段。记录保存后采用新详情 URL 时只通过 `navigateAfterSave(isDirty, action)`，后续输入尚未保存时不得跳转。后台筛选/hash 变化仍要登记新的历史记录滚动位置，不能为了不重置滚动而退出整个恢复机制。

新增路由必须同步登记，标明加载、刷新、导航、编辑保护、验收和样例路径。执行 `npm run verify:interaction-quality`；浏览器正常路径覆盖每条路由；共用页面覆盖慢网、断网、读失败、图片/chunk 失败、连续切换、保存竞态、同步失败、未保存 POP 和版本提示。桌面/手机验证 360、390、768、1024、1440px、键盘、焦点、减少动态效果。

本地 Vite、Cloudflare 本地预览、模拟后台、真实 MFA 后台验收必须分开记录；不能用模拟结果证明线上业务。CI 文件可在本地修改，但未推送不得称 CI 通过。不得为本规则擅自推送、部署或写生产数据。
