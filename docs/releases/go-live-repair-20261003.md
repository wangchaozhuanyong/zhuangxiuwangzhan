# 上线检查修复与本项目待发布改动

基线为 main / 线上 `8c7633a53951662cd1d4a1d4cc005788098ef851`。本轮所有源码改动位于项目内 `.worktrees/go-live-repair-20261003`；证据归 `audits/go-live-repair-20261003`。用户授权修复、汇总本项目已完成改动、合并 main、统一部署与线上验证。

## 候选范围

- React Router 固定到 7.18.4，窄范围更新 brace-expansion 与 postcss-selector-parser 的安全补丁；保持 BrowserRouter 声明式路由。删除已退出的 v6 future 属性。
- 后台登录返回地址只接受本站 `/admin/` 子路径，拒绝跨域、反斜杠、控制字符和路径越界；保留查询与锚点。LocalizedLink 保留协议相对外链，防止语言前缀污染。
- 表单 E2E 等待真实页面就绪，定位主内容中的可见联系方式；保留错误焦点、用户输入、成功状态与单次提交断言。
- 公共性能检查记录失败请求的 URL、状态、类型和时间，去掉 URL 查询值；关键请求失败阻断，第三方非关键失败明确告警。原 3000/3500ms 门槛不变。
- 诊所案例共享 scope/materials 字段按既有精确标签机制翻译中文，英文和其他案例保持原值。CMS 中文正文另走受保护 `content-publish`，绑定实际记录 ID/updated_at；保留概念说明。发布器按已有案例规则清除 location/area，原记录保留作回滚依据。
- 备份验证从四张表扩大到包中全部声明表的行数，以及媒体文件数。真实恢复演练发现预置CMS唯一键冲突；恢复脚本改按manifest依赖顺序写表、恢复媒体，并要求显式隔离目标与凭据，拒绝原生产项目。真实恢复仅在独立本地环境进行。
- 本项目盘点发现 Rawang / Seri Kembangan 的两地区咨询标签代码已提交，来源 `a358c6d1`；合入时复用 main 已有七地区的双语模板，仅扩大两个已审阅 slug 的适用范围。

## 盘点边界

旧导航、动效、卡片、材料正文、FAQ、博客 CTA 与 WhatsApp 变体已经由 #161–#165 的整合版本覆盖，不重放旧实现。四处 356 个构建生成文件不当成新交付。五个 CMS native 目标及其他冻结草案仍缺少相应发布验收/许可，本轮不发布那些数据，也不混入其边界服务改动。完整盘点见 `project-inventory.json`。

## 实际验证

- Node22.20.0 安装与生产构建完成；类型、完整 lint、架构、语言和界面技术字段检查通过。
- 单元测试：120 个文件、1082 项通过；脚本测试15项通过（安全诊断、CMS源漂移、备份缺失、发布控制）。
- 本地候选12项表单、语言查询上下文、后台未登录保护测试通过；5种浏览器配置覆盖45个核心页面通过。表单提交/Turnstile为测试拦截，不是生产真实通知证明。
- 生产基线性能首次复查10/10通过，未出现503；增强诊断保留之前失败记录。第二次复查同样10/10通过，两个回执分别保留；本轮未复现旧503，不宣称已找到其生产根因。
- 2026-09-06 备份32张声明表、72个媒体文件完整性验证和 dry run通过；缺少 Auth、数据库schema备份且日期较旧，不宣称具备整套系统即时恢复能力。真实隔离恢复32张表的行数、全部原字段与72个媒体文件字节比对通过。恢复时只对可丢弃本地环境处理预置数据、暂停USER触发器，并保证恢复后重新启用；外键约束保持启用。Auth仅有本地外键占位，不能证明账户恢复。
- npm audit --omit=dev为0；完整工具链审计仍有13项开发依赖通告，未执行未经审阅的框架/构建工具批量升级。
- 本地候选电脑264×88与手机76×76动效采样均经过waiting/flying/settling/done，归位轮廓误差0像素；手机刷新按钮位置变化0像素。
- 本地 CMS 机器发布凭据收到401；不绕过发布器、不修改密钥/权限。正式内容发布走现有 GitHub 工作流，成功回执、Saved ID及中英文读回另行记录。
- 真实生产线索、接收渠道、通知回执尚需受控测试。没有证据前记为未测，不以模拟数据替代。

## 发布与回滚

同一候选 PR Head 通过现有 CI 后合并；生产仅由 main 的 `cloudflare-pages-deploy.yml` 部署，同SHA已有运行时不重复派发。CMS仅发布本轮诊所目标。上线后核对 `/version.json` 的 main SHA、导航/表单/核心页面、手机刷新及动效归位、SEO与性能回执。前端回滚采用恢复 `8c7633a` 的独立回滚提交并走相同工作流；内容回滚需对新保存版本重新核验并通过受保护发布器。

## Architecture Compliance Report

1. Target modules: system、admin-auth、projects；现有地区页与线索/报价验收。
2. Target layers: frontend presentation/i18n、既有脚本与发布配置。
3. Edited files: PR源码清单及本发布文档；没有加入构建生成物。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no new access；CMS使用既有发布器；恢复只在隔离环境。
7. Cross-module dependency introduced: no；复用现有标签及地区咨询模板。
8. Business behavior changed: 安全返回路径与两地区咨询上下文；不改变真实提交/通知接口。
9. arch:check result: PASS。
10. Remaining risks: 真实通知及生产发布证据未完成前，整体状态不得写成全部闭环。
