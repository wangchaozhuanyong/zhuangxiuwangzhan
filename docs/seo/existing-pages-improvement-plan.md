# 现有功能完善：任务分配清单

> 日期：2026-11-22
> 原则：**不新增功能，只完善已上线的页面。**
> 分工：代码改动归 Codex，CMS/文案归我，业务动作归业主。

---

## 一、实测缺陷清单

| # | 缺陷 | 实测数据 | 影响 |
|---|---|---|---|
| 1 | `/locations` 枢纽页无内链 | 初始 HTML 253 字符，渲染 7,525；**指向 30 个区域页的 `<a href>` = 0 条** | 30 个区域页收不到枢纽页权重 |
| 2 | 5 个页面缺预注入 | about 301/3,631、contact 249/2,183、quote 1,054/2,680、promotions 263/1,257、custom-cabinets 403/1,778 | 爬虫看不到正文 |
| 3 | 9 篇博客正文过薄 | 英文 468–753 字符、中文 187–323 | 可索引的低质页面 |
| 4 | 3 个区域页压线 | klang 774、balakong 780、cyberjaya 783 | 差 16–26 字符到 800 门槛 |
| 5 | 15 个组合页缺马来语 | `serviceAreaPageText.json` 中 21 个页面仅 6 个有 ms | 三语不一致 |

---

## 二、我做（CMS 内容 + 文案）

### A1. 9 篇薄博客补写正文

**归属**：`blog_posts` 表（`content_en` / `content_zh` / `content_ms`）

| 文章 | 现状 en | 现状 zh | 现状 ms |
|---|---|---|---|
| artistic-wall-coating-guide-remmers | 468 | 187 | 704 |
| landed-house-renovation-selangor | 477 | 207 | 806 |
| area-guide-kl-selangor-renovation | 503 | 260 | 860 |
| bathroom-leakage-renovation-malaysia | 507 | 192 | 838 |
| how-to-plan-condo-renovation-kl | 517 | 202 | 715 |
| renovation-payment-schedule-malaysia | 533 | 230 | 951 |
| old-house-renovation-checklist | 617 | 268 | 930 |
| old-house-renovation-hidden-costs-malaysia | 691 | 323 | 1,212 |
| shoplot-renovation-permit-malaysia | 753 | 302 | 1,146 |

**目标**：英文 ≥ 2,500 字符，中文 ≥ 1,200 字符，马来语 ≥ 2,500 字符。保持原文主题，扩写为完整文章。

**内容要求**：
- 保留原有论点，补充具体做法、判断标准、常见错误
- 问句式 H2 做可抽取的答案结构
- 内链指向已有服务页和区域页
- **不编造价格、工期、客户案例**

**做法**：三篇一批，每批写完后由我直接发到 `blog_posts`（乐观锁 + 快照）。

### A2. 3 个区域页补到 800+

**归属**：`service_areas` 表（`content_zh`）

```
/locations/klang      774 → 目标 900+
/locations/balakong   780 → 目标 900+
/locations/cyberjaya  783 → 目标 900+
```

各补 2–3 句该区特有的内容（楼盘类型、施工条件）。**不编造具体楼盘名。**

### A3. 6 个装修组合页补马来语文案

**归属**：`src/components/services/serviceAreaPageText.json`（内容型 JSON，非逻辑代码）

需要补 ms 的 6 个页面（另 9 个是电子锁，归 Codex）：

```
/locations/kuala-lumpur/condo-renovation
/locations/petaling-jaya/kitchen-renovation
/locations/cheras/condo-renovation
/locations/subang-jaya/landed-house-renovation
/locations/selangor/office-renovation
/locations/petaling-jaya/landed-house-renovation
```

**为什么归我**：这是纯文案，不涉及渲染逻辑。但改的是 `src/` 下的文件，**提交前需要确认 Codex 没有同时改这个文件**。

---

## 三、Codex 做（代码）

### B1. `/locations` 枢纽页预注入 + 内链 ← 最高优先

**问题**：初始 HTML 253 字符，`<a href>` 指向区域页 0 条。

