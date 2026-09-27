# 维修首屏图片清晰度修复

手机 500 × 1170 首屏使用 `object-fit: cover`，把横图撑满约 1102px 高的区域。原有 `sizes="100vw"` 使浏览器仅选择 w560 缩略图（约 315px 高），垂直放大约 3.5 倍，明显发糊；原图 1672 × 941，无 CSS 模糊滤镜。

只调整维修首屏的 responsive sizes：同时考虑屏幕宽度、满屏高度和首屏最小高度，仍使用现有原图与响应式版本。图片、布局、文案、CMS 保存内容均不变，没有新增图片请求或素材。

## 验证

- 默认本地 preview 的旧构建复现旧问题：4 项手机场景失败、2 项桌面场景通过；失败上下文保留于 `hero-quality-baseline/`。该运行针对旧构建，随后明确切换到当前源码 Vite 地址。
- 当前源码本地 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8941 npm run test:e2e -- e2e/surface-repair-hero-quality.spec.ts --project=chromium`：6/6 通过，中英文 390×844、500×1170、1440×900。
- 浏览器实际确认长屏加载原图，且无滤镜；视觉截图 `hero-quality-local-500.png`。
- lint、typecheck、arch:check 通过；维修咨询交互 Vitest 5/5 通过；git diff --check 通过。
- 正式部署和生产核验另存本地机器可读回执。

## 原工作区及待发布范围

远端 main 与先前生产版本均为 `7ab6e30dfe3231de933d38df9c06ec8abba92eb5`，此前完成改动已上线。重新清点 51 个工作区，发现新增 GEO 源绑定和施工流程文案两个未提交开发工作区；未发现对应完成/验收交付或开放 PR，保持其原有修改。本次只归并明确完成的图片清晰度修正。

## Architecture Compliance Report

1. Target module: services。
2. Target layer: 前端展示与浏览器回归测试。
3. Edited files: SurfaceRepairContent.tsx、surface-repair-hero-quality.spec.ts、本发布记录。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no。
7. Cross-module dependency introduced: no。
8. Business behavior changed: no，首屏图片选择修复。
9. arch:check result: passed。
10. Remaining architecture risk: 图片解析度上限仍为原图 1672×941，不通过放大文件尺寸伪造更高分辨率。
