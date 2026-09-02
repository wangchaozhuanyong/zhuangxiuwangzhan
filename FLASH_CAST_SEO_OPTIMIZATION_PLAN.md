# FLASH CAST SEO 内容与排名优化计划

> 版本：2026-09-02 规划稿  
> 目标：提升 Google 自然搜索中的商业意图覆盖、合格咨询量与页面主题清晰度  
> 执行边界：本文件只做规划；不批量建页、不发布 CMS、不改生产网站、不保证排名或询盘结果

## 1. 执行结论

FLASH CAST 现在最需要的不是继续扩充 URL，而是先把现有页面的“关键词拥有关系、证据、上下游内链和转化承接”理顺。

截至 2026-09-02，生产 sitemap 有 460 个 URL，即 230 组英文页面和 230 组中文页面。其中每种语言已有：

| 页面类型 | 每种语言数量 | 当前判断 |
| --- | ---: | --- |
| Service 详情 | 12 | 数量足够；先解决定位重叠和模板同质化 |
| Location 详情 | 30 | 已超过本轮应继续扩张的规模；暂停新增 |
| Project 详情 | 38 | 应先核验真实案例、概念图和重复项目 |
| Blog 详情 | 38 | 已覆盖多个集群；优先更新、合并和补商业内链 |
| Materials 详情及分类 | 97 | 规模很大；先控制索引质量和商业页面承接 |
| 核心 Hub / 公司 / 转化页 | 15 | 保留，明确每个 Hub 的拥有词 |

本轮建议顺序：

1. 首页、Services Hub 和 8 个高商业意图 Service 页面先定词、改标题/H1/首屏与上下游内链。
2. 先优化 5 个地区页，再扩到第二梯队；其余 Location 暂停扩写。
3. 真实 Project 证据分级，概念项目不能承担“已完工案例”或地区信任证明。
4. 先整理现有 38 篇 Blog 的 Topic Cluster 和重复内容，再决定是否新增 2–4 篇成本内容。
5. Materials 只承担材料选择、规格、取舍和适用场景，不与 Service 抢“装修/安装/报价”主词。

## 2. 审计基线、事实等级与限制

### 2.1 本次已核对的证据

- 项目：`zhuangxiuwangzhan-main`
- 技术栈：Vite + React + TypeScript + React Router + Supabase + Cloudflare Pages
- 包管理器：npm（`package-lock.json`）
- 最新远端基线：`origin/main@dfc00f6`
- 本地主 checkout：`main`，落后远端 18 个提交，并有既有未提交修改；本计划没有覆盖这些修改
- 生产站：`https://flashcast.com.my`
- 生产 sitemap：2026-09-02 只读获取，共 460 个 URL
- 生产 DOM 抽样：14 个核心页面均为 HTTP 200，均只有 1 个渲染后 H1
- 本地内容源：路由、SEO manifest、Service/Location/Project/Blog/Materials 数据与页面组件
- 公司资料：2026-08-31 的公司、服务、地区、品牌、案例和 FAQ 资料

### 2.2 事实、推断、建议的区分

- **事实**：来自当前生产页面、生产 sitemap、源码或已确认公司资料。
- **推断**：页面主题和 URL 相似，存在抢词风险；没有 GSC query/page 数据时，不能称为已确认的排名 cannibalization。
- **建议**：下文的关键词分配、标题和内容结构，必须在 GSC、自然转化与业主事实补齐后再批准执行。

### 2.3 当前缺少的关键数据

- GSC 最近 90 天和 16 个月的 `query + page + country + device` 导出。
- GA4 的 organic landing page 到 `quote_form_success`、有效电话和签名 WhatsApp 入站数据。
- 匿名销售阶段：有效咨询、量房、报价、签单和输赢原因。
- 每个 Project 的真实性、公开授权、真实面积、工期、范围和图片阶段证明。
- 30 个 Location 的真实服务能力、项目证据与实际咨询量。

因此，本计划可以确定页面拥有关系和实施优先级，但不能声称某页“已经排名下降”或“改完一定提升”。

## 3. Google 官方原则对本计划的约束

- 每页使用清楚、简洁、独立的 `<title>`，避免堆词和大面积模板化标题：<https://developers.google.com/search/docs/appearance/title-link>
- Meta Description 是候选摘要，不保证按原文展示；页面正文仍需直接回答搜索需求：<https://developers.google.com/search/docs/appearance/snippet>
- 内链必须是可抓取的 `<a href>`，锚文本应帮助用户和 Google 理解目标页：<https://developers.google.com/search/docs/crawling-indexing/links-crawlable>
- 优先 helpful、reliable、people-first content，而不是为搜索变体批量造页：<https://developers.google.com/search/docs/essentials>

字符数只作为内部编辑检查，不是 Google 的硬性排名规则：英文 Title 通常先控制在约 50–65 个字符，Meta Description 先控制在约 140–165 个字符，再以设备实际展示和 GSC CTR 判断。

## 4. 当前核心关键词与页面拥有关系

| 优先级 | 核心关键词 | 意图 | 唯一拥有页面 | 不应作为主词的页面 |
| --- | --- | --- | --- | --- |
| P0 | renovation company kuala lumpur | 商业比较 / 咨询 | `/en` | KL Location、Services Hub、Blog |
| P0 | 吉隆坡装修公司 | 商业比较 / 咨询 | `/zh` | 中文地区页与文章 |
| P0 | renovation services kuala lumpur | 服务比较 | `/en/services` | 首页、单项 Service |
| P0 | residential renovation kuala lumpur | 商业 / 报价 | `/en/services/renovation` | 首页、旧屋页、KL Location |
| P0 | kitchen renovation kuala lumpur | 商业 / 报价 | `/en/services/kitchen` | Cabinet 材料页、成本文章 |
| P0 | bathroom renovation kuala lumpur | 商业 / 报价 | `/en/services/bathroom` | 防水指南、材料页 |
| P0 | office renovation kl | 商业 / 报价 | `/en/services/office-renovation` | Commercial Blog、Location |
| P0 | shop renovation kl | 商业 / 报价 | `/en/services/shop-renovation` | Shoplot Guide、Location |
| P0 | old house renovation malaysia | 商业 / 评估 | `/en/services/old-house` | Old-house Blog cluster |
| P0 | custom cabinet kuala lumpur | 商业 / 报价 | `/en/services/builtin` | Kitchen Service、Materials |
| P1 | renovation contractor kl | 商业 / 本地服务 | `/en/locations/kuala-lumpur` 的次要词 | 首页不堆叠为第二主词 |
| P1 | condo renovation kl | 商业 / 评估 | 先由 `/en/services/renovation` 的独立 Condo 模块承接 | 暂不立即新建页面 |
| P1 | commercial fit-out kl | 商业 / 比较 | 先由 `/en/services` Hub 承接，Office/Shop 分别承接具体意图 | 暂不让 Office 与 Shop 同抢广义词 |
| P1 | renovation cost malaysia | 信息 / 商业前置 | 选定一个 Cost Pillar；见第 11 节 | 首页、Service 不做价格文章 |
| P1 | flooring installation kuala lumpur | 商业 / 报价 | `/en/services/flooring` | Flooring 材料分类页 |

