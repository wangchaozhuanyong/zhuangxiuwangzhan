# FLASH CAST 发布流程整改

状态：代码、本地验证完成；未提交、推送、创建 PR、合并或部署。

基线：origin/main `f1d74bdad3cd2f941b6b49bf8d6db1662c0c36d4`。分支：`fix/release-dedup-20260913`。

实际浪费：运行 34139506883 对只改 3 个文档的 0b855f68 仍构建部署 7 分 20 秒；原本地 npm 入口还会独立构建并部署。

修复：本地入口统一派发 GitHub workflow；比较线上到目标 main 的完整差异，文档/测试/流程修改跳过构建，未知源码或构建输入保留部署。读取不到线上版本时提前停止；派发绑定预期 main。重复 SHA 定位原运行，失败恢复原运行，正在发布的任务不被后续提交打断。

构建缓存只供同一次运行重试：校验源码 SHA、Node/构建环境摘要及全部文件摘要，同时保留 Functions 生成的 SEO manifest。不同运行不复用旧 CMS 快照。发布后确认线上版本，不将版本相符当作全业务/浏览器验收。

修改文件：`.github/workflows/cloudflare-pages-deploy.yml`、`scripts/deploy-cloudflare-pages.mjs`、`scripts/pages-release.mjs`、`scripts/pages-release.test.mjs`、`.gitignore`、`AGENTS.md`、本文。

验证：流程测试 6/6；`npm run arch:check`；MJS 语法检查及项目 ESLint；工作流 YAML、依赖、8 个 shell 步骤语法、缓存/部署顺序契约；diff 检查均通过。项目 ESLint 对 MJS 规则有限，功能证据以 Node 测试为准。本地 Node 24.19.0，工作流保持 Node 22。未启动应用构建、全套测试、浏览器验收或生产发布。

只读线上版本为 `f1d74bdad3cd2f941b6b49bf8d6db1662c0c36d4`，与当前 main 相同，未部署文件数 0，无需再次部署。这不代表本地修复已经生效。

## Architecture Compliance Report

1. Target module: system
2. Target layer: scripts / GitHub workflows
3. Edited files: 发布工作流、入口、控制脚本及测试、忽略配置、规则、本文
4. Forbidden files touched: no
5. API paths changed: no
6. Database access changed: no
7. Cross-module dependency introduced: no
8. Business behavior changed: no
9. arch:check result: passed
10. Remaining architecture risk: 无新增模块依赖；远端运行、真实缓存重试需授权推送后验证。

待完成：授权提交并推送，通过 PR 进入 main；后续实际发布验证缓存和线上步骤。本次没有写入 CMS、Supabase 或 Cloudflare 设置。
