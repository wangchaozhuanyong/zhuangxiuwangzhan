# 显式表权限兼容补丁

## 范围与结论

- 目标：适配 Supabase 在 2026-10-30 推行的 `public` 新表不再隐式授权的行为。
- 公告：https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- 发布基线：`d3584c6687341c08aeac32226c0f2b6e95ad2777`，37 份已提交历史迁移、36 张应用表；包含主分支已合并的马来语字段迁移。
- 补丁：`supabase/migrations/20261021070913_explicit_table_privileges.sql`，文件时间戳与生产迁移账本一致。
- 用户批准发布后，已备份并在生产执行。详见下面发布记录；网站页面和 Edge Function 不在此次发布范围。
- 主工作区现有未提交源码未纳入候选，也未被修改。

现有表保留旧授权，不会仅因公告日期到来失效。风险在于以后新建表或重建环境只执行 RLS、没有显式 `GRANT`。此补丁追加授权，保留已有权限，不是收紧现网旧权限的专项审计。

## 权限分配

`authenticated` 是登录会话的数据库角色，不等于管理员。管理员角色、停用状态、MFA、已发布内容和父记录可见性仍由原 RLS 判断。

| 对象 | anon | authenticated | service_role | 依据 |
| --- | --- | --- | --- | --- |
| 24 张公开内容表 | SELECT | SELECT/INSERT/UPDATE/DELETE，受原 RLS 限制 | 见以下服务器规则 | 现有前台查询和后台管理策略 |
| admin_users、leads、quote_requests、lead_followups、maintenance_reminder_items | 无 | SELECT/INSERT/UPDATE/DELETE，受原角色策略限制 | SELECT/INSERT/UPDATE | 现有后台、Edge 和备份恢复 |
| translation_jobs | 无 | SELECT/INSERT/UPDATE/DELETE，受原角色策略限制 | SELECT/INSERT | 翻译函数创建任务记录，后台管理记录 |
| cms_revisions | 无 | SELECT | SELECT/INSERT/UPDATE | 修订由原触发器生成；服务器支持隔离恢复 |
| admin_audit_logs、system_event_logs | 无 | SELECT/INSERT，受原 RLS 限制 | SELECT/INSERT/UPDATE | 后台日志、服务器写入及隔离恢复 |
| notification_settings、managed_cms_release_permits | 无 | 无 | SELECT/INSERT/UPDATE | 保留现有服务器专用边界 |
| form_submission_attempts | 无 | 无 | SELECT/DELETE | 既有原子 RPC 负责插入；维护函数计数并清理 |

公开内容表：about_sections、before_after_items、blog_posts、brand_partners、cms_content_entries、cms_pages、cms_section_templates、cms_sections、cta_blocks、faqs、hero_slides、home_sections、landing_pages、material_images、materials、media_assets、process_steps、project_images、projects、service_areas、services、site_pages、site_settings、testimonials。

服务器规则：现有 `scripts/backup-supabase.mjs` 的 32 张完整备份表由 `scripts/restore-supabase-backup.mjs` 使用 upsert 恢复，因此显式授予 SELECT/INSERT/UPDATE。`cms_section_templates` 不在该恢复清单内，仅授予服务器 SELECT。发布、翻译及恢复所需访问均被该分配覆盖。

- 不使用 `ON ALL TABLES`、`GRANT ALL` 或恢复默认授权。
- 不增加 TRUNCATE、REFERENCES、TRIGGER 或序列权限；应用表主键使用 UUID/text。
- 不改函数权限、Storage 权限、RLS、数据内容或管理员判定函数。
- `media_assets` 继续保留已有公开读取策略，不声称此次修复进一步限制了媒体记录可见性。
- 对目标表先检查 RLS；表缺失或 RLS 未开启时立即报错，避免对未保护的表加授权。
- 每张未来新表仍须在自己的建表迁移中明确授权并配套 RLS；本补丁不会自动开放未知新表。

## 本地验证

在此工作区根目录执行：

```sh
python3 scripts/verify-explicit-table-grants.py
```

要求本地 Docker 可用、已有官方 `postgres:17-alpine` 镜像。脚本不接受连接字符串，不读取 `.env`，不发布端口、不挂载宿主目录，容器网络为 `none`，数据库数据放在容器 tmpfs。测试结束检查本次标签后停止容器，`--rm` 自动移除；报告仅写入本项目目录。

范围是实际 PostgreSQL 17 的表权限、RLS、触发器和 SQL 调用。Auth/Storage 仅提供迁移所需的最小 SQL 契约（`auth.uid/jwt/role`、用户外键、bucket/object）；不是完整本地 Supabase 服务，也不是托管环境或浏览器验收。

本次结果：54 项检查通过，其中包含 756 项独立表/角色/操作权限断言。报告：`reports/explicit-table-grants/verification.json`，记录基线、镜像 ID、迁移和验证脚本摘要，以及已通过项目。

覆盖：

