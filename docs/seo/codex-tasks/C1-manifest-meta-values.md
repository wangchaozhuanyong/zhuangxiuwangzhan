# C1 配套：15 条 manifest meta（5 组合 × 3 语言）

> 用途：直接粘进 `scripts/seo-static-pages.mjs` 的 `staticDefs` 数组。
> 这些值会同时进入中间件判定（决定 200/404）和 sitemap（决定收录），所以必须是能直接上线的真实文案。
> **不要再改写成占位符**。改字符数会导致 title 被截断。

---

## 1. 15 条定义

```js
// ── 服务 × 区域交叉页（C1）────────────────────────────────
// 5 组合 × 3 语言。path 不带语言前缀，buildStaticManifest 会自动拼 /en /zh /ms。
{
  lang: "en",
  path: "/locations/kuala-lumpur/kitchen-renovation",
  title: "Kitchen Renovation Kuala Lumpur | FLASH CAST",
  description: "Kitchen renovation in Kuala Lumpur for condos and landed homes. Custom cabinets, wet and dry kitchen layout, quartz tops, plumbing and electrical coordination. Site visit and itemised quotation.",
  keywords: "kitchen renovation kuala lumpur, kitchen cabinet kl, custom kitchen cabinet malaysia, wet kitchen dry kitchen",
  schemaType: "Service",
  entityName: "Kitchen Renovation Kuala Lumpur",
},
{
  lang: "zh",
  path: "/locations/kuala-lumpur/kitchen-renovation",
  title: "吉隆坡厨房装修｜定制橱柜｜FLASH CAST",
  description: "吉隆坡公寓与有地住宅厨房装修。定制橱柜、干湿厨房布局、石英石台面、水电协调，含现场测量与分项报价。",
  keywords: "吉隆坡厨房装修, 厨房橱柜定制, 干湿厨房, 全屋定制",
  schemaType: "Service",
  entityName: "吉隆坡厨房装修",
},
{
  lang: "ms",
  path: "/locations/kuala-lumpur/kitchen-renovation",
  title: "Pengubahsuaian Dapur Kuala Lumpur | FLASH CAST",
  description: "Pengubahsuaian dapur di Kuala Lumpur untuk kondominium dan rumah teres. Kabinet custom, susun atur dapur basah dan kering, permukaan kuarza, kerja paip dan elektrik. Lawatan tapak dan sebut harga terperinci.",
  keywords: "pengubahsuaian dapur kuala lumpur, kabinet dapur kl, kabinet dapur custom malaysia",
  schemaType: "Service",
  entityName: "Pengubahsuaian Dapur Kuala Lumpur",
},
{
  lang: "en",
  path: "/locations/kuala-lumpur/office-renovation",
  title: "Office Renovation Kuala Lumpur | Fit-Out | FLASH CAST",
  description: "Office renovation and fit-out in Kuala Lumpur for shoplot offices, corporate suites and co-working spaces. Partition, ceiling, electrical, networking, air-conditioning and handover documentation.",
  keywords: "office renovation kl, office fit out kuala lumpur, office interior design kl",
  schemaType: "Service",
  entityName: "Office Renovation Kuala Lumpur",
},
{
  lang: "zh",
  path: "/locations/kuala-lumpur/office-renovation",
  title: "吉隆坡办公室装修｜办公室精装｜FLASH CAST",
  description: "吉隆坡店铺办公室、企业办公室与共享空间的装修与精装。隔墙、天花、电气、网络、空调与交付文件。",
  keywords: "吉隆坡办公室装修, 办公室设计装修, 商业空间装修",
  schemaType: "Service",
  entityName: "吉隆坡办公室装修",
},
{
  lang: "ms",
  path: "/locations/kuala-lumpur/office-renovation",
  title: "Pengubahsuaian Pejabat KL | Fit-Out | FLASH CAST",
  description: "Pengubahsuaian dan fit-out pejabat di Kuala Lumpur untuk pejabat shoplot, suite korporat dan ruang kerja bersama. Partition, siling, elektrik, rangkaian, penghawa dingin dan dokumentasi serahan.",
  keywords: "pengubahsuaian pejabat kl, fit out pejabat kuala lumpur, pengubahsuaian komersial kl",
  schemaType: "Service",
  entityName: "Pengubahsuaian Pejabat Kuala Lumpur",
},
{
  lang: "en",
  path: "/locations/kuala-lumpur/bathroom-renovation",
  title: "Bathroom Renovation Kuala Lumpur | FLASH CAST",
  description: "Bathroom and toilet renovation in Kuala Lumpur. Waterproofing, re-tiling, sanitary ware, shower screen, ventilation and concealed plumbing replacement with ponding test records.",
  keywords: "bathroom renovation kl, toilet renovation kuala lumpur, waterproofing malaysia",
  schemaType: "Service",
  entityName: "Bathroom Renovation Kuala Lumpur",
},
{
  lang: "zh",
  path: "/locations/kuala-lumpur/bathroom-renovation",
  title: "吉隆坡浴室装修｜防水与暗管更换｜FLASH CAST",
  description: "吉隆坡浴室与厕所翻新。防水、重铺砖、洁具、淋浴隔断、通风与暗管更换，含闭水测试记录。",
  keywords: "吉隆坡浴室装修, 厕所翻新, 防水工程",
  schemaType: "Service",
  entityName: "吉隆坡浴室装修",
},
{
  lang: "ms",
  path: "/locations/kuala-lumpur/bathroom-renovation",
  title: "Pengubahsuaian Bilik Air KL | FLASH CAST",
  description: "Pengubahsuaian bilik air dan tandas di Kuala Lumpur. Kalis air, jubin baharu, saniteri, skrin mandi, pengudaraan dan penggantian paip tersembunyi dengan rekod ujian takungan air.",
  keywords: "pengubahsuaian bilik air kl, pengubahsuaian tandas kuala lumpur, kalis air malaysia",
  schemaType: "Service",
  entityName: "Pengubahsuaian Bilik Air Kuala Lumpur",
},
{
  lang: "en",
  path: "/locations/petaling-jaya/condo-renovation",
  title: "Condo Renovation Petaling Jaya | FLASH CAST",
  description: "Condo and apartment renovation in Petaling Jaya. Layout changes, carpentry, flooring, electrical, air-conditioning and JMB or MC management approval coordination for PJ condos.",
  keywords: "condo renovation petaling jaya, apartment renovation pj, renovation contractor petaling jaya",
  schemaType: "Service",
  entityName: "Condo Renovation Petaling Jaya",
},
{
  lang: "zh",
  path: "/locations/petaling-jaya/condo-renovation",
  title: "八打灵再也公寓装修｜管理处审批｜FLASH CAST",
  description: "八打灵再也公寓与共管公寓装修。格局改动、木作、地面、电气、空调，以及 JMB 或 MC 管理处审批协调。",
  keywords: "八打灵再也公寓装修, 公寓翻新 pj, 八打灵再也装修公司",
  schemaType: "Service",
  entityName: "八打灵再也公寓装修",
},
{
  lang: "ms",
  path: "/locations/petaling-jaya/condo-renovation",
  title: "Pengubahsuaian Kondominium PJ | FLASH CAST",
  description: "Pengubahsuaian kondominium dan apartmen di Petaling Jaya. Ubah susun atur, kerja kayu, lantai, elektrik, penghawa dingin dan penyelarasan kelulusan JMB atau MC.",
  keywords: "pengubahsuaian kondominium pj, pengubahsuaian apartment petaling jaya, kontraktor pengubahsuaian petaling jaya",
  schemaType: "Service",
  entityName: "Pengubahsuaian Kondominium Petaling Jaya",
},
{
  lang: "en",
  path: "/locations/selangor/landed-house-renovation",
  title: "Landed House Renovation Selangor | FLASH CAST",
  description: "Landed house renovation across Selangor: terrace, semi-D and bungalow. Extension, layout reconfiguration, full house wiring and plumbing, wet works and local council approval guidance.",
  keywords: "landed house renovation selangor, terrace house renovation selangor, bungalow renovation kl",
  schemaType: "Service",
  entityName: "Landed House Renovation Selangor",
},
{
  lang: "zh",
  path: "/locations/selangor/landed-house-renovation",
  title: "雪兰莪有地住宅装修｜排屋与洋房｜FLASH CAST",
  description: "雪兰莪排屋、半独立式与独立洋房装修。扩建、格局重划、全屋水电、泥水工程与地方政府图测审批指引。",
  keywords: "雪兰莪有地住宅装修, 排屋装修 雪兰莪, 洋房装修",
  schemaType: "Service",
  entityName: "雪兰莪有地住宅装修",
},
{
  lang: "ms",
  path: "/locations/selangor/landed-house-renovation",
  title: "Pengubahsuaian Rumah Teres Selangor | FLASH CAST",
  description: "Pengubahsuaian rumah teres di Selangor: teres, semi-D dan banglo. Sambungan, ubah susun atur, pendawaian dan paip seluruh rumah, kerja basah dan panduan kelulusan pihak berkuasa tempatan.",
  keywords: "pengubahsuaian rumah teres selangor, pengubahsuaian banglo kl, pengubahsuaian semi-d selangor",
  schemaType: "Service",
  entityName: "Pengubahsuaian Rumah Teres Selangor",
},
```

