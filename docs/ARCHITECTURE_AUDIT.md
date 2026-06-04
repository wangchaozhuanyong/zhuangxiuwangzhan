# Architecture Audit

本文档记录当前代码距离固定架构规则的状态。它不是业务 bug 清单，而是后续让 AI 不乱写代码的结构约束记录。

## Current Result

当前项目已经完成第一轮架构治理：

- 已建立 `AGENTS.md` 和 `docs/ARCHITECTURE.md`。
- 已建立 16 个推荐一级后端模块骨架。
- 每个模块都有 `routes`、`controller`、`service`、`repository`、`schemas` 和 `README.md`。
- `npm run arch:check` 已接入 CI。
- 后台页面、组件、hooks、`src/lib` 兼容工具层已经没有直接 Supabase 数据库、Storage、RPC、Edge Function、Auth 调用。
- Supabase Edge Function 的 `index.ts` 已作为入口适配器，复杂逻辑已拆到 function-local `service` / `repository`。
- 本次没有新增本地 `/api` 后端，没有改数据库结构，没有改变业务路由。

## Direct Supabase Access Summary

最近一次 `arch:check` 扫描范围：

- `src/pages`
- `src/components`
- `src/hooks`
- `src/lib`
- `supabase/functions/*/index.ts`

当前结果：

| Area | Result | Meaning |
| --- | --- | --- |
| `src/pages` | 0 direct matches | 页面层只负责展示和交互，不直接登录/退出或查库 |
| `src/components` | 0 direct matches | 组件层只负责 UI |
| `src/hooks` | 0 direct matches | hook 层只负责状态和调用封装 |
| `src/lib` | 0 direct matches | 旧兼容工具不再直接访问数据库或 Edge Function |
| `supabase/functions/*/index.ts` | 0 direct matches | Edge Function 入口层不再直接写复杂查询 |

## Completed Migrations

| Module | Main result |
| --- | --- |
| `media` | 媒体库列表、创建、更新、删除、Storage 上传和公共 URL 获取已进入 media module |
| `leads` | 线索列表、详情、报表、前台表单提交已进入 leads module |
| `quotes` | 报价列表、详情、报表已进入 quotes module |
| `followups` | 线索/报价跟进写入已进入 followups module |
| `services` | 服务保存、slug 检查、英文生成后回读、后台读取已进入 services module |
| `projects` | 项目保存、图片管理、slug 检查、英文生成后回读、后台读取已进入 projects module |
| `materials` | 材料保存、slug 检查、英文生成后回读、后台读取已进入 materials module |
| `blog` | 博客保存、slug 检查、英文生成后回读、后台读取已进入 blog module |
| `cms` | CMS 页面/区块/模板/版本读取、公开内容读取、默认内容补齐、内容健康检查已进入 cms module |
| `settings` | 通知设置、站点设置、Telegram 测试、维护提醒测试已进入 settings module |
| `system` | 系统健康、系统日志、地理编码、英文生成、通用后台保存/归档已进入 system module |
| `admin-auth` | session、角色、auth 状态、订阅已进入 admin-auth module |
| `admin-users` | 管理员读取、写入、角色和启用状态修改已进入 admin-users module |
| `seo` | SEO 审计和 sitemap 相关后端逻辑已进入 seo module |

## Current Enforcement Level

`arch:check` 现在会失败拦截这些情况：

- `src/pages` 直接调用 Supabase 数据库、Storage、RPC、Edge Function、Auth。
- `src/components` 直接调用 Supabase 数据库、Storage、RPC、Edge Function、Auth。
- `src/hooks` 直接调用 Supabase 数据库、Storage、RPC、Edge Function、Auth。
- `src/lib` 直接调用 Supabase 数据库、Storage、RPC、Edge Function、Auth。
- 出现未知 backend module 目录。
- backend module 缺少固定层级目录。
- `AGENTS.md` 或 `docs/ARCHITECTURE.md` 缺少固定架构关键词。
- CI 没有运行 `npm run arch:check`。

## Remaining Risk

当前仍处于 Supabase 兼容后端结构，不是独立 Express/Fastify API 后端。

这意味着：

- 浏览器端仍会通过模块封装调用 Supabase SDK 或 Edge Function。
- `src/lib` 仍保留旧 import 兼容入口，但不能再写新的数据库访问。
- 一些旧的通用保存能力已经集中到 system module；后续新增功能时，应该优先放进对应业务模块，而不是继续扩大通用 helper。
- 如果未来真的要做独立后端，再单独规划 `/api`、controller、routes 和部署方式，不要临时硬造。

## Verification

最近一次验证通过：

- `npm run arch:check`
- `npm run typecheck`
- `npm run lint`

后续每次新增或修复，都必须先输出 `Architecture Decision:`，完成后输出 `Architecture Compliance Report:`。
