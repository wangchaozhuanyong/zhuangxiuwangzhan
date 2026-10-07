# TEST 表单最小修复：已获老板配套发布批准

结论：本地代码与检查完成，未推送、未部署、未修改数据库结构、未新增账号。生产两条 TEST 尚未提交，不能称为收件验收完成。

## 授权与根因

老板在当前付费准备聊天回答「批准这个最小本地修复」：仅已登录且有权限的管理员可提交 TEST、正式统计和广告转化排除 TEST、正常通知保留；本地验证后交老板审核，不推送或部署。修复前 submit-lead 将 TEST 保存为普通线索/报价，前端成功提交照常触发 GA4 和 Ads 转化。

仓库：`/Users/wangchao/Desktop/装修网站/zhuangxiuwangzhan-main`，main，基准 HEAD `125177aebafef3f9cf942a8d9703b56342a01013`。开始时工作区干净。当前差异仅本次本地候选。

## Architecture Decision

1. Target module: leads、quotes、system（仪表盘统计）。
2. Why this module: 提交、线索/报价统计分别由这些现有模块负责。
3. Target layer: submit-lead service/repository、后台 repository、浏览器分析兼容工具及表单调用点。
4. Why this layer: 服务端核验 TEST，查询层排除测试，浏览器阻止测试转化；界面只传递本次提交来源。
5. Files allowed to edit: 下列实际修改文件及对应测试、本文档。
6. Files forbidden to edit: 账号/登录核心、通知配置、数据库迁移、CMS、部署流程、价格与业务事实。
7. API paths affected: 现有 submit-lead；不新增/改名。请求仍使用现有 sourcePath，响应仍为 {ok,id}/{error}。
8. Database access location: 现有 submit-lead repository 和后台 leads/quotes/system repository。
9. Cross-module dependency risk: 共享无运行时依赖的纯 TEST 契约；浏览器只重导出纯常量/函数，不引入管理员服务端或特权客户端。
10. Business behavior impact: 普通表单与通知不变；仅这次经认证授权的两条 TEST 不计入正式统计或本应用发送的转化事件。

## 实际修改

- 服务端：复用现有 active 管理员、AAL2、super_admin 核验，不开放 cron/service-role TEST 绕过。
- 只认准确配对的 T01 报价、T02 联系标记；未知/重复/伪造服务端标记拒绝。要求明显 [TEST] 名称、「非客户咨询」说明和公开公司号码。
- 服务端赋予规范 source_path。两条固定 UUID 使用既有主键限制重复保存；重复回读及主键冲突核验不重复发送通知。
- 正式报表、仪表盘 12 条相关计数/最近记录查询排除规范测试记录，保留 source_path 为 NULL 的正常客户；原始后台列表不隐藏测试证据。
- TEST 直达页面不加载本应用 Google 标签、不发送应用分析事件或 /__visit；表单捕获提交时的来源，异步过程中改 URL 也不把 TEST 结果变成正式转化。
- 保留原 notify-lead 调用和失败/超时后仍保留已保存记录的语义。不声称本地模拟通知就是阿文实际收件。

修改文件：

1. supabase/functions/_shared/lead-test-contract.ts（新增纯契约）
2. supabase/functions/submit-lead/service.ts
3. supabase/functions/submit-lead/repository.ts
4. src/lib/leadTest.ts（新增浏览器纯契约兼容入口）
5. src/lib/leadTest.test.ts（新增）
6. src/lib/leadTest.server.test.ts（新增）
7. src/lib/leadTest.queries.test.ts（新增）
8. src/lib/analytics.ts、analytics.test.ts
9. src/lib/websiteVisits.ts、websiteVisits.test.ts
10. src/lib/adminLeadReports.ts
11. src/backend/modules/leads/repository/leadRepository.ts
12. src/backend/modules/quotes/repository/quoteRepository.ts
13. src/backend/modules/system/repository/dashboardRepository.ts
14. src/pages/Contact.tsx、Quote.tsx（仅提交时来源传递，未改界面文案/布局）

## 已实际运行的检查

