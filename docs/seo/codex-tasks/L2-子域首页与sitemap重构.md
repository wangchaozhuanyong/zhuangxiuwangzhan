# L2 · 电子锁子域首页 SEO 重构 + sitemap 扩容 + llms.txt

> 投放对象：Codex
> 前置：无（可与 L1 并行，但 sitemap 改动以 L1 的 54 条为准）
> 预计改动：小到中（3 个 HTML + 1 个 sitemap + 1 个 llms.txt + 卡片链接）

---

## 1. 项目背景

`locks.flashcast.com.my` 是 ANZHE 电子锁展示站，三语静态页，由 `functions/anzheShowroom.ts` 转发 `public/anzhe-showroom/{zh,en,ms}/index.html`。

线上实测（2026-11-21）：

| 项 | 现状 | 问题 |
|---|---|---|
| H1 | `<h1 id="hero-title">V37J-P16</h1>` | 品牌型号占据唯一 H1，品类词（电子锁/digital lock/kunci digital）完全没有排名信号 |
| 结构化数据 | `CollectionPage` + `Organization` | 无 `Product`、无 `FAQPage`、无 `ItemList` |
| 目录区 | 17 款在 JS 里分页（1–12 / 17） | 第 13–17 款在初始 HTML 里**没有链接**，爬虫抓不到 |
| 型号卡片 | `<div>` 块，无 `<a href>` | 17 张卡片没有一处可点击的索引入口 |
| sitemap | 3 条 | 收录面积极小 |
| AI 可读性 | 无 `llms.txt` | ChatGPT / Perplexity 抓不到结构化事实 |

---

## 2. 本次目标

1. H1 归位到品类 + 地域词，型号降为 H2
2. 17 张型号卡片全部变成真实 `<a href="/{lang}/lock/{slug}/">` 链接
3. 首屏加“直接答案”块（GEO）
4. JSON-LD 补 `ItemList` + `FAQPage`，`Organization` 补 `sameAs` / `priceRange` / `areaServed`
5. 新增 `llms.txt`
6. sitemap 扩到 54 条（依赖 L1）

---

## 3. 动手前必须回答的 Architecture Decision

```text
Architecture Decision:
1. Target module:
2. Why this module:
3. Target layer:
4. Why this layer:
5. Files allowed to edit:
6. Files forbidden to edit:
7. API paths affected:
8. Database access location:
9. Cross-module dependency risk:
10. Business behavior impact:
```

判断参考：这是静态资产改动，不涉及 16 个后端模块；不改主站中间件。

---

## 4. 允许修改 / 禁止修改

### 允许修改

```
public/anzhe-showroom/{zh,en,ms}/index.html
public/anzhe-showroom/sitemap.xml
public/anzhe-showroom/llms.txt            ← 新增
public/anzhe-showroom/strings.js          ← 只允许新增 key，不得删改现有 key
scripts/generate-anzhe-boot.mjs           ← 若资源指纹需要重新生成，跑它而不是改它
```

### 禁止修改

```
functions/_middleware.ts
src/pages/**  src/routes/**  src/data/**
scripts/generate-sitemap.mjs
package.json 的现有 script（可新增，不可改现有）
```

---

## 5. 硬性实现要求

### 5.1 H1 与标题

每个语言各自的 H1（只允许一个 `<h1>`）：

| 语言 | H1 |
|---|---|
| zh | `吉隆坡电子锁｜ANZHE 智能门锁 含安装` |
| en | `Digital Lock Kuala Lumpur & Selangor｜ANZHE Smart Locks with Installation` |
| ms | `Kunci Digital Kuala Lumpur & Selangor｜Kunci Pintu ANZHE dengan Pemasangan` |

- 原 `<h1 id="hero-title">V37J-P16</h1>` 改成 `<h2>`
- **必须保留现有 CSS 视觉**：类名/尺寸不变，只改标签层级；改完在 390×844 与 1440×900 两种视口截图对比，字号与行高不得变化
- `<title>` 保持现状（各语言已有），只确认不含型号重复

### 5.2 直接答案块（GEO）

在 H1 下方、产品 hero 之前插入一段，三语各自版本，40–60 字：

```
zh：ANZHE 电子锁在吉隆坡与雪兰莪销售并含安装，17 款型号覆盖入户门、室内门与窄框铝门，价格 RM635.20 起，安装前先核对门厚、锁体与门框宽度。
en：ANZHE digital locks are sold and installed across Kuala Lumpur and Selangor. 17 models cover entrance doors, interior doors and narrow-frame aluminium doors, from RM635.20 including installation, with door thickness and lock body checked before installation.
ms：Kunci digital ANZHE dijual dan dipasang di Kuala Lumpur dan Selangor. 17 model meliputi pintu utama, pintu dalaman dan pintu aluminium bingkai sempit, bermula RM635.20 termasuk pemasangan, dengan ketebalan pintu dan badan kunci diperiksa sebelum pemasangan.
```

要求：

- 用 `<p class="seo-answer">`，CSS 复用现有正文样式，不新造视觉
- 这段文字必须在初始 HTML 中（`curl` 可见），不能由 JS 注入

### 5.3 型号卡片链接化

`catalog.js` 渲染的逻辑在 `directory.js` / `panels.js` 里。找到生成卡片的函数，把卡片根节点改成 `<a>`：

```html
<a class="lock-card" href="/zh/lock/v37j-p16/" aria-label="V37J-P16 电子锁 含安装 RM2,360">
  ...
</a>
```