中文页面不做英文页逐字机翻；保持同一页面意图和事实一致，但使用中文用户自然表达。

## 5. 页面关键词 Mapping

### 5.1 首页与 Hub 页面

| 页面 | Primary Keyword | Secondary Keywords | Search Intent | Target Location | 对应用户需求 | 页面边界 |
| --- | --- | --- | --- | --- | --- | --- |
| `/en` | renovation company kuala lumpur | home renovation KL; commercial renovation KL; renovation company Selangor; Klang Valley renovation | 商业比较 / 品牌验证 / 咨询 | Kuala Lumpur；次级覆盖 Selangor、Klang Valley | 判断公司是否能做住宅与商业项目、是否可信、如何咨询 | 只拥有公司级广义词，不深入抢单项服务词 |
| `/zh` | 吉隆坡装修公司 | 吉隆坡住宅装修；吉隆坡商业装修；雪兰莪装修 | 商业比较 / 中文咨询 | Kuala Lumpur、Selangor、Klang Valley | 快速确认业务范围、证据和中文咨询入口 | 与英文首页同意图，不堆英文词 |
| `/en/services` | renovation services kuala lumpur | home & commercial renovation services; renovation scope planning | 服务比较 | Kuala Lumpur、Selangor | 比较不同装修类型并进入正确服务页 | Hub 不抢单个 Kitchen、Bathroom、Office 主词 |
| `/en/locations` | renovation service areas KL & Selangor | Klang Valley renovation coverage; renovation areas | 地区选择 / 服务可达性 | KL、Selangor、Klang Valley | 确认是否服务自己的地区及下一步 | Hub 不抢 `/locations/kuala-lumpur` 的本地主词 |
| `/en/projects` | renovation project references malaysia | home renovation projects; commercial fit-out references; built-in examples | 证据比较 | 只显示已批准的大区域 | 看范围、问题、方案、材料和结果 | 不使用“公司/承包商”商业主词 |
| `/en/blog` | malaysia renovation guides | renovation cost; planning; materials; approval guides | 信息 / 决策前置 | Malaysia，按文章细分 KL/Selangor | 学习预算、流程、材料与风险 | Blog Hub 不抢单篇 Pillar |
| `/en/materials` | renovation materials kuala lumpur | cabinet materials; flooring; bathroom fittings; wall finishes | 材料比较 / 项目前置 | Kuala Lumpur、Selangor | 比较材料取舍并回到相关 Service | 不拥有装修施工、安装或公司级主词 |

### 5.2 Service 页面

| URL | Primary Keyword | Secondary Keywords | Search Intent | Target Location | 对应用户需求 | 与其他页面的边界 |
| --- | --- | --- | --- | --- | --- | --- |
| `/en/services/renovation` | residential renovation kuala lumpur | home renovation KL; full home renovation; condo renovation KL; landed house renovation | 商业 / 范围评估 | KL、Selangor、Klang Valley | 判断住宅整体或局部装修范围、流程与报价准备 | 不承担 old house 专项；不抢首页 company 词 |
| `/en/services/kitchen` | kitchen renovation kuala lumpur | kitchen cabinet renovation; wet and dry kitchen; countertop and plumbing planning | 商业 / 报价 | KL、Selangor | 厨房布局、柜体、台面、水电和报价范围 | 材料页讲产品取舍；Blog 讲成本/知识 |
| `/en/services/bathroom` | bathroom renovation kuala lumpur | bathroom waterproofing; tile and drainage renovation; shower and vanity planning | 商业 / 报价 | KL、Selangor | 漏水、防水、排水、瓷砖、洁具和整体翻新 | 防水 Blog 讲诊断；材料页讲具体材料 |
| `/en/services/office-renovation` | office renovation kl | office fit-out KL; workspace renovation; office partition and M&E coordination | 商业 / 报价 | KL、Selangor、Cyberjaya、PJ | 办公布局、隔断、M&E、IT、施工与交付协调 | 只拥有 Office；不抢 Shop/Retail 和广义 Commercial |
| `/en/services/shop-renovation` | shop renovation kuala lumpur | retail fit-out KL; shoplot renovation; F&B and salon fit-out | 商业 / 报价 | KL、Selangor | 开店前动线、展示、后场、机电、审批和进场 | 不抢 Office；Restaurant 内容作为子场景 |
| `/en/services/old-house` | old house renovation malaysia | terrace house renovation KL; old wiring; old plumbing; roof leakage; structural checks | 商业 / 现场评估 | KL、Selangor | 先检查屋况，再确定必要维修和升级 | Blog 只承担检查表、风险和成本解释 |
| `/en/services/builtin` | custom built-in furniture kuala lumpur | custom cabinet KL; wardrobe; TV cabinet; storage cabinet | 商业 / 设计与报价 | KL、Selangor | 柜体用途、基材、五金、尺寸、收纳和报价 | Kitchen 页只讲厨房整体；Materials 讲材料选型 |
| `/en/services/flooring` | flooring installation kuala lumpur | SPC flooring installation; laminate flooring; floor replacement | 商业 / 报价 | KL、Selangor | 基层、材料、安装、收口、耐用和报价 | Flooring 分类页只做材料比较 |
| `/en/services/design` | interior design kuala lumpur | space planning KL; renovation design coordination; 3D direction | 商业 / 设计咨询 | KL、Selangor | 明确设计交付、空间规划、材料和施工衔接 | Location 可用作次要服务，不以此为所有地区页主词 |
| `/en/services/approval` | renovation permit and drawing support KL | management approval; renovation documents; DBKL coordination | 信息 + 商业协助 | KL、Selangor | 确认资料、责任人、管理处/政府流程和限制 | 不保证审批结果；Guide 讲一般知识 |
| `/en/services/artistic-coating` | artistic wall coating kuala lumpur | textured wall finish; feature wall coating; Remmers wall finish | 商业 / 材料咨询 | KL、Selangor | 了解适用基面、样板、施工和保养 | 材料页讲 finish；Service 讲施工范围 |
| `/en/services/warehouse` | warehouse shelving malaysia | warehouse racking; aisle planning; storage zoning | 商业 / B2B 评估 | Selangor、Klang Valley | 货架、通道、分区、安全与现场评估 | 不与 Office/Shop 共用 Commercial Fit-Out 主词 |

