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
- 发布前检查必须是绝对干净工作区；构建后只允许响应式图片、SEO manifest、sitemap 和 llms.txt 这些已声明生成产物发生变化，任何源码或配置变化仍会阻断。
- 发布前检查和构建后检查全部通过。
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

## 手动发布与完整制品（2026-09-07）

- `Deploy to Cloudflare Pages` 仅允许手动在 `main` 上运行。必须填写最新完整 `source_sha` 和本次政策生成的单次 `approval_id`；常驻授权名称不是执行许可。不得恢复 `workflow_run` 自动生产部署，也不得在内容发布中同步 Pages secrets 或部署 Supabase Functions。
- 同一个最终 main SHA 的 Prelaunch、i18n、required release workflow 必须成功。质量工作流默认面向 PR，最终 main 需要单独运行；PR 的绿灯不代替 main 的验证。构建前及上传前都检查最新 main，任何漂移停止。
- 构建按现有 release:check 完成响应式图片、SEO 生成和旧 hashed assets 保留后，按只读取得的现有 production compatibility date/flags 再预编译 `dist/_worker.js` 与 `dist/_routes.json`。完整包还包含 HTML、静态资源、headers、redirects、sitemap、llms；仅 Vite dist 不是完整部署包。
- 打包后保存每个文件的大小/SHA-256、tar 包 SHA-256、源码 SHA、Node/Wrangler/lockfile 信息、GitHub artifact ID/digest。部署 job 在新 runner 按 artifact ID 下载，验证压缩包及全部文件，使用分别独立的上传目录、Wrangler 工作目录及 `--no-bundle` 上传（Wrangler 缓存不得进入上传目录），不能再次构建或隐式读取仓库 functions/config。
- 构建前只读保存 Cloudflare canonical production deployment ID、URL、完整 commit SHA，并与公开 version endpoint 对账；上传前再次确认旧 deployment ID 和 runtime compatibility 设置均未变。只保存白名单部署字段，不保存 API 整体响应、账号配置或密钥。
- 发布后保存新 deployment ID 与公开版本，完整生产 smoke 仍须按业务页面验收。任何失败停止 CMS；按批准的前一 deployment ID 回退 Cloudflare Pages 后再次核对公开版本和 smoke，不因 workflow 失败就声称自动回滚。旧版本没有历史制品归档时如实登记缺口，不用重新构建的包冒充原上传字节。
- 首次合并本发布修复前，完整检查旧部署/Prelaunch 活动运行并停止并行 main 写入；有旧运行则停止，不能假定源码修改会取消它们。修复合并后读取 main YAML、等待该 SHA 的 Prelaunch 完成并确认无自动部署，再继续业务 PR。
- 修复先合并会改变 base 和全部组合树。重建 #88–#92 版本清单；strict 要求更新分支时保留 merge 历史，重新跑当前 Head CI/QA，不复用旧树、旧 Head 放行或已消费许可。
- CMS 五篇先统一远程 dry-run 5/5。之后使用已核准的单 target 入口：一篇发布 → API 字段/版本 → 两语言渲染正文新内链 → Meta/Schema/sitemap/llms → 保存 PASS → 下一篇。任一失败停止，不用 all-five publish 循环越过逐篇验收。
