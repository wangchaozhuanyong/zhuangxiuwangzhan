# 前台可读性、皮肤按钮与联系布局验收

状态：代码完成、本地验证完成。未提交、未推送、未合并、未部署。

最终方案以 [ADAPTIVE-CONTRAST.md](ADAPTIVE-CONTRAST.md) 和 `adaptive-*.png/json` 为准。该报告包含完整文件清单、实现说明、检查命令、架构决策与架构合规十项记录。

项目：FLASH CAST。候选工作区：`/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main/.worktrees/public-readable-controls-20261001`。
分支：`fix/public-readable-controls-20261001`；基线：`a1e450591833f4cc67af00675abfcc9d8daff256`。
主工作区已有修改未覆盖。预览：<http://127.0.0.1:4186/zh/services/design>。

## 完成内容

1. 恢复原有纯透明叠图导航，图片从顶部开始；撤回独立导航底色、顶部渐变和文字阅读底板。
2. 统一前台文字自适应：根据实际局部背景调整深浅，合格皮肤字色优先保留；复杂图片或无法取色时使用细字形轮廓。
3. 修复检测点在隐藏预览或尺寸变化时错误切换导航底色的问题，原有滚动检测边界与菜单行为保留。
4. 主按钮、次按钮、语言选中项通过已有皮肤变量成对映射前景和背景；主按钮及当前语言项为森林绿底暖白字。
5. 联系页与页脚共用 PublicContactRow：图标、信息、操作同行，整行点击。窄容器保留箭头和无障碍操作名称；营业时间是说明，联系我们独立呈现。
6. 联系页 WhatsApp 为主入口；报价、留言入口在联系组底部并排。保留原有地图选择弹窗及联系目的地。

## 最终实际验证

- 5 个测试文件、115 项测试通过：`adaptive-tests.log`。
- TypeScript、Lint、开发构建及 `git diff --check` 通过：`adaptive-typecheck.log`、`adaptive-lint.log`、`adaptive-build.log`。
- 最终浏览器实际宽度 360、390、768、1024、1440；首页、设计、修复服务中英文共 30 组，通过透明叠图、无阅读底板、无溢出检查：`adaptive-page-matrix.json`。
- 同一文字在深浅背景及图片上真实切换，复杂图片及无法取色保护通过：`adaptive-fixture.json`。
- 中英文联系页 × 390/1440，4 组布局及皮肤色回归通过：`adaptive-contact-regression.json`。
- 顶部跨尺寸切换、菜单/Esc/焦点恢复、语言切换、实际滚动与返回顶部通过：`adaptive-top-resize.json`、`adaptive-interactions.json`。
- 原始证据断言通过：`node audits/readable-controls-20261001/verify-adaptive-evidence.mjs`，`adaptive-evidence-check.log`。

验收使用页面实际 `innerWidth` 核对目标宽度。验收工具最初把尺寸设置到了其他标签页，当时记录已废弃；以上最终记录全部重新验证。

## 最终截图

- `adaptive-transparent-desktop.png`、`adaptive-transparent-mobile.png`：纯透明导航。
- `adaptive-design-desktop.png`、`adaptive-design-mobile.png`：代表页面完整首屏。
- `adaptive-contact-mobile.png`：手机联系页共享操作行。
- `adaptive-fixture-image.png`：深浅、混合背景和不可采样背景案例。

## 历史记录

旧 `NAVIGATION-CORRECTION.md` 中的渐变方案已经撤回；`navigation-overlay-*.png`、旧首页/设计/修复截图，以及旧阅读底板的 166 色样本均不代表最终实现。旧日志与旧 JSON 保留作为阶段历史，不用于声明当前文字对比度或最终响应式效果。

## 验证边界

最终是本地候选验证；未推送或部署。未运行完整 E2E、完整生产 prebuild、Cloudflare 公共性能门禁或线上验收。实际图片只做局部采样，复杂图采用细轮廓，不声明任意图片逐像素或全站全部页面均通过 WCAG。生产采样耗时和匿名取色额外请求尚未测量。
沿用现有 Node 24.19.0，仓库 engines 为 20–22；没有升级依赖或构建配置，既有构建大分块提示仍存在。
