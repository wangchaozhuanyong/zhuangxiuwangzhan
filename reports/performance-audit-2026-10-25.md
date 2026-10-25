# Flashcast 性能检查与修复记录

检查日期：2026-10-25（用户所在时区 Asia/Kuala_Lumpur）  
网站：https://flashcast.com.my  
仓库：https://github.com/wangchaozhuanyong/zhuangxiuwangzhan  
基线提交：`1a3a4647cb36aa59f5da572df00fc3c7c065cafd`  
修复分支：`codex/flashcast-performance-20261025`

## 结论与交付状态

已确认四项可以在保留现有布局和内容的前提下修复的问题，并完成对应代码及回归检查：首文档遗漏必要模块预加载、站内意图预取没有覆盖页面程序、普通延迟图片被自动提升为高优先级，以及桌面上隐藏的手机底栏仍执行遮挡检查。另修正性能预算脚本漏算静态依赖的问题。

这是一份待审查的性能修复，尚未合并或部署。真实首屏静态脚本预算仍超过原定的 180 KiB gzip，因此不能宣称全部性能问题已经解决，也不建议把本次 draft 直接作为性能验收完成。没有为通过检查而提高预算或取消既有加载保护。

当前线上检查与本地修复验证是两组证据：浏览器检查针对线上基线；代码回归和构建对比针对本次补丁。没有取得补丁部署后的马来西亚真机弱网数据，也没有给出加速百分比。

## 用户要求与修改范围

- 只处理加载、页面切换和资源调度性能。
- 保留现有布局、文字、图片、CSS、路由地址、品牌加载视觉和业务行为。
- 未更改数据库、CMS 内容、表单提交、权限、生产缓存时间或部署流程。
- 未提交真实咨询、发送 WhatsApp 消息或修改线上内容。

## 已修复问题

### P1：首屏必要模块需要逐层发现

原 `vite.config.ts` 在 HTML 入口的 `modulePreload.resolveDependencies` 中，只保留 vendor/runtime 等少量脚本，过滤了其他实际必需的静态依赖。基线构建的初始静态依赖有 43 个模块，HTML 却只暴露 3 个 JS 引用，其中仅 2 个 modulepreload。源码/构建分析发现最多 4 层依赖发现链。

修复后，HTML 恢复预加载完整的必要静态依赖。动态路由仍只预加载 CSS，保留现有 WebKit/Safari 的 JS 预加载规避策略。此修改改善下载发现顺序，不减少现有脚本总字节数。

涉及：`vite.config.ts`、`scripts/vite-module-preload.mjs`。

### P1：站内指向下一页时，只预取数据，没有预取页面程序

原 `PublicRoutePrefetch` 在 pointerover/focusin/pointerdown 时只预取业务数据。页面组件仍在实际导航渲染时才调用动态 import，首次进入未访问页面仍需等待页面代码及其依赖。

修复后，路由与预取共用 `publicPageModules` 的同一份动态加载函数，只预热用户明确指向的页面，并行准备代码、公共页面 CSS 和既有数据。28 个前台页面仍然是动态入口，没有启动时下载所有页面。

保护措施：

- 首次真实成功的 `public-route-ready` 之前，关闭可选预取，给首屏 CSS 和关键图片留出资源。
- 降级完成不视为成功就绪；组件晚挂载时可识别已有 ready DOM。
- 合并同一路径的在途请求，去重 1 秒内同一手势的重复事件。
- 忽略当前页、后台、外站、下载、新窗口以及同一链接内部移动。
- 浏览器报告 Save-Data、2G 或 slow-2G 时跳过可选预取。
- 不阻止正常点击，不等待预取完成才导航。
- 包装器不永久保存失败 Promise；原有导航错误恢复保持不变。

注意：单元测试能证明包装器失败后可再次调用，不能证明真实浏览器或 Vite 在 CSS/ESM 网络失败后一定重新请求相同 URL。

涉及：`src/lib/publicPageModules.ts`、`src/routes/publicRoutes.tsx`、`src/components/PublicRoutePrefetch.tsx`。

### P2：普通图片提前加载时，被误升为高优先级

原 `DeferredSmartImage` 在进入预加载距离后把 loading 改为 eager；`SmartImage` 又把未显式指定 fetchPriority 的 eager 图片默认设为 high。因此部分非首屏图片也会与真正关键图片竞争。

