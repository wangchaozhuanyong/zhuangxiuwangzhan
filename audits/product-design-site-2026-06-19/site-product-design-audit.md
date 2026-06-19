# Product Design 网站体验审计

日期：2026-06-19
项目：FLASH CAST 装修网站
范围：前台转化线与后台登录入口
输出位置：`audits/product-design-site-2026-06-19/`

## Audit Scope

本次按 Product Design 审计方式检查以下流程：

1. 首页首屏：`/zh`
2. 首页手机首屏：`/zh`
3. 服务列表桌面：`/zh/services`
4. 服务详情手机：`/zh/services/renovation`
5. 报价页桌面：`/zh/quote?source=service&title=全屋装修`
6. 报价页手机首屏和表单区
7. 后台未登录深链：`/admin/services/new -> /admin`

截图证据保存在 `screenshots/`：

- `01-home-desktop-viewport.png`
- `02-home-mobile-viewport.png`
- `03-services-desktop-viewport.png`
- `04-service-detail-mobile-viewport.png`
- `05-quote-desktop-viewport.png`
- `06-quote-mobile-viewport.png`
- `07-quote-mobile-form-viewport.png`
- `08-admin-login-mobile-viewport.png`
- `09-admin-login-desktop-viewport.png`
- `10-home-desktop-after.png`
- `11-home-mobile-after.png`
- `12-quote-mobile-guide.png`
- `13-quote-mobile-guide-filled.png`
- `14-services-category-cards-desktop.png`
- `15-services-category-cards-mobile.png`
- `16-service-detail-trust-tags-mobile.png`
- `17-service-detail-trust-tags-desktop.png`
- `18-admin-login-desktop-enhanced.png`
- `19-admin-login-mobile-enhanced.png`

## User Goal And Accessibility Target

用户目标：

- 访客快速理解 FLASH CAST 是做装修设计施工的公司。
- 访客能从首页或服务详情自然进入报价/WhatsApp 咨询。
- 管理员访问后台深链时能理解为什么回到登录页，并知道登录后继续。

可访问性目标：

- 首屏核心文案和主要操作在桌面、手机都可见。
- CTA、语言切换、电话、菜单等控件具备可理解名称。
- 页面没有横向溢出、乱码或明显遮挡。

## Strengths

1. 视觉基调统一，高端装修感强。
   - 证据：`03-services-desktop-viewport.png`、`05-quote-desktop-viewport.png`
   - 服务页和报价页的图片、暗色叠层、导航胶囊、按钮样式统一，整体品牌感成立。

2. 核心转化入口一直存在。
   - 证据：`01-home-desktop-viewport.png`、`04-service-detail-mobile-viewport.png`
   - 首页、服务详情都有“获取免费报价”和 WhatsApp 入口。

3. 报价页上下文带入清楚。
   - 证据：`05-quote-desktop-viewport.png`、`07-quote-mobile-form-viewport.png`
   - 从服务进入报价页后，会显示“已带入服务：全屋装修”，用户知道表单和刚才浏览的内容有关。

4. 后台登录深链提示明确。
   - 证据：`08-admin-login-mobile-viewport.png`、`09-admin-login-desktop-viewport.png`
   - 未登录访问后台内页会看到“请先登录，登录后继续访问刚才打开的后台页面”。

## UX Risks

### P1 已修复：首页首屏主标题不可见

修复前：

- 桌面首页首屏只突出背景图和按钮，H1 在 DOM 中存在，但视觉上被隐藏。
- 手机首页首屏标题被压到下方，用户先看到按钮，后看到网站到底做什么。
- 证据：`01-home-desktop-viewport.png`、`02-home-mobile-viewport.png`

影响：

- 新访客第一眼无法明确判断公司业务。
- CTA 出现得太早，缺少“为什么点”的上下文。
- 对可访问性和转化都不理想。

已执行修复：

- 修改 `src/styles/components/home-hero.css`，让首页 H1 和描述重新可见。
- 保留原来的大图、暗色叠层、按钮和高级感，不改业务内容、不改路由、不改 CMS。

修复后：

- 桌面标题、描述、报价按钮和 WhatsApp 都在第一屏可见。
- 手机标题、描述、按钮都在 390px 宽度第一屏可见。
- 无横向溢出、无乱码。
- 证据：`10-home-desktop-after.png`、`11-home-mobile-after.png`

### P2 已优化：报价页手机表单较长，缺少进度感

证据：`06-quote-mobile-viewport.png`、`07-quote-mobile-form-viewport.png`

修复前：

- 手机报价页首屏能看到标题和表单开头。
- 真正提交按钮需要继续向下滚动较多。

已执行优化：

- 修改 `src/pages/Quote.tsx`，在表单标题下加入“约 1 分钟完成”和必填项完成进度。
- 把字段按“联系方式 / 项目基础信息 / 帮助报价的补充信息”分组。
- 填写姓名、电话、项目类型、地点后，进度从 `已完成 0/4 个必填项` 更新到 `已完成 4/4 个必填项`。
- 保持单页提交和原有 `submitQuoteRequest` 逻辑不变，没有改 API、数据库或提交契约。

