# FLASH CAST 服务×区域落地页文案骨架（5 页首发）

> 生成日期：2026-11-14
> 适用站点：flashcast.com.my（三语：en / zh / ms）
> 本文交付物：5 个「服务×区域」交叉页的完整文案骨架 + 三语标题描述 + FAQ + 内链 + Schema 要求。

---

## 0. 先对齐一个事实：你现在缺的不是"落地页"，是"交叉页"

核对当前代码库（`src/routes/publicRoutes.tsx`、`src/data/services.ts`、`src/data/locations.ts`）后，现状是这样：

| 类型 | 已有 | 缺口 |
|---|---|---|
| 服务页 | 11 个：`/services/{renovation, design, builtin, kitchen, bathroom, office-renovation, shop-renovation, artistic-coating, old-house, warehouse, approval}` | 标题已带 "Kuala Lumpur & Selangor"，但没有单区域深挖 |
| 区域页 | 8 个区域：`/locations/{kuala-lumpur, selangor, petaling-jaya, cheras, subang-jaya, mont-kiara, bangsar, puchong}` + 15 个案例型页 | 区域页是"区域总览"，不是"某区域的厨房装修" |
| 交叉页 | **0 个** | 全部缺失 |
| 业务线独立页 | 无 | 电子锁、刷漆、地砖、吊顶、隔墙、水电、工厂装修、家具定制独立入口 |

所以这 5 页不是重做，是**新增第二层**：`服务页（总）→ 交叉页（区域限定）→ 案例（证据）`。

**路由建议**（需开发确认，属架构改动）：

```
/:lang/locations/:area/:service
例：/en/locations/kuala-lumpur/kitchen-renovation
    /zh/locations/kuala-lumpur/kitchen-renovation
    /ms/locations/kuala-lumpur/kitchen-renovation
```

不建议用 `/kitchen-renovation-kuala-lumpur` 这种扁平 slug，原因有三个：
1. 现有站点所有公开页都有 `/:lang` 前缀，扁平 slug 会破坏 `LanguageRouteSync` 和 hreflang 逻辑；
2. 嵌套在 `/locations/` 下能自动继承区域页的内链权重和面包屑；
3. 未来加第 9、第 10 个区域时，不用再新增一级路由。

---

## 1. 五个页面的优先级与理由

| # | 页面 | 主关键词（EN） | 优先级 | 为什么先做这个 |
|---|---|---|---|---|
| 1 | 厨房装修 × 吉隆坡 | kitchen renovation kuala lumpur | P0 | 客单价高、决策周期短、现有 `services/kitchen` 已有内容可复用 |
| 2 | 办公室装修 × 吉隆坡 | office renovation kl | P0 | 商业客户预算稳、不砍单、现有 `services/office-renovation` 有基础 |
| 3 | 公寓装修 × 八打灵再也 | condo renovation petaling jaya | P0 | PJ 是公寓密度最高的区域之一，`locations/petaling-jaya` 已有案例 |
| 4 | 有地住宅装修 × 雪兰莪 | landed house renovation selangor | P0 | 单笔金额最大、雪兰莪覆盖面积大、竞争低于 KL 市中心 |
| 5 | 浴室装修 × 吉隆坡 | bathroom renovation kl | P1 | 小额高频、适合做引流款、转化快但不适合当主推 |

> 你把「电子锁」也列进业务了。电子锁不该放在这 5 页里——它是独立的**产品型服务**，客单价低、决策快、跟装修主线不同，应该单独开 `/services/digital-lock`，用完全不同的写法（型号、兼容门厚、安装费、保修）。这个我在第 6 节单独说。

---

## 2. 五页共用的页面骨架

每一页都必须按这个顺序写，不要自己发挥。顺序本身就是转化逻辑：

