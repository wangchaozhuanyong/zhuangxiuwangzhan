# 交给 Codex 的任务单

> 生成日期：2026-11-20
> 背景：SEO 内容层已由另一个执行方完成，以下三项是**代码改动**，属于 Codex 的职责范围，且都不涉及 CMS 直写。

---

## 任务 1：修 manifest 标题不一致（优先级最高）

### 现象

博客页和服务页的线上 `<title>` 仍然带着旧公司名 `FLASH CAST SDN. BHD.`，但站点已把 title 后缀改成 `FLASH CAST`。

### 实测证据（2026-11-20 17:40 左右）

```
数据库 blog_posts.seo_title_en:
  "Bathroom Leakage Renovation in Malaysia: What to Check First"        ← 无品牌后缀

仓库里 functions/seo-manifest.json:
  "Bathroom Leakage Renovation in Malaysia: What to Check First | FLASH CAST SDN. BHD."

线上 https://flashcast.com.my/seo-manifest.json:
  "Bathroom Leakage Renovation in Malaysia: What to Check First | FLASH CAST"   ← 新的，对

线上 https://flashcast.com.my/en/blog/bathroom-leakage-renovation-malaysia 的 <title>:
  "Bathroom Leakage Renovation in Malaysia: What to Check First | FLASH CAST SDN. BHD."  ← 旧的，错
```

加随机参数绕缓存后结果不变，所以不是 CDN 缓存。

### 已有改动

PR #349 已合并，把 `scripts/seo-static-pages.mjs` 第 7 行的常量改了：

```js
// 改前
export const COMPANY = "FLASH CAST SDN. BHD.";
// 改后
export const COMPANY = "FLASH CAST";
```

该常量只用于标题拼接，schema.org 和其他地方的注册全名未受影响。

### 需要排查的方向

1. **两份 manifest 是否同步**。`seo-generator-consistency.test.mjs` 断言 `public/seo-manifest.json` 与 `functions/seo-manifest.json` 内容一致。线上两者行为不一致，说明构建产物里可能只有一份被重建。
2. **`generate-seo-manifest.mjs` 第 167 行**：

   ```js
   const rawTitle = title || sectionTitle || existing.title || COMPANY;
   ```

   `existing` 来自上一次的 manifest。如果 CMS 的 seo_title 为空，标题就会沿用旧 manifest 的值，形成"改了常量但线上不变"的假象。需要确认博客和服务的实际分支走的是哪条路径。

3. **中间件用的到底是哪一份**。`functions/_middleware.ts` 第 20 行从 `./seo-manifest.json` 导入。确认部署时这个文件是否被 prebuild 覆盖，还是沿用了仓库里提交的旧版本。

### 验收

- `curl https://flashcast.com.my/en/blog/bathroom-leakage-renovation-malaysia` 的 `<title>` 结尾为 `| FLASH CAST`
- 抽样 5 个服务页同样
- `/seo-manifest.json` 与页面 `<title>` 一致
- `npm run verify:seo-html` 通过

### 已知影响面

修复后约 56 个页面（博客 46 + 服务 9 + 其他 1）的标题各缩短 10 个字符。

---

## 任务 2：FAQ 页面加正文预注入

### 现象

`/en/faq` 初始 HTML 只有 **314 字符**，25 条问答全靠客户端渲染。FAQPage schema 里有 32 条（爬虫能读），但**正文不在初始 HTML**。

区域页修好之前是同一个病，参考 PR #347 的做法。

### 现状代码

`functions/_middleware.ts` 第 2431 行：

```js
|| buildReadableHomeFaqBody(key, homeFaqs, meta);
```

但 `homeFaqs` 只对首页有值：

```js
const homeFaqs = shouldInjectHomeBundle && isHomePageKey(key)
  ? mapPublicHomeFaqs(homeContentBundle?.faqs, key === "/zh" ? "zh" : "en")
  : [];
```

而 `buildReadableHomeFaqBody` 内部只认 `/^\/(en|zh|ms)$/` 这种 key，`/en/faq` 不匹配。

### 做法建议

1. 在 `readablePublicBody.ts` 里新增或改造一个构造函数，让它接受 `/en/faq` 形式的 key。
2. 中间件对 `key` 匹配 `^\/(en|zh|ms)\/faq$` 时，查询 `faqs` 表（`page_key in (general, home)`，`status = published`，按 `sort_order`），复用 `mapPublicHomeFaqs` 做本地化映射。
3. 注意 `pickLocalizedFaq` 之类的现有工具：`question_zh` / `answer_zh` 可能为空，需要有兜底策略。

### 验收

- `curl https://flashcast.com.my/en/faq` 初始 HTML 可见文本从 314 提到 1000+
- 中文页同样
- 页面 HTML 里能看到 `data-flashcast-readable-body`
- 加 `--lang` 三语路由都不报错
- 现有 `readablePublicBody.malay.test.ts` 等测试仍通过

---

## 任务 3：privacy / terms 移出 sitemap

### 现象

4 个页面在 sitemap 里，但对 SEO 无价值，占用索引额度：

```
/en/privacy   142 字符
/en/terms     146 字符
/zh/privacy   148 字符
/zh/terms     146 字符
```

### 做法

在 `scripts/generate-sitemap.mjs` 里加排除列表。

**注意**：不能用「把 `qualification` 标成 not-eligible」的方式排除。`buildQualifiedSitemap` 对任何 `source_complete !== true` 或 `qualification !== "eligible"` 的行会直接抛 `seo_manifest_unqualified`，整份 sitemap 生成失败。

### 验收

- sitemap URL 数从 1,367 降到 1,363
- 生成脚本无报错
- 这 4 个页面本身仍可访问，只是不进 sitemap

---

## 不要做的事

| 禁止 | 原因 |
|---|---|
| 直接写 `service_areas` / `faqs` / `materials` 等内容表 | AGENTS.md 明令禁止绕过 content-publish |
| 用 qualification 标记来排除页面 | 会触发全局校验报错 |
| 改 `hasCompleteMalayContent` 的判定 | 会导致马来语未完成的页面进 sitemap |
| 新增一级模块 | 架构固定 16 个 |

---

## 上下文数据（供判断影响面）

最近一次全站审计（1,367 个 URL，全部 200）：

```
重复 title           0 组
超长 title（>60宽）  178 个（博客 48 / 材料 44 / 项目 41 / 家具 29 / 服务 9 / 其他 7）
缺 title             0
缺 description       0
sitemap 里的 noindex 0
薄页面（<800 字符）  844 个
description >160     543 个
description <50      165 个
```

审计脚本已入库：`python docs/seo/seo_audit.py`
