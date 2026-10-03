# 加载、刷新、导航与编辑保护（唯一正文）

适用：全部公开页面、后台页面、弹窗编辑和新增功能。其他规则仅链接本文件，不另设冲突的刷新规则。路由登记在 `docs/interaction-route-compliance.json`。

## 状态与反馈

共用状态：首次加载、后台更新、成功、空结果、首次错误、离线、提交。读取必须使用既有业务 query hook 或 `useInteractionQuery`，保持 TanStack 原始状态语义。页面用 `isInitialError` 显示首次错误，用 `refreshError` 显示更新失败，禁止用错误结果代替“空内容”。有成功数据时保留内容、滚动、筛选、分页；错误仍可局部重试。结果更新期间必须通过 `aria-busy` 告知，旧结果依赖的编辑、选择和导出暂时暂停。

集中配置 `src/lib/interactionPolicy.ts`：反馈延迟 180ms，慢请求恢复操作 5s，读取超时 15s，搜索防抖 300ms；公开缓存 60s，后台列表 5min，其他后台默认 2min，保留 30min。读取消信号必须传到 repository 和实际 transport；读取最多自动重试一次，写入不得自动重试。

公开首个文档保留品牌画面。`publicBoot` 管文档交接，`PublicRouteImageGate` 管路由真实就绪；必要数据由 `data-route-pending` 登记，关键图片由 `SmartImage critical` 登记。非首屏、非关键图片不得锁住整页；关键图片慢时降级为占位，失败显示单图重试。首屏不得按固定时间假装完成；路由准备不等待后台更新。保留导航和公共布局。CSS、chunk 错误必须保留可恢复入口。

HTML 预注入仅允许 `publicQuerySeed` 初始化查询缓存，`publicQuerySeedCache` 按 QueryClient/查询键消费一次并保留文档时间。失效或缓存清理之后不得重新读取旧 HTML 作为刷新结果。摘要不满足详情字段时不能初始化详情；正文必须来自完整记录。queryFn 始终读取真实数据源。

## 导航与表单

根使用现有 React Router Data router；`NavigationProtectionProvider` 统一处理站内跳转、前进后退、跨文档更新确认。表单用 `useUnsavedChangesWarning(dirty || isSubmitting)` 登记；原生刷新、关闭由 beforeunload 保护。公开语言切换、同页 hash 不算离开业务页面；禁止用 hash 作为后台页面 remount key。需要清空当前页面编辑的动作也必须先确认。

后台权限提示与权限门内的页面统一由 `AdminLanguagePage` 订阅语言，重新渲染同一个页面实例；不可用语言作为 remount key，亦不可依赖查询刷新或下一次编辑才更新文案。无需各页面分别增加语言补丁，原有权限判断保持不变。

只通过 `reloadDocumentSafely` 更新程序版本；内容版本变化仅失效缓存。不可自动整页刷新。跨前后台的文档切换继续保留分析隔离，不改变登录、权限、MFA。

编辑必须区分最后确认的远端快照、提交快照、当前输入。`useAdminFormState` 保留 dirty 字段；`applyRemote(saved, submitted)` 合并保存响应并保留提交后的新输入；多区块、失焦保存用 `applyPatchRemote(savedPatch, submittedPatch)`，不得把未提交的兄弟区块标记为已保存。不同记录 resetKey 不同，不沿用前一条详情占位。读取失败、写入失败保留输入。用 `useSubmissionLock` 同步锁定相关提交动作，覆盖校验期间的重复点击。

筛选、分类、分页放 URL；客户、CRM 搜索词只放 `useAdminListingState` 当前标签页内存，不能写入 URL、持久存储、跨标签消息。详情返回和 POP 恢复原列表位置；后台更新不重置滚动。

## 保存与缓存

业务写入仍在既有模块 service/repository。`invalidateAdminResource` 协调资源列表、详情、统计和公开内容；同一路径禁止“invalidate 后又 refetch”。程序性批量操作可只在批次末失效。跨标签通过 `QueryInvalidationBridge` 仅发送资源名和失效标记，不传记录、表单、客户资料或搜索条件。

数据库写入失败按原错误处理。数据库已成功、公开同步失败则保留保存结果，`PublicSyncRecovery` 明确提示“已保存，公开同步待重试”，重试只执行 delivery invalidation，不能重复 insert/update。受保护发布继续使用现有 `content-publish` 入口，不能绕过审批或权限。

## 复用示例与新增页面验收

公开列表：参考 `src/pages/Projects.tsx` + `usePublicListingState`；详情：`src/pages/BlogDetail.tsx`，只初始化完整正文；公开表单：`src/pages/Contact.tsx`/`Quote.tsx`，提交锁与未保存保护；后台编辑：`src/pages/admin/AdminServiceEditor.tsx`；多区块：`AdminHomeEditor.tsx`/`AdminAboutEditor.tsx`；失焦保存：`AdminLeadDetail.tsx`；后台列表：`AdminBlogList.tsx` + `AdminDataTable busy`。

| 新页面类型 | 必须接入的实现 | 状态与恢复示例 |
| --- | --- | --- |
| 公开列表 | 既有 `usePublished*` hook、`usePublicListingState`、`data-public-results`、`SmartImage` | `isLoading` 登记首次必要数据；`isInitialError` 显示失败重试；`isFetching` 只标记结果更新；空结果必须来自成功读取 |
| 公开详情 | 按 `slug`/语言查询、`data-route-pending`、完整详情缓存、`SmartImage critical` | 首次骨架、真实读取失败、成功但不存在分别处理；禁止跨记录 `keepPreviousData`；图片失败只重试图片 |
| 公开表单 | `useSubmissionLock`、提交快照、`useUnsavedChangesWarning` | 提交前抓取本次输入；失败保留输入；成功只确认该快照，后来输入继续显示未提交；语言/hash 保留当前表单 |
| 后台编辑 | `useAdminFormState(remote, { resetKey: id, initial })`、`useSubmissionLock`、`useUnsavedChangesWarning`、资源失效 | 保存使用 `applyRemote(saved, submitted)`；失焦/区块使用 `applyPatchRemote`；远端刷新不能覆盖 dirty 字段；提交期间同样保护离开 |

保存按钮与发布按钮写同一记录时使用同一个提交锁 key。失焦保存使用 `queueSubmission`，不能用“忙时忽略”丢弃后续字段。记录保存后采用新详情 URL 时只通过 `navigateAfterSave(isDirty, action)`，后续输入尚未保存时不得跳转。后台筛选/hash 变化仍要登记新的历史记录滚动位置，不能为了不重置滚动而退出整个恢复机制。

新增路由必须同步登记，标明加载、刷新、导航、编辑保护、验收和样例路径。执行 `npm run verify:interaction-quality`；浏览器正常路径覆盖每条路由；共用页面覆盖慢网、断网、读失败、图片/chunk 失败、连续切换、保存竞态、同步失败、未保存 POP 和版本提示。桌面/手机验证 360、390、768、1024、1440px、键盘、焦点、减少动态效果。

本地 Vite、Cloudflare 本地预览、模拟后台、真实 MFA 后台验收必须分开记录；不能用模拟结果证明线上业务。CI 文件可在本地修改，但未推送不得称 CI 通过。不得为本规则擅自推送、部署或写生产数据。