```
① Hero（H1 + 一句副标题 + 主 CTA + 信任条）
② 这个区域的真实情况（200–300 字，H2）
③ 我们在这类空间做什么（H2 + 4–6 个可勾选条目）
④ Before / After 案例（2–3 个，H2）
⑤ 报价区间与计价方式（H2 + 表格）
⑥ 施工流程与工期（H2 + 5 步）
⑦ 常见问题 FAQ（H2 + 5–6 条，带 Schema）
⑧ 相关服务与内链（H2）
⑨ 结尾 CTA（表单 + WhatsApp + 电话）
```

**每页必须有的 5 个转化元素**（缺一个就算没做完）：

1. 首屏内可见的 WhatsApp 按钮（移动端不能藏在汉堡菜单里）
2. 报价区间表格（不是"请联系我们获取报价"）
3. 真实项目照片，带区域名和项目类型（不能用库存图冒充）
4. FAQ 至少一条回答"多少钱"
5. 表单字段不超过 5 个（姓名 / WhatsApp / 区域 / 项目类型 / 预算区间）

---

## 3. 页面 1：厨房装修 × 吉隆坡

**URL**：`/en/locations/kuala-lumpur/kitchen-renovation`

### 三语元数据

| 字段 | EN | ZH | MS |
|---|---|---|---|
| title | Kitchen Renovation Kuala Lumpur \| Custom Cabinets & Wet/Dry Kitchen \| FLASH CAST | 吉隆坡厨房装修｜定制橱柜与干湿厨房｜FLASH CAST | Pengubahsuaian Dapur Kuala Lumpur \| Kabinet Dapur Custom \| FLASH CAST |
| description | Kitchen renovation in Kuala Lumpur for condos and landed homes. Custom cabinets, wet and dry kitchen layout, quartz and solid surface tops, plumbing and electrical coordination. Site visit and itemised quotation. | 吉隆坡公寓与有地住宅厨房装修。定制橱柜、干湿厨房布局、石英石与实体面材台面、水电协调，含现场测量与分项报价。 | Pengubahsuaian dapur di Kuala Lumpur untuk kondominium dan rumah teres. Kabinet custom, susun atur dapur basah dan kering, permukaan kuarza, kerja paip dan elektrik. Lawatan tapak dan sebut harga terperinci. |
| H1 | Kitchen Renovation in Kuala Lumpur | 吉隆坡厨房装修 | Pengubahsuaian Dapur di Kuala Lumpur |

### 正文骨架

**② 这个区域的真实情况**（H2：*What kitchen renovation looks like in Kuala Lumpur*）

写这三件事，不要写形容词：
- KL 公寓厨房普遍 8–12 尺单排或 L 型，湿厨房多数在阳台侧，改动涉及防水和排烟；
- 旧公寓（10 年以上）常见问题：原有水管老化、插座不足、抽油烟机排管走公共管道受管理层限制；
- 有地住宅可以扩厨房，但要过 DBKL 扩建审批，工期多 3–6 周。

**③ 我们做什么**（H2：*Scope we handle*）

可勾选清单，每条一行：
- 拆除原有橱柜与台面，保护地砖与墙砖
- 干厨房 / 湿厨房分区布局
- 定制橱柜：melamine / acrylic / solid surface / 石英石台面
- 上柜到顶、隐藏式把手、soft-close 铰链
- 水槽与灶台下柜防水处理
- 抽油烟机排管与补风
- 厨房专用电路（烤箱、电磁炉、洗碗机独立回路）
- 给排水改管、地漏与去水位
- 墙砖、地砖、背墙（backsplash）
- 吊柜灯带与操作台照明

**④ Before / After**（H2）

每个案例卡必须写满这 6 项，缺一项就是废图：
```
项目：{小区/路段名}，{区域}
户型：{公寓/排屋}，{面积} sqft
原状况：{3 个具体问题，例：橱柜门板脱落、只有一个插座、湿厨房无抽风机}
做了什么：{按上面的清单勾选}
工期：{X 周}
造价区间：RM {XX,XXX} – {XX,XXX}
图：before 1 张 + after 2 张（同一角度）
```