### 5.3 Location 页面

Location 的 Primary Keyword 统一是“服务 + 地区”，但每页必须通过物业类型、实际需求和项目证据形成不同的 Secondary Keywords，不能只换地名。

| URL | Primary Keyword | Secondary Keywords | Search Intent | Target Location | 真实用户需求与差异化方向 |
| --- | --- | --- | --- | --- | --- |
| `/en/locations/kuala-lumpur` | renovation services kuala lumpur | renovation contractor KL; condo/landed/office/shop renovation KL | 本地商业 | Kuala Lumpur | 物业类型复杂、管理处/商业进场、服务覆盖和本地咨询；与首页区分为“地区执行条件” |
| `/en/locations/petaling-jaya` | renovation services petaling jaya | PJ office fit-out; PJ terrace house renovation; custom built-in PJ | 本地商业 | Petaling Jaya | 成熟住宅、Office、Shoplot、物业管理与交通/进场条件 |
| `/en/locations/damansara` | renovation services damansara | landed home renovation; master suite and built-in planning | 本地商业 | Damansara | 先明确 Damansara 范围，避免与 Kota/Ara Damansara 混为一页 |
| `/en/locations/mont-kiara` | condo renovation mont kiara | condo built-in; management approval; wet/dry kitchen | 本地商业 | Mont Kiara | 高层 Condo 的管理处、保护、运输、电梯和材料样板；概念图不能当完工证据 |
| `/en/locations/bangsar` | renovation services bangsar | landed home renovation; F&B/retail fit-out; custom wardrobe | 本地商业 | Bangsar / Bangsar South | 老房、商业单位、邻里/进场、F&B 机电需求 |
| `/en/locations/cheras` | renovation services cheras | old terrace renovation; shop renovation; waterproofing | 本地商业 | Cheras | 老屋水电/防水与零售单位；需区分 KL 与 Selangor 边界 |
| `/en/locations/puchong` | renovation company puchong | landed renovation; built-in; office/shop fit-out; warehouse | 本地商业 | Puchong | 家庭住宅、商业单位、仓储与现场可达性 |
| `/en/locations/subang-jaya` | renovation services subang jaya | kitchen renovation; landed home; restaurant fit-out | 本地商业 | Subang Jaya | 住宅更新、厨房、Shoplot/F&B 与管理/审批条件 |
| `/en/locations/setapak` | renovation services setapak | condo renovation; home storage; kitchen and bathroom | 本地商业 | Setapak | 公寓与住宅常见小空间、收纳、管理处和湿区问题；先补真实证据 |
| `/en/locations/ampang` | renovation services ampang | landed home renovation; condo renovation; exterior work | 本地商业 | Ampang | 有地住宅、外部维护与 Condo；先确认真实可服务边界 |
| `/en/locations/cyberjaya` | office renovation cyberjaya | tech office fit-out; condo renovation; M&E and IT | 本地商业 | Cyberjaya | 办公空间、IT/M&E、商业管理要求与新 Condo |
| `/en/locations/shah-alam` | renovation services shah alam | warehouse fit-out; commercial renovation; landed home renovation | 本地商业 | Shah Alam | 工业/仓储、商业空间和有地住宅的不同进场与审批条件 |
| `/en/locations/setia-alam` | renovation services setia alam | landed home renovation; custom cabinet; exterior feature | 本地商业 | Setia Alam | 新住宅、柜体、外部/门墙与家庭收纳；项目真实性需确认 |

所有中文 Location 页面使用相同拥有关系，但用“地区 + 装修服务/住宅装修/办公室装修”等自然中文表达，不强塞 `contractor`、`best`、`cheap`。

### 5.4 Project、Blog 与 Materials 的拥有规则

| 页面类型 | Primary Keyword 形式 | Search Intent | Target Location | 用户需求 | 禁止抢占 |
| --- | --- | --- | --- | --- | --- |
| Project 详情 | `<property/type> + <scope> + project/reference` | 证据比较 | 只用已批准的大区域 | 看项目问题、方案、材料、过程和结果 | `renovation company KL`、Service 主词 |
| Concept Project | `<space> + design/rendering concept` | 灵感 / 规划 | 地点非必要 | 看布局、材料方向和设计取舍 | 不写 completed project、client result |
| Cost Pillar | `renovation cost malaysia` | 信息 + 商业前置 | Malaysia | 预算组成、范围、风险和报价准备 | 不替代 Service 报价页 |
| Service Guide | `<service> checklist/guide` | 信息 | Malaysia 或明确地区 | 帮客户准备决策 | 不能把纯 Guide 写成 Service 页 |
| Material Category | `<material category> malaysia` | 比较 | Malaysia / KL | 选材料类型和取舍 | 不抢 installation / renovation quote |
| Material Detail | `<specific material> for <application>` | 规格 / 比较 | 项目适用区 | 看适用空间、优缺点、保养和搭配 | 不写“best/cheap contractor” |

## 6. Cannibalization 问题与处置

### 6.1 已确认已处理，继续保留重定向

| 旧页面 | 目标页面 | 当前生产状态 | 后续动作 |
| --- | --- | --- | --- |
| `/en/products/*` | `/en/materials/*` | 抽样为 301；已从生产 sitemap 移除 | 保留 301，不恢复 Products 索引 |
| `/en/landing/bathroom-renovation` | `/en/services/bathroom` | 301 | 保留；Service 为唯一商业页 |
| `/en/landing/office-renovation` | `/en/services/office-renovation` | 301 | 保留；Service 为唯一商业页 |
| 其他已映射 `/landing/*` | 相应 `/services/*` | 最新路由已有映射 | 每次发布继续验证状态、Location 和 sitemap |

本地 `public/seo-manifest.json` 仍包含旧 Products/Landing 记录，但生产运行时已合并。后续应以最新生成脚本和生产 sitemap 对账，不能把旧静态快照当成当前索引事实。

### 6.2 当前高风险页面拥有冲突

