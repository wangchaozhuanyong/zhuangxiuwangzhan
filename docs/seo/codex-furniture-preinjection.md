# 交给 Codex 的任务：家具产品页预注入

> 生成日期：2026-11-21
> 背景：家具是主营，308 个产品（en+zh 各 308 = 616 页）有图、有规格、150 个有价格。
> **问题不在内容，在爬虫看不到。** 和区域页、FAQ 修好前是同一个病。
> 参考已完成的同类修复：PR #347（区域页）、FAQ 预注入（PR #360 系列）。

---

## 任务：给家具产品页加正文预注入

### 现象（实测）

```
用户渲染后：  536–1,006 字符，含 RM1,900.00 这样的价格
爬虫初始 HTML： 368–457 字符，无价格，无 data-flashcast-readable-body
```

四个样本的实测数据：

| 产品 slug | 初始 HTML | 渲染后 | 页面含价格 |
|---|---|---|---|
| `ws-2102-wooden-bunk-bed-white` | 368 | 1,006 | RM1,900.00 |
| `cloudy-3-seater-easy-clean-sofa-beige` | 457 | 590 | RM1,900.00 |
| `dophin-queen-size-bedframe-blue` | 418 | 536 | RM1,872.00 |
| `bb-606-heavy-duty-full-solid-bunk-bed` | 454 | — | 有 |

### 数据在哪

**不需要查数据库。** 商品数据是仓库里的静态文件：

```
src/data/furnitureCatalog.json          730 KB，308 个产品，主数据
src/data/furnitureCatalogEn.json        161 KB，英文覆盖
src/data/furnitureCatalogZh.json        226 KB，中文覆盖
src/data/furnitureDisplaySafety.json      6 KB，3 个产品的人工审核覆盖
```

产品记录字段（实测）：

```json
{
  "slug": "ws-2102-wooden-bunk-bed-white",
  "name": "WS 2102 Wooden Bunk Bed-White",
  "shortDescription": "WS 2102 solid wood double decker bunk bed\nProduct size: L202 x W97 x H155cm\n...",
  "description": "...",
  "sku": "WS 2102-WHITE",
  "price": "RM1,900.00",
  "images": [...],
  "sourceUrl": "https://huaxia.my/product/...",
  "sourceCategories": [...]
}
```

**308 个产品里 150 个有 `price` 字段**，其余为空（预售/询价）。

已有的解析入口：`src/lib/furnitureCatalog.ts` 和 `src/lib/furnitureDisplaySafety.mjs`（`resolveFurnitureDisplay`）。预注入应该复用这两个，不要另写一套解析。

### 做法

1. 在 `functions/readablePublicBody.ts` 增加一个家具产品页的构造函数，或在现有函数里加分支。
2. `functions/_middleware.ts` 里对匹配下面路径的请求调用它：
   ```
   /^\/(en|zh)\/furniture\/product\/(.+)$/
   ```
   注意：**没有 ms 版本**，家具只有 en 和 zh。
3. 构造的正文应包含：
   - `<h1>` 产品名
   - 价格（有则显示金额；无则显示 "Price on request" / "价格请咨询"）
   - SKU
   - 规格描述（`shortDescription` 按换行拆成段落）
   - 产品图片的 alt
   - 所属分类的链接（如 `/en/furniture/bedroom/bed-frame`）
   - 同分类的其他产品链接（3–5 个）
4. 输出必须带 `data-flashcast-readable-body` 标记，和区域页保持一致。

### 验收

```bash
curl -s https://flashcast.com.my/en/furniture/product/ws-2102-wooden-bunk-bed-white \
  | grep -c 'data-flashcast-readable-body'
# 期望：1

curl -s https://flashcast.com.my/en/furniture/product/ws-2102-wooden-bunk-bed-white \
  | grep -o 'RM1,900.00'
# 期望：能有输出
```

逐项确认：

- [ ] 初始 HTML 可见文本从 368 → **1,000+ 字符**
- [ ] 初始 HTML 里能看到价格
- [ ] 中文页同样（`/zh/furniture/product/...`）
- [ ] 没有价格的产品显示 "Price on request"，不是空白
- [ ] 分类页（`/en/furniture/bedroom` 等）行为不变
- [ ] `npm run verify:seo-html` 通过
- [ ] 抽样 10 个产品页全部达标

### 不要做的事

| 禁止 | 原因 |
|---|---|
| 给产品页加 noindex | 家具是主营，产品有价格有规格，不该排除 |
| 改 `furnitureCatalog.json` 的数据 | 那是供应商快照，改动会破坏溯源 |
| 改 `furnitureDisplaySafety.json` 的 3 条审核覆盖 | 那是人工审核过的，针对标题与描述不一致的商品 |
| 新造一套产品解析逻辑 | 复用 `furnitureCatalog.ts` 和 `resolveFurnitureDisplay` |
| 用 `qualification: ineligible` 做任何排除 | 会触发 `seo_manifest_unqualified` 全局报错 |

---

## 可选任务（排在预注入之后）：URL 改用英文 slug

### 现象

数据里本来就有英文 slug：

```
slug 字段：ws-2102-wooden-bunk-bed-white
实际 URL：/en/furniture/product/%E4%BA%91%E5%9B%A2%E6%B2%99%E5%8F%91
```

页面路由用了中文拼音的百分号编码，搜索结果里显示成一串乱码。

### 做法

1. 路由改用 `slug` 字段
2. 旧的中文拼音 URL 加 301 → 新 URL
3. sitemap 输出新 URL
4. 站内链接全部换新

### 注意

- **这是 616 个重定向**，工作量不小
- 必须在预注入完成之后再动，否则两个改动混在一起不好排查
- 迁移期间新旧 URL 都要能访问

---

## 附：一个与本任务无关但值得记录的发现

全站统计是完整的（我实测过）：

```
GA4          G-LLJGRG2YNP
Google Ads   AW-18205206146
事件          page_view / cta_click / whatsapp_click / phone_click
             quote_form_submit / quote_form_success / generate_lead / conversion / web_vital
```

但 GA4 后台「关键事件数 = 0」——**事件在发，只是没人标记为关键事件**。这是后台配置，不是代码问题，不需要处理。