> 首发的 3 个案例必须真实。如果现在手上没有 KL 厨房的完整 before/after，就先只放 1 个，剩下位置留白等拍——**不要用 AI 概念图冒充完工案例**。这条和你们 `docs/rules/public-case-privacy.md` 的效果图规则是一致的。

**⑤ 报价区间**（H2：*Kitchen renovation cost in Kuala Lumpur*）

表格按"柜体长度"和"台面材质"分档，不要只给一个总价：

| 项目 | 单价区间 | 说明 |
|---|---|---|
| 定制下柜（含台面） | RM {XXX} – {XXX} / 尺 | melamine 门板 |
| 定制下柜（含台面） | RM {XXX} – {XXX} / 尺 | acrylic / 石英石 |
| 上柜 | RM {XXX} – {XXX} / 尺 | 到顶加价 {X}% |
| 拆除清运 | RM {X,XXX} – {X,XXX} / 套 | 含垃圾清运 |
| 水电改管 | RM {XXX} – {XXX} / 点 | 按点位计 |
| 墙地砖 | RM {XX} – {XX} / sqft | 含工不含砖 |
| 防水 | RM {XX} – {XX} / sqft | 湿厨房必做 |

价格后面必须跟一句免责：
> Prices above are planning ranges for Kuala Lumpur and Selangor, based on standard layouts. Final quotation depends on site measurement, material selection, and management approval requirements.

**⑥ 流程**（H2）：需求确认 → 现场测量 → 布局与材质确认 → 分项报价 → 拆除与水电 → 柜体安装 → 台面与收口 → 验收

**⑦ FAQ**（H2，5 条，必须进 FAQPage Schema）

| EN | ZH | MS |
|---|---|---|
| How much does kitchen renovation cost in Kuala Lumpur? | 吉隆坡厨房装修大概多少钱？ | Berapa kos pengubahsuaian dapur di Kuala Lumpur? |
| How long does a kitchen renovation take? | 厨房装修要多久？ | Berapa lama pengubahsuaian dapur mengambil masa? |
| Can I keep my existing floor tiles? | 可以保留原地砖吗？ | Bolehkah jubin lantai sedia ada dikekalkan? |
| Do you handle condo management approval? | 公寓管理处的手续你们处理吗？ | Adakah pihak anda menguruskan kelulusan pengurusan kondominium? |
| Can you match an existing cabinet colour? | 可以配回原有橱柜颜色吗？ | Bolehkah warna kabinet sedia ada dipadankan? |

答案写法：第一句直接给数字或结论，第二句给条件。不要用"it depends"开头。

**⑧ 内链**（必须链到这 4 个）：
- `/services/kitchen`（服务总页，锚文本：kitchen renovation services）
- `/custom-cabinets`（定制柜，锚文本：custom kitchen cabinets）
- `/blog/kitchen-cabinet-material-guide`（材料指南）
- `/locations/kuala-lumpur`（区域总页）

---

## 4. 页面 2：办公室装修 × 吉隆坡

**URL**：`/en/locations/kuala-lumpur/office-renovation`

### 三语元数据

| 字段 | EN | ZH | MS |
|---|---|---|---|
| title | Office Renovation Kuala Lumpur \| Office Fit-Out & Interior Works \| FLASH CAST | 吉隆坡办公室装修｜办公室精装与内装工程｜FLASH CAST | Pengubahsuaian Pejabat Kuala Lumpur \| Fit-Out & Kerja Dalaman \| FLASH CAST |
| description | Office renovation and fit-out in Kuala Lumpur for shoplot offices, corporate suites and co-working spaces. Partition, ceiling, electrical, networking, air-conditioning and handover documentation. | 吉隆坡店铺办公室、企业办公室与共享空间的装修与精装。隔墙、天花、电气、网络、空调与交付文件。 | Pengubahsuaian dan fit-out pejabat di Kuala Lumpur untuk pejabat shoplot, suite korporat dan ruang kerja bersama. Partition, siling, elektrik, rangkaian, penghawa dingin dan dokumentasi serahan. |
| H1 | Office Renovation and Fit-Out in Kuala Lumpur | 吉隆坡办公室装修与精装 | Pengubahsuaian dan Fit-Out Pejabat di Kuala Lumpur |

