# 2026-10-02 本窗口视觉改动统一发布清单

用户授权：汇总本窗口所有已完成、待发布的改动，合并 main，统一部署并验证上线。
发布前 main 与线上版本：`c3413b6577dacf10bd2d6d1406b0d671e8635ccc`。
隔离集成目录：本项目 `.worktrees/window-visual-release-20261002`。
源码快照和摘要：本项目 `backups/window-visual-release-20261002/`。
最终检查、PR、部署和线上验收回执：本项目 `audits/window-visual-release-20261002/`。

## 本次纳入的全部待发布交付

| 交付 | 最终行为 | 修改文件 |
| --- | --- | --- |
| 手机商品图贴边 | 保持完整图片的正方形区域，分隔线不挤占图片尺寸，消除上下间隙 | furniture-showcase.css |
| 列表图片圆角 | 图片使用外层卡片统一裁切，消除两个上角露出的白边 | public-warm-stone.css |
| 桌面分栏首屏轮廓 | 左侧介绍增加边框与浅色卡片底，与右侧图片和下方模块协调 | scheme-a-route-hero-v5.css |
| 全屏图片上的导航字色 | 首页、室内设计、家具／表面维修按每个导航项背后的局部图片区域选择黑白；滚动和菜单状态恢复常规字色 | SchemeAPublicChrome.tsx、public-warm-stone.css |
| 家具商城浮动入口 | 去掉缩略图；电脑248×84、平板212×64、手机148×48；悬停、按压、焦点、触摸反馈，保留新窗口直接打开商城；页脚避让 | FurnitureFloatingLink.tsx、buttons.css、public-warm-stone.css |

这是5组交付、6个源码文件。采用本窗口最后确认的实色商城按钮；旧方形图片方案及其截图保留为历史证据。所有源码文件与发布前本窗口的已验证候选逐文件摘要一致。

基线中已经上线的全屏原图和透明导航等能力保留。本次不重放历史发布，不纳入其他窗口工作区中的候选、CMS 草案或数据变更，不改依赖锁、登录权限、支付、数据库、密钥、托管设置或 DNS。

## 验证和发布路径

保留本窗口四轮本地视觉验收记录：图片贴边与圆角、桌面首屏轮廓、导航对比度、家具商城浮动入口。合并前在隔离候选执行相关类型、lint、架构、语言、界面字段、单元测试和发布控制检查，并由同一 PR Head 的现有 CI 执行构建检查。

生产构建与部署仅使用 `.github/workflows/cloudflare-pages-deploy.yml`。main 合并触发该受管工作流；同一 SHA 若已有运行，则检查和续验原运行，不再次派发。上线后独立核对线上版本与合并提交，执行中英文、电脑和手机实际页面、导航状态、商城入口和图片边缘验收。

本清单记录发布范围和执行规则，不提前声称合并或上线完成。实际结论以验收目录和本窗口最终回执为准。

## Architecture Compliance Report

1. Target module: 公共导航、商品展示、首屏布局、商城浮动入口。
2. Target layer: frontend component/styles/release documentation。
3. Edited files: 上表6个源码文件与本文。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no。
7. Cross-module dependency introduced: no，复用已有公共 lib、图标、文案和商城地址。
8. Business behavior changed: no，保留业务接口和商城目的地，仅更新界面及交互反馈。
9. arch:check result: PASS；Node 22下的类型、完整lint、i18n、界面字段检查通过，118项相关单元测试和6项发布控制测试通过。
10. Remaining architecture risk: 无新增依赖、后端或数据风险；图片无法读取像素时保留稳定字色并增加描边。