| 冲突组 | 风险 | 处置 |
| --- | --- | --- |
| 首页 vs `/locations/kuala-lumpur` vs `/services` vs `/services/renovation` | 都出现 broad renovation + KL | 首页=公司；Location=地区条件；Services=服务选择；Residential=住宅项目，四页按第 5 节重写首屏 |
| `/services/renovation` vs `/services/old-house` | Full/Home/Old House 边界不清 | Residential 页讲一般住宅；Old House 只讲旧屋系统、修复和风险 |
| `/services/builtin` vs Kitchen Service vs Cabinet Materials | Custom cabinet 词可能分散 | Built-in 拥有定制柜商业词；Kitchen 拥有厨房整体；Material 只讲材料 |
| Office vs Shop vs 广义 Commercial Fit-Out | Office 当前标题带 broad Commercial Fit-Out | Office 和 Shop 各自拥有具体意图；广义词先由 Services Hub 承接 |
| `/services/design` vs 多个 Location 的 Interior Design 标题 | 地区页可能抢 Design Service | Location 的标题以 renovation/service area 为主，Interior Design 只作次要词 |
| Project 地区词 vs Location 页 | 部分项目 slug 含地点 | Project 标题聚焦空间与范围；Location 聚焦当地服务，不用同一商业 Title |
| Materials vs Service | 材料详情标题/描述大量包含 Kuala Lumpur、renovation | 材料页聚焦选择与适用；增加到 Service 的上下文链接，不把施工词作为主词 |

### 6.3 需要内容比对或 GSC 才能决定的合并候选

| 候选页面 | 初步判断 | 决策条件 |
| --- | --- | --- |
| `bathroom-waterproofing-guide` vs `bathroom-waterproofing-drainage-planning-malaysia` | 高重叠；优先合并为更完整页面 | 正文重叠、GSC query overlap、外链与转化数据 |
| `malaysia-renovation-budget-guide` vs `klang-valley-renovation-cost-2026` | 可共存，但必须明确全国常青指南 vs Klang Valley 年度成本 | GSC query/page 和内容范围 |
| `office-renovation-checklist-malaysia` vs `office-fit-out-me-it-planning-checklist-malaysia` | 可区分一般流程 vs M&E/IT 专项 | 正文相似度与查询意图 |
| `area-guide-kl-selangor-renovation` vs `/locations` | 可能是弱 Hub 复写 | 若无独立信息和查询，则 301 到 Location Hub |
| `corporate-office-petaling-jaya` vs `petaling-jaya-corporate-office-fit-out` | 可能是同项目或高度相似项目 | 业主核验项目身份、图片和范围 |
| `modern-condo-mont-kiara` vs `mont-kiara-luxury-condo-renovation` | 一个可能为项目、一个已明确为概念 | 保持真实/概念分类；若同素材则合并 |
| Damansara / Kota Damansara / Ara Damansara Location | 地名接近但未必同意图 | GSC、服务边界和真实项目证据；禁止仅按名字合并 |

## 7. 首页 SEO 优化方案

### 7.1 当前问题

- 当前 Title 已明确 `Renovation Company Kuala Lumpur` 和 Home/Commercial 定位，方向正确。
- 当前生产 H1 是 `Renovation for homes and commercial spaces.`，没有直接说明 Kuala Lumpur，也弱化了“公司”实体。
- 首页已有 Service、Location、Project、Blog、Materials 和 Quote 内链，但需要强化正文中的上下文锚文本，而不是只依赖导航和卡片。
- 抽样发现首页 Before/After 的一张重要图片使用空 ALT；Logo 也为空 ALT，需区分装饰图与品牌链接图。
- 首页 Project Evidence 必须区分真实完工、规划参考和 rendering concept。

### 7.2 建议首页结构

1. **H1**：`Renovation Company in Kuala Lumpur for Homes & Commercial Spaces`
2. 首屏副文案：只说明 KL / Selangor / Klang Valley、住宅与商业装修、现场评估、规划、材料和项目协调。
3. 主 CTA：`Request a Renovation Quote`；次 CTA：WhatsApp。移动端首屏需可见。
4. H2 服务覆盖：Residential、Kitchen、Bathroom、Office、Shop、Old House、Custom Built-In。
5. H2 地区覆盖：KL 主区 + Selangor / Klang Valley；不列出无法证明能服务的所有小区。
6. H2 Project Evidence：只放已核验项目；概念图持续标注。
7. H2 Why FLASH CAST：只使用可证实的流程、测量、材料建议、项目协调和已确认公司资料。
8. H2 咨询准备：地点、物业类型、面积、现场照片、问题和目标范围。

### 7.3 首页关键词使用边界

- Primary Keyword 在 Title、H1、首段和一个自然内链中出现即可。
- `Renovation Contractor` 只作为语义次词或 KL Location 次要词，不与 `Renovation Company` 并列重复。
- 禁止堆 `Best Renovation`、`Cheap Renovation`、`No.1`、`Guaranteed`。

## 8. Service 页面优化方案

### 8.1 当前模板缺口

生产抽样显示多数 Service 页共享同一组 H2：`Overview / Our Process / FAQ / Related Services`。当前源码还存在以下缺口：

- `suitableFor` 和服务范围被混在同一个 Overview 列表中。
- 数据中的 `commonProjects` 没有形成独立展示模块。
- 没有针对当前 Service 的 Related Project、Related Location、Related Guide、Related Material。
- Related Services 除 Office/Shop 外，大多退化为数据数组中的前 3 项。
- CTA 位于页面后部；既有内部观察显示部分服务页移动端首屏没有报价、电话或 WhatsApp CTA。

### 8.2 每个 Service 的标准内容合同

每页至少包含以下模块，但标题和内容必须按服务改写，不使用同一句模板：

1. 独立 Title、Meta Description、H1 和首屏 CTA。
2. 服务解决什么问题，以及不适合什么情况。
3. 适合客户：物业/商业类型、阶段和常见需求。
4. Scope：拆除、湿作、水电、柜体、饰面、M&E、文件等实际相关范围。
5. 施工/协作过程：只写该服务特有步骤。
6. 材料与取舍：链接到相关 Materials，不编造价格。
7. 项目证据：1–3 个已核验项目；概念图单独标注。
8. 服务地区：2–5 个最相关 Location，不罗列 30 个城市。
9. 独立 FAQ：服务决策问题，不重复全站 FAQ。
10. CTA：告诉客户首轮应提交什么资料。

### 8.3 先优化的 8 个 Service

| 批次 | 页面 | 本页必须独有的内容 |
| --- | --- | --- |
| A | Residential | Condo vs landed、局部 vs 全屋、居住中施工、范围拆分 |
| A | Kitchen | Wet/dry layout、柜体、台面、电器点位、给排水、潮湿节点 |
| A | Bathroom | 漏水诊断、防水层、坡度/排水、瓷砖、洁具与测试 |
| A | Office | Headcount、工作模式、M&E/IT、消防/管理、reinstatement 边界 |
| A | Shop | 顾客动线、展示、后场、设备、招牌、开业节点和 landlord/mall 要求 |
| B | Old House | 老电线、水管、屋顶、防水、结构检查和必要维修优先级 |
| B | Built-In | 基材、封边、五金、湿区、尺寸、内部配置和样板批准 |
| B | Flooring | 基层含水、找平、材料、铺法、收口、家具移动和维护 |