### 与其他 4 页不同的三件事

办公室装修的决策人不是屋主，是**公司**。所以这页必须多三段别页没有的内容：

1. **工期与停业成本**：写清"X 个工位以下的标准办公室，从开工到可进驻 X 周"，因为老板算的是租金损失；
2. **合规文件**：消防（Bomba）、楼宇管理（Management Office）、装修押金与图纸审批、需要提交的文件清单；
3. **夜间与周末施工**：KL 多数写字楼只允许非办公时间施工，这一点要主动写出来，它是重要卖点。

**正文骨架调整**：

```
① Hero（H1 + "Move-in ready in X weeks" + 报价 CTA）
② 你所在的大楼类型限制（H2：写字楼 / 店屋 office / 共享空间，三种审批路径不同）
③ 我们能交付什么（H2：隔墙、天花、地坪、电气与数据、空调、消防、家具、门禁）
④ 案例（H2：按"工位数 + 工期 + 交付内容"写，不按 nice design 写）
⑤ 报价（H2：按 sqft 和工位数双维度）
⑥ 时间表（H2：含审批等待时间，用甘特式文字描述）
⑦ FAQ（H2：押金、夜间施工、Bomba、网线、旧家具处理）
⑧ 内链
⑨ CTA
```

**FAQ 三语**（这 5 条是办公室独有的）：

| EN | ZH | MS |
|---|---|---|
| Can work be done outside office hours? | 可以在非办公时间施工吗？ | Bolehkah kerja dijalankan di luar waktu pejabat? |
| Do you handle Bomba and building management submissions? | Bomba 和楼宇管理处的文件你们负责吗？ | Adakah anda menguruskan penyerahan Bomba dan pengurusan bangunan? |
| How many workstations can fit in my unit? | 我的单位能放多少个工位？ | Berapa banyak stesen kerja boleh dimuatkan dalam unit saya? |
| What is the typical renovation deposit? | 装修押金一般多少？ | Berapa deposit pengubahsuaian biasa? |
| Can we work in phases to avoid full shutdown? | 可以分阶段施工避免全面停业吗？ | Bolehkah kerja dijalankan berperingkat untuk elak tutup sepenuhnya? |

**内链**：`/services/office-renovation`、`/services/shop-renovation`、`/blog/office-renovation-checklist-malaysia`、`/locations/petaling-jaya`（跨区对比）

---

## 5. 页面 3：公寓装修 × 八打灵再也

**URL**：`/en/locations/petaling-jaya/condo-renovation`

### 三语元数据

| 字段 | EN | ZH | MS |
|---|---|---|---|
| title | Condo Renovation Petaling Jaya \| Apartment & Condo Interior Works \| FLASH CAST | 八打灵再也公寓装修｜公寓内装与翻新｜FLASH CAST | Pengubahsuaian Kondominium Petaling Jaya \| Kerja Dalaman Apartmen \| FLASH CAST |
| description | Condo and apartment renovation in Petaling Jaya. Layout changes, carpentry, flooring, electrical, air-conditioning and management approval coordination for PJ condos. | 八打灵再也公寓与共管公寓装修。格局改动、木作、地面、电气、空调与管理处审批协调。 | Pengubahsuaian kondominium dan apartmen di Petaling Jaya. Ubah suai susun atur, kerja kayu, lantai, elektrik, penghawa dingin dan penyelarasan kelulusan pengurusan. |
| H1 | Condo Renovation in Petaling Jaya | 八打灵再也公寓装修 | Pengubahsuaian Kondominium di Petaling Jaya |

