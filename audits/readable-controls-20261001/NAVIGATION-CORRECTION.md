> 历史方案：本文的顶部渐变和固定浅色字已按用户要求撤回。最终实现为纯透明背景与自动字色，详见 [ADAPTIVE-CONTRAST.md](ADAPTIVE-CONTRAST.md)。下文及旧截图仅保留为阶段记录。

# 透明叠图导航更正

状态：代码完成、本地验证完成；未提交、未推送、未合并、未部署。

用户要求恢复原来的导航叠图设计，只解决背景造成的文字不清。前轮将首屏导航改为独立暖白背景，超出了用户认可的视觉范围，本轮撤回该导航背景。

## 最终行为

- 图片仍从页面顶部开始，导航覆盖图片；实测首屏 `heroTop=0`、透明背景、无导航占位元素。
- 导航使用已有媒体前景色及渐变颜色变量。顶部渐变在文字区域保持足够覆盖，然后向图片自然淡出；字、品牌图标、下划线和键盘焦点在叠图状态采用浅色。
- 原有定位、桌面 76px / 手机 56px 高度、菜单布局和滚动状态保留。滚动后继续使用原有浅底深字，回到顶部恢复透明叠图；前景和背景同步切换，避免切换过程中短暂低对比。
- 本轮只修改两个共享导航样式文件。前轮按钮皮肤及联系布局改动保留。

## Architecture Decision

1. Target module: 现有公共页面布局与皮肤。
2. Why this module: 导航由公共布局统一渲染。
3. Target layer: 展示层 CSS。
4. Why this layer: 问题涉及导航前景与图片背景的可读性。
5. Files allowed to edit: `src/styles/components/scheme-a-shell.css`、`src/styles/components/public-warm-stone.css`；项目内本次验收记录。
6. Files forbidden to edit: 后台、API、数据库、导航交互逻辑、主工作区已有修改。
7. API paths affected: 无。
8. Database access location: 无访问。
9. Cross-module dependency risk: 无新增依赖。
10. Business behavior impact: 原有导航、菜单、语言切换及滚动行为保留。

## 实际检查

- `npm run lint`、`npm run typecheck`：退出码 0；记录 `navigation-lint.log`、`navigation-typecheck.log`。
- `npm test -- src/styles/publicDesignBoundary.test.ts src/lib/colorContrast.test.ts src/components/LanguageRouteLink.test.tsx`：3 个文件、63 项测试通过，记录 `navigation-tests.log`。
- 最后 CSS 切换调整后，`npm test -- src/styles/publicDesignBoundary.test.ts`：57 项通过，记录 `navigation-final-tests.log`。
- `npm run build:dev`：退出码 0，记录 `navigation-build.log`；存在既有大分块与插件耗时提示。
- `git diff --check`：通过。
- CUA 浏览器检查：首页、室内设计、表面修复的中英文版本，1440 / 390 宽度，共 12 组；均透明叠图、图片顶部为 0、无占位、无横向溢出。原始记录 `navigation-overlay.json`。
- 对浏览器实际计算出的文字和渐变颜色进行透明合成计算：导航文字区域在纯白、纯黑两种极端图片底色下，最低对比度 7.3626:1；12 组全部通过。此值是颜色计算结果，非图片逐像素采样。记录 `navigation-contrast.json`。
- 手机滚动后为浅底深字，返回顶部恢复透明浅字；目录打开和 Esc 关闭正常。记录 `navigation-states.json`，`menuClosed=false` 表示触发器的 `aria-expanded` 为 false。

截图：`navigation-overlay-desktop.png`、`navigation-overlay-mobile.png`、`navigation-overlay-full.png`。

## Architecture Compliance Report

1. Target module: 公共页面布局与皮肤。
2. Target layer: 展示层 CSS。
3. Edited files: `src/styles/components/scheme-a-shell.css`、`src/styles/components/public-warm-stone.css`；本次项目内验收记录。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no。
7. Cross-module dependency introduced: no。
8. Business behavior changed: no。
9. arch:check result: 未运行，本轮只更正公共导航 CSS，没有修改架构文档、模块、脚本或后端。
10. Remaining architecture risk: 无新增架构风险；仍需未来发布后的线上浏览器验收。

验证边界：未运行完整生产 prebuild 或完整 E2E 套件。本轮仅本地候选验证，没有 Cloudflare preview 发布，因此未运行需要该 URL 的 `npm run verify:public-performance`。沿用现有 Node 24.19.0 环境，未安装或升级依赖。线上网站尚未应用本轮修改。