修复将“提前请求”与“提高优先级”分开：普通延迟图片进入预加载范围后仍立即请求，但保持 auto。显式 high/low/auto、显式 eager 与 critical 的原行为继续保留。图片 URL、节点身份、尺寸、样式、预加载距离和失败 UI 均未改动。

新增回归在原代码上出现两个确定失败，修复后通过：普通图片进入预加载范围、无 IntersectionObserver 的兜底路径均保持 auto。

涉及：`src/components/DeferredSmartImage.tsx`。

### P2：桌面隐藏的手机底栏仍监听和扫描页面

`.scheme-a-mobile-switcher` 仅在 `max-width: 767px` 时显示，但原 `MobileBottomDock` 在桌面也持续启用 `useFloatingOcclusion`，订阅整页 DOM 变化、滚动、尺寸、图片 load、焦点和动画事件，并安排遮挡检查。这些计算无法改变一个已经由 CSS 隐藏的底栏。

修复按原有媒体断点启停这一个底栏的遮挡检查：桌面不安装该组观察器和事件监听；切回手机宽度时重新读取实际遮挡；离开手机断点或卸载时取消已排队检查。共享 hook 的其他调用默认继续启用。底栏 DOM、CSS、断点、按钮、焦点和弹窗优先级规则保持不变。

这项修改移除了可证明不必要的工作，但没有取得线上 CPU 时间或掉帧率，不能宣称具体帧率提升。

涉及：`src/components/MobileBottomDock.tsx`、`src/hooks/useFloatingOcclusion.ts`。

### P1：原性能预算漏算静态依赖

原脚本仅统计 HTML 中显式引用的 JS，没有追踪其静态 import。在原预加载配置下，实际必需模块的大部分没有被计入预算。

现使用仓库已有 TypeScript AST 递归统计静态 import、side-effect import 和 re-export；循环/重复模块只计一次，不把动态 import 或普通字符串误当首屏依赖。缺失模块明确失败。不新增依赖，180 KiB 门槛保持原值。

原正则把轻量 `supabaseConfig` 配置模块误认为 SDK，本次仅精确排除此配置模块；真实 Supabase SDK 检查仍保留并有回归验证。

涉及：`scripts/verify-performance-budget.mjs`、`scripts/lib/performance-budget.mjs`。

## 同配置构建证据

采用仓库 Interaction standards 工作流中的 production fixture 配置：

```text
Node 22.23.4
vite build --mode production
VITE_SUPABASE_URL=https://interaction.invalid
VITE_SUPABASE_ANON_KEY=synthetic-ci-fixture
VITE_APP_VERSION=interaction-ci
```

以上值是工作流已有的合成测试配置。两次构建均未运行生产 prebuild、CMS/SEO 快照生成或部署，也未连接真实数据库。基线在独立 worktree 中构建；这不是已配置真实生产内容的正式发布构建。

| 指标 | 基线 | 修复后 |
| --- | ---: | ---: |
| 初始静态 JS 完整依赖 gzip | 351.7 KiB | 352.6 KiB |
| 精确 gzip 字节数 | 360122 | 361103 |
| 初始静态模块数 | 43 | 43 |
| HTML modulepreload 数 | 2 | 42 |
| HTML 中 JS 引用数 | 3 | 43 |
| 初始依赖图中的页面模块 | 0 | 0 |
| HTML gzip 字节数 | 6377 | 7078 |

新增调度、首屏保护和断点控制合计增加 981 字节 gzip，约 0.96 KiB。本次收益是加载发现顺序、资源优先级与减少隐藏组件计算，不能写成“首包变小”。

性能门禁结果：

| 对象 | 结果 |
| --- | --- |
| 基线 + 原门禁 | 只计 159.7 KiB / 3 个 HTML 引用，误报 PASS |
| 基线 + 修正门禁 | 351.7 KiB，超过 180 KiB，退出码 1 |
| 修复后 + 修正门禁 | 352.6 KiB，超过 180 KiB，退出码 1 |

这已在本地复现仓库 CI 的编译和预算步骤。首提交 `be2cb6d` 的远端 Interaction standards 也在此预算步骤失败，前面的完整交互质量检查和两种构建均通过；这不是新增功能测试失败。

### 布局和内容保持检查