### 这一页的核心差异化：管理处规则

PJ 的公寓几乎全部有 JMB / MC（联合管理机构），装修必须：
- 提交装修申请 + 押金 + 承包商资料 + 工人名单
- 限定施工时段（通常周一至五 9:00–17:00，周六半天）
- 限定拆除范围（承重墙、外观、阳台封闭基本不可动）
- 泥水与噪音工序有额外限制

所以这页的 ② 段标题就叫 **"What PJ condo management will and will not approve"**，把上面四条直接列出来，再补一句"我们代办这些文件"。

这是转化杀手锏：别家写 design，你写规则。

**正文骨架重点**：
- ② 管理处审批规则（分"可做 / 需申请 / 不能做"三栏表格）
- ③ 常见 PJ 公寓户型改造（800–1200 sqft 三房改两房、封闭阳台做工作区、开放式厨房改造的可行性）
- ④ 案例（Mont Kiara 已有现成案例可复用，但必须换成 PJ 本地的）
- ⑤ 报价（按 sqft 全包 + 分项）
- ⑥ 流程（含押金退还流程）
- ⑦ FAQ

**FAQ 三语**：

| EN | ZH | MS |
|---|---|---|
| Do I need approval to hack a wall in my condo? | 公寓敲墙需要申请吗？ | Perlukah kelulusan untuk merobohkan dinding kondominium? |
| How much is the renovation deposit in PJ condos? | PJ 公寓装修押金多少？ | Berapa deposit pengubahsuaian kondominium di PJ? |
| Can I close up my balcony? | 阳台可以封起来吗？ | Bolehkah balkoni ditutup? |
| How long does approval take? | 审批要多久？ | Berapa lama kelulusan diambil? |
| Can renovation be done while I still live there? | 我还住着可以装修吗？ | Bolehkah pengubahsuaian dibuat semasa saya masih tinggal? |

**内链**：`/services/renovation`、`/locations/petaling-jaya`、`/locations/mont-kiara`、`/blog/how-to-plan-condo-renovation-kl`、`/projects`

---

## 6. 页面 4：有地住宅装修 × 雪兰莪

**URL**：`/en/locations/selangor/landed-house-renovation`

### 三语元数据

| 字段 | EN | ZH | MS |
|---|---|---|---|
| title | Landed House Renovation Selangor \| Terrace, Semi-D & Bungalow \| FLASH CAST | 雪兰莪有地住宅装修｜排屋、半独立与洋房｜FLASH CAST | Pengubahsuaian Rumah Teres Selangor \| Teres, Semi-D & Banglo \| FLASH CAST |
| description | Landed house renovation across Selangor: terrace, semi-D and bungalow. Extension, layout reconfiguration, full house wiring and plumbing, wet works and finishing. | 雪兰莪排屋、半独立式与独立洋房装修。扩建、格局重划、全屋水电、泥水与收口工程。 | Pengubahsuaian rumah teres di Selangor: teres, semi-D dan banglo. Sambungan, ubah susun atur, pendawaian dan paip seluruh rumah, kerja basah dan kemasan. |
| H1 | Landed House Renovation in Selangor | 雪兰莪有地住宅装修 | Pengubahsuaian Rumah Teres di Selangor |

### 这一页的差异化：面积与审批

有地住宅和公寓最大的区别不是面积，是**你可以改结构、但要自己跑审批**。这页必须写清：

- 单层 / 双层排屋（terrace）、半独立（semi-D）、独立洋房（bungalow）三类各自的典型改造范围
- 扩建（extension）需要 MBSA / MBPJ / MPKj 等**不同地方政府**的图测审批，不是统一 DBKL
- 雪兰莪各区的审批周期差异（举例说明，不要编具体天数，写"通常比 KL 长，且各区不同"）
- 全屋水电重做的判断标准（房龄 > 20 年、铝线、单相电不足）

