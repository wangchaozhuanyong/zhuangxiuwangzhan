# FLASH CAST 后台 Product Design 审计

日期：2026-06-19

## 审计范围

- 项目：FLASH CAST Website
- 路径：`/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`
- 审计对象：客户端管理后台 `/admin/*`
- 技术栈：Vite + React + React Router + Supabase + Tailwind + Radix UI
- 包管理器：npm，锁文件：`package-lock.json`
- 当前分支：`main`
- 当前限制：没有 `ADMIN_TEST_EMAIL` / `ADMIN_TEST_PASSWORD`，所以本轮只能截图确认登录页、未登录跳转和响应式状态；登录后的真实数据页基于源码和现有 e2e 守卫检查审计。

## 截图证据

- `screenshots/01-admin-login-desktop-zh.jpg`：桌面中文登录页
- `screenshots/02-admin-login-desktop-en.jpg`：桌面英文登录页
- `screenshots/03-admin-login-desktop-en-dark.jpg`：桌面英文暗色登录页
- `screenshots/04-admin-dashboard-unauth.jpg`：未登录访问 `/admin/dashboard` 后回到登录页
- `screenshots/05-admin-login-mobile-390-zh.jpg`：390px 手机暗色登录页
- `screenshots/06-admin-login-mobile-390-zh-light.jpg`：390px 手机浅色登录页

## 审计步骤

1. `/admin` 登录页，桌面中文：整体健康，布局稳定，无明显横向溢出。
2. `/admin` 登录页，英文 + 暗色：整体健康，主题切换稳定，文字未重叠。
3. `/admin/dashboard` 未登录访问：功能健康，能回到登录页；体验上缺少“为什么回来了”的提示。
4. `/admin` 390px 手机：整体健康，浅色/暗色都无横向溢出，表单字段有 label，图标按钮有 `aria-label`。
5. 登录后后台页面源码审查：发现列表 loading、媒体弹窗、筛选控件可访问性、错误提示一致性和操作密度等风险。

## 确认优点

- 登录页首屏简洁，语言切换、主题切换和表单都在一个清楚焦点内。
- 390px 手机宽度下 `scrollWidth === clientWidth`，没有横向溢出。
- 登录页 email/password 使用显式 label，错误区域使用 `role="alert"`。
- 未登录访问后台内页会回到 `/admin`，自动化守卫测试通过。
- 后台已有统一基础组件：`AdminPageHeader`、`AdminDataTable`、`AdminEmptyState`、`AdminRoleGate`、`AdminActionButton`、`AdminConfirmDialog`，方向是对的。

## 主要风险

### 1. 多个列表页加载中会先显示“空数据”

严重度：高

现象：多处页面把 `data?.rows ?? []` 或 `items = []` 直接渲染为真实空态。首次进入、慢网络或 Supabase 延迟时，用户会先看到“暂无数据 / 没有符合条件的内容”，而不是明确 loading。后台操作者可能误判没有客户、没有内容风险、没有媒体。

证据：

- `src/pages/admin/AdminContentHealth.tsx:22-40` 默认 `items = []` 后立即计算 0 统计。
- `src/pages/admin/AdminContentHealth.tsx:167-170` `filtered.length === 0` 直接显示空态。
- `src/pages/admin/AdminServiceList.tsx:25-29` 默认 `rows = []`。
- `src/pages/admin/AdminServiceList.tsx:108-124` 表格直接吃空 rows，只在分页器显示 fetching。
- `src/pages/admin/AdminLeadList.tsx:41-45` 默认 rows/total。
- `src/pages/admin/AdminLeadList.tsx:166-168` rows 为 0 时直接显示空态。
- `src/pages/admin/AdminQuoteList.tsx:37-41` 与 `src/pages/admin/AdminQuoteList.tsx:162-164` 同类问题。
- `src/pages/admin/AdminPublishCenter.tsx:63-68` 统计会在 items 空时先显示 0。

建议：

- 增加统一 `AdminLoadingState` 或 `AdminDataState`。
- `isFetching && !data` 时显示骨架屏或“正在加载”，不要显示空态。
- `isFetching && data` 时保留旧数据并在 header/pager 显示刷新状态。

### 2. 媒体库编辑弹窗没有复用 Dialog，焦点和读屏风险高

严重度：高

现象：删除确认已经使用 `AdminConfirmDialog` / Radix Dialog，但媒体编辑是手写 `fixed inset-0` overlay。它没有 `role="dialog"`、`aria-modal`、`DialogTitle`、焦点陷阱、Esc 关闭和打开后焦点管理。弹窗内字段也主要依赖 placeholder，没有可见 label。

证据：

- `src/pages/admin/AdminMediaLibrary.tsx:195-216` 手写 fixed overlay。
- `src/pages/admin/AdminMediaLibrary.tsx:200-207` folder/select/alt 字段没有显式 label。
- `src/components/admin/AdminConfirmDialog.tsx:32-59` 项目已有可复用的 Dialog 模式。

建议：

- 将媒体编辑弹窗改为 Radix `Dialog` 组合，复用 `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter`。
- 给 folder、usage type、中文 alt、英文 alt 加可见 label。
- 打开时聚焦第一个字段，关闭后回到“编辑”按钮。