## 2. 字符数核对（已计算，不要改）

| 组合 | EN title | 长度 | ZH title 汉字数 | MS title | 长度 |
|---|---|---|---|---|---|
| KL / kitchen | `Kitchen Renovation Kuala Lumpur \| FLASH CAST` | 44 | 11 | `Pengubahsuaian Dapur Kuala Lumpur \| FLASH CAST` | 52 |
| KL / office | `Office Renovation Kuala Lumpur \| Fit-Out \| FLASH CAST` | 52 | 10 | `Pengubahsuaian Pejabat KL \| Fit-Out \| FLASH CAST` | 49 |
| KL / bathroom | `Bathroom Renovation Kuala Lumpur \| FLASH CAST` | 45 | 12 | `Pengubahsuaian Bilik Air KL \| FLASH CAST` | 43 |
| PJ / condo | `Condo Renovation Petaling Jaya \| FLASH CAST` | 51 | 11 | `Pengubahsuaian Kondominium PJ \| FLASH CAST` | 46 |
| Selangor / landed | `Landed House Renovation Selangor \| FLASH CAST` | 50 | 12 | `Pengubahsuaian Rumah Teres Selangor \| FLASH CAST` | 51 |

全部英文 ≤ 60 字符，中文汉字 ≤ 30，符合规范。

