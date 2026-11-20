# 交给 Codex 的任务单

> 更新日期：2026-11-20 21:50
> 全部为**代码改动**，不涉及 CMS 直写，不违反 AGENTS.md。
> 建议按顺序做，任务 1 收益最大。

---

## 任务 1：修标题里的旧公司名（影响 145 页）

### 现象

全站 1,374 个 URL 中，**145 个页面的 `<title>` 结尾仍是 `| FLASH CAST SDN. BHD.`**，而不是已改成的 `| FLASH CAST`。

| 板块 | 受影响 |
|---|---|
| 博客 | 79 |
| 区域页 | 63 |
| 服务页 | 3 |

### 实测证据（2026-11-20 21:47）

```
数据库 blog_posts.seo_title_en（slug=bathroom-leakage-renovation-malaysia）:
  "Bathroom Leakage Renovation in Malaysia: What to Check First"          ← 无品牌后缀

仓库 functions/seo-manifest.json:
  "...| FLASH CAST SDN. BHD."                                            ← 旧

线上 https://flashcast.com.my/seo-manifest.json:
  "...| FLASH CAST"                                                      ← 新，正确

线上 https://flashcast.com.my/en/blog/bathroom-leakage-renovation-malaysia 的 <title>:
  "...| FLASH CAST SDN. BHD."                                            ← 旧，错误
```

加随机参数绕缓存后结果不变，不是 CDN 缓存问题。

### 已有改动

PR #349 已合并，改了 `scripts/seo-static-pages.mjs` 第 7 行：

```js
// 改前
export const COMPANY = "FLASH CAST SDN. BHD.";
// 改后
export const COMPANY = "FLASH CAST";
```

该常量仅用于标题拼接。schema.org 和其他位置的注册全名未受影响。

### 排查方向

1. **两份 manifest 是否同步。** `seo-generator-consistency.test.mjs` 断言 `public/seo-manifest.json` 与 `functions/seo-manifest.json` 内容一致。线上两者行为不一致，说明构建产物里可能只有一份被重建。

2. **`scripts/generate-seo-manifest.mjs` 第 167 行：**

   ```js
   const rawTitle = title || sectionTitle || existing.title || COMPANY;
   ```

   `existing` 来自上一次的 manifest。如果某条目的 CMS seo_title 为空，标题会沿用旧 manifest 的值——改了常量也不生效。

3. **中间件读的是哪一份。** `functions/_middleware.ts` 第 20 行从 `./seo-manifest.json` 导入。确认部署时这个文件是否被 `prebuild` 覆盖，还是沿用了仓库里提交的旧版本。

4. **`prebuild` 顺序。** `package.json` 的 `prebuild` 依次跑 `generate-sitemap` → `generate-seo-manifest` → `generate-llms`，然后才是 `vite build`。确认 manifest 生成时读到的 CMS 数据是最新的。

### 验收

```bash
curl -s https://flashcast.com.my/en/blog/bathroom-leakage-renovation-malaysia | grep -o '<title>[^<]*'
# 期望结尾为 | FLASH CAST
```

再抽样：
- 3 个博客页
- 3 个区域页（如 `/en/locations/rawang`）
- 2 个服务页

全部不含 `SDN. BHD.`，且 `/seo-manifest.json` 与页面 `<title>` 一致。

---

## 任务 2：FAQ 页面加正文预注入

### 现象

`/en/faq` 初始 HTML 只有 **314 字符**，25 条问答全靠客户端渲染。

FAQPage schema 里有 32 条问答（爬虫能读到结构化数据），但**正文不在初始 HTML**。区域页在修好之前是同一个问题，参考 PR #347 的做法。

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

`buildReadableHomeFaqBody` 内部只认 `/^\/(en|zh|ms)$/` 这种 key，`/en/faq` 不匹配。

### 做法建议

1. 在 `src/lib/publicContentQualification` 之外，中间件对 `key` 匹配 `^\/(en|zh|ms)\/faq$` 时，查询 `faqs` 表：
   ```
   page_key in (general, home)
   status = published
   order by sort_order
   ```
2. 复用 `mapPublicHomeFaqs` 做本地化映射。
3. 在 `readablePublicBody.ts` 里新增或改造构造函数，接受 `/en/faq` 形式的 key。

### 数据现状

