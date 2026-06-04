# SEO / GEO / CMS 发布规则

Flashcast 是公开获客网站，SEO 和 CMS 发布链路必须稳定。后台内容改动必须能在前台真实显示。

## 公开页面必须有

- `title`
- `description`
- `canonical`
- `hreflang`
- Open Graph / social image
- 必要的 JSON-LD 结构化数据

## 多语言 SEO 规则

- 中文页面用中文 SEO 文案。
- 英文页面用英文 SEO 文案。
- 不允许所有页面共用同一个标题和描述。
- 新增公开页面时必须同步考虑 `/zh` 和 `/en`。

## CMS 发布规则

- 后台保存成功不等于完成，必须验证前台真实读到并显示。
- 后台 seed、数据库内容、前台读取、SEO manifest 不能互相矛盾。
- 新增 CMS 页面、服务、案例、材料、博客时，必须确认列表页、详情页、sitemap、SEO、语言切换是否受影响。
- 改 slug、删除页面、下线内容时，必须考虑旧链接、重定向、404、sitemap 和搜索引擎影响。
- `functions/seo-manifest.json`、`public/seo-manifest.json`、`public/sitemap.xml` 这类生成物不能手工乱改，优先用现有脚本生成。

## 生成和验证

- SEO HTML 检查优先运行 `npm run verify:seo-html`。
- 预览检查优先运行 `npm run verify:preview` 或 `npm run verify:preview:server`。
- sitemap、SEO manifest、LLMS 内容优先使用现有脚本生成。

## 禁止事项

- 禁止只改后台字段，不验证前台读路径。
- 禁止只改中文 SEO，不补英文 SEO。
- 禁止手工乱改生成物后不说明来源。
- 禁止删除或改 slug 时不考虑旧链接和搜索引擎影响。