## 3. 为什么 description 里都不提具体价格

`description` 会进 manifest，进而进 sitemap 与搜索结果摘要。价格必须由业主提供才能写死，否则：
- 报价变动后 description 会过时，改一次要重新部署
- 数字写错会带来报价纠纷

所以描述里只写「分项报价 / 现场测量」这类过程承诺，具体区间放在页面正文的报价表（那里可以随时改，不用重新生成 manifest）。

## 4. 关于 ms 条目能不能真的独立生效

这 3 条 ms 定义进了 `staticDefs` 之后，**需要实测确认**它们不是走 `englishMeta` 回退路径（那条路径会带 `noIndex: true`）。

判定方法（交给 C1 验收时做）：

```
1. node scripts/generate-seo-manifest.mjs
2. 检查 functions/seo-manifest.json 里
   /ms/locations/kuala-lumpur/kitchen-renovation 是否存在
3. 若存在，检查它的 title 是否为上面给的马来语标题
   - 是马来语标题 → 独立条目，生效
   - 是英文标题   → 走了回退路径，需要排查
4. 检查该条目有无 noIndex: true
```

如果实测发现 ms 仍走回退，说明 `buildStaticManifest` 的 `hreflang` 里 ms 只在 `/custom-cabinets` 特殊处理那条逻辑需要扩展，这属于 `seo-static-pages.mjs` 范围内的合理改动，Codex 可以在同一个 PR 里处理，但要在报告里单独说明。

## 5. 页面 H1 与这里的 title 的关系

- manifest 的 `title` → `<title>` 标签、搜索结果标题、sitemap
- 页面组件的 H1 → 页面可见主标题

两者**不要完全一样**，也不要差太远。页面 H1 建议：

```
EN: Kitchen Renovation in Kuala Lumpur
ZH: 吉隆坡厨房装修
MS: Pengubahsuaian Dapur di Kuala Lumpur
```

（去掉品牌后缀，因为页面上下文已经有品牌；保留服务词 + 区域词）
