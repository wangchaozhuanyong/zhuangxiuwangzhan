# FLASH CAST 网站修复方案

制定日期：2026-08-30
依据：[网站设计与体验审计](./README.md)
项目：`flashcast-website`
技术栈：Vite 8、React 18、TypeScript、React Router、TanStack Query、Supabase、Cloudflare Pages
包管理器：npm
当前分支：`main`

## 一、修复目标

本轮修复不更换框架、不重做品牌风格、不修改数据库结构，目标是让现有高端装修视觉变得稳定、紧凑和流畅：

1. 刷新或首次进入时，首屏图片不再出现黑色空白后突然弹出。
2. 中英文切换不再整页重载或重播全部动画。
3. 英文使用真实、紧凑、适合网页的字体和独立字号体系。
4. 减少过大的模块间距、超高图片和过长页面。
5. 降低 GSAP、ScrollTrigger、DOM 扫描和非首屏图片对流畅度的影响。
6. 保持现有 URL、SEO、CMS、后台编辑、Supabase 数据结构和品牌内容不变。

## 二、实施原则

- 每个修复批次独立、可回退、可单独验收，不把字体、路由、动画和 CSS 重构混成一次大改。
- 优先修复用户能直接感知的 P1 问题，再处理代码整理。
- 不新增大型依赖；字体使用自托管 WOFF2，不接入运行时第三方字体请求。
- 不修改数据库、登录、报价、支付和后台发布流程。
- Cloudflare 缓存和边缘 HTML 数据裁剪在用户单独确认后实施；只改响应序列化，不改缓存策略和数据库契约。

## 三、建议拆分为 6 个修复批次

## 批次 1：图片加载稳定化

优先级：P1
目标：解决刷新时图片区域先空白、后突然出现，以及非首屏图片弹出的问题。

### 修改范围

- `src/components/SmartImage.tsx`
- `src/components/DeferredSmartImage.tsx`
- `src/components/scheme-a/SchemeAHome.tsx`
- `src/components/scheme-a/SchemeARoutePrimitives.tsx`
- 首页与公共图片状态相关 CSS

### 技术方案

1. 给 `SmartImage` 增加明确的 `loading / loaded / error` 状态，同时保留调用方传入的 `onLoad`、`onError`。
2. 图片容器从首次绘制开始显示与图片比例一致的深色/暖灰占位背景；加载完成后仅做 160–220ms opacity 渐显。
3. Hero 保留现有 responsive preload、`loading="eager"` 和 `fetchPriority="high"`，不重复增加 preload。
4. 首屏 Hero 不再由 GSAP 重置透明度或在空闲阶段二次缩放；首屏图片只由加载状态控制。
5. `DeferredSmartImage` 未挂载真实图片时显示可见占位层，不再是透明空 `span`；加载失败时显示稳定背景和无障碍替代文本。
6. 将默认 `rootMargin` 从 1000px 收紧到约 400–600px，避免一次性提前挂载过多图片。
7. 项目/服务列表卡片全部改为 lazy；只有页面 Hero 使用 eager/high。
8. 保留 width、height、aspect-ratio 和 srcset，避免为了消除闪动引入 CLS。

### 验收标准

- 连续硬刷新 5 次，首屏不出现纯黑图片区后突然弹图。
- 图片加载前后 Hero、项目卡片、材料区高度不变化。
- 360px、390px、768px、1280px、1440px 均无图片溢出或裁切异常。
- 首屏只存在一个高优先级内容图片请求。
- 图片请求失败时页面结构仍完整，不出现破图图标或空白大洞。

## 批次 2：语言切换链路优化

优先级：P1
目标：中英文切换在视觉上接近即时完成，不整页卸载、不重播动画、不出现中英文混合帧。

### 修改范围

- `src/components/scheme-a/SchemeAPublicChrome.tsx`
- `src/components/LanguageRouteSync.tsx`
- `src/App.tsx`
- `src/hooks/usePublishedContent.ts`
- `src/i18n/LanguageContext.tsx`
- 相关语言路由与集成测试

### 技术方案

