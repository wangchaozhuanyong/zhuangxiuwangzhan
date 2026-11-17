# 区域页内容重构样板：Cheras（蕉赖）

> 现状：`/en/locations/cheras` 可见文本约 394 字符，属于薄内容页。
> 目标：每页 5 段、英文 1200+ 字符 / 中文 700+ 汉字，含区域特定信息，不用模板套话。
> 这份是样板，确认风格后再批量做其余区域。

---

## English（`content_en`）

```html
<p>Cheras runs along the south-east edge of Kuala Lumpur and mixes two very different kinds of housing. Older terraces and low-rise flats around Taman Maluri, Taman Pertama and Taman Midah were built mostly in the 1980s and 1990s, while the corridor towards Sungai Besi and Cheras Selatan has filled with newer condominiums. The renovation work that follows is different in each case: an older terrace usually needs its wiring, plumbing and waterproofing reviewed before anything cosmetic, while a newer condo needs layout changes and storage that fit within management rules.</p>

<p><strong>What tends to come up in Cheras</strong></p>

<p>In the older terraces and flats, the recurring items are aluminium wiring that cannot safely carry modern loads, single-phase supply that limits air-conditioning, cast-iron or galvanised pipes that have already been patched more than once, and bathrooms where the waterproofing has reached the end of its life. Car porch extensions and kitchen rear extensions are common, and those need drawings and local authority submission rather than a verbal agreement with a contractor. In the newer condos, the usual requests are combining two small rooms, adding built-in storage, and reworking the kitchen — all of which depend on what the JMB or MC will approve.</p>

<p><strong>Access and site conditions</strong></p>

<p>Cheras has a lot of narrow side streets and double-parked frontages, so material delivery and waste removal need planning rather than improvising on the day. For terrace houses, the working space is often limited to the car porch and the rear lane, which affects how much can be staged on site. For condos, the service lift booking, the protected common areas and the permitted working hours set the real schedule. We confirm these before the programme is fixed, because discovering a one-hour loading window after demolition has started costs everyone time.</p>

<p><strong>Typical scope</strong></p>

<p>For a terrace: full rewiring, re-piping, bathroom and kitchen replacement, ceiling and painting, and often a rear extension. For a flat or condo: kitchen and bathroom renovation, built-in wardrobes and cabinets, flooring, and lighting changes. For both: waterproofing is the item most often deferred and most often regretted, because a failed membrane shows up as a stain on the neighbour's ceiling rather than in your own unit.</p>

<p><strong>Quotation and handover</strong></p>

<p>The quotation separates confirmed work from items that can only be assessed after opening up, and states which submissions or management approvals sit with us and which sit with you. At handover we test every outlet, run each tap, and check the bathrooms under normal use rather than a quick glance. Defects are recorded in writing with a return date, because the first month after handover is when settlement cracks and minor leaks appear.</p>
```

---

## 中文（`content_zh`）

```html
<p>蕉赖位于吉隆坡东南侧，住宅类型分成很不一样的两类。Taman Maluri、Taman Pertama、Taman Midah 一带的排屋与低层公寓多建于 1980 至 1990 年代，而往 Sungai Besi 与 Cheras Selatan 方向则集中了较新的共管公寓。两类房子的装修重点完全不同：老排屋通常要先查线路、水管与防水，再谈外观；新公寓则是在管理处规定范围内改格局、做收纳。</p>

<p><strong>蕉赖常见的问题</strong></p>

<p>老排屋与旧公寓反复出现的是：铝线承载不了现代用电、单相电容量限制空调数量、铸铁或镀锌管已经修补过多次、浴室防水到了寿命末期。车棚加盖与厨房后部扩建在这个区很常见，这类工程需要图纸与地方政府送审，不能只靠和承包商口头说定。较新的公寓则多是两间小房合并、增加定制收纳、重做厨房，而这些都要先看 JMB 或 MC 能批到什么程度。</p>

<p><strong>进场与施工条件</strong></p>

<p>蕉赖不少小路很窄，店屋前经常双向停车，材料进场与废料清运需要提前安排，不能当天临时想办法。排屋的作业空间往往只有车棚与后巷，能堆多少料是有限制的。公寓则要看货梯预约、公共区域保护与允许施工的时段，这三项才决定真实工期。我们在排工期之前会先确认，因为拆完之后才发现只有一小时上料时间，损失的是所有人的时间。</p>

<p><strong>典型施工范围</strong></p>

<p>排屋多为：全屋重新拉电、换水管、浴室与厨房重做、天花与油漆，常伴随后部扩建。公寓与组屋多为：厨房与浴室翻新、定制衣柜与橱柜、地面与灯位调整。两类房子共通的一点是，防水最常被推迟，也最常后悔——防水一旦失效，水渍先出现在楼下邻居的天花上，而不是你自己家里。</p>

<p><strong>报价与交付</strong></p>

<p>报价会把已确认工程与「打开后才能判断」的项目分开，并写清哪些送审或管理处手续由我们处理、哪些由你处理。交付时逐个插座测试、每个龙头放水、浴室按日常使用方式试一遍，而不是看一眼就算。缺陷会书面记录并约定返场日期，因为交付后第一个月正是沉降裂缝与轻微渗水最容易出现的时候。</p>
```

---

## 批量执行时的规则

1. **每个区域必须写区域特有内容**：房产类型、屋龄结构、交通与进场条件、管理处特点。不能把 Cheras 换成 Klang 名字就直接用——Google 会判重复。
2. **不编造具体小区名、项目名、客户名**。可以写街道或地段（Taman Maluri、SS15），但不写"某某公寓 3 座"。
3. **不写价格数字**，不写工期天数，不写保修年限。
4. **英文 1200–1500 字符，中文 700–900 汉字**，5 段结构保持一致。
5. **三语**：en + zh 先出，ms 等翻译方按术语表交付后再补，不要机翻。
6. 每段都要有可执行信息，不要写"我们专业可靠"这类空话。

## 建议的批量顺序

按转化价值与现有搜索量排：

| 顺序 | 区域 | 理由 |
|---|---|---|
| 1 | kuala-lumpur | 主词，必须最厚 |
| 2 | petaling-jaya | 公寓密度高，已有交叉页 |
| 3 | cheras | 已完成样板 |
| 4 | subang-jaya | 成熟社区，家庭型需求 |
| 5 | mont-kiara | 高端公寓，客单高 |
| 6 | puchong | 新区，排屋为主 |
| 7 | klang | 独立房与厂房 |
| 8 | shah-alam | 马来语市场主力区域 |

其余 22 个区域按 Search Console 实际曝光再排，不做无差别铺量。