Design、Approval、Artistic Coating、Warehouse 保留并单独优化，但不应延迟上述核心商业页。

## 9. Location SEO 优化方案

### 9.1 当前问题

- 已有 30 个地区页，因此当前问题不是数量不足。
- KL、PJ、Mont Kiara 抽样页都有 1 个 H1 和不同正文，但使用几乎相同的 H2 模板。
- 地区页的“项目”卡片统一追加 `Rendering concept`，并且只链接 `/projects` Hub，不能把权重和用户直接传给对应项目。
- 部分 fallback 文案使用 `we cover all areas / all neighborhoods`，服务边界证据不足时风险较高。
- 多个地区标题容易变成机械的 `<City> Renovation Contractor | FLASH CAST`。

### 9.2 每个 Location 的差异化内容合同

1. 物业结构：Condo、Landed、Shoplot、Office、Industrial 的真实组合。
2. 当地常见需求：只保留能被服务、项目或咨询证据支持的需求。
3. 当地施工问题：管理处、保护、运输、工作时段、邻里、既有水电、商业进场等。
4. 项目证据：真实项目优先；无真实项目时明确写 planning/rendering reference。
5. 服务范围：列 3–5 个最相关 Service，并解释为什么相关。
6. Nearby Areas：只列真正可服务且有独立意图的邻近页。
7. Local FAQ：每页至少 3 个真正不同的问题。
8. Related Guide：链接一个与当地物业/业务类型相符的 Guide。
9. CTA：要求提交准确地点、物业类型、面积、照片和管理要求。

### 9.3 Location 优先级

| 批次 | 地区 | 业务价值与证据方向 | 前置条件 |
| --- | --- | --- | --- |
| A | Kuala Lumpur | 公司主市场；住宅与商业总覆盖 | 与首页明确分工 |
| A | Petaling Jaya | Office、成熟住宅、Shoplot；已有项目线索 | 核验项目身份与公开授权 |
| A | Puchong | Landed、Built-In、Office/Shop、Warehouse 组合 | 保留真实需求，不泛写全地区 |
| A | Subang Jaya | Kitchen、Landed、Restaurant/F&B | 核验餐饮项目与进场信息 |
| A | Cheras | Old House、Bathroom、Retail/Shop | 区分 KL/雪州边界和服务范围 |
| Regional Hub | Selangor | 承接州级范围与子地区导航 | 不与每个城市复写同一正文 |
| B | Shah Alam | Warehouse/Commercial + Landed | 项目证据与服务能力确认 |
| B | Mont Kiara | 高意图 Condo Renovation | 现有重点项目为 concept，不能冒充实绩 |
| B | Bangsar | Landed + Built-In + F&B/Retail | 真实案例与商业能力确认 |
| B | Cyberjaya | Office/Tech Fit-Out + Condo | M&E/IT 服务事实确认 |
| C | Damansara | Landed / master suite / Built-In | 明确与 Kota/Ara Damansara 的边界 |
| C | Setia Alam | Landed + Built-In + exterior | 项目真实性确认 |
| C | Ampang | Landed + Condo + exterior | 服务范围和项目授权确认 |
| C | Setapak | Condo/Home 需求潜力 | 当前真实项目和询盘证据不足 |

其他 17 个现有 Location 暂停扩写和新增。先保留 URL 稳定，再根据 GSC、有效咨询、项目证据和正文独特性决定保留、合并或 noindex；没有数据前不删除。

## 10. Project 页面 SEO 与证据方案

### 10.1 当前缺口

- Project 详情模板当前主要显示：类型、工期或 concept 类型、范围数量、材料数量、概述、图库和 More Projects。
- 缺少可独立阅读的 `Problem / Solution / Result` 模块。
- Related Projects 目前主要取列表中的前 3 项，不一定同服务、同物业或同材料。
- 项目 Meta Description 偏页面类型模板，未充分表达这个项目的具体问题和方案。
- 公开规则要求保护客户隐私；准确楼宇、门牌、客户/品牌名不能为了 SEO 写入页面。

### 10.2 Project 内容合同

每个项目后台至少整理以下字段，公开页只显示通过授权的内容：

| 字段 | 公开规则 |
| --- | --- |
| Project Name | 用空间类型 + 改造重点，不用客户真实名称 |
| Location | 仅显示批准的城市/州级大区域；具体地址内部保留 |
| Property Type | Condo / Landed / Office / Retail / Warehouse 等 |
| Size | 只有已确认且允许公开才显示 |
| Duration | 仅用于该项目，不推广成通用承诺 |
| Scope | 按工种或空间列出 |
| Client Requirement | 匿名、事实化，不写身份 |
| Problem | 施工前真实问题 |
| Solution | 采取的设计/施工/材料方案 |
| Materials | 链接到相应 Materials 页面 |
| Before / During / After | 每张图记录阶段、ALT、授权和真实性 |
| Result | 可观察结果，不写未经证实的满意度或 ROI |
| Related Service | 1 个主 Service + 最多 2 个次 Service |
| Related Location | 只有隐私和授权允许时才链接 |

### 10.3 项目分级

- **A：Verified Completed Project**：有归属、授权、范围和真实阶段图，可承担信任证明。
- **B：Published Reference, Evidence Incomplete**：保留，但不作为首页强信任证据，等待业主补资料。
- **C：Rendering / Planning Concept**：继续索引时必须在 Title、H1、图注、ALT 和正文持续标注 concept。
- **D：Duplicate / Unclear Identity**：暂停扩写；核验后合并或下线。

## 11. Blog Topic Cluster 体系

### 11.1 Renovation Cost

| 角色 | 页面 | 动作 |
| --- | --- | --- |
| Pillar 候选 | `malaysia-renovation-budget-guide` | 更新为常青的 Malaysia 预算组成与报价准备 |
| 地区年度页 | `klang-valley-renovation-cost-2026` | 保留 2026，显示 Last Updated 和来源；每年维护 |
| 子主题 | `built-in-cabinet-cost-malaysia` | 链接 Built-In Service 与 Cabinet Materials |
| 子主题 | `kitchen-cabinet-price-malaysia` | 保留为柜体价格因素，不冒充完整厨房成本 |
| 子主题 | `old-house-renovation-hidden-costs-malaysia` | 链接 Old House Service |
| 待验证新页 | Condo / Kitchen / Bathroom / Office Renovation Cost | 只在 GSC gap 和真实报价因素足够时分批创建 |

### 11.2 Kitchen

现有：Dry vs Wet Kitchen、Cabinet Material、Cabinet Price、Quotation Checklist。

