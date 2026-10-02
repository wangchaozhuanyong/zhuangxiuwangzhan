# 2026-10-02 网站改动统一发布清单

用户授权：完成剩余修改，汇总本项目已完成待发布改动，合并 main，统一部署并验证上线。
基线与发布前线上版本：`fbf89f343016530296eee7e24c32f7ef4d760ac5`。
隔离集成目录：本项目 `.worktrees/unified-release-20261002`。
原工作区六文件补丁和本轮证据：本项目 `backups/unified-release-20261002/`。

## 纳入范围

| 交付 | 原候选 |
| --- | --- |
| 后台与公开访问的统计隔离、浏览器返回恢复 | `706ac4674c58c95dcf7c5bd9d065a3c11314bd38` |
| 博客分类补齐已发布指南内链，保留原三篇 | `6b1da5b901b84ccbb8a9da2ebbb22b31f772685d` |
| 联系表单地区与量房范围说明 | `433c10e8b9346635ea386b842538a5bfee622241` |
| 材料正文安全富文本、摘要与 SEO 元数据 | `7e39872e74b6f8240f6679ea12fc7b5571ad3fd0` |
| 家具详情、共享导航和手机栏的 WhatsApp 商品上下文 | `0d1b05d220aa2f28e98272abd88a2ad6fd7d409e` |
| 四个案例的十四个中文范围标签 | `8ae71d41d1f91be9ce11158314ca1d978425d7b7` |
| 衣柜／收纳柜分类双语描述与中文初始兜底 | `ca54948039bc2151b86c7010ace0f627e77c855e` |
| 旧屋两段规划正文与第五条 FAQ | `c42fe765d4055c83b3bd1296fa1a5ded02304fad`、`d0dd7bb759547bc4c8487ac336a83faa6e84fd7b` |
| 四条审核路由的无 JS 正文和咨询链接 | `4e2554471205b355b405228f25678c90ccb4251e` 的三个 SEO 文件 |
| 首页／设计／维修原图与透明顶部、字面可读性 | 本窗口六文件补丁内的三个 CSS；只在服务文字上补对比 |
| 用户选定第四款家具橱窗方形入口 | 全部公开页面共用组件；直接打开 `https://shop.flashcast.com.my/`；桌面 80px、手机 72px |

旧候选的按钮外形与页面特例服从本次用户选定 D 款，不带入长条、缩放入底栏或家具页单独外形。
家具列表 V3 的标题／商城 CTA 和 ORG027/028 博客素材已在 main 中，保留较新的无障碍及返回滚动实现。其他旧 parity、备份和归档分支保留，不重复合并。
未保存 Shop／儿童房 CMS 候选仍属内容草案，不属于已完成代码交付；本轮没有 CMS 保存、迁移或数据发布。

## 实际验证与发布记录

整合代码已通过 Node 22.20.0 下的类型、Lint、架构、i18n、技术字段检查，15 文件 197 项相关单元测试，以及 6 项发布控制测试。
中断前全量测试未跑完；其中一项 CMS CLI 测试独立续验通过，没有以全量通过名义报告。
首批 30 组本地页面检查通过；脚本旧屋路径纠正后续验 50 组通过。
正式生产构建、最终页面验收、PR 同提交 CI、合并、部署和线上验收结果保存到上述证据目录；本清单不预先声称上线完成。
不改依赖锁、数据库、登录权限、CSP、托管设置或 DNS。当前线上版本为回滚基线；只沿现有 GitHub Actions / Cloudflare Pages 受管入口发布。

## Architecture Compliance Report

1. Target module: home / services / blog / materials / company / seo / system
2. Target layer: frontend component, i18n, style, existing public SEO adapter
3. Edited files: 此次 main diff 所列源码与本文；完整列表见证据目录 inventory.json 与 final-diff.txt
4. Forbidden files touched: no
5. API paths changed: no
6. Database access changed: no new database operation; existing published reads retained
7. Cross-module dependency introduced: no internal backend module import
8. Business behavior changed: yes, public links/copy/rendering and admin analytics isolation as listed
9. arch:check result: PASS, 16 modules
10. Remaining architecture risk: no new dependency or migration; actual deployment/browser results recorded separately