**三语标题里的关键词布局**：
- EN 用 "landed house renovation selangor" + "terrace / semi-D / bungalow" 三个子词，覆盖长尾
- ZH 用 "雪兰莪 + 排屋 / 半独立 / 洋房"，这是马来西亚华人真实说法，不要写成"别墅"（"别墅"在大马华人语境里用得少，"洋房/独立式"更准，可两者都放）
- MS 用 "rumah teres / semi-D / banglo"，不要写 "rumah landed"（马来语里不自然）

**FAQ 三语**：

| EN | ZH | MS |
|---|---|---|
| Do I need approval to extend my house in Selangor? | 雪兰莪扩建房子要申请吗？ | Perlukah kelulusan untuk menyambung rumah di Selangor? |
| Which local authority handles my area? | 我这个区归哪个地方政府管？ | Pihak berkuasa tempatan mana yang menguruskan kawasan saya? |
| How long does a full house renovation take? | 全屋装修要多久？ | Berapa lama pengubahsuaian seluruh rumah? |
| Can I stay in the house during renovation? | 装修期间可以住家里吗？ | Bolehkah saya tinggal di rumah semasa pengubahsuaian? |
| Do you handle old wiring replacement? | 旧电线重做你们做吗？ | Adakah anda membuat penggantian pendawaian lama? |

**内链**：`/services/renovation`、`/services/old-house`、`/locations/selangor`、`/services/approval`、`/before-after`

---

## 7. 页面 5：浴室装修 × 吉隆坡

**URL**：`/en/locations/kuala-lumpur/bathroom-renovation`

### 三语元数据

| 字段 | EN | ZH | MS |
|---|---|---|---|
| title | Bathroom Renovation Kuala Lumpur \| Toilet & Wet Area Remodelling \| FLASH CAST | 吉隆坡浴室装修｜厕所与湿区翻新｜FLASH CAST | Pengubahsuaian Bilik Air Kuala Lumpur \| Ubah Suai Tandas & Kawasan Basah \| FLASH CAST |
| description | Bathroom and toilet renovation in Kuala Lumpur. Waterproofing, re-tiling, sanitary ware, shower screen, ventilation and concealed plumbing replacement. | 吉隆坡浴室与厕所翻新。防水、重铺砖、洁具、淋浴隔断、通风与暗管更换。 | Pengubahsuaian bilik air dan tandas di Kuala Lumpur. Kalis air, jubin baharu, saniteri, skrin mandi, pengudaraan dan penggantian paip tersembunyi. |
| H1 | Bathroom Renovation in Kuala Lumpur | 吉隆坡浴室装修 | Pengubahsuaian Bilik Air di Kuala Lumpur |

### 这一页的差异化：防水是唯一卖点

浴室装修客户最怕漏水到楼下。所以整页重心放在**防水做法与验收**，而不是瓷砖花色。

必须写：
- 防水层做几遍、刷到多高（淋浴区建议做到 1.8m 或到顶）
- 闭水测试做几小时、谁在场确认、出不出书面记录
- 暗管更换 vs 不换的判断标准
- 地漏坡度与二次排水
- 通风（有窗 / 无窗分别怎么做）
- 常见返工原因（这个反而增加信任）

**FAQ 三语**：

| EN | ZH | MS |
|---|---|---|
| How long does a bathroom renovation take? | 浴室装修要多久？ | Berapa lama pengubahsuaian bilik air? |
| Do you do waterproofing and ponding test? | 你们做防水和闭水测试吗？ | Adakah anda membuat kalis air dan ujian takungan air? |
| Can the layout be changed? | 格局可以改吗？ | Bolehkah susun atur diubah? |
| Will there be dust in the rest of the house? | 会不会弄到整间屋子都是灰？ | Adakah habuk merebak ke seluruh rumah? |
| Do you replace concealed pipes? | 暗管会更换吗？ | Adakah paip tersembunyi diganti? |