1. 在没有默认授权的数据库完整执行 37 份历史迁移；补丁前实际复现 CMS/媒体访问被拒绝。
2. 应用补丁后，逐项核验 36 张表、3 个角色、7 种操作；确认重复执行无新增变化。
3. 游客及普通登录用户仅能读到原 RLS 允许的 CMS、案例、材料及子表；草稿、删除状态和不可见父记录被过滤。
4. 内容编辑器新建草稿、更新发布后游客可读回；修订触发器仍正常，直接修订写入仍被拒绝。
5. 媒体记录写入和游客读回；只读角色、线索角色、停用管理员及未完成 MFA 的编辑器不能写 CMS。
6. 普通用户不能读线索和日志；即使 super_admin 也不能直接访问通知密钥、发布许可、防刷记录表。
7. 服务器线索写入、原子防刷 RPC、过期记录清理及管理员日志写入可用；游客不能调用防刷 RPC。
8. 保留旧默认授权的兼容场景中，已有表权限没有减少，通知密钥浏览器禁读边界保持。
9. 两种场景均比较 RLS、函数 ACL、Storage ACL、默认权限及所有应用表的数据指纹，补丁未改变这些对象或已有数据。
10. 新建未知表仍无游客权限；移除目标表 RLS 后补丁拒绝执行。

工程检查：`npm run arch:check`、`npm run typecheck`、`npm run lint` 通过。架构检查仅报告项目已登记的旧依赖边界警告。本机 Node 为 24，项目声明支持 20–22；这些检查在现有运行时通过，不代表支持范围已经升级。

## 线上执行前与回滚

后续环境再次执行前，应重复以下流程。本次生产执行已获用户批准，结果见发布记录：

1. 核对目标项目身份、真实 schema 与迁移账本；确认基线后新迁移是否引入其他表或修改访问规则。
2. 备份并验证，保存目标表执行前 ACL、RLS、函数 ACL、默认权限及迁移文件摘要。
3. 对照当前业务和备份恢复清单复核授权；若有不同，在迁移执行前修订候选并重新测试。
4. 通过项目规定的迁移流程执行该增量文件；不能重置生产库或直接重放全部历史迁移。
5. 读回表权限；用真实游客和不同后台角色测试 CMS/媒体，并验证授权的保存到公开读取链路。

回滚按执行前 ACL 与执行后 ACL 的差集，仅撤回此次新增的角色/表/操作授权。不要简单对这 36 张表整批 REVOKE，也不要恢复 schema-wide 默认 GRANT。旧环境常已拥有这些权限，重复授权可能没有任何增量，此时无需撤销原有业务权限。若补丁后又有经批准的新授权，回滚时也须保留；迁移账本随正式回滚流程处理。本次执行前后 ACL 相同，授权差集为空，无须撤销任何原有业务权限。

## 生产发布记录（2026-10-21）

- 项目：`rbsnyexjifounogswrjp`，与项目原有部署绑定一致。
- 新鲜加密备份及私有 R2 读回：[运行 39559603694](https://github.com/wangchaozhuanyong/zhuangxiuwangzhan/actions/runs/39559603694)，成功；备份摘要 `c9f835e3cf3c330203a44984cc7b5dba0ef66b9bee43c9e76e654282bc69e6d4`。
- 生产迁移：`20261021070913_explicit_table_privileges`；账本 SQL MD5 与候选文件完全一致：`c17359d6d54073a84868da41b0224837`。
- 补丁要求的 253 项授权此前均已存在，执行前后 ACL 完全相同。106 条公开/Storage 策略、函数 ACL、默认 ACL 和 Storage ACL 均保持不变。
- 线上额外存在 `whatsapp_growth_events`，不在本次迁移中；它及其他表的现有权限均未改变。其建表来源不属于本次兼容补丁的已提交迁移清单。
- 真实角色只读检查：游客读到 38 条已发布案例和 12 条 CMS 页面，CMS 草稿/删除记录泄露数为 0；游客看不到线索；合成普通登录身份看不到管理员、线索、修订记录，且管理员角色返回 null。
- 通知配置、发布许可表对游客和普通登录身份仍不可直接读取。上述验证没有插入或更新生产业务数据。
- 发布前后权限快照保存在工作区内被 Git 忽略的 `backups/explicit-table-grants-20261021/`，只保存元数据，不保存密钥或客户内容。

## Architecture Compliance Report

1. Target module: system；跨表数据库访问基础设施。
2. Target layer: supabase/migrations 和本地数据库验证脚本。
3. Edited files: 新迁移、verify-explicit-table-grants.py、本说明及本次验证报告。
4. Forbidden files touched: no；历史迁移、已有业务文件和主工作区修改均未改动。
5. API paths changed: no。
6. Database access changed: 已执行版本化显式授权迁移；线上执行前后有效 ACL 相同。
7. Cross-module dependency introduced: no。
8. Business behavior changed: 修复无默认授权的新环境；原 RLS 和旧 ACL 保留。
9. arch:check result: PASS，存在已登记的旧边界警告。
10. Remaining architecture risk: 未做生产业务写入或完整后台浏览器验收；原有权限整改不在本次兼容补丁范围。