1. 语言按钮在 `pointerenter`、`focus`、`touchstart` 时预取目标语言的当前页面数据。
2. 点击时先同步设置目标 language，再执行路由跳转，消除 `useEffect` 延迟同步造成的中间帧。
3. `LanguageRouteSync` 继续负责直接访问 URL 时的兜底，但不再成为正常语言切换的主要状态更新路径。
4. 公共主区域 key 改为“移除 `/zh` 或 `/en` 前缀后的业务路径”；仅切换 locale 时保留现有页面组件实例。
5. TanStack Query 为目标语言使用 `prefetchQuery`；冷切换时暂时保留当前完整页面，目标数据就绪后一次性替换，禁止半中文半英文。
6. `PublicCinematicMotion` 的依赖改为业务路径，单纯切换语言时不销毁并重建动画。
7. 语言切换只保留 120–180ms 的轻量文字透明度过渡，不使用全页 Loader。
8. 更新 `<html lang>`、SEO title 和页面内容时保持同一切换周期。

### 验收标准

- 已预取或已缓存情况下，语言内容切换目标小于 150ms。
- 冷切换情况下，主要内容稳定切换目标小于 500ms；弱网下允许延迟，但不显示空白页。
- `/zh` → `/en` → `/zh` 不重播 Hero、Header 和全页 ScrollTrigger。
- 切换过程中不出现中文路径配英文内容或英文路径配中文内容。
- 浏览器前进/后退、直接访问 `/en/...` 和 `/zh/...` 行为保持正确。

## 批次 3：英文字体和中英文排版系统

优先级：P1
目标：英文页面紧凑、易读，避免 Georgia 和中文字体回退导致的尺寸失控。

### 字体方向

- 英文标题：`Inter Tight Variable`，500–600。
- 英文正文与导航：`Inter Variable`，400–600。
- 英文引语/短品牌强调：可选 `Playfair Display`，仅少量使用。
- 中文正文：`PingFang SC`、`Noto Sans SC`、系统无衬线回退。
- 中文短标题/引语：保留现有宋体方向，但不影响英文 token。

### 修改范围

- `src/styles/base.css`
- `src/styles/components/scheme-a-structural.css`
- `src/styles/components/scheme-a-literal.css`
- `src/styles/components/home-atelier.css`
- `src/styles/components/scheme-a-native-pages.css`
- 新增经过授权检查的 WOFF2 字体资产及字体许可证文件

### 技术方案

1. 新增 `@font-face`，只自托管首屏需要的 Latin variable WOFF2；不下载完整中文 WebFont。
2. 建立语言级 token：
   - `html[lang="en"] --font-display / --font-body / --font-accent`
   - `html[lang^="zh"] --font-display / --font-body / --font-accent`
3. 删除首页和公共页面对 Georgia、PingFang 的直接硬编码，统一引用 token。
4. 英文移动端 H1 调整为约 32–36px、line-height 1.12–1.18、宽度 12–14ch；不再比中文 H1 更大。
5. 英文桌面 H1/H2 建立独立最大宽度，避免依赖中文排版参数。
6. 导航、按钮、eyebrow 的英文 letter-spacing 收紧；普通英文正文禁止大面积正 tracking。
7. 字体加载失败时回退到 `Arial / system-ui` 等尺寸接近的无衬线字体，避免再次落到 Georgia。

### 验收标准

- 浏览器计算样式确认英文标题不再是 Georgia，正文不再是 PingFang。
- 360px 移动端英文 Hero 标题不超过 4–5 行，不与顶部标识、正文或按钮碰撞。
- 英文首页总高度与中文差异控制在约 8% 内，超出的部分必须来自真实内容长度而非字号/间距。
- 字体加载期间不发生明显 FOUT 引起的二次换行或布局跳动。
- 中文页面字体视觉保持原有品牌气质。

## 批次 4：布局密度和响应式修复

优先级：P2
目标：缩短页面、减少无效留白，改善英文移动端和中等桌面宽度。

### 修改范围

- `src/styles/components/scheme-a-structural.css`
- `src/styles/components/home-atelier.css`
- `src/styles/components/scheme-a-shell.css`
- `src/styles/components/scheme-a-native-pages.css`