缺口：Kitchen Layout、Countertop 选择、完整 Kitchen Renovation Cost。Countertop 应优先复用 Materials 分类，不急于再写一篇泛文。

### 11.3 Bathroom

现有：Leakage、Quotation Checklist、Waterproofing + Drainage、Waterproofing Guide。

动作：先处理两篇 Waterproofing 的高重叠，再考虑 Bathroom Cost、Tiles 和 Drainage Problems。Service 页拥有商业主词，Blog 负责诊断和准备。

### 11.4 Old House

现有：Old House Checklist、Hidden Costs、Landed House Renovation Selangor。

下一步优先把 Service 页补齐旧电线、旧水管、屋顶漏水和结构检查模块。只有搜索需求和专家事实足够时，再拆独立 Guide；不要一次创建 4 篇薄文章。

### 11.5 Commercial

现有：Office Checklist、Office M&E/IT、Office Reinstatement、Shop Before Opening、Shoplot Permit、Restaurant Fit-Out、Selangor Office Tips。

动作：

- Office Service 拥有商业意图；Office Blog 解释流程、技术和复原。
- Shop Service 拥有商业意图；Shop/Restaurant Blog 解释开业、设备、后场和审批。
- 先区分现有 Office Checklist 与 M&E/IT Checklist，再决定是否写 Office Cost。
- Commercial Renovation Cost、Shop Cost 均是候选，不在第一批创建。

### 11.6 内容更新规则

以下内容必须有编辑责任人、来源和可见更新时间：

- 成本、价格与预算；
- 管理处、DBKL/地方政府、许可与法规；
- 材料规格、保养、可用性和供应商信息；
- 带年份的文章。

当前 Blog 页面会显示 Published 日期，JSON-LD 也支持 `dateModified`，但抽样没有看到可见的 `Last Updated`。建议在 `updatedAt` 与发布时间不同的情况下显示：

`Published: <date> · Last Updated: <date>`

`feature-wall-ideas-2025` 在 2026 年仍在线，应先更新、移除年份或解释版本，不允许标题年份过期而正文不维护。

## 12. Internal Linking 方案

### 12.1 当前问题

- 全站导航已经连接 Services、Locations、Projects、Blog、Materials，但站点级导航不等于上下文内链。
- Blog 详情当前固定链接到 Services/Projects/Materials Hub，缺少按主题直达商业页的链接。
- Service 页没有 Project、Location、Guide、Material 专项模块。
- Location 项目卡当前只链接 Projects Hub。
- Project 页没有直接链接 Related Service、Location 和 Materials。
- Material 页只链接同分类材料，没有回到 Service、Project 和 Guide。

### 12.2 目标链接矩阵

| 来源 | 必须链接到 | 每页建议 | 示例锚文本 |
| --- | --- | ---: | --- |
| Home | Services Hub、5–8 个重点 Service、Locations Hub、Projects、Quote | 12–18 条上下文链接 | `kitchen renovation in Kuala Lumpur` |
| Service | 2–5 Location、1–3 Project、2 Material、1–2 Blog、Quote | 6–12 条 | `bathroom waterproofing planning` |
| Location | 3–5 Service、1 Project/Concept、1 Guide、2–4 Nearby Area、Quote | 7–12 条 | `office renovation in Petaling Jaya` |
| Project | 1 主 Service、1 Location、2–4 Material、1 Guide、Quote | 5–9 条 | `custom built-in furniture service` |
| Blog | 1 主 Service、1 Location、1 Project、1–2 Material、Quote | 5–8 条 | `request a kitchen renovation quote` |
| Material | 1 Service、1 Project、1 Guide、同分类 2–4 项 | 5–8 条 | `use this finish in custom cabinets` |

### 12.3 Bathroom Leakage 链路示例

`Bathroom Leakage Guide`

→ `/services/bathroom`（Bathroom Renovation）  
→ Waterproofing/Drainage 专项 Guide  
→ 已核验 Bathroom Project  
→ 相关 Tile / Shower / Vanity Material  
→ `/locations/kuala-lumpur` 或真实目标地区  
→ 带来源参数的 Quote CTA

每个链接都必须使用真实 `<a href>`、正确语言 URL 和自然锚文本；禁止在同一段反复重复完全匹配关键词。

## 13. Title / Description 优化清单

### 13.1 P0 英文页面草案

| 页面 | 建议 Title | 独立 Meta Description 草案 |
| --- | --- | --- |
| Home | `Renovation Company Kuala Lumpur \| FLASH CAST` | `Plan home or commercial renovation in Kuala Lumpur, Selangor and Klang Valley with site review, space planning, material advice and coordinated project scope.` |
| Services Hub | `Renovation Services Kuala Lumpur \| FLASH CAST` | `Compare FLASH CAST residential, kitchen, bathroom, office, shop, old-house and custom built-in renovation services across Kuala Lumpur and Selangor.` |
| Residential | `Residential Renovation Kuala Lumpur \| FLASH CAST` | `Plan condo, landed-home, partial or full residential renovation in Kuala Lumpur and Selangor based on site condition, scope, materials and quotation needs.` |
| Kitchen | `Kitchen Renovation Kuala Lumpur \| FLASH CAST` | `Plan a KL or Selangor kitchen renovation covering wet/dry layout, custom cabinets, worktops, appliance points, plumbing and moisture-related details.` |
| Bathroom | `Bathroom Renovation Kuala Lumpur \| FLASH CAST` | `Review bathroom renovation scope in Kuala Lumpur and Selangor, including leakage checks, waterproofing, drainage, tiles, fittings, shower screens and vanities.` |
| Office | `Office Renovation Contractor KL \| FLASH CAST` | `Plan office renovation and fit-out in KL or Selangor with layout, partitions, reception, M&E, IT coordination, materials and management requirements.` |
| Shop | `Shop Renovation Kuala Lumpur \| FLASH CAST` | `Plan shop or retail fit-out in Kuala Lumpur and Selangor around customer flow, display, back-of-house needs, services, approvals and opening priorities.` |
| Old House | `Old House Renovation Kuala Lumpur \| FLASH CAST` | `Assess old-house or terrace renovation in KL and Selangor, including wiring, plumbing, roof, moisture, structure, layout, kitchen and bathroom priorities.` |
| Built-In | `Custom Cabinet Kuala Lumpur \| FLASH CAST` | `Plan custom kitchen cabinets, wardrobes, TV units and storage in KL or Selangor with material, hardware, moisture, layout and quotation considerations.` |
| Flooring | `Flooring Installation Kuala Lumpur \| FLASH CAST` | `Compare flooring installation options for KL and Selangor projects, including substrate checks, SPC, laminate, engineered wood, skirting and finishing details.` |
| Locations Hub | `Renovation Service Areas KL & Selangor \| FLASH CAST` | `Check FLASH CAST renovation service coverage across Kuala Lumpur, Selangor and Klang Valley, then review local property needs and request a site assessment.` |
| Projects Hub | `Home & Commercial Renovation Projects \| FLASH CAST` | `Explore verified renovation projects and clearly labelled planning references, with property type, scope, material direction, process and related services.` |
| Blog Hub | `Malaysia Renovation Guides & Costs \| FLASH CAST` | `Read practical Malaysia renovation guides covering cost factors, kitchens, bathrooms, old houses, offices, shops, approvals, materials and handover.` |
| Materials Hub | `Renovation Materials & Finishes \| FLASH CAST` | `Compare cabinet, countertop, flooring, bathroom, door and wall-finish options for renovation projects, including suitability, trade-offs and care.` |