要求：

- slug 由 `model.id` 直接得到（现有 id 已符合 slug 规则：`a88-face-id`、`g86f-pro`、`k26j-pro`、`p59j-pro`、`v37j-p16`、`g53-pro` 等都合法）
- 语言前缀取当前页面语言
- **第 13–17 款（K16J-K19、Q58J-K19、V37J-P16、P59J PRO 等）必须在初始 HTML 中存在可抓取链接**：把“型号索引”区（`型号索引 17 款型号` 那 17 个缩略图）也改成链接，它是全量 17 款的静态入口
- 不得改动卡片内价格格式化函数 `formatShowroomPrice`

### 5.4 JSON-LD

在现有 `CollectionPage` 脚本里追加：

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "ANZHE 电子锁型号",
  "numberOfItems": 17,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://locks.flashcast.com.my/zh/lock/v37j-p16/" }
  ]
}
```

`Organization` 补：

```json
{
  "sameAs": ["https://flashcast.com.my/zh/services/digital-lock"],
  "areaServed": ["Kuala Lumpur", "Selangor"],
  "priceRange": "RM635.20 - RM2,960",
  "telephone": "+601128853888",
  "address": { "@type": "PostalAddress", "streetAddress": "94, Jalan Mega Mendung, Taman United", "postalCode": "58200", "addressLocality": "Kuala Lumpur", "addressCountry": "MY" }
}
```

`FAQPage` 至少 4 条，问题必须用真实搜索句式：

```
吉隆坡公寓的门能装电子锁吗？
电子锁含安装的价格从多少起？
旧锁孔需要另外开孔吗？
电子锁断电了怎么开门？
```

### 5.5 llms.txt

新增 `public/anzhe-showroom/llms.txt`（`functions/anzheShowroom.ts` 的 `staticFiles` 正则要加 `llms\.txt`，否则 404）：

```markdown
# ANZHE Digital Lock Showroom — FLASH CAST

> ANZHE electronic locks sold and installed in Kuala Lumpur and Selangor, Malaysia.
> 17 models, all prices in MYR and inclusive of installation.

## Key facts
- Business: FLASH CAST SDN. BHD.
- Address: 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur
- Phone / WhatsApp: +601128853888
- Hours: 10:00-19:00 daily (Malaysia time)
- Service area: Kuala Lumpur and Selangor
- Price range: RM635.20 - RM2,960 including installation
- Models: 17 (entrance door 14, interior door 2, narrow-frame aluminium door 1)

## Pages
- [Chinese catalogue](https://locks.flashcast.com.my/zh/)
- [English catalogue](https://locks.flashcast.com.my/en/)
- [Malay catalogue](https://locks.flashcast.com.my/ms/)
- [Installation service page](https://flashcast.com.my/en/services/digital-lock)

## Models
| Model | Door type | Price (MYR, incl. installation) | Unlock methods |
| V37J-P16 | Entrance | 2360 | Palm vein, hidden fingerprint, PIN, card, key, app |
...
```

型号表必须与 `catalog.js` 完全一致，价格不许四舍五入错。

### 5.6 sitemap 与 staticFiles

- sitemap 54 条（与 L1 一致），三语 `xhtml:link` 互指
- `functions/anzheShowroom.ts` 的 `staticFiles` 正则加入 `llms\.txt`

---

## 6. 验收标准

- [ ] 三语首页各有且仅有一个 `<h1>`，内容符合 5.1
- [ ] H1 视觉与改造前一致（两种视口截图对比，字号/行高/换行无变化）
- [ ] `curl -s https://locks.flashcast.com.my/zh/ | grep -o 'lock/v37j-p16'` 有结果
- [ ] 初始 HTML 中 17 个 `/{lang}/lock/{slug}/` 链接全部存在（`grep -c` 计数 = 17）
- [ ] `curl https://locks.flashcast.com.my/llms.txt` → 200，`content-type: text/plain`
- [ ] JSON-LD 通过 schema 校验，`ItemList.numberOfItems = 17`
- [ ] FAQPage 问题与页面可见文本一致
- [ ] sitemap 54 条，无 404
- [ ] `node scripts/generate-anzhe-boot.mjs --check` 通过
- [ ] 禁用 JS 后仍能看到 H1、直接答案段、17 个型号链接
- [ ] 移动端无横向溢出

---

## 7. 必须运行的命令

```bash
node scripts/generate-anzhe-boot.mjs
npm run arch:check
npm run typecheck
npm run lint
npm run verify:interaction-standards
```

---

## 8. 必须输出的报告

```text
Architecture Decision: 1-10

Architecture Compliance Report: 1-10

## 三语 H1 实际渲染值
## 17 个型号链接清单（复制 grep 输出，不要手打）
## 改造前后视觉对比（两张截图路径）
## llms.txt 与 catalog.js 价格一致性核对表
## 未完成项
```

---

## 9. 边界与失败处理

| 情况 | 处理 |
|---|---|
| 改 H1 后视觉位移 | 保留原 `id="hero-title"` 上挂的 class，只换标签 |
| 卡片加链接后布局塌 | 链接用 `display:contents` 或继承卡片 class，不改 grid |
| `directory.js` 有分页逻辑拦住第 13 款 | 只改“型号索引”缩略图区，不动分页交互 |
| llms.txt 需要新增 staticFiles 白名单 | 与 L1 同一处正则，合并为一次改动 |
| 拿不到 17 款完整规格 | 型号表只写已有字段，缺的写“待确认” |