### 技术方案

1. 建立三档 section spacing，不再每个模块单独写 82/94px：
   - 紧凑：移动 48px / 桌面 64px。
   - 标准：移动 64px / 桌面 80–96px。
   - 强调：移动 80px / 桌面 112–128px。
2. 首页建议映射：原则区标准、品牌引语强调、项目区标准、服务区标准、材料区强调、流程区标准、FAQ 标准、最终 CTA 强调。
3. 移动端 Hero 从固定 `height + min-height + max-height` 改为内容驱动的 `min-height`，为固定顶栏和底部导航预留 safe area。
4. 项目主图桌面最大高度限制在约 72–78vh；移动端保持稳定 aspect-ratio。
5. 项目集合与下一模块之间移除重复 margin/padding，移动端集合顶部间距从 64px 收紧到约 36–44px。
6. 服务/材料双栏 gap 限制在约 48–96px，不再扩大到 9–11rem。
7. 增加 1180–1366px 紧凑桌面导航档位，缩小 nav gap；必要时收起次要导航，不压缩 Logo 和语言按钮。
8. 横向项目卡片保证下一张露出 12–20%，增加轻量进度指示或“横滑查看更多”提示。

### 验收标准

- 360、390、430、768、1024、1180、1280、1366、1440、1920px 均无横向溢出。
- 英文 Hero 内容不与固定 Header、底部 Dock 或图片说明碰撞。
- 首页仍有高端留白，但连续同色模块之间不再出现一整屏空白。
- 中英文导航在 1180–1366px 都不发生品牌、菜单、语言按钮和 CTA 碰撞。
- 横向卡片在触摸、鼠标滚轮/触控板和键盘下均可使用。

## 批次 5：动效与滚动性能整改

优先级：P1/P2
目标：保留少量品牌动效，移除全页扫描和频繁 ScrollTrigger refresh。

### 修改范围

- `src/components/PublicCinematicMotion.tsx`
- `src/App.tsx`
- `src/styles/components/motion.css`
- 需要动效的页面组件

### 技术方案

1. 删除监听整个公共页面 subtree 的 MutationObserver。
2. 动效目标由组件明确注册，不再通过全局 selector 扫描全部 section。
3. 每个页面只保留 1–2 类签名动效：首个非 Hero 区块进入、少量项目图片轻微进入；取消普遍 scrub。
4. Hero 图片加载与 Hero 内容入场分离；首屏图片永远不被后加载动效模块重置。
5. 图片加载、字体 ready 和 pageshow 不再各自触发全量 refresh；只有真实布局改变时合并 refresh 一次。
6. `prefers-reduced-motion` 只关闭位移、缩放、视差和自动播放；保留 100–160ms 颜色/透明度反馈。
7. 将 `transition: all` 改成明确属性列表。
8. 如果收紧后 GSAP 仍造成明显主线程压力，再评估将普通 section reveal 改为原生 IntersectionObserver + CSS。

### 验收标准

- 桌面从 Hero 连续滚动至页尾，不出现图片经过视口时的明显顿挫或回弹。
- 切换语言、前进后退和懒图片挂载不触发全页动画重建。
- 滚动过程中不出现超过 50ms 的重复长任务峰值。
- reduced-motion 下没有大幅位移/缩放，同时菜单、按钮状态反馈仍可见。
- 动效模块优化后重新记录 gzip 体积和运行时触发数量。

## 批次 6：CSS 收口与边缘数据优化

优先级：P2/P3
目标：减少后续改一处坏一处的风险，并压缩首页预注入数据。

### CSS 收口

1. 保留 `token → 公共组件 → 页面变体 → breakpoint` 的单向覆盖顺序。
2. 同一组件的响应式规则集中在一个权威文件中。
3. 清理 structural、literal、home-atelier、desktop-hero 中重复的字体、Hero、间距 selector。
4. 逐步删除非必要 `!important`，每次只处理一个组件，不进行一次性全站重写。

### 边缘数据优化（已完成单独评审与实施）