### 13.2 P0 中文标题方向

| 页面 | 建议 Title |
| --- | --- |
| 首页 | `吉隆坡装修公司 \| 住宅与商业装修 \| FLASH CAST` |
| Services Hub | `吉隆坡装修服务 \| 住宅与商业空间 \| FLASH CAST` |
| Residential | `吉隆坡住宅装修 \| 公寓与有地住宅 \| FLASH CAST` |
| Kitchen | `吉隆坡厨房装修与橱柜定制 \| FLASH CAST` |
| Bathroom | `吉隆坡浴室装修与防水 \| FLASH CAST` |
| Office | `吉隆坡办公室装修与 Fit-Out \| FLASH CAST` |
| Shop | `吉隆坡店铺装修与零售 Fit-Out \| FLASH CAST` |
| Old House | `吉隆坡旧屋翻新 \| 排屋与有地住宅 \| FLASH CAST` |
| Built-In | `吉隆坡定制柜与内嵌家具 \| FLASH CAST` |

中文 Meta Description 应单独编辑，表达“做什么、在哪里、页面独有信息、如何咨询”，不能复制当前多个中文 Hub 使用的同一句通用模板。

### 13.3 Location Title 方向

| 地区 | 建议 Title 方向 |
| --- | --- |
| Kuala Lumpur | `Renovation Services in Kuala Lumpur \| FLASH CAST` |
| Petaling Jaya | `Home & Office Renovation Petaling Jaya \| FLASH CAST` |
| Damansara | `Landed Home Renovation Damansara \| FLASH CAST` |
| Mont Kiara | `Condo Renovation Mont Kiara \| FLASH CAST` |
| Bangsar | `Home & Retail Renovation Bangsar \| FLASH CAST` |
| Cheras | `Old House & Shop Renovation Cheras \| FLASH CAST` |
| Puchong | `Home, Office & Shop Renovation Puchong \| FLASH CAST` |
| Subang Jaya | `Home & Commercial Renovation Subang Jaya \| FLASH CAST` |
| Setapak | `Condo & Home Renovation Setapak \| FLASH CAST` |
| Ampang | `Landed Home & Condo Renovation Ampang \| FLASH CAST` |
| Cyberjaya | `Office & Condo Renovation Cyberjaya \| FLASH CAST` |
| Shah Alam | `Commercial & Home Renovation Shah Alam \| FLASH CAST` |
| Setia Alam | `Home Renovation & Custom Cabinet Setia Alam \| FLASH CAST` |

这些标题只能在对应正文确实支持该物业/服务组合后使用，不能为了差异化虚构服务能力。

### 13.4 当前必须优先修正的 Title / Description

1. `/services/builtin` 和 `/services/warehouse` 当前静态标题含 `FLASH CAST | keyword | Image-Rich Renovation Plan`，属于内部产物式表达，应改为客户可读标题。
2. 多个 Service 和 Blog 英文 Title 过长，重复使用 `FLASH CAST SDN. BHD.`；详情页统一用简短 `FLASH CAST` 即可。
3. `/services/bathroom` 与旧 Landing 曾有完全相同 Title；生产已 301，继续保持单一目标。
4. 45 组 Materials/Products 重复 Title/Description 来自旧双路由；生产 Products 已 301，勿重新开放索引。
5. 抽样材料详情 `kitchen-cabinet-natural-woodgrain` 的生产 Title 为 101 个字符，Meta Description 为 1216 个字符；应改成独立、简洁、可读摘要。
6. 中文 Services、Materials、Contact、Quote、Blog Hub 的部分 Description 使用同一句宽泛模板，应按页面意图重写。

## 14. H1 / H2 / H3、更新时间与图片 SEO

### 14.1 Heading

- 生产抽样的 14 个核心页面都只有 1 个 H1，基础结构合格。
- CMS 富文本清洗会把 H1 降级为 H2，可以降低多 H1 风险。
- 首页 H1 需要加入公司类型和 Kuala Lumpur。
- Services Hub 当前 H1 `Our Services` 过泛，应改为 `Home & Commercial Renovation Services in Kuala Lumpur`。
- 多数 Service 和 Location H2 模板完全一致；保留信息层级，但让标题表达页面独有决策，例如 `Wet and Dry Kitchen Layout`、`Mont Kiara Management Requirements`。
- H3 用于具体步骤、材料、问题或相关项目；不能只为了缩小字号使用 Heading。

### 14.2 Published / Last Updated

- Blog 必须同时保留 Published 和 Last Updated。
- Cost、approval/regulation、material 文章进入季度或半年复查队列。
- 无实际内容更新时不能只改日期。
- Project 只显示事实确认日期或发布/更新日期，不伪造完工年份。

### 14.3 图片 ALT

ALT 写实际内容、阶段和事实状态：

- `Completed kitchen renovation with natural woodgrain cabinets in Kuala Lumpur`：仅真实完工且地点获批时使用。
- `Natural woodgrain kitchen cabinet planning concept`：概念图使用。
- `Bathroom waterproofing membrane at shower floor junction`：施工过程图使用。

抽样发现：

- 站点 Logo 的 ALT 为空；若它是首页品牌链接，建议使用 `FLASH CAST`。如果纯装饰，应明确 `aria-hidden`。
- 首页一张 Before/After 厨房图 ALT 为空，属于应修复的重要内容图。

禁止把 ALT 写成 `best cheap renovation contractor KL` 之类关键词串。

## 15. 应优化、建议新增、建议保留与建议合并

### 15.1 应优化页面

P0：Home、Services Hub、Residential、Kitchen、Bathroom、Office、Shop、Old House、Built-In、KL Location、PJ Location、Puchong Location、Subang Jaya Location、Cheras Location、Projects Hub、Blog Hub、Materials Hub。

