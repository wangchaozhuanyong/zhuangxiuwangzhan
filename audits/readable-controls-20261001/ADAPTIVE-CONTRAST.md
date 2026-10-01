# 纯透明导航与前台文字自适应

状态：代码完成、本地验证完成。未提交、未推送、未合并、未部署。

项目：FLASH CAST；真实 Git 根目录 `/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`。
候选工作区：`/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main/.worktrees/public-readable-controls-20261001`。
分支：`fix/public-readable-controls-20261001`；基线 HEAD：`a1e450591833f4cc67af00675abfcc9d8daff256`。
技术栈：Vite 8、React 18、TypeScript 5.8、Tailwind 3；包管理器 npm。
本次代码与验收产物均属于该工作区；主工作区已有修改未覆盖。

## 最终行为

- 首屏导航继续叠在图片上，背景纯透明；移除前轮独立底色、导航渐变及文字阅读底板。照片保持原亮度。
- 公共前台外壳只安装一个自适应控制器，自动识别可见文字。首页、服务页、联系页、页脚及以后新增的同类前台文字共用该机制，不按页面增加颜色特例。
- 优先保留已达采样对比要求的皮肤字色；不够清楚时自动选择深字或浅字。明暗同时出现、或者背景无法可靠读取时，增加约 1px 的反色字形边缘，不给导航或文字容器增加底色。
- 当前皮肤主按钮和语言选中项保持森林绿底、暖白字；共享联系行的图标、信息、操作沿用前轮统一布局。
- 原有导航定位、桌面 76px / 手机 56px 高度、菜单和语言切换保留。滚动后的原有实体导航状态保留，回到顶部恢复透明。
- 修复导航检测点在隐藏预览、路由加载或尺寸变化时误报不相交的问题：根据检测点实际位置和真实滚动位置判断，沿用原有检测边界，避免顶部误出现底色。

## 共享实现

`App.tsx` 的公共外壳通过 `useAdaptiveContrast` 安装 `observeAdaptiveContrast`，后台不安装。控制器在文字各行的局部区域取样，按采样点中最弱的对比度做判断，不以整张图片的平均亮度替代文字所在位置。图片坐标根据实际裁切、`object-fit`、`object-position` 和响应式尺寸计算。

文字与背景采用透明合成和相对亮度计算。可靠采样时以普通文字 4.5:1 为选择目标；合格的皮肤颜色优先保留，并设置小幅切换容差。字色即时更新，背景、透明度、位移动效保留原定时，避免把文字的过渡中间色误当成皮肤目标色。

对图片像素按最长边 512px 缓存，最多缓存 12 张；只处理视口中可见文字。内容、图片、皮肤、交互状态、字体、滚动和尺寸变化触发更新，节流上限为每秒 10 次，后台停止处理，卸载时清理监听与自有变量。运行时 CSS 变量仅承载计算结果，没有新增皮肤调色板或业务配置。

跨域图片读取像素受浏览器权限限制。控制器不会改展示图片的 URL、原有加载属性或图片请求业务链；必要时最多尝试一次匿名、无 referrer、低优先级的 CORS 读取，失败使用字形边缘保护，不重复请求失败图片。复杂 CSS 背景、不可采样媒体或滤镜图片不填造对比度数据。

可见普通文字自动接入；隐藏文字、辅助朗读文字、SVG 内部、禁用控件和已有实体底色表单输入保留自身规则。Logo 与少量含图标的导航入口使用共享标记协同调整。强制颜色模式及打印使用原生回退。

明暗杂乱图片可能无法由同一种文字颜色在每个位置都达到对比要求，采用文字轮廓辅助阅读。依据：[W3C G18 对比及 halo 方法](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)、[MDN 跨域图片与 Canvas 限制](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)。本次验收不代表任意图片逐像素均达到 WCAG，也不是全站所有页面的无障碍认证。

## 修改文件

| 文件 | 作用 |
| --- | --- |
| `src/App.tsx` | 公共外壳统一接入 |
| `src/hooks/useAdaptiveContrast.ts` | 生命周期安装与清理 |
| `src/lib/adaptiveContrast.ts` | 局部背景读取、缓存、自动字色、变化监听 |
| `src/lib/colorContrast.ts` | 颜色解析、透明合成、亮度、选色与图片坐标映射 |
| `src/components/scheme-a/SchemeAPublicChrome.tsx` | Logo/导航共享标记、顶部状态修复、共享页脚联系行 |
| `src/styles/components/public-warm-stone.css` | 全局字形规则与皮肤按钮映射，移除阅读底板 |
| `src/styles/components/scheme-a-shell.css` | 恢复首屏纯透明、保留原导航布局、页脚联系排版 |
| `src/styles/components/scheme-a-home-hero.css`、`src/styles/design-service.css` | 撤除旧媒体覆盖及文字底板样式 |
| `src/components/PublicContactRow.tsx`、`src/styles/components/public-contact.css` | 联系页/页脚统一信息操作行 |
| `src/pages/Contact.tsx`、`src/styles/components/scheme-a-native-pages.css` | 联系入口层级和底部次按钮布局，移除旧联系覆盖 |
| `src/styles/components.css` | 同步加载共享联系样式 |
| `src/components/ui/button.tsx`、`src/components/ui/dialog.tsx` | 共享控件用途标记 |
| `src/lib/adaptiveContrast.test.ts`、`src/lib/colorContrast.test.ts`、`src/components/PublicContactRow.test.tsx` | 自适应行为、背景变化、跨域回退、清理及共享联系行测试 |
| `e2e/scheme-a-fidelity.spec.ts` | 联系布局回归断言更新；本次未执行完整套件 |
| `audits/readable-controls-20261001/` | 验收夹具、截图、原始记录、报告；不接入生产路由 |