连接现有 CMS 的本地 Edge 基线中，首页 `flashcast-public-data` 为 164KB；服务、材料、产品、地区和博客列表页分别约为 103KB、251KB、250KB、164KB 和 212KB。主要原因是列表页预注入完整详情正文与发布后台字段。

已实施：

1. 新增独立 Edge 投影层，按首页、项目摘要、服务摘要、材料列表/详情、地区摘要和博客摘要保留字段白名单。
2. 继续保留中英文双语展示字段，确保同一文档内语言切换无需重新获取数据；仅移除后台元数据和当前路由不会读取的详情字段。
3. 博客列表只保留摘要，同时在 Edge 预计算中英文阅读分钟数；直接产品详情仍保留目标产品的完整详情和图库。
4. 删除首页当前没有消费方的 `productHighlights` 预注入与对应 Edge 请求。
5. 为 10 个公开页面增加原始 JSON 体积预算，并把产品详情完整预注入契约加入 Playwright 验收。
6. 保留现有 Edge cache、freshness、ETag、响应式图片 preload 和 Supabase 数据查询契约，不修改数据库/RPC/RLS。

### 验收标准

- 公共 CSS gzip 体积不高于当前基线，重复 selector 和 `!important` 数量下降。
- 首页预注入 JSON 原始体积小于 70KB；各列表页均受独立体积预算保护，且不增加首次客户端数据请求。
- CMS 发布后中文、英文、SEO 和首页内容均正确刷新。
- Cloudflare edge hit/stale/miss 行为与现有测试一致。

## 四、推荐执行顺序与依赖

```text
批次 1 图片稳定化
  ↓
批次 2 语言切换
  ↓
批次 3 英文字体
  ↓
批次 4 布局密度
  ↓
批次 5 动效性能
  ↓
批次 6 CSS / 边缘数据收口
```

原因：图片和语言是用户最直接感知的问题；字体确定后才能准确调整布局；布局稳定后再收紧滚动动画，避免反复调 ScrollTrigger；CSS 和边缘数据最后处理，降低一次改动范围。

## 五、每个批次必须执行的检查