- 5418 个非运行时代码静态产物逐文件 SHA-256 完全一致。
- 全部 5 个 CSS 文件的字节与 hash 完全一致。
- 去除 modulepreload 标签、归一化 entry 构建文件名后，HTML 字节完全一致。
- 全部 28 个前台页面仍为动态入口。
- `package.json` 与 `package-lock.json` 未改动。

这些证据证明样式和静态内容产物保持不变，不等同于补丁部署后的真实交互验收。

## 线上浏览器检查

使用已连接 Chrome，检查对象为线上基线。以下结果是抽样，不能替代全站全部路由或弱网测试。

| 场景 | 观察结果 |
| --- | --- |
| 英文首页、中文手机首页 | 可以打开，标题与关键图片正常显示 |
| 英文案例列表 | 可以打开；商业分类筛选得到 7 项 |
| 案例筛选后刷新 | URL 保留 `filter=Commercial`，筛选与 7 项结果保留 |
| 英文服务列表 | 页面与服务卡片正常显示 |
| 英文材料列表 → 地板分类 | 可以进入分类；抽样未发现已完成请求的破图 |
| 英文博客 → 手机视口 → 切换中文 | 保持对应博客路径，切换成功 |
| 手机完整目录 | 可打开、切换分类并进入联系页 |
| 中文联系页 | 表单与联系方式可见；没有提交真实咨询 |
| 浏览器后退、前进 | 博客与联系页之间 URL 和标题对应 |
| 响应式抽样 | 博客在 360/390/768/1024/1440 宽度设置下未发现横向溢出；联系页 390 宽度抽样正常 |
| 控制台 | 本次抽样未记录 error/warn |

立即切换时能观察到原有 loading/品牌等待随后正常呈现，这本身不是故障证据。没有据此虚构毫秒级页面耗时、长任务或掉帧率。

## HTTP 响应补充检查

线上 `/__flashcast/version` 与基线 SHA 一致。下列 GET 均返回 200：

| 页面 | TTFB | HTML 字节数 |
| --- | ---: | ---: |
| `/zh` Edge miss | 1.580 秒 | 85930 |
| `/zh` Edge hit | 0.689 秒 | 85930 |
| `/zh/services` | 1.022 秒 | 49005 |
| `/zh/projects` | 1.233 秒 | 96847 |
| `/zh/materials` | 1.431 秒 | 89070 |
| `/zh/blog` | 0.924 秒 | 113936 |

这些请求经 Cloudflare DFW 节点，不能作为马来西亚客户的速度成绩。TTFB 也不是完整页面加载时间。未验证连接浏览器的网络出口位置。

## 测试结果与未验证项

已通过：

- 常规 TypeScript、严格核心类型检查、全仓库 ESLint、架构检查。
- 交互标准静态检查：98 条登记路由；该检查不是全站浏览器验收。
- 联合回归：15 个测试文件、271 项通过。
- 最后追加的首屏预取保护：组件 10 项测试、全项目类型检查与局部 lint 通过（与联合回归部分重叠，不累计为独立测试总数）。
- 隐藏手机底栏优化：`MobileBottomDock`、`useFloatingOcclusion`、`FurnitureFloatingLink` 三文件 138 项回归、全应用及严格核心类型检查、局部 lint 及架构检查通过；与此前联合测试存在重叠，不累计独立总数。新增测试曾在远端严格索引检查中失败，已通过显式检查帧记录和回调是否存在修复，并重新通过严格检查及 138 项回归，未改动生产代码或构建数据。
- 构建/预算工具：5 项 Node 回归通过。
- 最终 production fixture 编译、静态产物一致性比较和 diff 格式检查通过。

明确未通过：修正后的 `verify:performance-budget`，真实脚本量超过原定 180 KiB。

首提交 `be2cb6d` 的 GitHub Actions 结果：

| 工作流 | 结果 |
| --- | --- |
| [Furniture page PR checks](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/actions/runs/40209415996) | 通过 |
| [R3 managed CMS PR checks](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/actions/runs/40209416053) | 通过，包括严格发布构建与产物校验；没有部署 |
| [Interaction standards](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/actions/runs/40209416014) | 完整交互质量检查、development/production 构建通过，最终性能预算失败 |

上述远端运行针对首提交。随后补充的底栏优化有上述本地回归和最终构建证据；其远端状态以 PR 最新提交的 Checks 为准。