**要求**：

1. 中间件对 `/{lang}/locations` 拉取 `service_areas` 已发布记录
2. 注入正文：页面标题 + 30 个区域的名称与简述
3. **必须包含 30 条 `<a href="/{lang}/locations/{slug}">`**
4. 带 `data-flashcast-readable-body` 标记
5. 用 `<ul><li>` 不用 `<table>`（预注入白名单不含 table）

**验收**：

```bash
curl -s https://flashcast.com.my/en/locations \
  | grep -o 'href="/en/locations/[a-z0-9-]*"' | sort -u | wc -l
# 期望：30（或 31，含自身）

curl -s https://flashcast.com.my/en/locations | grep -c 'data-flashcast-readable-body'
# 期望：1
```

- [ ] 英文页可见文本从 253 → ≥ 2,000
- [ ] 中文页从 178 → ≥ 1,200
- [ ] 马来语页从 279 → ≥ 2,000
- [ ] 30 条区域页链接出现在初始 HTML

### B2. 五个页面加预注入

| 页面 | 现状 | 目标 |
|---|---|---|
| `/{lang}/about` | 245–329 | ≥ 1,200 |
| `/{lang}/contact` | 230–249 | ≥ 900 |
| `/{lang}/quote` | 454–1,184 | ≥ 1,000 |
| `/{lang}/promotions` | 171–263 | ≥ 900 |
| `/{lang}/custom-cabinets` | 183–436 | ≥ 1,200 |

**做法**：沿用 `functions/readablePublicBody.ts` 已有的构造函数模式，在 `readableBodyPaths` 里登记这些路径。

**注意**：
- `custom-cabinets` 已有部分预注入（marker=True），是扩展不是新建
- 不得改 `qualification`，否则触发 `seo_manifest_unqualified`

### B3. 9 个电子锁组合页补马来语

**归属**：`serviceAreaPageText.json` + 子域，属电子锁范围。

```
/locations/{petaling-jaya,cheras,subang-jaya,mont-kiara,bangsar,puchong,selangor,shah-alam,kajang}/digital-lock
```

---

## 四、业主做（业务动作）

| # | 事项 | 为什么只能你做 |
|---|---|---|
| 1 | **索评 3 → 10 条** | 需要联系真实客户 |
| 2 | **外链 0 → 有**（家具品牌方经销商名录最现实） | 需要对外沟通 |
| 3 | **CIDB 档案电话更新**（`01-23381417` → `011-2885 3888`） | 需登录 CIMS |
| 4 | GBP 第 2 条资质帖重提（改稿已备好） | 需登录后台 |
| 5 | 确认 about 页是否公开 CIDB 号与 G3 等级 | 公开商业声明需你点头 |
| 6 | before/after 照片（如果将来找到） | 只有你有素材 |

---

## 五、执行顺序

```
第一批（并行）
├─ Codex：B1 枢纽页预注入 ← 影响最大，先做
├─ 我：A1 前 3 篇博客扩写
└─ 你：索评启动

第二批
├─ Codex：B2 五个页面预注入
├─ 我：A1 中间 3 篇
└─ 我：A2 三个区域页补 60 字

第三批
├─ 我：A1 后 3 篇
├─ 我：A3 六个组合页马来语
└─ Codex：B3 九个电子锁组合页马来语
```

---

## 六、不要做的事

| 禁止 | 原因 |
|---|---|
| 新增页面类型或新板块 | 本轮只完善现有页面 |
| 用 `qualification: ineligible` 排除 | 触发全局 sitemap 报错 |
| 编造价格 / 工期 / 客户案例 / 楼盘名 | 公开商业声明有实际风险 |
| 为了达标而注水（重复句、空话） | 薄页面变成垃圾页面更糟 |
| 改 `furnitureCatalog.json` | 供应商快照，改动破坏溯源 |
| 提交 `scripts/seo-greyhat/` | 灰帽脚本，不应进仓库 |
| 提交 `functions/anzheShowroom.ts` | Codex 正在改，冲突风险 |