### 自动检查

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run i18n:check`
- `npm run build:dev`
- `npm run verify:performance-budget`
- `npm run verify:public-performance`（先解决本机缺少 Playwright Chromium 的环境问题）

### 人工回归矩阵

| 场景 | 必测内容 |
| --- | --- |
| 首页硬刷新 | 图片占位、Hero、Logo、字体、CLS、首屏按钮 |
| 中文 ↔ 英文 | 内容原子切换、URL、标题、无全页动画重播 |
| 首页滚动 | 项目、服务、材料、前后对比、FAQ、CTA |
| 项目/服务列表 | Hero 优先级、卡片 lazy、滚动流畅度 |
| 移动端 | 360×800、390×844、430×932 |
| 平板 | 768×1024、1024×768 |
| 桌面 | 1280×720、1366×768、1440×900、1920×1080 |
| 无障碍 | 键盘、焦点、reduced motion、图片错误状态 |
| 网络 | 正常网络、Slow 4G、缓存命中、硬刷新 |

## 六、最终整体验收指标

- 刷新时无图片区域闪黑、弹出或明显布局跳动。
- 首页 CLS 目标不高于 0.05。
- 首屏 LCP 目标不高于 2.5 秒，弱网结果单独记录。
- 语言热切换小于 150ms，冷切换目标小于 500ms。
- 正常交互 INP 目标不高于 200ms。
- 英文移动端 Hero 不拥挤，首页高度不因字体规则额外膨胀超过约 8%。
- 1180–1366px 中英文导航无碰撞。
- 页面滚动无反复 ScrollTrigger refresh 造成的明显停顿。
- 所有自动检查通过，无数据库、CMS、SEO、后台和生产发布回归。

## 七、风险与控制

| 风险 | 控制方式 |
| --- | --- |
| 字体更换导致全站换行变化 | 字体批次独立；先处理 token，再逐页调整，不同时改大间距。 |
| 移除 pathname key 后页面状态残留 | 对真实业务路径保留 key；只让 locale 切换复用页面实例，并补前进/后退测试。 |
| 减少 ScrollTrigger 后品牌感下降 | 保留少量签名动效，以截图和录屏比较，不全部关闭动画。 |
| 图片渐显影响 LCP | Hero 保持 preload/eager/high，渐显时间不超过 220ms，并用实测确认。 |
| CSS 收口影响大量页面 | 最后执行，按组件小批处理，禁止全文件重写。 |
| 边缘数据裁剪导致 CMS 内容缺失 | 保留双语字段；用字段投影单测、双语 hydration 集成测试和 10 页真实浏览器验收保护。 |

## 八、本方案不包含

- 不重新设计 Logo、品牌色或全站内容架构。
- 不修改数据库表、Supabase RLS、后台权限、登录或报价流程。
- 不部署、不提交、不推送、不创建 PR。
- 不新增 npm 依赖；经用户明确授权后，仅安装项目锁定 Playwright 版本对应的 Chromium 运行时到本机缓存。

## 九、2026-08-30 执行结果

已完成批次 1–5，以及批次 6 的前端 CSS 收口和 Edge HTML 数据裁剪：

- 图片增加稳定占位、加载状态、解码后渐显，并把列表首屏外图片恢复为 lazy。
- 中英文切换增加目标语言数据预取、60 秒原始首页数据共享快照和页面实例复用；首页切换取消通用 View Transition。
- 英文标题/正文改为项目内托管的 Inter Tight / Inter 可变字体，中文继续使用系统中文字体栈。
- 收紧首页桌面和移动端的模块间距、材料图高度、项目主图高度、移动端首屏与横滑案例提示。
- 全页 GSAP / ScrollTrigger 扫描改为原生 IntersectionObserver；动效分包由约 117.8KB 降到 1.2KB。
- 修复 1180–1365px 导航密度，并清理公开页 `transition: all` 与会覆盖图片渐显的 `opacity: 1 !important`。
- Cloudflare HTML 预注入改为路由级字段投影；首页移除未使用的产品亮点数据，列表页不再携带详情全文。
- 首页首个精选案例图使用单独的 1000px 观察范围，避免快速下滑时踩到图片起始时间阈值；其余懒图片仍保持默认 600px。
- `verify:public-performance` 增加原始 JSON 体积预算和直接产品详情契约，共覆盖 10 个公开页面。

实测结果：

- 1265×720：CLS 记录值 0、无横向溢出、Hero 图片状态为 `loaded`。
- 390×844：英文标题使用 Inter Tight Local、34.3px、首屏内容未裁切，页面无横向溢出。
- 首页中英文切换：URL 和目标语言标题在点击后首个 80ms 采样时均已完成。
- Edge 实测预注入 JSON：主页 164KB→36KB（-78%）、服务 103KB→10KB（-90%）、材料 251KB→43KB（-83%）、产品 250KB→42KB（-83%）、地区 164KB→32KB（-80%）、博客 212KB→59KB（-72%）。
- 直接产品详情为 49KB，目标产品完整图库仍在 HTML 中；列表和详情首次渲染均为 0 次浏览器端 Supabase REST 请求。
- `lint`、`typecheck`、`i18n:check`、`arch:check`、`ui:text-check`、58 个测试文件 / 266 项测试、开发构建、性能预算和 10 页 `verify:public-performance` 均通过。
- 已按用户授权安装项目 Playwright 版本所需 Chromium；没有新增依赖、修改锁文件、提交、部署或变更生产配置。

## 十、架构合规报告

- 改动层：公开页面响应序列化层、客户端博客摘要兼容映射、性能验收脚本和契约测试。
- API：保留 `flashcast-public-data` 现有顶层键与原始行命名；只缩小列表/首页行字段，直接详情仍提供完整目标记录。
- 数据：数据库表、RPC、RLS、CMS 发布结构和查询状态条件全部未修改。
- 缓存：Edge cache key、TTL、freshness、ETag、stale/miss/hit 行为未修改；新部署仍由 commit SHA 隔离缓存。
- SEO/国际化：保留中英文、SEO 摘要、canonical/hreflang 和 CMS 页面映射字段，并用双语 hydration 测试验证。
- 发布：本轮没有 commit、push、PR 或部署。