### 3. 未登录深链接回到登录页时缺少原因提示

严重度：中

现象：未登录访问 `/admin/dashboard` 会回到 `/admin`，功能上正确，但视觉上和普通打开登录页完全一样。对运营人员来说，可能不知道是 session 过期、权限失效，还是链接错误。

证据：

- `screenshots/04-admin-dashboard-unauth.jpg`
- `src/pages/admin/AdminRoute.tsx:96` signed-out 直接 `<Navigate to="/admin" replace />`。
- `src/pages/admin/AdminLogin.tsx:117-165` 登录页没有读取 redirect/session-expired 状态来显示说明。

建议：

- redirect 时带 `?reason=signed-out&redirect=/admin/dashboard` 或 router state。
- 登录页显示一条轻量提示：“登录后继续访问总览”。
- 登录成功后回到原始后台路径，而不是永远去 dashboard。

### 4. 后台筛选控件缺少稳定可读名称

严重度：中

现象：多个搜索框和 select 只靠 placeholder 或无说明。虽然 `AdminLayout` 有运行时补 aria 的兜底，但 select 没有 placeholder 时容易得到泛化名称，读屏用户无法快速知道这个下拉是“状态筛选”“用途筛选”还是“SEO 筛选”。

证据：

- `src/pages/admin/AdminServiceList.tsx:90-103`
- `src/pages/admin/AdminLeadList.tsx:111-119`
- `src/pages/admin/AdminQuoteList.tsx:107-115`
- `src/pages/admin/AdminMediaLibrary.tsx:139-145`
- `src/pages/admin/AdminSeoManager.tsx:276-290`

建议：

- 所有 filter bar 使用 `sr-only` label 或显式 `aria-label`。
- 搜索框 label 用“搜索服务 / 搜索客户咨询 / 搜索报价请求”这类具体文案。
- 状态按钮组补齐 `role="group"` 和 `aria-pressed`；`AdminContentHealth` 已经是较好的参考。

### 5. 错误提示和状态提示样式不统一

严重度：中

现象：登录页错误用 `role="alert"`，线索详情用 `role="status"`，但列表和媒体库里很多错误只是普通 `p`。媒体库还直接展示 `error.message`，有技术字段泄漏风险。

证据：

- `src/pages/admin/AdminMediaLibrary.tsx:117` raw error message fallback。
- `src/pages/admin/AdminMediaLibrary.tsx:136` banner 是普通 `<p>`。
- `src/pages/admin/AdminLeadList.tsx:135` 列表错误是普通 `<p>`。
- `src/pages/admin/AdminQuoteList.tsx:131` 同类。
- `src/pages/admin/AdminLogin.tsx:161-165` 登录页已有更好的 alert 模式。

建议：

- 新增 `AdminAlert` 组件：`info/success/warning/error`，内置 `role="status"` 或 `role="alert"`。
- 后台所有 Supabase/query/mutation 错误统一走 `formatUserFacingError` 或 `formatAdminMutationError`。
- 禁止 raw `error.message` 直接进入 UI。

### 6. 内容编辑页顶部操作太密，主次不够清楚

严重度：低到中

现象：服务编辑页 sticky action bar 同时放返回、状态、slug 检查、预览、保存草稿、发布、保存并生成英文、强制重新生成英文。对移动端和低权限用户来说，顶部会变得很拥挤，发布动作也容易和普通保存混在一起。

证据：

- `src/pages/admin/AdminServiceEditor.tsx:282-324`
- `src/components/admin/AdminStickyActionBar.tsx:14-16`

建议：

- 只保留 1 个 primary：保存草稿或发布。
- 次要动作放进“更多”菜单或分组为“英文工具”。
- 发布按钮旁显示 publish gate 摘要，例如“会进入受保护发布流程”。

## 可访问性风险汇总

- 已确认：登录页字段 label、图标按钮 aria、移动端无横向溢出。
- 需要修：媒体编辑弹窗语义和焦点管理。
- 需要修：筛选 select/search 缺少明确 label。
- 需要修：异步错误/状态提示缺少统一 live region。
- 仍需账号验证：登录后键盘 Tab 顺序、侧栏抽屉焦点回收、编辑表单错误定位、保存/发布 toast 是否被读屏读出。

## 优先级建议

1. 先修加载态和空态，避免运营人员误判数据。
2. 再修媒体编辑弹窗，复用现有 Dialog。
3. 统一筛选控件 label 和 `AdminAlert`。
4. 优化未登录深链接提示和登录后回跳。
5. 梳理编辑页 sticky action bar 的主次层级。

## 已运行检查

- `npm run typecheck`：通过。
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8081 npx playwright test e2e/smoke.spec.ts --grep "admin access guard|admin authenticated smoke" --project=chromium`：3 个未登录守卫用例通过，1 个登录后 smoke 因缺少测试账号跳过。

## 未覆盖项

- 没有真实后台账号，未能截图登录后的 dashboard、内容编辑、媒体库真实数据、线索详情和系统设置。
- 没有进行生产环境审计；本轮只审本地 dev server。
- 本轮没有修改源码，也没有提交、推送或部署。
