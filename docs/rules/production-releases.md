# 正式环境发布规则

本规则保证正式站始终对应一个可追溯、可测试、可回滚的 Git 提交，避免本地新代码未提交时被后续构建覆盖。

## 唯一正式发布来源

- `main` 是唯一正式发布分支。
- 功能分支、设计分支、修复分支只用于开发、测试和预览，禁止直接覆盖正式站。
- 正式环境只能部署 `origin/main` 上存在的完整 40 位 commit SHA。
- 未提交修改、未跟踪文件、本地临时构建和旧 `dist` 都不是可发布版本。

## 固定流程

```text
功能分支 → commit → push → review/test → merge main → main SHA 检查 → production deploy → post-deploy smoke
```

1. 功能代码、样式、测试和规则必须一起进入可审查提交。
2. 功能分支推送并通过检查后合并到 `main`；紧急修复也必须先形成提交进入 `main`。
3. `Prelaunch verification` 必须在准备发布的同一个 `main` SHA 上通过。
4. Cloudflare Pages 只部署这个完整 SHA。
5. 发布后用该 SHA 对应的测试检查正式站。

## 强制发布门禁

生产发布必须同时满足：

- 来源分支严格等于 `main`。
- 工作区没有修改、删除或未跟踪文件。
- 检出的 `HEAD` 等于声明的发布 SHA。
- 所有正式发布（包括 CI 和本地紧急发布）中，`HEAD` 必须等于执行校验时最新的 `origin/main`；构建期间 `main` 前进时，旧 SHA 必须停止发布并重新走门禁。
- 发布前检查和构建后检查全部通过。
- 发布前工作区必须完全干净；构建后只允许 `public/images/_responsive/`、sitemap、llms 与 SEO manifest 等仓库内明确登记的生成产物发生变化，任何源码、配置或未登记路径变化都必须阻止发布。
- Cloudflare 命令显式携带 `--branch main` 和 `--commit-hash <完整 SHA>`。

任意一项不满足都必须停止。禁止使用 `--allow-dirty`、伪造分支名或直接运行 Wrangler 绕过。

## 本地发布

- 默认使用 GitHub Actions，不从本地发布生产。
- 确需本地紧急发布，只能在干净、同步的 `main` 上执行 `npm run deploy:cloudflare:pages`。
- 禁止直接运行 `wrangler pages deploy dist --branch main`。
- `release:check:dirty` 只能用于开发验证，不能用于生产发布。

## 功能防回退验收

- 修复或新增关键交互时，回归测试必须和功能代码一起提交。
- 生产 smoke 必须覆盖导航、联系入口、表单入口和本次修改的关键路径。
- smoke 失败时停止后续发布，优先回滚到上一个成功部署。

移动端底栏至少验证：

- 初始显示五项底部导航。
- 内容向上移动后切换为联系操作栏。
- 内容向下移动后切回导航。
- 输入框聚焦或菜单打开时隐藏固定底栏，避免遮挡。

## GitHub 设置

`main` 应启用分支保护或 Ruleset：

- 禁止 force push 和删除分支。
- 合并前必须通过 `Prelaunch verification`。
- 推荐要求 Pull Request 审核。
- Cloudflare 生产密钥只提供给正式发布工作流。

## 发布记录与回滚

- 每次发布记录 commit SHA、工作流链接、Cloudflare deployment URL、时间和验证结果。
- 前端异常优先回滚 Cloudflare 部署，不要同时回滚数据库。
- 回滚后重新运行完整生产 smoke。
- CMS 数据回滚遵守内容 revision 和备份规则，与前端代码回滚分开处理。
