# 家具产品页：收录策略决策与实施规划

> 日期：2026-11-21
> 对象：`/furniture/product/*` 共 616 个页面
> 结论：**产品页 noindex，分类页保留收录**

---

## 一、先看事实

### 产品页（616 个）实测

| 检查项 | 结果 |
|---|---|
| 可见文本长度 | **193–540 字符**（抽 12 个，全部低于 800） |
| 有价格 | **0 / 12** |
| 规格模板（`Model: / Material: / Color:`） | 3 / 12 |
| 机器翻译痕迹（拉丁学名如 `Larix principis-rupprechtii`） | 9 / 12 |
| URL 形态 | `%E4%BA%91%E5%9B%A2%E6%B2%99%E5%8F%91`（中文拼音百分号编码） |

一个真实例子：

```
标题：Cloud Sofa | FLASH CAST
正文（442 字符）：
  Model: Cloud Sofa
  Material: Baby Fleece/Lambswool
  Color: Optional
  Note: Bottom frame 2 * 8 Larix principis-rupprechtii, 10cm black bandage,
        + serpentine spring, high rebound sponge on the sitting surface + solid wood
```

`Larix principis-rupprechtii` 是落叶松的拉丁学名，明显是从供应商表格机翻过来的。`Color: Optional` 对客户没有任何信息量。

### 分类页（72 个）实测 —— 反而很健康

| 页面 | 可见文本 | 预注入产品链接 |
|---|---|---|
| `/en/furniture` | 5,545 字符 | 18 |
| `/en/furniture/bedroom` | 6,159 字符 | 18 |
| `/en/furniture/dining` | 5,121 字符 | 18 |
| `/en/furniture/living` | 4,477 字符 | 18 |
| `/zh/furniture/dining` | 2,328 字符 | 18 |

**分类页有内容、有内链、有分类文案，是好页面。**

---

## 二、决策

### 产品页 616 个 → `noindex, follow`
### 分类页 72 个 → 保持收录

`follow` 而不是 `nofollow`：产品页仍然传递链接权重给分类页和首页，只是自己不参与索引。

---

## 三、为什么不是「补描述」

| 方案 | 工作量 | 问题 |
|---|---|---|
| 补描述 | 616 × 3 语言 = **1,848 条** | 补完仍然没有价格，客户来了也转化不了 |
| 改 URL | 616 个 slug + 616 条 301 重定向 | 工程量大，收益仅为 CTR |
| 加价格 | 需要你逐项核价 + 库存 | 这是电商运营，不是 SEO |

**核心判断：一家装修公司靠「Kekun Sofa」这类词排名的可能性接近零。**

搜这些词的人是同行或极少数散客，不是你的目标客户。你的客户搜「厨房装修 吉隆坡」「公寓装修报价」。

**这些页面占 sitemap 的 45%，却不服务于任何一个你要抢的词。**

---

## 四、技术实现

复用 Codex 为 privacy/terms 建的机制（`src/lib/publicSitemapExclusions.mjs`），不新造轮子。

### 改动点

**1. 扩展排除规则**

`src/lib/publicSitemapExclusions.mjs` 现在只列了 4 个硬编码路径。改成同时支持前缀匹配：

```js
const excludedPrefixes = ["/en/furniture/product/", "/zh/furniture/product/", "/ms/furniture/product/"];

export function isExcludedFromPublicSitemap(pathname) {
  return excludedPaths.has(pathname)
    || excludedPrefixes.some((p) => pathname.startsWith(p));
}
```

**2. 中间件输出 noindex**

`functions/_middleware.ts` 里对匹配 `/^\/(en|zh|ms)\/furniture\/product\//` 的路径，把 robots 设为 `noindex, follow`。

**3. 生成物自动跟随**

`generate-sitemap.mjs`、`generate-llms.mjs`、`verify-seo-html.mjs` 都已经 import 了 `isExcludedFromPublicSitemap`，改完规则它们自动生效，不用逐个改。

### 注意

- **不能用 `qualification: ineligible` 排除** —— 会触发 `seo_manifest_unqualified` 全局报错，sitemap 直接生成失败
- 产品页本身仍要能正常访问（客户从分类页点进来，或者你发给客户看）

---

## 五、预期效果

| 指标 | 现在 | 改完 |
|---|---|---|
| sitemap URL 数 | 1,379 | **763** |
| 薄页面（<800 字符） | 825 | **209** |
| **薄页面占比** | **60%** | **27%** |
| 索引中的页面 | 1,379 | 763 |

薄页面占比从 60% 降到 27%，这是 Google 判断站点质量的直接信号。

---

## 六、三步走

### 阶段 1：现在就做（可逆）

noindex 616 个产品页 + 从 sitemap 移除。一次提交，随时可以改回来。

**预计效果：** 2–4 周后 Search Console 的「已编入索引」开始下降，「已排除」上升。正常现象。

### 阶段 2：如果家具是生意线

1. 从分类页的访客数据里挑**最热的 30–50 个产品**（等 GA4 数据跑两周）
2. 这 30–50 个补：价格区间 + 三语描述（材质、尺寸、适用空间、保养）
3. 单独从排除列表中放出来，重新收录
4. 其余继续 noindex

**这样是精准投入，不是 616 个一起补。**

### 阶段 3：如果真要做家具电商

需要的是：全站产品数据、库存、价格、结构化数据（Product schema）、URL 规范化（扔掉中文拼音）、结账流程。

**这是另一个项目，不是 SEO 改造能覆盖的。**

---

## 七、风险与回滚

| 风险 | 评估 |
|---|---|
| 失去家具长尾流量 | 实测这些页面没有价格、内容机翻，本来就没有可失去的流量 |
| 客户找不到产品 | 不影响——分类页仍在索引，站内导航不变 |
| Google 判定「隐藏内容」 | 不会——noindex 是标准做法，不是作弊 |

**回滚：删掉 `excludedPrefixes` 那三行，提交即可。** 一次提交，5 分钟。

---

## 八、需要你决定的一件事

**家具到底是不是你的生意线？**

| 你的回答 | 走哪条路 |
|---|---|
| **是**，想认真卖家具 | 阶段 1 先做（止血），再做阶段 2（挑热销款精做） |
| **不是**，只是展厅顺便展示 | 阶段 1 就够了，产品页留着给访客看，不指望它带来搜索流量 |
| **以后可能做** | 阶段 1 先做，等决定做的时候再走阶段 2 |

**三种情况下阶段 1 都该做。** 区别只在于后面要不要投入。

---

## 九、附带发现：URL 本身也是问题

即使将来要把某些产品页放出来收录，URL 也得改：

```
现在的：/en/furniture/product/%E4%BA%91%E5%9B%A2%E6%B2%99%E5%8F%91
应该是：/en/furniture/product/cloud-sofa
```

现在的 URL 是中文拼音的百分号编码，在搜索结果里显示成一串乱码，**点击率会非常低**——就算排上去了也没人点。

这个改动需要 slug 迁移 + 301 重定向，属于阶段 2 或 3 的配套工作，不建议现在做。