## 实际检查

全部命令在候选工作区执行，以下退出码均为 0：

- `npm test -- src/lib/adaptiveContrast.test.ts src/lib/colorContrast.test.ts src/styles/publicDesignBoundary.test.ts src/components/PublicContactRow.test.tsx src/components/LanguageRouteLink.test.tsx`：5 文件，115 测试通过，`adaptive-tests.log`。
- `npm run typecheck`：通过，`adaptive-typecheck.log`。
- `npm run lint`：通过，`adaptive-lint.log`。
- `npm run build:dev`：通过，`adaptive-build.log`；既有大分块/插件耗时提示仍存在。
- `git diff --check`：通过。
- `node audits/readable-controls-20261001/verify-adaptive-evidence.mjs`：浏览器原始记录断言全部通过，`adaptive-evidence-check.log`。

真实浏览器通过 CUA 验证：

1. 首页、设计、修复服务的中英文版本 × 360、390、768、1024、1440 五种**实际页面宽度**，共 30 组；纯透明导航、图片顶部为 0、无导航占位、无文字底板、无横向溢出。正常纯色模式的可见文字采样对比度均至少 4.5:1，复杂背景进入 outline 模式。记录：`adaptive-page-matrix.json`。
2. 同一组三段文字在图片、纯黑、纯白背景之间通过真实按钮切换，颜色自动改变；文字自身背景仍透明。纯色代表样本对比度为 13.842 / 21.000 / 5.317；混合图使用轮廓，无法取色时无虚构 ratio。记录：`adaptive-fixture.json`。其中动态切换在 390 宽度完成，全部回退案例在 1440 宽度检查。
3. 联系页中英文 × 390、1440，4 组；无横向溢出，共享联系行为 grid、最小 64px 高，主按钮与语言选中项稳定保持森林绿底暖白字。记录：`adaptive-contact-regression.json`。
4. 顶部切换 1440、390、1024、360 尺寸，始终透明。记录：`adaptive-top-resize.json`。
5. 手机菜单打开、Esc 关闭、焦点返回触发器；实际语言切换至英文设计页；真实滚动后实体导航，回到顶部透明。记录：`adaptive-interactions.json`。

验收过程中发现尺寸被应用到另一个标签页，已废弃当时的宽度记录并按 `innerWidth === expectedWidth` 重新完成最终 30 组验收。这里列出的 JSON 为修正后的有效记录。前轮暖白导航、渐变及阅读底板截图、166 色样本均属历史，不作为最终效果证据。

截图：`adaptive-transparent-desktop.png`、`adaptive-transparent-mobile.png`、`adaptive-design-desktop.png`、`adaptive-design-mobile.png`、`adaptive-contact-mobile.png`、`adaptive-fixture-image.png`。

## Architecture Decision

1. Target module: 公共前台展示、公共布局和现有皮肤。
2. Why this module: 可读性与联系布局由公共页面共同使用，需要在共同入口解决。
3. Target layer: React 展示层、前端 hooks/lib、CSS。
4. Why this layer: 问题来自前景与渲染背景，不涉及业务数据规则。
5. Files allowed to edit: 上述前台外壳、共享组件、颜色工具、样式、对应测试与项目内验收记录。
6. Files forbidden to edit: 后台、API、数据库、部署配置、主工作区已有无关修改。
7. API paths affected: 无。
8. Database access location: 无新增或改变的数据库访问。
9. Cross-module dependency risk: 无新依赖；控制器只挂公共前台，复用既有按钮、联系配置及链接封装。
10. Business behavior impact: 业务目的地、菜单、语言切换和联系流程保留，仅展示一致性与检测状态修复。

## Architecture Compliance Report

1. Target module: 公共前台展示、公共布局和现有皮肤。
2. Target layer: React 展示层、前端 hooks/lib、CSS。
3. Edited files: 上述“修改文件”清单，均位于候选工作区。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no。
7. Cross-module dependency introduced: no。
8. Business behavior changed: no；联系、导航、语言及目的地保持原有业务含义。
9. arch:check result: 未运行；未修改架构文档、业务模块、后台或项目脚本，展示层边界由既有 publicDesignBoundary 测试验证。
10. Remaining architecture risk: 无新增业务模块或依赖风险；运行时采样的生产性能尚未测量，需要后续获授权发布的 preview/线上验收。

## 验证边界

- 未运行完整 E2E、完整生产 prebuild 或线上验收。SEO 内容、路由和元数据生成逻辑未改；语言切换与响应式实测通过。没有新增多语言文案，未运行 `i18n:check`。
- 未运行 `npm run verify:public-performance`：该门禁需要 Cloudflare preview 或线上 URL，本次未授权推送/部署，不能拿旧线上版本替代当前候选性能结果。
- 图片业务加载路径保持原样，但跨域取色可能产生一次低优先级匿名读取；生产额外网络与采样耗时尚未测量。
- 沿用现有 Node 24.19.0；仓库 engines 指定 20–22。没有安装、升级依赖或修改构建配置。
- 当前线上网站尚未应用本次候选修改。