`faqs` 表中 `page_key='general'` 有 25 条已发布，含 `question_zh` / `answer_zh`。`page_key='home'` 有 7 条。

### 验收

- `curl https://flashcast.com.my/en/faq` 初始 HTML 可见文本从 314 提到 1000+
- 中文页同样
- HTML 中出现 `data-flashcast-readable-body`
- 三语路由都不报错
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

也不能删 `staticDefs` 里的定义——那会让 middleware 返回 404。

### 验收

- sitemap URL 数从 1,374 降到 1,370
- 生成脚本无报错
- 这 4 个页面本身仍可访问，只是不进 sitemap
- `npm run verify:seo-html` 通过

---

## 任务 4：hreflang 指向不在 sitemap 的页面

### 现象

18 条 hreflang 的 `ms-my` 指向了不在 sitemap 的马来语页面：

```
/en/blog  [ms-my] -> /ms/blog   : target not in sitemap
/en/faq   [ms-my] -> /ms/faq    : target not in sitemap
/en/locations [ms-my] -> /ms/locations : target not in sitemap
... 共 18 条（9 个列表页 × en/zh）
```

原因：这些 `/ms/` 列表页马来语内容不全，被判为不可索引，但 hreflang 仍然声明。

### 做法

hreflang 只对「目标页面可索引」的语言输出 alternate。需要在构建 manifest 或中间件构造 hreflang 时，检查目标页面的资格。

参考：`available_locales` 字段已经在 manifest 里记录每个页面哪些语言可用。让 hreflang 生成读这个字段，而不是无条件输出三语。

### 验收

重跑审计脚本 `python docs/seo/audit_head_tags.py`，`non-reciprocal hreflang` 从 18 降到 0。

---

## 任务 5：材料分类页加正文预注入

### 现象

**122 个材料分类页**全部很薄，初始 HTML 只有 166–427 字符：

```
/en/materials/category/furniture    211 字符
/zh/materials/category/bathroom     427 字符
/zh/materials/category/furniture    166 字符
```

页面内容是「标题重复两次 + 一句话 + URL」，商品列表在客户端渲染。

### 数据与文案现状

- 分类文案在 `src/i18n/materialCatalogText.ts`，52 个键 × 3 语言
- **不要直接改这个文件**：`materialCatalogText.test.ts` 要求英文值与 `src/data/materials.ts` 逐字一致，且中文不得含拉丁字母、马来语不得含汉字。改一句话要三方同步
- 另外 `furnitureCategoryPageCopy` 只给 `bedroom` 一个分类写了专属文案，其余全部回退

### 建议做法

优先做预注入（正文里带商品列表），而不是改文案：

1. 商品数据来自 `materials` 表（`category` 字段区分）
2. 参考 `buildReadableCollectionBody` 的模式，为 `/materials/category/{key}` 构造带商品链接的预注入正文
3. 商品名 + 一句规格 + 链接，不需要价格

### 验收

- `curl https://flashcast.com.my/en/materials/category/furniture` 可见文本从 211 提到 800+
- 抽查 5 个分类页（中英各若干）
- sitemap 数量不变

---

## 不要做的事

| 禁止 | 原因 |
|---|---|
| 直接写 `service_areas` / `faqs` / `materials` / `services` 表 | AGENTS.md 明令禁止绕过 content-publish |
| 用 qualification 标记排除页面 | 会触发 `seo_manifest_unqualified` 全局报错 |
| 改 `hasCompleteMalayContent` 判定 | 会让马来语未完成的页面进 sitemap |
| 删除 `staticDefs` 里的 privacy/terms 定义 | 会让页面变 404 |
| 新增一级模块 | 架构固定 16 个 |

---

## 全站现状（供判断影响面）

最近一次审计，1,374 个 URL 全部 200：

```
重复 title                  0 组
超长 title（>60 显示宽度）   约 140 个
缺 title / 缺 description   0 / 0
canonical 非自指            0
缺 hreflang                 0
死链（295 条内链抽查）        0
薄页面（<800 字符）          844 个（其中家具产品 674）
title 含旧公司名            145 个  ← 任务 1
```

可用工具（都已入库）：

```bash
python docs/seo/seo_audit.py            # 标题/描述/schema/薄页面
python docs/seo/audit_head_tags.py      # canonical / hreflang / OG
python docs/seo/check_internal_links.py # 内部链接
```
