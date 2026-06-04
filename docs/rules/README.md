# Flashcast Rule Index

本目录存放 Flashcast 的专项开发规则。`docs/DEVELOPMENT_RULES.md` 是总入口；这里的文件负责放更细、更容易长期维护的规则。

| 规则 | 文件 | 适用场景 |
| --- | --- | --- |
| 多语言 i18n | `i18n.md` | 页面、组件、后台、SEO、CMS 文案 |
| 用户界面禁止直出技术字段 | `user-facing-technical-fields.md` | 后台表格、系统日志、状态、错误码、通知消息 |
| 组件复用和设计系统 | `component-reuse.md` | UI、组件、Tailwind、后台组件 |
| 表单和数据提交 | `forms-and-submissions.md` | 联系表单、报价表单、后台表单、写入操作 |
| 可访问性和响应式 | `accessibility-responsive.md` | 前台页面、后台关键页面、移动端验收 |
| SEO / GEO / CMS 发布 | `seo-cms-publishing.md` | 公开页面、CMS 内容、sitemap、metadata |
| 依赖管理 | `dependencies.md` | 新增 npm 包、替换库、引入大型功能库 |
| 日志、审计和隐私 | `logging-privacy.md` | 后台敏感操作、线索隐私、日志、备份 |

修改这些规则后，必须运行：

```powershell
npm.cmd run arch:check
```

如果某次规则改动还同步修改了脚本、CI 或运行时代码，再按影响范围补跑 `lint`、`typecheck`、`test`、`build`。
