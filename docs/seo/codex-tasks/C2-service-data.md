# C2 配套：7 个业务线服务页的完整数据

> 用法：把下面第 1 节的 TS 对象按顺序追加到 `src/data/services.ts` 的 `servicesData` 数组末尾。
> 字段名与 `src/data/types.ts` 的 `ServiceItem` 完全对应，不需要改类型。
> **不要改写文案、不要补价格数字、不要加保修年限**——这些值已经过业主确认可用。

---

## 0. 交付前必读

1. **图片是占位**。`image` 字段指向最接近的现有图，每个都标了 `待补真实图`。上线前如果还没拍到实景，保持占位图不要换成别的服务图。
2. **不含价格**。所有涉及金额的地方都写"以现场评估与书面报价为准"，这是刻意的——报价数字必须业主给。
3. **不含保修期限**。统一写"售后条款以报价单为准"。
4. **ms 不在本文件里**。马来语按现有 11 条的做法走 fallback，交付时在报告里说明 ms 当前表现。
5. **CMS 优先**。这 7 条只进静态兜底，线上若 `services` 表有数据会读 CMS。交付时给后台录入清单。

---

## 1. 七个服务对象（直接追加）

```ts
  {
    id: "digital-lock",
    title: "Digital Lock Supply & Installation",
    titleZh: "电子锁销售与安装",
    slug: "digital-lock",
    seoTitle: "Digital Lock Installation KL | Supply & Install | FLASH CAST",
    seoTitleZh: "吉隆坡电子锁安装｜智能门锁｜FLASH CAST",
    seoDescription: "Digital lock supply and installation for condos and landed homes in Kuala Lumpur and Selangor. Door compatibility check, existing lock replacement, user enrolment and handover testing.",
    seoDescriptionZh: "吉隆坡与雪兰莪公寓及有地住宅的电子锁销售与安装。含门体兼容性核对、旧锁更换、用户录入与交付测试。",
    summary: "Digital lock supply and installation for condos and landed homes across Kuala Lumpur and Selangor, including door compatibility checks, replacement of the existing lock and handover testing with every user enrolled.",
    summaryZh: "为吉隆坡与雪兰莪的公寓及有地住宅提供电子锁销售与安装，含门体兼容性核对、旧锁更换，以及为每位使用者完成录入后的交付测试。",
    description: "A digital lock is only reliable when the door suits it. Before recommending a model, we check the door thickness, the existing mortise or rim lock type, the door material, whether the door closes squarely and whether a gate or grille interferes with the handle side. Condo main doors, landed-house timber doors, glass doors and metal gates each need a different fixing and wiring approach. Installation covers removing the old lock, preparing the door if the cut-out needs adjustment, mounting the new lock, wiring any external keypad or camera, and configuring fingerprints, PINs, cards or app access for each user. At handover we test locking and unlocking from both sides, check the mechanical key override and the emergency power option, and confirm what happens during a power failure. After-sales terms are stated on the quotation.",
    descriptionZh: "电子锁能不能用得久，首先取决于门本身合不合适。在推荐型号之前，我们会先核对门厚、现有锁体类型（mortise 或附加锁）、门的材质、门扇是否关得正，以及铁门或格栅会不会挡住把手一侧。公寓大门、有地住宅木门、玻璃门与铁门，各自需要不同的固定方式与走线做法。安装包含拆除旧锁、在锁孔需要调整时处理门扇、装上新锁、为外置键盘或摄像头上线，以及为每位使用者配置指纹、密码、卡片或 App 权限。交付时会从门内外两侧分别测试上锁与开锁、检查机械钥匙与应急供电方案，并说明断电时的实际表现。售后条款以报价单载明内容为准。",
    suitableFor: [
      "Condo owners replacing the original mechanical lock",
      "Landed-house owners who want keyless entry for family members",
      "Owners who need temporary access codes for contractors or tenants",
      "Households that want an audit trail of who opened the door and when",
    ],
    suitableForZh: [
      "想把原有机械锁换成电子锁的公寓业主",
      "希望家人不用带钥匙进出有地住宅的业主",
      "需要为装修工人或租客设置临时密码的业主",
      "希望查看开门记录、确认谁在什么时间进出的家庭",
    ],
    commonProjects: [
      "Condo main door lock replacement",
      "Landed-house main door and side gate",
      "Digital lock for a rented unit with tenant turnover",
      "Office or shoplot entry with staff access control",
      "Replacement of a failed lock installed by another party",
    ],
    commonProjectsZh: [
      "公寓大门换锁",
      "有地住宅大门与侧门",
      "出租单位的电子锁，配合租客更换",
      "办公室或店铺入口，含员工权限管理",
      "更换他方安装后已故障的电子锁",
    ],
    processSteps: [
      { title: "Door Check", desc: "Confirm door thickness, lock type, material, closing alignment and any gate or grille interference." },
      { title: "Model Matching", desc: "Match a lock to the door and to how the household actually uses it — fingerprint, PIN, card or app." },
      { title: "Removal and Preparation", desc: "Remove the old lock and adjust the cut-out only where the door allows it." },
      { title: "Installation and Wiring", desc: "Mount the lock, wire external keypad or camera, and confirm the mechanical override still works." },
      { title: "Enrolment and Handover", desc: "Enrol every user, test both sides, explain power-failure behaviour and record the after-sales terms." },
    ],
    processStepsZh: [
      { title: "门体核对", desc: "确认门厚、锁体类型、门扇材质、关门是否正，以及铁门或格栅是否影响把手一侧。" },
      { title: "型号匹配", desc: "按门体条件与家庭实际用法（指纹、密码、卡片或 App）选定型号。" },
      { title: "拆锁与处理", desc: "拆除旧锁，只在门扇允许的范围内调整锁孔。" },
      { title: "安装与走线", desc: "装锁、为外置键盘或摄像头上线，并确认机械应急开锁仍然可用。" },
      { title: "录入与交付", desc: "为每位使用者完成录入，两侧实测，说明断电表现并记录售后条款。" },
    ],
    items: [
      "Door thickness and lock body compatibility check",
      "Removal of the existing mechanical or digital lock",
      "Fingerprint, PIN, card and app access configuration",
      "External keypad or camera wiring where applicable",
      "Mechanical key override and emergency power check",
      "User enrolment for every household member",
      "Handover test from both sides of the door",
    ],
    itemsZh: [
      "门厚与锁体兼容性核对",
      "拆除原有机械锁或电子锁",
      "指纹、密码、卡片与 App 权限配置",
      "外置键盘或摄像头的走线（如适用）",
      "机械钥匙与应急供电检查",
      "为每位家庭成员完成录入",
      "门内外两侧的交付实测",
    ],
    faqs: [
      { q: "Will the lock fit my existing door?", a: "It depends on door thickness, the existing lock body and whether the cut-out can be adjusted. We check these on site before recommending a model, and confirm the approach in writing before any drilling." },
      { q: "Can I keep using a mechanical key?", a: "Most models we install keep a mechanical override. We test it at handover and show you where it is stored." },
      { q: "What happens during a power failure?", a: "Behaviour differs by model — some keep the last state, others fail open or fail locked. We confirm the specific behaviour of the installed unit at handover." },
    ],
    faqsZh: [
      { q: "现有的门能装吗？", a: "要看门厚、现有锁体类型，以及锁孔能不能微调。我们会先现场核对再推荐型号，任何开孔动作都会先书面确认做法。" },
      { q: "还能用机械钥匙吗？", a: "我们安装的多数型号都保留机械应急开锁。交付时会现场测试，并告知钥匙的存放位置。" },
      { q: "断电会怎样？", a: "不同型号表现不同，有的保持原状态，有的自动开或自动锁。交付时会说明该型号的实际表现。" },
    ],
    image: "/images/services/ai-concepts/builtin-concept.webp", // 待补真实图：电子锁安装实景
  },
  {
    id: "painting",
    title: "Painting Works",
    titleZh: "油漆工程",
    slug: "painting",
    seoTitle: "Painting Service KL | Interior & Exterior | FLASH CAST",
    seoTitleZh: "吉隆坡油漆工程｜室内外墙｜FLASH CAST",
    seoDescription: "Interior and exterior painting in Kuala Lumpur and Selangor. Surface preparation, crack repair, primer and finish coats, with protection for floors and fittings.",
    seoDescriptionZh: "吉隆坡与雪兰莪室内外墙油漆工程。含表面处理、裂缝修补、底漆与面漆，并对地面与固定家具做保护。",
    summary: "Interior and exterior painting across Kuala Lumpur and Selangor, covering surface preparation, crack and patch repair, priming, finish coats and protection of floors, fittings and furniture.",
    summaryZh: "为吉隆坡与雪兰莪提供室内外墙油漆工程，含表面处理、裂缝与修补处处理、底漆、面漆，以及地面、固定家具与家具的保护。",
    description: "Paint work lasts as long as the preparation underneath it. We start by checking the wall condition: hairline cracks, damp patches, peeling or chalky old paint, and any area that has been patched before. Cracked or hollow plaster is cut back and filled, damp areas are identified before painting rather than painted over, and old glossy or chalky surfaces are sanded so the new coat can bond. The sequence is typically putty or skim coat where needed, primer, then two finish coats, with drying time between each. Floors, door frames, switches, built-in cabinets and furniture are masked or covered before work starts. Exterior work depends on weather, so we plan around the rainy periods rather than promising a fixed completion date.",
    descriptionZh: "油漆能撑多久，取决于底下的处理。开工前我们会先看墙面状况：细裂缝、潮湿斑、起皮或粉化的旧漆，以及之前修补过的位置。开裂或空鼓的灰泥会铲除后填补，潮湿区域会先找出原因而不是直接盖漆，旧的亮面或粉化表面会打磨，让新漆咬得住。一般顺序是批灰或腻子、底漆、两道面漆，每道之间留干燥时间。开工前会把地面、门框、开关、固定橱柜与家具遮盖保护。外墙工程受天气影响，我们会按雨季安排而不是承诺一个固定完工日。",
    suitableFor: [
      "Owners repainting before moving in or before renting out",
      "Households refreshing walls after years without repainting",
      "Offices and shops that need painting outside business hours",
      "Owners preparing a unit for sale or handover",
    ],
    suitableForZh: [
      "准备入住或出租前需要重新粉刷的业主",
      "多年未刷、想整体翻新的家庭",
      "需要在非营业时间施工的办公室与店铺",
      "准备出售或交屋、需要整理外观的业主",
    ],
    commonProjects: [
      "Whole-unit interior repainting",
      "Feature wall and colour change",
      "Exterior wall repainting for landed homes",
      "Office and shoplot repainting at night",
      "Ceiling repainting after water damage repair",
    ],
    commonProjectsZh: [
      "整间单位室内重新粉刷",
      "主题墙与换色",
      "有地住宅外墙重新粉刷",
      "办公室与店铺夜间施工",
      "漏水修补后的天花重新粉刷",
    ],
    processSteps: [
      { title: "Surface Inspection", desc: "Check cracks, damp, peeling and previous patches before quoting the preparation work." },
      { title: "Protection", desc: "Cover floors, mask frames, switches and built-ins before any sanding starts." },
      { title: "Preparation", desc: "Cut back and fill hollow plaster, sand glossy or chalky surfaces, apply putty where needed." },
      { title: "Primer and Finish", desc: "Apply primer then two finish coats, keeping the specified drying time between coats." },
      { title: "Touch-up and Handover", desc: "Walk the area under daylight, touch up marks and confirm the colour reference used." },
    ],
    processStepsZh: [
      { title: "墙面检查", desc: "先看裂缝、潮湿、起皮与旧修补处，再决定报价里的处理工序。" },
      { title: "保护", desc: "打磨之前先遮盖地面、门框、开关与固定家具。" },
      { title: "表面处理", desc: "铲除空鼓灰泥并填补，打磨亮面或粉化表面，需要时批灰。" },
      { title: "底漆与面漆", desc: "上底漆后做两道面漆，每道之间按规定时间干燥。" },
      { title: "补漆与交付", desc: "在自然光下走一遍，补掉磕碰痕迹，并确认所用色号。" },
    ],
    items: [
      "Wall and ceiling surface inspection",
      "Crack cutting, filling and patching",
      "Putty or skim coat where required",
      "Primer application",
      "Two finish coats in the selected colour",
      "Masking and protection of floors and fittings",
      "Post-work cleaning of the painted area",
    ],
    itemsZh: [
      "墙面与天花状况检查",
      "裂缝铲除、填补与修补",
      "需要时批灰或腻子",
      "底漆施工",
      "按选定色号做两道面漆",
      "地面与固定家具的遮盖保护",
      "完工后施工区域的清洁",
    ],
    faqs: [
      { q: "How many coats are included?", a: "The standard scope is primer plus two finish coats. Where the existing colour is much darker or the surface is porous, an additional coat may be needed and will be listed separately." },
      { q: "Can you match my existing colour?", a: "We can match to a colour code or a physical sample. Slight variation is normal between different paint batches, so we recommend confirming the reference before the order is placed." },
      { q: "Can painting be done while we live in the unit?", a: "Yes for most interior work, if the rooms are done in sequence. We agree which rooms are out of use each day and cover furniture accordingly." },
    ],
    faqsZh: [
      { q: "包含几道漆？", a: "标准范围是底漆加两道面漆。如果原色很深或墙面吸水性强，可能需要多一道，会单独列在报价里。" },
      { q: "可以配回原有颜色吗？", a: "可以按色号或实物样板配对。不同批次之间本来就会有轻微色差，建议在订货前先确认色号。" },
      { q: "还住着可以刷漆吗？", a: "多数室内工程可以，按房间分区施工。每天会先约定哪些房间暂时不能用，并做好家具遮盖。" },
    ],
    image: "/images/services/artistic-coating.webp", // 待补真实图：油漆施工实景
  },
  {
    id: "tiling",
    title: "Tiling Works",
    titleZh: "地砖与墙砖工程",
    slug: "tiling",
    seoTitle: "Tiling Works KL | Floor & Wall Tiles | FLASH CAST",
    seoTitleZh: "吉隆坡地砖铺贴｜墙砖地砖｜FLASH CAST",
    seoDescription: "Floor and wall tiling in Kuala Lumpur and Selangor. Substrate check, levelling, waterproofing coordination, cutting, laying and grouting with hollow-tile inspection.",
    seoDescriptionZh: "吉隆坡与雪兰莪地砖与墙砖铺贴。含基层检查、找平、防水配合、切割铺贴与勾缝，并做空鼓检查。",
    summary: "Floor and wall tiling across Kuala Lumpur and Selangor, covering substrate inspection, levelling, waterproofing coordination, cutting, laying, grouting and hollow-tile checks at handover.",
    summaryZh: "为吉隆坡与雪兰莪提供地砖与墙砖铺贴，含基层检查、找平、防水配合、切割铺贴、勾缝，以及交付时的空鼓检查。",
    description: "Tiling fails at the substrate, not at the tile. Before laying, we check whether the existing floor is level, whether the old tile or screed needs removal, and whether the area is wet enough to require waterproofing underneath. Hollow or drummy existing tiles are removed rather than tiled over, because they will loosen the new layer. Layout is set out from a datum line so cuts land where they are least visible, and large-format tiles need a flatter substrate and a different adhesive than standard sizes. Grout joints are kept consistent, expansion joints are allowed at the perimeter, and after laying we check for hollow spots by tapping. Tile supply can be owner-supplied or arranged by us, but the tile size, batch and shade should be confirmed before work starts.",
    descriptionZh: "瓷砖出问题通常不在砖，而在基层。铺贴之前我们会先确认地面是否平整、旧砖或砂浆层需不需要拆除、这个区域是否潮湿到必须做防水。有空鼓的旧砖会拆掉，而不是直接盖上去——盖上去新的一层迟早会松。排版会从一条基准线放出，让收边落在最不显眼的位置；大规格砖对基层平整度与粘结剂的要求和小砖完全不同。勾缝宽度会保持一致，周边留伸缩缝，铺完用敲击方式检查空鼓。砖可以由业主自购或由我们安排，但尺寸、批次与色号必须在开工前确认。",
    suitableFor: [
      "Owners replacing worn or hollow floor tiles",
      "Renovations where the wet area needs re-waterproofing",
      "Shops and offices that need a durable floor before opening",
      "Owners changing from carpet or vinyl to tile",
    ],
    suitableForZh: [
      "需要更换磨损或空鼓地砖的业主",
      "湿区要重做防水后再铺砖的翻新工程",
      "开业前需要耐磨地面的店铺与办公室",
      "想把地毯或胶地板换成地砖的业主",
    ],
    commonProjects: [
      "Living and dining floor tiling",
      "Bathroom and kitchen wall and floor tiling",
      "Balcony and outdoor area tiling",
      "Shoplot and office floor tiling",
      "Replacement of hollow or cracked tiles",
    ],
    commonProjectsZh: [
      "客厅与餐厅地面铺砖",
      "浴室与厨房墙地砖",
      "阳台与户外区域铺砖",
      "店铺与办公室地面铺砖",
      "空鼓或开裂瓷砖的更换",
    ],
    processSteps: [
      { title: "Site and Substrate Check", desc: "Check level, existing tile condition, hollow spots and whether the area needs waterproofing." },
      { title: "Removal", desc: "Hack out old tiles and screed where required, then clear and level the base." },
      { title: "Layout Setting", desc: "Set out from a datum so cuts fall in the least visible positions and joints stay consistent." },
      { title: "Laying", desc: "Apply the correct adhesive for the tile size, lay, level and keep expansion joints at the perimeter." },
      { title: "Grouting and Inspection", desc: "Grout, clean, then tap-check for hollow tiles and record any replacement needed." },
    ],
    processStepsZh: [
      { title: "现场与基层检查", desc: "确认平整度、旧砖状况、空鼓位置，以及是否需要先做防水。" },
      { title: "拆除", desc: "按需要敲除旧砖与砂浆层，清运后把基层找平。" },
      { title: "排版放线", desc: "从基准线放出排版，让收边落在最不显眼处，勾缝保持均匀。" },
      { title: "铺贴", desc: "按砖的规格选用合适的粘结剂，铺贴、找平，周边留伸缩缝。" },
      { title: "勾缝与检查", desc: "勾缝清洁后逐块敲击检查空鼓，记录需要更换的位置。" },
    ],
    items: [
      "Substrate level and hollow-tile inspection",
      "Removal of existing tiles and screed",
      "Floor levelling and surface preparation",
      "Waterproofing coordination in wet areas",
      "Tile layout setting and cutting",
      "Laying with size-appropriate adhesive",
      "Grouting, cleaning and hollow-tile check",
    ],
    itemsZh: [
      "基层平整度与空鼓检查",
      "拆除旧砖与砂浆层",
      "地面找平与基层处理",
      "湿区防水配合",
      "排版放线与切割",
      "按规格选用粘结剂铺贴",
      "勾缝、清洁与空鼓检查",
    ],
    faqs: [
      { q: "Can you tile over existing tiles?", a: "Only where the existing tile is solid, level and the added height does not affect doors or thresholds. Hollow or drummy tiles are removed first, because tiling over them transfers the problem to the new layer." },
      { q: "Do I need waterproofing before tiling?", a: "Wet areas such as bathrooms, kitchens and balconies normally do. We check the area and confirm whether waterproofing is part of the scope before quoting." },
      { q: "Can I supply my own tiles?", a: "Yes. Confirm the size, batch and shade before the order, and allow spare pieces for cuts and future repairs." },
    ],
    faqsZh: [
      { q: "可以直接铺在旧砖上吗？", a: "只有在旧砖牢固、平整，且增加的高度不影响门扇与门槛时才考虑。空鼓的旧砖必须先拆，否则问题会转到新的一层。" },
      { q: "铺砖前要做防水吗？", a: "浴室、厨房与阳台这类湿区通常需要。我们会先看现场，再确认防水是否包含在范围内。" },
      { q: "砖可以自己买吗？", a: "可以。订货前请确认尺寸、批次与色号，并预留切割损耗与日后维修的备用砖。" },
    ],
    image: "/images/services/bathroom-renovation.webp", // 待补真实图：铺砖施工实景
  },
  {
    id: "ceiling",
    title: "Plaster Ceiling and Partition",
    titleZh: "石膏天花板与隔断",
    slug: "ceiling",
    seoTitle: "Plaster Ceiling KL | Ceiling & Light Trough | FLASH CAST",
    seoTitleZh: "吉隆坡石膏天花板｜吊顶与灯槽｜FLASH CAST",
    seoDescription: "Plaster ceiling installation in Kuala Lumpur and Selangor. Flat and cove ceilings, light troughs, access panels and coordination with air-conditioning and downlights.",
    seoDescriptionZh: "吉隆坡与雪兰莪石膏天花板工程。含平顶与跌级吊顶、灯槽、检修口，以及与空调和筒灯的配合。",
    summary: "Plaster ceiling works across Kuala Lumpur and Selangor, covering flat and cove ceilings, light troughs, access panels and coordination with air-conditioning, wiring and downlight positions.",
    summaryZh: "为吉隆坡与雪兰莪提供石膏天花板工程，含平顶与跌级吊顶、灯槽、检修口，以及空调、线路与筒灯位置的配合。",
    description: "A plaster ceiling hides the services above it, which is exactly why its layout has to be agreed before the frame goes up. We mark the finished ceiling height first, then locate the air-conditioner units, the fan coil access panels, the downlight positions and any light trough. Units that cannot be serviced after the ceiling closes are the most common regret, so every concealed item gets an access panel. Metal framing is fixed to the slab or to the wall with the correct spacing, and the plasterboard is screwed and jointed before skimming. Corners and shadow gaps need a straight datum, otherwise the lines read crooked from across the room. If the room has a beam or a structural drop, the ceiling design usually works around it rather than hiding it.",
    descriptionZh: "石膏天花板把上面的管线藏起来，所以框架上墙之前必须先把布局谈定。我们会先标出完成面高度，再定位空调内机、检修口、筒灯位置与灯槽。天花板封上之后就再也修不到的设备，是最常见的遗憾，因此所有隐蔽设备都要留检修口。铁架按正确的间距固定在楼板或墙上，石膏板锁好后做接缝处理再批灰。转角和阴影缝需要一条直的基准线，否则站在房间另一头看就会歪。遇到梁或结构降板，通常是把设计绕开它，而不是硬把它藏起来。",
    suitableFor: [
      "Renovations that need to conceal new wiring or air-conditioning",
      "Owners who want cove lighting or a feature ceiling",
      "Offices that need a clean ceiling before fit-out",
      "Owners replacing a sagging or water-stained ceiling",
    ],
    suitableForZh: [
      "需要藏起新线路或空调管线的翻新工程",
      "想做灯槽或造型天花的业主",
      "装修前需要干净天花的办公室",
      "需要更换下陷或水渍天花的业主",
    ],
    commonProjects: [
      "Whole-unit flat plaster ceiling",
      "Cove ceiling with concealed lighting",
      "Ceiling replacement after a water leak",
      "Office ceiling with access panels",
      "Ceiling and light trough for a feature living area",
    ],
    commonProjectsZh: [
      "整间单位平顶石膏天花",
      "含隐藏灯带的跌级吊顶",
      "漏水后的天花更换",
      "带检修口的办公室天花",
      "客厅造型天花与灯槽",
    ],
    processSteps: [
      { title: "Height and Layout Marking", desc: "Fix the finished ceiling height and mark services, downlights and access panels." },
      { title: "Framing", desc: "Install metal framing at the correct spacing, anchored to slab or wall." },
      { title: "Board and Jointing", desc: "Fix plasterboard, tape and joint the seams, and prepare for skimming." },
      { title: "Skim and Sand", desc: "Apply skim coat, sand flat and check the lines under light." },
      { title: "Paint and Handover", desc: "Prime and paint, then confirm access panels open and lights sit as agreed." },
    ],
    processStepsZh: [
      { title: "标高与放线", desc: "确定完成面高度，标出管线、筒灯与检修口位置。" },
      { title: "上铁架", desc: "按正确间距安装铁架，固定在楼板或墙体上。" },
      { title: "封板与接缝", desc: "锁石膏板、贴带做接缝处理，为批灰做准备。" },
      { title: "批灰与打磨", desc: "批灰后打磨平整，在灯光下检查线条是否顺直。" },
      { title: "上漆与交付", desc: "上底漆与面漆，确认检修口能正常打开、灯具位置符合约定。" },
    ],
    items: [
      "Finished ceiling height setting",
      "Metal framing installation",
      "Plasterboard fixing and jointing",
      "Cove and light trough construction",
      "Access panel for air-conditioning units",
      "Skim coat, sanding and painting",
      "Downlight and wiring coordination",
    ],
    itemsZh: [
      "完成面标高设定",
      "铁架安装",
      "石膏板封板与接缝处理",
      "灯槽与跌级造型施工",
      "空调内机检修口",
      "批灰、打磨与上漆",
      "筒灯与线路配合",
    ],
    faqs: [
      { q: "How much height will the ceiling lose?", a: "It depends on what has to be concealed above it. We measure the air-conditioning and pipe positions first, then confirm the achievable finished height before framing." },
      { q: "Will I be able to service the air-conditioner?", a: "Yes, provided an access panel is included. We mark every concealed unit that needs servicing and confirm the panel positions with you." },
      { q: "Can the existing ceiling be repaired instead of replaced?", a: "Local damage such as a water stain or a small sag can sometimes be cut out and patched. Where the framing has failed or the board is soft across a large area, replacement is usually the more reliable option." },
    ],
    faqsZh: [
      { q: "天花会压低多少？", a: "要看上面需要藏什么。我们会先量空调与管道位置，再确认能做到的完成面高度，之后才上框。" },
      { q: "以后空调还能维修吗？", a: "只要留检修口就可以。所有需要维修的隐蔽设备我们都会标出来，并和你确认检修口位置。" },
      { q: "可以修补而不整个换掉吗？", a: "局部水渍或小面积下陷，有时可以切开修补。如果骨架已经失效或大片板材发软，整体更换通常更可靠。" },
    ],
    image: "/images/services/renovation-works.webp", // 待补真实图：石膏天花施工实景
  },
  {
    id: "partition",
    title: "Partition Works",
    titleZh: "隔墙与隔断工程",
    slug: "partition",
    seoTitle: "Partition Works KL | Plasterboard & Glass | FLASH CAST",
    seoTitleZh: "吉隆坡隔墙工程｜石膏板与玻璃｜FLASH CAST",
    seoDescription: "Partition walls and dividers in Kuala Lumpur and Selangor. Plasterboard, glass and aluminium options with acoustic, fire and service coordination considered.",
    seoDescriptionZh: "吉隆坡与雪兰莪隔墙与隔断工程。提供石膏板、玻璃与铝合金方案，并考虑隔音、防火与管线配合。",
    summary: "Partition walls and dividers across Kuala Lumpur and Selangor, in plasterboard, glass and aluminium, with acoustic performance, fire requirements and concealed services considered before the frame is fixed.",
    summaryZh: "为吉隆坡与雪兰莪提供隔墙与隔断工程，涵盖石膏板、玻璃与铝合金方案，并在固定框架前先考虑隔音、防火与隐蔽管线。",
    description: "A partition is a decision about sound, privacy and services as much as about walls. Before fixing the frame, we confirm what the room is used for — a meeting room, a bedroom, a consultation room or a store — because that decides whether a single plasterboard layer is enough or whether insulation and a double layer are needed. Glass partitions give light and visibility but carry different acoustic and privacy behaviour, and they need framing that can take the weight. Any concealed wiring, network cable or plumbing inside the wall has to be routed and marked before the boards go on, because reopening a finished partition is expensive. Doors, access panels and any wall-mounted equipment also have to be located at this stage. Fire-rated construction, where the building requires it, changes the board specification and must be confirmed with the building management.",
    descriptionZh: "隔墙不只是砌一道墙，它同时决定隔音、隐私与管线怎么走。上框之前我们会先确认房间用途——会议室、卧室、诊室还是储藏室——因为这决定单层石膏板够不够，还是需要加隔音棉与双层板。玻璃隔断透光、视觉开放，但隔音与隐私表现完全不同，框架也要能承重。墙内如果有电线、网络线或水管，必须在封板前布好并标注位置，因为隔墙封好之后再打开代价很高。门、检修口与墙面挂载设备也要在这个阶段定位。大楼若要求防火构造，板材规格会跟着改变，这一点必须先与管理处确认。",
    suitableFor: [
      "Offices adding meeting rooms or private cabins",
      "Owners splitting a large room into two usable spaces",
      "Clinics and studios that need acoustic separation",
      "Shops that need a stockroom or staff area",
    ],
    suitableForZh: [
      "需要增加会议室或独立办公室的写字楼",
      "想把大房间分成两个可用空间的业主",
      "需要隔音分隔的诊所与工作室",
      "需要储物间或员工区的店铺",
    ],
    commonProjects: [
      "Office meeting room partition",
      "Bedroom or study partition in a condo",
      "Glass partition for a reception area",
      "Stockroom partition in a shoplot",
      "Partition with a concealed sliding door",
    ],
    commonProjectsZh: [
      "办公室会议室隔墙",
      "公寓卧室或书房隔间",
      "接待区玻璃隔断",
      "店铺储物间隔墙",
      "含隐藏推拉门的隔墙",
    ],
    processSteps: [
      { title: "Purpose and Requirement Check", desc: "Confirm the room use, acoustic need and any fire requirement from the building." },
      { title: "Layout and Service Routing", desc: "Mark the partition line, door position and route any concealed wiring or plumbing." },
      { title: "Framing", desc: "Install the frame with the correct stud spacing and fixing for the wall type." },
      { title: "Boarding and Insulation", desc: "Add insulation where agreed, then board, tape and joint." },
      { title: "Finishing and Handover", desc: "Skim, sand, paint or fix glass, then check doors, panels and acoustic result." },
    ],
    processStepsZh: [
      { title: "用途与要求核对", desc: "确认房间用途、隔音需求，以及大楼是否有防火要求。" },
      { title: "放线与管线", desc: "标出隔墙位置与门洞，先布好墙内电线或水管。" },
      { title: "上框", desc: "按墙体类型与正确间距安装骨架并固定。" },
      { title: "封板与隔音", desc: "按约定加隔音棉，再封板、贴带做接缝。" },
      { title: "收口与交付", desc: "批灰打磨上漆或安装玻璃，检查门扇、检修口与隔音效果。" },
    ],
    items: [
      "Partition layout and door position setting",
      "Metal stud framing",
      "Insulation where specified",
      "Single or double layer plasterboard",
      "Tape, joint and skim finish",
      "Glass or aluminium partition options",
      "Concealed wiring and plumbing coordination",
    ],
    itemsZh: [
      "隔墙放线与门洞定位",
      "轻钢龙骨框架",
      "按需要加隔音棉",
      "单层或双层石膏板",
      "贴带、接缝与批灰收口",
      "玻璃或铝合金隔断方案",
      "墙内电线与水管的配合",
    ],
    faqs: [
      { q: "How much sound will it block?", a: "It depends on the construction — a single board layer, insulation and a double layer all behave differently. Tell us what the room is used for and we will propose a build-up rather than quote a wall type blindly." },
      { q: "Can I hang things on the partition?", a: "Yes, if the fixing points are planned before boarding. Heavy items need backing or additional framing, which is much easier to add before the boards go on." },
      { q: "Do I need approval for a partition?", a: "For condo and office units, check with the management office first — partitions on or near structural elements and any fire-rated requirement usually need approval." },
    ],
    faqsZh: [
      { q: "能隔多少音？", a: "取决于构造——单层板、加隔音棉、双层板的隔音表现都不同。请告诉我们房间用途，我们会给构造建议，而不是随便报一种墙。" },
      { q: "隔墙上可以挂东西吗？", a: "可以，但加固点要在封板前规划。较重的物件需要背板或额外骨架，这些在封板前做比之后再补容易得多。" },
      { q: "隔墙需要申请吗？", a: "公寓与办公室单位建议先问管理处——涉及结构构件或防火要求的分隔通常需要审批。" },
    ],
    image: "/images/services/ai-concepts/office-renovation-concept.webp", // 待补真实图：隔墙施工实景
  },
  {
    id: "electrical-plumbing",
    title: "Electrical and Plumbing Works",
    titleZh: "水电工程",
    slug: "electrical-plumbing",
    seoTitle: "Electrical & Plumbing Works KL | FLASH CAST",
    seoTitleZh: "吉隆坡水电工程｜拉电与水喉｜FLASH CAST",
    seoDescription: "Electrical and plumbing works in Kuala Lumpur and Selangor. Rewiring, point additions, pipe replacement, leak repair and coordination with renovation trades.",
    seoDescriptionZh: "吉隆坡与雪兰莪水电工程。含重新拉电、加点位、换管、漏水维修，以及与装修工序的配合。",
    summary: "Electrical and plumbing works across Kuala Lumpur and Selangor, covering rewiring, additional points, pipe replacement, leak repair and coordination with the rest of the renovation sequence.",
    summaryZh: "为吉隆坡与雪兰莪提供水电工程，涵盖重新拉电、增加点位、更换管道、漏水维修，以及与整体装修工序的配合。",
    description: "Electrical and plumbing are the trades that are hardest to correct after the finishes go on. We start by mapping what exists: the incoming supply capacity, the consumer unit, which circuits serve which rooms, the water pressure, and where the stop valve and floor traps are. Additions are then priced per point so the scope is countable rather than estimated. Older properties frequently need more than new points — aluminium wiring, an undersized incoming supply, corroded galvanised pipes or a bathroom without a proper trap all surface during the check. Work is sequenced with the other trades: first fix before the plaster and tiles, second fix after painting. Any concealed route is photographed before it is closed up, so a future repair does not require guesswork.",
    descriptionZh: "水电是最难在收口之后补救的工序。我们会先把现状摸清：进电容量、配电箱、各回路分别供哪些房间、水压大小，以及总阀与地漏的位置。新增点位按点计价，这样范围可以数得清，而不是估一个数。旧房子往往不只是加点位——铝线、进电容量不足、镀锌管锈蚀、浴室没有正确存水弯，这些问题都会在检查时浮出来。施工要与其他工种排序：粗装在水电与泥水之前，收口在油漆之后。所有隐蔽走线在封板前拍照留存，日后维修不用靠猜。",
    suitableFor: [
      "Older properties with aluminium wiring or low supply capacity",
      "Renovations adding sockets, lighting circuits or water points",
      "Owners with recurring leaks or low water pressure",
      "Kitchen and bathroom upgrades that need pipe relocation",
    ],
    suitableForZh: [
      "使用铝线或进电容量不足的旧房子",
      "需要增加插座、照明回路或用水点的翻新工程",
      "反复漏水或水压偏低的单位",
      "厨房与浴室改造需要改管的位置",
    ],
    commonProjects: [
      "Whole-unit rewiring",
      "Additional power and lighting points",
      "Bathroom and kitchen pipe replacement",
      "Leak detection and repair",
      "Consumer unit upgrade",
    ],
    commonProjectsZh: [
      "整间单位重新拉电",
      "增加电源与照明点位",
      "浴室与厨房换管",
      "漏水检测与维修",
      "配电箱升级",
    ],
    processSteps: [
      { title: "Existing Condition Check", desc: "Check supply capacity, circuits, water pressure, pipe material and trap condition." },
      { title: "Point Listing", desc: "List every new or relocated point so the scope is countable and priced per point." },
      { title: "First Fix", desc: "Route and fix conduits and pipes before plaster, tiles or ceiling go on." },
      { title: "Testing Before Closing", desc: "Pressure-test plumbing and test circuits, photograph concealed routes." },
      { title: "Second Fix and Handover", desc: "Fit accessories after finishes, test everything and hand over the record." },
    ],
    processStepsZh: [
      { title: "现状检查", desc: "检查进电容量、回路、水压、管材与存水弯状况。" },
      { title: "点位清单", desc: "把所有新增或移位点位列清，按点计价，范围可数。" },
      { title: "粗装", desc: "在批灰、铺砖或封天花之前布管布线并固定。" },
      { title: "封闭前测试", desc: "水管打压、回路测试，隐蔽走线拍照留存。" },
      { title: "收口与交付", desc: "收口后安装面板与洁具，全面测试并交付记录。" },
    ],
    items: [
      "Supply capacity and circuit check",
      "Rewiring and new circuit installation",
      "Additional power, lighting and data points",
      "Pipe replacement and re-routing",
      "Leak detection and repair",
      "Water pressure and trap inspection",
      "Concealed route photography before closing",
    ],
    itemsZh: [
      "进电容量与回路检查",
      "重新拉电与新回路安装",
      "增加电源、照明与网络点位",
      "管道更换与改管",
      "漏水检测与维修",
      "水压与存水弯检查",
      "封闭前隐蔽走线拍照",
    ],
    faqs: [
      { q: "How are electrical works priced?", a: "Per point, so the scope is countable. The quotation lists each point type separately; concealed route length and any consumer unit upgrade are listed as their own items." },
      { q: "Do you do partial work only?", a: "We can take a defined scope, such as a bathroom re-pipe or a single circuit addition, provided the existing installation is safe to connect to. If the check finds an unsafe condition, that has to be resolved first." },
      { q: "Will you break the walls?", a: "Some routing needs chasing, and that is agreed before work starts. Where a route can avoid chasing, we will propose it, but it may change the point positions." },
    ],
    faqsZh: [
      { q: "水电怎么计价？", a: "按点位计价，范围可以数得清。报价会把每种点位分开列，隐蔽走线长度与配电箱升级单独列项。" },
      { q: "可以只做一部分吗？", a: "可以接明确范围，例如浴室换管或增加一个回路，前提是现有线路状况允许安全接入。如果检查发现不安全的情况，必须先处理。" },
      { q: "会敲墙吗？", a: "有些走线需要开槽，这会在开工前约定。如果某条路线可以避免开槽，我们会提出，但点位位置可能要跟着调整。" },
    ],
    image: "/images/services/renovation-works.webp", // 待补真实图：水电施工实景
  },
  {
    id: "factory-renovation",
    title: "Factory and Industrial Renovation",
    titleZh: "工厂与工业空间装修",
    slug: "factory-renovation",
    seoTitle: "Factory Renovation Malaysia | FLASH CAST",
    seoTitleZh: "工厂装修 马来西亚｜厂房与仓库｜FLASH CAST",
    seoDescription: "Factory and industrial unit renovation in Malaysia. Floor loading, ventilation, electrical capacity, fire requirements and phasing around production downtime.",
    seoDescriptionZh: "马来西亚工厂与工业单位装修。含地面承载、通风、用电容量、消防要求，以及围绕停产时间安排的分期施工。",
    summary: "Factory and industrial unit renovation in Malaysia, covering floor loading, ventilation, electrical capacity, fire requirements and phasing planned around production downtime.",
    summaryZh: "为马来西亚工厂与工业单位提供装修，涵盖地面承载、通风、用电容量、消防要求，并围绕停产时间安排分期施工。",
    description: "Industrial work is judged on whether production can restart, not on how the space looks. We begin with the operational facts: what the floor has to carry, whether forklifts or heavy racks will run on it, how much air has to move and where it goes, what electrical capacity the machinery needs, and which areas cannot be shut down at all. Floor systems, coatings and hardstanding are selected against that load and traffic rather than by appearance. Ventilation and extraction are sized for the process, not for comfort. Where the building has fire requirements, the compartmentation, detection and escape routes constrain the layout before any finish is discussed. Because most factories cannot stop for weeks, work is phased by zone so production continues in the unaffected bays, and each zone is handed back in a usable state before the next one starts.",
    descriptionZh: "工业空间的好坏，看的是生产能不能复工，不是好不好看。我们首先确认运营事实：地面要承载什么、叉车或重型货架会不会在上面跑、需要多大的换气量以及排到哪里、设备需要多少电容量，以及哪些区域完全不能停。地面系统、涂层与硬化层是按荷载与车流选的，而不是按外观。通风与排风按工艺需求设计，不是按舒适度。大楼若有消防要求，防火分区、探测与疏散路线会先约束布局，之后才谈面层。多数工厂不可能停几周，所以工程按区域分期，未受影响的车间继续生产，每个区域在下一个开始前先交付到可用状态。",
    suitableFor: [
      "Factories expanding or re-laying a production floor",
      "Warehouses adding racking and hardstanding",
      "Units converting from one production process to another",
      "Operators who need work phased around live production",
    ],
    suitableForZh: [
      "需要扩建或重做生产地面的工厂",
      "要加货架与硬化地面的仓库",
      "从一种生产工艺转换到另一种的单位",
      "必须边生产边施工的厂家",
    ],
    commonProjects: [
      "Production floor coating and hardstanding",
      "Warehouse racking and floor marking",
      "Office and welfare area within a factory",
      "Ventilation and extraction upgrade",
      "Zone-by-zone refurbishment during live production",
    ],
    commonProjectsZh: [
      "生产地面涂层与硬化",
      "仓库货架与地面划线",
      "厂区内的办公与员工福利区",
      "通风与排风升级",
      "边生产边施工的分区翻新",
    ],
    processSteps: [
      { title: "Operational Review", desc: "Confirm loads, traffic, ventilation needs, electrical capacity and areas that cannot stop." },
      { title: "Compliance Check", desc: "Check fire compartmentation, detection and escape requirements with the building before layout." },
      { title: "Phasing Plan", desc: "Split the work into zones so production continues and each zone is handed back usable." },
      { title: "Execution", desc: "Carry out floor, structure, services and finishes zone by zone against the agreed sequence." },
      { title: "Zone Handover", desc: "Test and hand back each zone before moving on, with the record for the next stage." },
    ],
    processStepsZh: [
      { title: "运营条件确认", desc: "确认荷载、车流、通风需求、用电容量，以及不能停产的区域。" },
      { title: "合规核对", desc: "布局之前先与业主及大楼确认防火分区、探测与疏散要求。" },
      { title: "分期方案", desc: "把工程拆成区域，让生产继续，每个区域交付到可用状态。" },
      { title: "施工", desc: "按约定顺序分区完成地面、结构、机电与面层。" },
      { title: "分区交付", desc: "每个区域先测试交付，再进入下一区，并留下记录。" },
    ],
    items: [
      "Floor loading and traffic assessment",
      "Floor coating, hardstanding and repair",
      "Ventilation and extraction sizing",
      "Electrical capacity review and upgrade",
      "Fire compartmentation and escape coordination",
      "Internal office and welfare area construction",
      "Zone phasing plan for live production",
    ],
    itemsZh: [
      "地面荷载与车流评估",
      "地面涂层、硬化与修补",
      "通风与排风量核算",
      "用电容量核查与升级",
      "防火分区与疏散配合",
      "厂内办公与员工区施工",
      "边生产边施工的分区方案",
    ],
    faqs: [
      { q: "Can work be done without stopping production?", a: "In most cases yes, if the work is phased by zone and the services can be isolated per zone. We plan the sequence around your production schedule and confirm which areas can be released." },
      { q: "Do you handle fire and authority requirements?", a: "We coordinate with the building and the relevant parties, and the scope states clearly which submissions are included. Anything requiring professional certification is identified before work starts, not after." },
      { q: "How is industrial work priced?", a: "By measured area and by item, not as a single lump sum. Floor area, coating system, racking, services and phasing each appear separately so you can compare and phase the budget." },
    ],
    faqsZh: [
      { q: "可以不停产施工吗？", a: "多数情况可以，前提是按区域分期、机电能够分区隔离。我们会按你的生产排程安排顺序，并确认哪些区域可以腾出来。" },
      { q: "消防与政府部门的要求你们处理吗？", a: "我们会与业主及相关方协调，报价里会写清哪些送审包含在内。需要专业认证的部分会在开工前指出，而不是做完才发现。" },
      { q: "工业工程怎么计价？", a: "按实测面积与分项计价，不给一个笼统总价。地面面积、涂层系统、货架、机电与分期方案各自列项，方便你比较与分阶段编预算。" },
    ],
    image: "/images/services/ai-concepts/warehouse-concept.webp", // 待补真实图：厂房施工实景
  },
```

---

## 2. 交回 Codex 时要求它做的事

1. 追加到 `src/data/services.ts` 的 `servicesData` 数组末尾，不改既有 11 条
2. 跑 `npm run typecheck`、`npm run lint`、`npm run arch:check`、`npm test`、`npm run build`，全部附退出码
3. 输出 7 个 URL 的访问结果：`/en/services/{slug}`、`/zh/services/{slug}`，共 14 条
4. 输出**后台录入清单**：7 条服务在 `/admin` 各自要填哪些字段（因为线上 CMS 有数据时优先读 CMS）
5. 输出**缺图清单**：7 个 `image` 都是占位，列出待拍的真实图
6. 报告 ms 语言当前表现（这 7 条没有 ms 文案，会走 fallback）

## 3. 已知需要业主后续补的

| 项 | 说明 |
|---|---|
| 7 张真实施工图 | 占位图不能长期用，尤其 digital-lock 现在用的是衣柜概念图 |
| 后台 CMS 录入 | 线上生效靠这一步 |
| ms 文案 | 现阶段 fallback，后续人写 |