修复后：

- 手机端表单有明确时间预期、步骤感和完成反馈。
- 390px 宽度下无横向溢出、无乱码。
- 证据：`12-quote-mobile-guide.png`、`13-quote-mobile-guide-filled.png`

### P2 已优化：服务列表分类卡更像信息展示，不够像可点击筛选

证据：`03-services-desktop-viewport.png`

修复前：

- “住宅 / 商业 / 专项”三组入口视觉干净，但点击属性不够强。
- 用户可能把它看成说明卡，而不是快速跳转入口。

已执行优化：

- 修改 `src/pages/Services.tsx`，分类入口只显示有服务的分组，并加入当前分类状态。
- 增加服务数量、明确动作文案和箭头，例如“查看住宅服务 / 查看商业服务”。
- 点击分类后会跳到对应服务分组，并把当前分类高亮。
- 修改 `src/styles/components/subpages.css`，桌面为三张操作卡，手机为横向可滑动分类入口。

修复后：

- 分类入口更像可点击导航，而不是静态说明卡。
- 手机端页面本身无横向溢出，分类导航只在自身区域横向滚动。
- 证据：`14-services-category-cards-desktop.png`、`15-services-category-cards-mobile.png`

### P3 已优化：服务详情手机首屏信任信息还可以更靠前

证据：`04-service-detail-mobile-viewport.png`

修复前：

- 服务详情手机首屏图片真实、标题清楚，CTA 明确。
- 但“适合谁、流程、可做范围、SSM/本地服务”等信任点在首屏后面。

已执行优化：

- 修改 `src/pages/ServiceDetail.tsx`，在首屏 CTA 下加入 3 个信任标签。
- 信任标签覆盖本地服务范围、可预约现场、先确认范围再整理报价方向。
- 修改 `src/i18n/serviceDetailPageText.ts`，补齐中英文文案。
- 复用 `page-hero__meta` 体系，并在 `src/styles/components/subpages.css` 增加紧凑的信任标签样式。

修复后：

- 手机首屏可同时看到服务标题、核心 CTA、WhatsApp 和 3 个信任标签。
- 390px 宽度下无横向溢出、无乱码。
- 证据：`16-service-detail-trust-tags-mobile.png`、`17-service-detail-trust-tags-desktop.png`

### P3 已优化：后台登录桌面卡片略偏小

证据：`09-admin-login-desktop-viewport.png`

修复前：

- 登录状态清晰、表单可用、提示明确。
- 桌面大屏下卡片偏小，空间利用保守。

已执行优化：

- 修改 `src/pages/admin/AdminLogin.tsx`，桌面改为左侧后台工作区说明、右侧登录卡片的双栏布局。
- 保留原来的登录表单、语言切换、主题切换、错误提示和未登录深链提示。
- 登录按钮 loading 加入旋转图标，提交中禁用邮箱和密码输入，减少重复操作感。
- 修改 `src/i18n/adminLoginText.ts`，补齐中英文后台工作区、信任提示和安全说明。

修复后：

- 1440px 桌面下左侧后台用途信息和 480px 登录卡片同时可见，空间利用更完整。
- 390px 手机端自动回到单栏登录卡片，未登录深链提示仍然可见。
- 无横向溢出、无乱码。
- 证据：`18-admin-login-desktop-enhanced.png`、`19-admin-login-mobile-enhanced.png`

## Accessibility Risks

1. 已确认无横向溢出。
   - 覆盖：390px 手机与 1440px 桌面。

2. 已确认无乱码。
   - 截图和浏览器文本检查均未发现 `�`。

3. 首页已修复视觉隐藏主标题问题。
   - H1 现在不只存在于 DOM，也能被视觉用户看到。

4. 证据限制：
   - 本次后台只检查未登录入口，没有管理员账号，未进入真实后台内页。
   - 截图无法证明完整 WCAG 合规，键盘焦点顺序和屏幕阅读器朗读仍需专门测试。

## Recommendations

1. 已完成：恢复首页首屏 H1 和描述可见性。
2. 已完成：报价页手机表单进度、分组和完成反馈。
3. 已完成：服务列表分类卡点击感加强。
4. 已完成：服务详情手机首屏补 3 个信任标签。
5. 已完成：后台登录桌面双栏视觉增强和 loading 状态优化。

## Step Health

1. 首页桌面：修复前有 P1 风险，已修复，当前健康。
2. 首页手机：修复前有 P1 风险，已修复，当前健康。
3. 服务列表桌面：分类入口点击感已增强，当前健康。
4. 服务详情手机：首屏信任标签已增强，当前健康。
5. 报价页桌面：健康。
6. 报价页手机：已增强进度和分组反馈，当前健康。
7. 后台登录手机：健康。
8. 后台登录桌面：双栏视觉已增强，当前健康。
