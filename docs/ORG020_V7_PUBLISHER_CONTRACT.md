# ORG-020 v7 准确发布能力

本文件对应本地能力任务 `fc-20260926-org020-v7-publisher-capability-v1`，父内容任务 `fc-20260925-existing-page-content-gap-v1`。不是 QA、批准、许可或已发布证明。

## 架构和责任

沿用 `content-publish` 的 CMS service 和既有 repository。`org020-v7-targets.ts` 保存 28 项独立准确元数据，不含发布正文。发布脚本的锁定正文位于 `scripts/managed-cms-targets-org020-v7.mjs`，不进入前端内容字段。运营独立维护 permit issuer 消费元数据；本候选不编辑中控 issuer。

基线 `670553a9034e807a44986ea02cbb698d81fc1bff`。Home/FAQ 两个 i18n 文件逐字集成原 `c44e45a39f2aa94eae0a89af002dfed39a16415d`，独立原内容 QA 仍由运营关联，不以本能力测试取代。

## 请求和响应

入口仍为 `POST /functions/v1/content-publish`。既有管理员/机器身份验证、GitHub OIDC、HMAC issuer、短期一次许可不变；准确 CMS 写入仍要求真实 managed GitHub identity、`ownerApproved=true`、`explicitExecution=true`、非空 `approvalId` 和完整 `managedPermit`。零写预演也需经过入口原身份验证，使用 `managedCandidate` 选择准确目标，不构成写许可。

受限新增 `contentType=faq`：只支持冻结的 3 条原行。`record.id` 为准确 ID，`page_key/question/status/sort_order` 等提供时必须等于当前行；仅 `answer_en/answer_zh` 可变化。执行字段与哈希保持冻结 v7，3 个执行适配版本/action 独立为 v8，不把原 request=null 伪装成旧能力已支持。许可的 `slug` 为稳定 `faq-<UUID>`，不向数据库添加 slug 字段。

`site_page` 地区汇总仍是原内容类型，许可 slug 使用现有 `page_key=locations`；目标是已有行，不是新路由。其他 24 项使用既有 service/service_area/blog 类型与原 v7 action/version。所有脚本 REST 回读按准确 ID，baseline 投影字段、CAS、字段哈希和 source 文件哈希写入目标定义。

全部新目标：mode=dry-run/publish；nextStatus 只能保持 published；expectedUpdatedAt 必须匹配冻结及当前行；managedCandidate/managedPermit 的 task/action/version/row/scope 必须唯一匹配。字段清理后摘要还须相等。SQL 仅更新目标 changedFields，并在同一 UPDATE 带 id 与 updated_at 条件。不存在时拒绝，不插入。

dry-run 响应：`ok=true,dry_run=true,performed_write=false,content_type,existing_id,slug,status,payload_preview`；没有 Save ID 或许可 claim。publish 成功响应增加 `performed_write=true,saved_id,saved_updated_at`；失败保持原 `{ok:false,error}`，400 为字段内容无效，403 为身份/字段/摘要/授权拒绝，404 为原行缺失，409 为基线/CAS冲突或写结果不确定。结果不确定必须先读回，不能重放已用许可。

## FAQ 保护与兼容

三条 FAQ 不 insert、不 archive、不删除、不修改问题/page_key/排序/状态/其他 FAQ。原 homepage 通道如会替换包含锁定 FAQ 的整组或插入相同问题，则拒绝；其他首页组件与无关 FAQ 仍保持原流程。旧准确目标、尤其已完成 Builtin/Warehouse/Office 媒体目标定义均保留，status 读回继续可用。数据库已有非 revoked action 唯一索引包含 completed/uncertain 状态，未变更 schema 或角色。

## Workflow、恢复和验收

28 个准确选项加入现有 content-publish-approved workflow；publish 前同样要求准确许可，rollback 选项未扩展。没有“全部28项自动发布”入口。后续 18 地区与 10 其他单元分批，每批最多20记录；每行各有自身 QA/AUTO_RELEASE/政策、新鲜零写、一次 CAS Save 和公开验收。

新目标禁用原内容回滚；备份仍保留每行完整原数据。现有 issuer 所需 prior payload digest 由脚本按准确旧字段计算，标为备份证据，不生成恢复许可或执行恢复预演。失败后读回真实行，制作新的准确前向修正并复验。原已完成媒体/旧屋和全文不得因本任务回退。

缓存行为沿用入口现有 content revision 和公开 HTML 失效；不扩大 purge，不依据后台 footer 的旧 SHA 判断缓存故障。能力上线需一次合法同 SHA Git/main 与 Edge 同步；本地验证不表示上述发布已做。

必要后验：新 Edge 能力/源码 SHA、零写拒绝检查、每行 Saved ID/时间/不变字段、英中实际正文及 FAQ、390px/桌面、公开 metadata/FAQ Schema/动态 sitemap。本轮不访问生产认证或执行 Save；固定 QA 必须增量独立验证。