**内链**：`/services/bathroom`、`/services/renovation`、`/locations/kuala-lumpur`、`/blog/spc-vinyl-vs-laminate-flooring`

---

## 8. 你补充的 7 条业务线：不要塞进上面 5 页

你列的业务里，有 7 项是**独立服务**，不是修饰词：

| 业务 | 现状 | 建议 |
|---|---|---|
| 电子锁 / 智能门锁 | 无独立页 | 建 `/services/digital-lock`，产品型写法（型号、门厚兼容、安装费、保修、常见门型） |
| 刷漆 | 无独立页 | 建 `/services/painting`，按 sqft 计价 + 色卡 + 旧墙处理 |
| 地砖 | 无独立页 | 建 `/services/tiling`，按材料分类（homogeneous / porcelain / mosaic）+ 工费 |
| 木地板 | 有 `/landing/flooring` | 已有，补 SPC / laminate / engineered wood 三条子线 |
| 隔墙 | 无独立页 | 建 `/services/partition`，石膏板 / 玻璃 / 铝合金三种 |
| 吊顶 | 无独立页 | 建 `/services/ceiling`，石膏板 / 集成吊顶 / 灯槽 |
| 水电 | 无独立页 | 建 `/services/electrical-plumbing`，按点位计价，这是最高频询价项 |
| 工厂装修 | 无独立页 | 建 `/services/factory-renovation`，B2B 写法（承载、消防、通风、工期停业成本） |
| 全屋定制 / 家具定制 | 有 `/custom-cabinets` + `/services/builtin` | 已有，重点是把「全屋定制」这个词放进 H1 和 title |

这 7 个页面的优先级高于交叉页，因为它们**成本最低、意图最纯**：搜 "digital lock installation kl" 的人，今天就要装，不需要教育。

---

## 9. 每页上线前的检查清单

- [ ] title ≤ 60 字符（英文），中文 ≤ 30 字，包含「服务 + 区域」
- [ ] description 100–155 字符，含报价或 CTA 动词
- [ ] H1 只有 1 个，含服务 + 区域
- [ ] 报价区间是表格，不是文字段落
- [ ] 至少 1 个真实 before/after，带项目名、区域、工期、造价
- [ ] FAQ ≥ 5 条，且已输出 FAQPage Schema（用现成的 `JsonLdFAQ` 组件）
- [ ] Service Schema（`JsonLdService`）+ BreadcrumbList（`JsonLdBreadcrumb`）
- [ ] LocalBusiness Schema 的 `areaServed` 写具体区域
- [ ] 三语齐全，否则 ms 不进 sitemap（`hasCompleteMalayContent` 判定）
- [ ] 内链 ≥ 4 条，其中至少 1 条指向博客
- [ ] 移动端首屏可见 WhatsApp / 电话
- [ ] 表单 ≤ 5 字段
- [ ] canonical 正确，hreflang 三语互通
- [ ] 进 `scripts/generate-seo-manifest.mjs` 的 manifest，确认 `source_complete` + `eligible`
- [ ] 页面加载后核对 `dist` 产物里确实有这页，不是只在 dev 环境可见

---

## 10. 需要你确认的四件事

1. **报价区间的真实数字**——上面所有 `RM {XX}` 都是占位，必须你给实际区间，我不能编。给完我直接填。
2. **真实案例授权**——before/after 用哪个项目、能否公开客户名/小区名、有没有照片。
3. **路由方案**——`/:lang/locations/:area/:service` 这个结构调整要不要现在做，涉及 `publicRoutes.tsx`、`publicPageModules.ts`、`seo-manifest` 三处改动。
4. **谁写 ms 文案**——机器翻译会被 `hasCompleteMalayContent` 判死，等于白做。要人写或至少人工校对。