- 专项 7 个文件 63 项测试通过，包括真实 submitLead 业务函数、真实管理员认证判断与模拟持久化/通知边界；不调用生产账号。
- npm run typecheck、typecheck:strict-core、lint、arch:check、ui:text-check、git diff --check 通过。架构检查仅有已登记的其他模块旧债务提醒。
- npm run build:dev 通过；2197 个模块。不是生产部署构建/发布。
- 默认环境全套 npm test：1827 通过、1 失败。独立复现未修改的 Index.faqSchema.test.tsx：本地 VITE_SITE_URL 为 localhost 时，既有断言要求生产域名。不修改相关首页/配置/测试。
- 临时使用 VITE_SITE_URL=https://flashcast.com.my npm test：208 个文件、1828 项全部通过。该临时测试变量未写入环境文件。
- 未运行 Deno 原生检查（本机无 Deno）、真实数据库集成、生产提交/收件、桌面/手机浏览器验收、公开性能全站验收。以上不以单元模拟或构建代替。

## 后续准确批准与发布前核验

老板在当前付费准备聊天另行回答「批准」，允许前端与 submit-lead 服务端配套发布，随后执行原先批准的报价、联系各一条 TEST。该批准不包含启用广告、充值、付款、数据库结构或登录权限修改，不向总控或其他聊天派工。

2026-10-08 通过公司浏览器现有登录核验 Supabase 生产项目 `rbsnyexjifounogswrjp`、既有 submit-lead 编辑入口。旧生产源码已下载至本项目 `backups/lead-test-paired-release-20261008/submit-lead-before.zip`，SHA256 `a6e97da9915593b56c58fcfead519be10afc32012092f7433e18f7f00b88c923`；六个旧文件全部与本次基准仓库版本一致。五个服务端编辑文件（service、repository、types、原有 admin-auth、lead-test-contract）在 UI 编辑器中逐字核对与已批准本地源码一致，尚未点击部署。未经真实发布及验收不声称已上线。

## 配套发布与验收步骤（尚未完成）

1. 先审核本候选差异，再单独批准正确通道发布：浏览器代码与 submit-lead Edge 服务端必须配套上线，不能只部署前端。
2. 取得服务端发布/权限证明，核验现有生产表主键和报告过滤效果；不新增账号、不降低 MFA、不读/输出 Token。
3. 授权管理员用新文档直接打开 TEST URL（全新文档，勿从已加载 Google 标签的普通 SPA 会话进入）：`/zh/quote?fc_test=fc_paid_20261008_T01` 与 `/zh/contact?fc_test=fc_paid_20261008_T02`。
4. 仅各提交一次，共 2 次；任何失败或状态不明都停止，不自动重放。经本次允许的原通知渠道由阿文确认收件。
5. 对账实际记录、零正式统计增量、零应用成功转化事件、阿文收件，才能称两条表单测试完成。浏览器插件/第三方账户自动收集不在本地代码单元测试证明范围内。

## 风险与回滚

TEST 记录不删除，正常通知会发出明显标记的内部咨询。通知投递失败不自动重复提交；需要单独核对既有通知记录。固定两条测试标记不是通用测试框架。部署之前不能把生产 TEST 当作已隔离。当前回滚为撤回本候选准确本地差异，保留任何其他人新改动；没有迁移或生产资源需回滚。

## Architecture Compliance Report

1. Target module: leads/quotes/system。
2. Target layer: service/repository 与现有浏览器兼容层。
3. Edited files: 上述列表。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: yes，既有 repository 增加测试记录回读与正式报表过滤；schema 未变。
7. Cross-module dependency introduced: no privileged dependency；仅无运行时依赖共享契约。
8. Business behavior changed: yes，仅准确授权 TEST 权限/去重/统计排除；普通客户流程保留。
9. arch:check result: PASS。
10. Remaining architecture risk: Supabase SDK 认证类型边界适配与 Deno/生产集成未实际验证；正式生产双端部署及真实收件仍待老板审核后的单独执行。

当前状态：代码完成、本地验证完成、老板已批准配套发布；生产发布及两条测试仍未完成。唯一审核人：老板；执行负责人：当前聊天。未向总控或其他聊天派工。