P1：Flooring、Design、Approval、Shah Alam、Mont Kiara、Bangsar、Cyberjaya，以及 6 个可验证 Project。

### 15.2 建议新增页面

第一批不新增 Service 或 Location。

通过 GSC gap、销售需求和可写事实后，最多按一批 2 页新增：

1. `Condo Renovation Cost Malaysia`。
2. `Kitchen Renovation Cost Malaysia`。
3. `Bathroom Renovation Cost Malaysia`。
4. `Office Renovation Cost Malaysia`。

以下只作为候选，不立即创建：

- `/services/condo-renovation`：只有 Residential 页已经无法承接且 GSC/咨询持续显示独立商业意图时才拆。
- `/services/commercial-fit-out`：只有广义商业意图确实跨 Office、Retail、F&B 且内容能独立时才建。
- 任何新 Location：30 个现有地区页完成证据审计之前禁止新增。

### 15.3 建议保留页面

- Home、Services、Locations、Projects、Blog、Materials 六个核心 Hub。
- 12 个现有 Service URL，先优化，不改 slug。
- 13 个用户指定重点 Location + Kuala Lumpur / Selangor 父级关系。
- 有独立意图的现有 Blog，尤其 Cost、Kitchen、Bathroom、Old House、Commercial 集群。
- Canonical Materials 路径 `/materials/*`。
- 已部署的 Products/Landing 301 规则。
- 有真实证据或清楚 concept 标识的 Project。

### 15.4 建议合并或冻结页面

- 合并候选见第 6.3 节；任何 301 前先比较 GSC、外链、内容、转化和语言配对。
- 无真实差异的 Location 先冻结扩写；没有证据前不删。
- 无法确认是否同一项目的 Project 标记 `HOLD_FOR_OWNER_EVIDENCE`。
- 过期年份 Blog 先更新或改为常青标题；不能简单复制新年份页面。

## 16. 分批执行计划

### Phase 0：数据与基线（1–3 个工作日）

- 导出 GSC 90 天与 16 个月 query/page 数据。
- 对齐 GA4 organic landing 与真实有效咨询。
- 给 460 个 URL 增加：页面类型、Primary Keyword、索引目标、Owner、证据等级和动作。
- 保存发布前自然点击、展示、CTR、平均位置和合格咨询基线。

交付：完整关键词地图、GSC cannibalization 证据表、P0 页面最终清单。

### Phase 1：首页 + Service（第 1–2 周）

- 先处理 Home、Services Hub 和 5 个 Service：Residential、Kitchen、Bathroom、Office、Shop。
- 修正 Title、Description、H1、独有 H2、首屏 CTA 和上下游内链。
- 第二批处理 Old House、Built-In、Flooring。
- 每次只发布一个双语页面对，完成前后台、Meta、Schema、sitemap 和 CTA 验收。

### Phase 2：Location（第 3–5 周）

- Wave A：KL、PJ、Puchong、Subang Jaya、Cheras。
- 每页先有真实差异化 brief，再写双语内容。
- 每次只处理一个双语 Location 页面对。
- 其余地区不批量套模板。

### Phase 3：Project Evidence（第 4–6 周）

- 业主先核验 6 个最有业务价值的项目。
- 补 Problem、Solution、Result、Materials、阶段图与相关链接。
- 首页只使用 A 级已核验项目作为强信任证据。

### Phase 4：Blog Cluster（第 5–8 周）

- 先更新 10–12 篇现有商业前置文章。
- 完成 Waterproofing、Office Checklist、Cost 页面重叠处理。
- 再按数据新增最多 2 篇成本页；下一批需等首批效果和 QA。

### Phase 5：Materials（第 7–10 周）

- 修复超长 Title/Description。
- 每个材料页加入 Related Service / Project / Guide。
- 评估 97 个 Materials URL 的独特价值，低价值页面不继续扩张。

## 17. SEO 成效指标

### 17.1 领先指标

- P0 页面 Title/H1/Primary Keyword 拥有关系完成率。
- 有效上下文内链覆盖率。
- 独立 Meta Description 覆盖率。
- Project 证据分级完成率。
- 成本/法规/材料内容的 Last Updated 覆盖率。

### 17.2 结果指标

- GSC 非品牌商业 query 的 clicks、impressions、CTR 和 landing page 分布。
- P0 Service/Location 的自然入口增长。
- Organic 到真实表单成功、签名 WhatsApp 入站、有效电话的数量。
- 有效咨询率、量房率、报价率和签单率。

排名、点击和 CTA 点击不能单独作为业务成功。最终指标是可追溯的有效咨询和销售阶段。

## 18. QA、发布和回滚门禁

每个页面批次必须满足：

1. 公司事实、服务范围、地区、价格、工期、保修和项目证据已确认。
2. 英文与中文页面成对完成，不互相逐字机翻。
3. 一页一个 H1；Title、Description、H2/H3 与拥有词一致。
4. 概念图、真实项目和授权素材分类正确。
5. Related Service / Location / Project / Blog / Material 链接真实、可抓取、语言正确。
6. 图片 ALT、尺寸、加载和版权状态合格。
7. CTA 在桌面与 360/390/412px 移动端可用；表单成功、失败和来源追踪分开验证。
8. CMS 先 backup 和 dry-run，再通过受保护 `content-publish` 发布。
9. 发布后验证公开 HTML、Meta/JSON-LD、canonical、hreflang、sitemap、llms 和页面正文。
10. 发现错误时按 revision/backup 回滚；不直接手改生产数据。

源码变更必须走 feature branch → PR → 当前 `main` → 同一 SHA 部署 → 生产复核。禁止从当前脏且落后远端的本地 `main` 发布。

## 19. 需要业主补充或批准的事项

- GSC、GA4 Organic 和匿名销售阶段导出。
- 13 个重点地区的真实优先级、不可服务地区和量房边界。
- Project 的真实性、图片授权、公开地点粒度、面积、工期和结果。
- 对外可用的 SSM、保修、设计/施工能力和合作材料证明。
- Phase 1 最终 Title/H1/Description 与页面 diff 批准。
- 任何 CMS 发布、源码修改、PR、合并和生产部署均需另行执行授权。

## 20. 建议立即开始的最小批次

先做 5 页，不建新页：

1. Home
2. Services Hub
3. Residential Renovation
4. Kitchen Renovation
5. Bathroom Renovation

这个批次能够先解决首页/服务中心/住宅/厨房/浴室的拥有关系、标题、H1、内容结构和商业内链，同时风险和审查范围可控。完成生产 post-check 和至少 2–4 周 GSC/转化观察后，再进入 Office、Shop、Location Wave A。