明确未验证：

- `npm run verify:public-performance`。该脚本启动独立 Playwright；本次 Browser 技能要求只使用连接浏览器，不能另启独立浏览器绕过，因此用实际点测覆盖可做部分并记录缺口。
- 补丁部署后 LCP/INP/CLS、弱网长任务、连续导航逐帧画面、iOS Safari 真机与马来西亚网络验收。
- 本地没有运行生产 prebuild；远端首提交的 R3 工作流已执行严格构建。后台登录、数据库写入、表单成功提交及所有 98 条路由的全量浏览器验收仍未进行。

## 尚待解决的性能来源

1. **首包仍偏重。** 公共页脚从通用内容 hook 引入 CTA，间接带入所有内容 mapper 和语言回退字典。`malayContent` 构建 chunk 约 107.5 KiB gzip，`displayLabels` 约 22.6 KiB gzip；英文和中文入口也在此静态链中。
2. **仅拆页脚不能代表首页减重。** 首页 Index 本身还使用同套内容 hook。只把依赖挪到懒加载入口可能使统计好看，却增加首屏后续等待；需要同时量化公共入口与各首路由完整依赖。
3. **材料详情串行读取。** 当前先读材料目录，再按条件读目标条目及图库。是否需要详情，要等目录中的匹配项与 gallery 状态才能确定；直接并行会在原本不需要的分支增加请求，简单 `Promise.all` 还会改变错误处理，因此本轮保留原语义。另发现 `MaterialDetail` 从返回的 `category.items` 选材料，没有消费单独合并详情后的 `published.material`，部分额外读取可能未用于展示。改用完整对象可能改变正文和图库，超出本轮不改内容的约束，仅记录问题。
4. **博客列表载荷偏大。** 当前列表读取完整记录，并参与详情预取；精简正文前需保持阅读时间、相关文章和详情缓存的准确性。

这些是下一阶段明确的性能工作，不是要求更换设计或页面内容。没有在缺乏真实长任务证据时，把 MutationObserver、动画或路由门整体重写当成已证实解决方案。

## 后续验收与回滚

保持此变更为 draft。下一步应在相同布局/内容下安全拆分语言与内容依赖，修复真实预算超标，再在可用预览环境检查首次进入、刷新、缓存返回、连续导航、慢资源和恢复路径。真实页面数据、CSS、图片候选与解码状态仍按现有规则验收。

本次没有数据库迁移、内容更新、权限变更或线上缓存操作；如需回退，整体撤销本 PR 的性能提交即可。不得把静态检查通过当成可以跳过性能验收的理由。

## Architecture Compliance Report

1. Target module：system 公共运行支持、media 图片展示。
2. Target layer：前端公共组件及 hooks、lib 加载封装、routes 绑定、工程构建/验证脚本。
3. Edited files：上述性能实现、对应回归测试及本报告。
4. Forbidden files touched：no；未改页面 JSX 布局、CSS、内容、素材、数据库或权限。
5. API paths changed：no。
6. Database access changed：no。
7. Cross-module dependency introduced：no。
8. Business behavior changed：no；仅可选资源请求时机/优先级和工程计量改变。
9. arch:check result：pass，保留仓库已有架构债务提示。
10. Remaining architecture risk：公共入口仍耦合大内容/语言依赖；真实首屏预算及部署后性能尚未验收通过。

## 核查依据

- [基线构建配置](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/blob/1a3a4647cb36aa59f5da572df00fc3c7c065cafd/vite.config.ts)
- [基线性能预算脚本](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/blob/1a3a4647cb36aa59f5da572df00fc3c7c065cafd/scripts/verify-performance-budget.mjs)
- [基线路由预取](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/blob/1a3a4647cb36aa59f5da572df00fc3c7c065cafd/src/components/PublicRoutePrefetch.tsx)
- [基线图片预加载组件](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/blob/1a3a4647cb36aa59f5da572df00fc3c7c065cafd/src/components/DeferredSmartImage.tsx)
- [CI 编译与预算入口](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/blob/1a3a4647cb36aa59f5da572df00fc3c7c065cafd/.github/workflows/interaction-standards-ci.yml)
- [Vite modulePreload 官方说明](https://vite.dev/config/build-options#build-modulepreload)
- [React lazy 官方说明](https://react.dev/reference/react/lazy)
