# 维修服务与待发布改动统一交付

用户于 2026-09-27 明确授权：完成本项目待发布工作，汇总、合并 main、部署并验证上线。

## 基线与归并范围

- 原主工作区 HEAD：288e965，保留全部未提交修改。
- 集成基线 origin/main：160eca3239b65d57f2f6d045c1c07891ba64170d。
- 发布前线上：c5ac34eb87345d2010d56616a2b51bb768c0c250。main 后续仅有测试修正，因此此前发布流程正确跳过构建。
- 本轮确认 49 个工作区、0 个开放 PR；原目录 68 个产品文件与最新 main 相同。完整只读工作区快照保存在本地 worktree-inventory.json。
- #115–#122 的桌面框架、页脚、首页、室内设计、服务链接反馈、主导航及问答阅读器已合并；历史替代方案不回并。旧分支分类沿用项目 audits/unified-release-20260927/RELEASE_REVIEW.md，并重新核对祖先、补丁及当前文件。
- 保留根目录 .gitignore、历史审计/文档删除、四张未引用材质纹理和旧预览脚本。本次发布使用真实 React 页面和现有公共布局。

## 本次完成项

1. 新增中英文家具与家装表面修复页面，加入现有服务列表专业项目分组。
2. 四张损坏效果图完整显示，八类范围常显；适修判断、四步流程、报价因素模块化；标题、导航、页脚和手机底栏复用当前线上设计。
3. 案例带入咨询、所在地校验、手动留言保护、复制失败提示、真实 WhatsApp 链接；生成说明仅在本地处理，由客户确认发送。
4. 完整网站目录缩紧分组间距，右侧图片完整显示；手机服务首屏行动区对齐；问答标题间距统一。
5. 纳入最新设计页 CMS 读取修复：标题、摘要、正文、SEO、全部 FAQ 来自发布内容；清理不安全正文；等待真实数据后渲染，消除旧问答闪现。原工作区保留。
6. 双语 sitemap/SEO/llms 生成源补齐维修路径；图片提供 WebP 和 30 个响应式版本。
7. 在现有受保护内容发布流程增加唯一维修目标。新服务创建要求明确授权、当前部署 SHA 一致、图片可访问；默认 dry-run、已有内容冲突中止，发布后逐字段回读。

素材是先前已选定的设计效果图，公开标注保持“设计效果图 / Design rendering”。原始生成提示、来源与转换摘要在本目录，未伪称真实客户完工照片。

## 验证

- Node 22.23.3：lint、typecheck、arch:check、i18n:check、ui:text-check 通过。
- 相关 Vitest 113 项（维修 5、设计 CMS 7、发布 38、服务 SEO 与公共布局 63）、发布控制 6 项、新服务发布防护 5 项通过。
- 设计页浏览器回归 5/5：中英文、键盘、触摸与 360/390/768/1024/1440 布局。
- 实际浏览器：维修 1440 桌面、390 手机、320 英文窄屏无横向溢出；4 张案例图片均为 contain；8 类外层无折叠；咨询生成校验与链接内容正确；未发送真实咨询。
- 实际浏览器：设计页中英文已读到后台 5 条 FAQ；完整目录图片完整显示。
- 本地 Vite 生产打包通过。完整预构建、源码产物摘要、部署由 GitHub 唯一 Cloudflare Pages 发布流程执行，发布结果另记于本地 release-receipt.json。
- 初版浏览器回归捕获 CMS 加载前旧问答短暂出现；已修复渲染等待并新增回归后 5/5 通过，失败日志保留。

## 发布顺序与回退

PR 检查通过后合并 main，等待唯一 Pages 发布成功并回读完整 SHA，再使用 approved content publish 工作流发布 surface-repair-20260927。内容发布会保存空基线、新记录、保存 ID、逐字段回读和缓存回执。最后验收双语服务入口、HTML SEO、sitemap、llms、图片、桌面/手机和公共性能。

新增 CMS 服务需要回退时，通过相同受保护 API 归档该新行并校验 updated_at，保留记录；不删除，不改其他服务。网站需要回退时通过正常 PR 前向修复后由唯一发布入口执行。原工作区和旧分支均不清理。

## Architecture Compliance Report

1. Target module: services，现有 seo 与共享公共布局。
2. Target layer: 前端组件、样式、多语言/兜底数据、既有内容发布适配脚本。
3. Edited files: SurfaceRepairContent、DesignServiceContent、ServiceDetail、Services、services 数据、surfaceRepairPageText、surface-repair/design-service/scheme-a-shell 样式、SEO 生成源、受保护发布脚本和相关测试/工作流。
4. Forbidden files touched: no。
5. API paths changed: no，沿用 content-publish。
6. Database access changed: no，内容写入仍由现有受保护函数执行。
7. Cross-module dependency introduced: no，复用现有公共接口。
8. Business behavior changed: yes，新增维修咨询入口，设计页同步后台发布内容。
9. arch:check result: passed。
10. Remaining architecture risk: 未新增依赖、数据库结构、认证权限或后台 API；上线验证与发布回执另记。
