const h = (sections) => sections.map(([title, body]) => `<h2>${title}</h2><p>${body}</p>`).join("");

const article = (input) => ({
  slug: input.slug,
  title_zh: input.zhTitle,
  title_en: input.enTitle,
  excerpt_zh: input.zhExcerpt,
  excerpt_en: input.enExcerpt,
  content_zh: h(input.zh),
  content_en: h(input.en),
  seo_title_zh: input.zhTitle,
  seo_title_en: input.enTitle,
  seo_description_zh: input.zhExcerpt,
  seo_description_en: input.enExcerpt,
});

export const humanizedBlogUpdates = [
  article({
    slug: "rental-unit-renovation-kl",
    zhTitle: "KL 出租单位装修：预算与耐用度怎么拿捏",
    enTitle: "KL Rental Unit Renovation: Budget and Durability Tips",
    zhExcerpt: "出租单位装修要把钱花在耐用、易清洁、少维修的地方，而不是一味追求昂贵材料。",
    enExcerpt: "Rental-unit renovation should focus on durable, easy-care finishes and sensible spending, not the most expensive materials.",
    zh: [
      ["先看租客会怎样使用空间", "出租单位最怕后期维修频繁。地板、墙面、橱柜和门锁要优先选择耐磨、容易清洁、替换方便的做法，风格保持干净耐看就够了。"],
      ["预算别全部压在表面效果", "可以把预算分成基础维修、耐用材料、必要收纳和交屋清洁。水电、防水、门窗这些看不见的部分如果省过头，后面更容易产生投诉。"],
      ["报价前准备这些资料", "准备单位地点、面积、照片、目标租金、预算范围和预计出租时间。承包商越早知道使用目标，越容易把规格控制在合理范围。"],
    ],
    en: [
      ["Start with tenant usage", "Rental units need finishes that can handle frequent use. Flooring, walls, cabinets, and locks should be durable, easy to clean, and simple to repair."],
      ["Do not spend everything on appearance", "Split the budget into repair work, durable finishes, basic storage, and final cleaning. Wiring, waterproofing, doors, and windows should not be ignored."],
      ["Prepare details before pricing", "Share the location, area, photos, target rent, budget range, and expected rental date so the scope can be matched to the investment goal."],
    ],
  }),
  article({
    slug: "renovation-payment-schedule-malaysia",
    zhTitle: "装修付款进度表怎么安排比较安全",
    enTitle: "How to Plan a Safer Renovation Payment Schedule",
    zhExcerpt: "装修付款应跟着工程节点走，先把每一阶段包含什么写清楚，后面才不容易争议。",
    enExcerpt: "A safer renovation payment schedule links each payment to clear work milestones and written scope.",
    zh: [
      ["付款要跟工程进度绑定", "订金、材料进场、湿作业完成、木作安装、收尾交付，每个节点都应该对应具体工作内容。不要只看百分比，要看付款后现场应该完成到什么程度。"],
      ["保留收尾检查空间", "最后一笔款项建议放在修补、清洁、测试和交付检查后。这样双方都有清楚目标，也能减少小问题拖到入住后才处理。"],
      ["避免口头承诺", "付款表、材料规格、工期和不包含项目最好写进报价或合同。越早写清楚，施工中越少误会。"],
    ],
    en: [
      ["Tie payment to real progress", "Deposit, material delivery, wet works, carpentry installation, and handover should each match a visible milestone. Percentages alone are not enough."],
      ["Keep room for final checks", "The last payment should follow rectification, cleaning, testing, and handover inspection. This keeps small issues from being pushed after move-in."],
      ["Avoid verbal promises", "Payment stages, material specifications, timeline, and exclusions should be written into the quotation or agreement."],
    ],
  }),
  article({
    slug: "spc-vs-vinyl-flooring-malaysia",
    zhTitle: "SPC 地板和 Vinyl 地板怎么选",
    enTitle: "SPC vs Vinyl Flooring in Malaysia",
    zhExcerpt: "SPC 与 Vinyl 都常见，选择时要看潮湿环境、脚感、基层平整度和日后维修方式。",
    enExcerpt: "SPC and vinyl flooring should be compared by moisture resistance, comfort, subfloor condition, and maintenance needs.",
    zh: [
      ["先看使用区域", "厨房外侧、入口和高频走动区域通常更适合稳定性较好的 SPC；卧室如果更重视脚感，可以考虑较柔和的 Vinyl。"],
      ["基层会影响成品效果", "地面不平会让卡扣、边条和脚感出问题。报价前要确认找平、门缝高度、踢脚线和收边做法。"],
      ["别只比较每平方尺价格", "材料费之外还要看防潮垫、损耗、安装人工和后期更换难度。总成本比单价更重要。"],
    ],
    en: [
      ["Check the room usage first", "SPC is often better for high-traffic and slightly damp areas, while vinyl can feel softer in bedrooms and low-impact spaces."],
      ["Subfloor condition matters", "Uneven floors affect locking joints, edging, and walking comfort. Confirm levelling, door clearance, skirting, and transitions."],
      ["Compare total installed cost", "Underlay, wastage, labour, edging, and future replacement matter more than material price alone."],
    ],
  }),
  article({
    slug: "custom-wardrobe-price-malaysia",
    zhTitle: "马来西亚定制衣柜价格怎么看",
    enTitle: "How to Compare Custom Wardrobe Prices in Malaysia",
    zhExcerpt: "定制衣柜比价要看板材、门板、五金、抽屉、灯带和内部配件，不能只看总价。",
    enExcerpt: "Custom wardrobe pricing depends on board material, door finish, hardware, drawers, lighting, and internal accessories.",
    zh: [
      ["价格差通常来自规格差", "同样是衣柜，平开门、移门、玻璃门、抽屉数量、五金等级和内部收纳都会影响价格。报价要先确认尺寸和结构。"],
      ["常用区域要耐用", "每天开关的门铰、抽屉轨道和挂衣杆不要只看便宜。五金顺不顺，往往决定衣柜好不好用。"],
      ["先整理收纳习惯", "报价前准备墙面尺寸、衣物类型、长衣比例、抽屉需求和镜子或灯带需求，设计会更贴近日常使用。"],
    ],
    en: [
      ["Price differences come from specifications", "Door type, glass panels, drawer count, hardware grade, and internal accessories can change the price even when the wardrobe size looks similar."],
      ["Daily-use hardware matters", "Hinges, runners, hanging rails, and sliding tracks affect long-term comfort. Cheap hardware can become the first source of frustration."],
      ["Share storage habits early", "Prepare wall dimensions, clothing types, long-hanging needs, drawer requirements, mirrors, and lighting preferences before asking for pricing."],
    ],
  }),
  article({
    slug: "office-reinstatement-vs-renovation",
    zhTitle: "办公室还原工程和装修工程有什么不同",
    enTitle: "Office Reinstatement vs Renovation: What Is the Difference?",
    zhExcerpt: "办公室还原是交回给业主或大楼，装修则是为下一阶段使用做准备，两者目标不同。",
    enExcerpt: "Office reinstatement prepares a space for handback, while renovation prepares it for the next user or business operation.",
    zh: [
      ["还原看的是交还标准", "还原工程通常要拆除隔间、柜体、招牌、地毯或电位，并按租约或大楼要求恢复。重点不是好看，而是能不能交回。"],
      ["装修看的是使用效率", "办公室装修要考虑团队人数、会议室、前台、弱电、照明、收纳和未来扩充。目标是让团队搬进去后能顺利工作。"],
      ["报价资料不要混在一起", "如果同时涉及搬迁、还原和新办公室装修，最好分开报价和排期，责任范围会更清楚。"],
    ],
    en: [
      ["Reinstatement follows handback rules", "It often covers removing partitions, cabinets, signage, carpet, or electrical points to meet landlord or building requirements."],
      ["Renovation supports daily work", "Office renovation focuses on headcount, meeting rooms, reception, data points, lighting, storage, and future expansion."],
      ["Keep scopes separate", "If relocation involves both reinstatement and new fit-out, separate the quotations and timelines so responsibilities are clear."],
    ],
  }),
  article({
    slug: "shoplot-renovation-permit-malaysia",
    zhTitle: "店铺装修需要哪些审批资料",
    enTitle: "What Approval Documents Are Needed for Shoplot Renovation?",
    zhExcerpt: "店铺装修常涉及业主、管理处、商场、招牌、消防和施工时间限制，开工前要先对齐资料。",
    enExcerpt: "Shoplot renovation approval often involves landlord, management, mall, signage, fire-safety, and working-hour requirements.",
    zh: [
      ["先问清楚谁有审批权", "街店、商场店、办公楼底商的规则不一样。开工前要确认业主、管理处、商场或地方政府分别要什么资料。"],
      ["常见资料要提前准备", "通常会用到平面图、施工范围、承包商资料、保险、工人名单、押金、施工时间表和招牌资料。"],
      ["审批会影响开业时间", "不要等材料到了才处理文件。审批、招牌制作、消防或管理处复核都会影响倒排工期。"],
    ],
    en: [
      ["Identify the approval party", "Street shops, mall units, and commercial blocks follow different rules. Confirm whether landlord, management, mall, or council approval is needed."],
      ["Prepare common documents early", "Floor plans, scope of work, contractor details, insurance, worker lists, deposits, schedule, and signage details are often requested."],
      ["Approval affects opening date", "Do not wait until materials arrive. Approval, signage production, and inspection can affect the launch timeline."],
    ],
  }),
  article({
    slug: "landed-house-renovation-selangor",
    zhTitle: "雪兰莪有地住宅装修重点清单",
    enTitle: "Selangor Landed House Renovation Checklist",
    zhExcerpt: "有地住宅翻新要先查屋顶、排水、墙体、水电和潮湿问题，再决定风格升级。",
    enExcerpt: "Landed house renovation should start with roof, drainage, wall, wiring, plumbing, and dampness checks.",
    zh: [
      ["先查屋况再谈设计", "有地住宅常见问题包括屋顶渗水、排水不顺、墙身裂缝、旧电线和地面下陷。先检查基础问题，预算才不会失控。"],
      ["室外工程也要算进去", "外墙、防水、雨棚、围墙、铁门、车 porch 和排水沟都会影响整体费用，不要只看室内装修。"],
      ["分阶段会更稳", "如果预算有限，可以先处理安全、防水、水电和厨房浴室，再安排柜体、背景墙和软装升级。"],
    ],
    en: [
      ["Check the house before design", "Roof leaks, drainage issues, wall cracks, old wiring, and floor settlement should be reviewed before choosing finishes."],
      ["Include exterior works", "External walls, waterproofing, awnings, gates, car porch, and drains can affect the budget as much as interior works."],
      ["Phase the work if needed", "Handle safety, waterproofing, wiring, plumbing, kitchen, and bathrooms first, then plan cabinets and styling upgrades."],
    ],
  }),
  article({
    slug: "dry-wet-kitchen-renovation-malaysia",
    zhTitle: "马来西亚干湿厨房装修怎么规划",
    enTitle: "How to Plan Dry and Wet Kitchen Renovation in Malaysia",
    zhExcerpt: "干湿厨房要按烹饪习惯分工，湿厨房重防水排烟，干厨房重展示、收纳和动线。",
    enExcerpt: "Dry and wet kitchens should be planned around cooking habits, fumes, waterproofing, storage, and daily movement.",
    zh: [
      ["先分清楚煮什么", "重油烟、热炒和洗涤工作适合放在湿厨房；咖啡机、小家电、展示柜和轻食准备可以放在干厨房。"],
      ["湿厨房要耐用好清洁", "地砖防滑、墙面易擦、台面耐污、排水顺畅和抽油烟路线都要提前确认。好看之外，要能每天使用。"],
      ["干厨房要控制杂乱", "干厨房常连着客餐厅，收纳、电器位、隐藏插座和灯光很关键。设计时要把展示和日常使用一起考虑。"],
    ],
    en: [
      ["Plan around cooking habits", "Heavy cooking, washing, and oily work belong in the wet kitchen. Coffee, small appliances, display storage, and light prep can sit in the dry kitchen."],
      ["Wet kitchens need easy maintenance", "Slip resistance, washable walls, stain-resistant tops, drainage, and cooker-hood routing should be confirmed early."],
      ["Dry kitchens need clutter control", "Because dry kitchens often connect to living and dining areas, storage, appliance points, hidden sockets, and lighting need careful planning."],
    ],
  }),
  article({
    slug: "area-guide-kl-selangor-renovation",
    zhTitle: "吉隆坡与雪兰莪装修地区指南",
    enTitle: "KL and Selangor Renovation Area Guide",
    zhExcerpt: "不同地区的物业类型、管理规则、材料运输和施工时间都会影响装修排期与报价。",
    enExcerpt: "Renovation planning in KL and Selangor changes by property type, management rules, delivery access, and working hours.",
    zh: [
      ["公寓和有地住宅规则不同", "Mont Kiara、Bangsar、PJ、Subang、Puchong、Cheras、Shah Alam 和 Klang 的物业条件不同，先确认是公寓、排屋、半独立还是店铺。"],
      ["运输条件会影响成本", "电梯保护、卸货时间、停车位、楼层距离和材料搬运路线都会影响人工与排期。报价前最好让团队了解现场限制。"],
      ["地方经验可以减少来回", "熟悉区域规则的团队更容易提前提醒管理处文件、噪音时间和材料进场安排，避免开工后才补资料。"],
    ],
    en: [
      ["Property type changes the rules", "Mont Kiara, Bangsar, PJ, Subang, Puchong, Cheras, Shah Alam, and Klang each have different condo, landed, or shoplot conditions."],
      ["Delivery access affects cost", "Lift protection, unloading time, parking, floor distance, and material movement routes can affect labour and scheduling."],
      ["Local experience reduces back-and-forth", "A team familiar with the area can flag management documents, noisy-work hours, and delivery planning earlier."],
    ],
  }),
  article({
    slug: "renovation-quotation-checklist-malaysia",
    zhTitle: "马来西亚装修报价单要看什么",
    enTitle: "Malaysia Renovation Quotation Checklist",
    zhExcerpt: "看装修报价不要只看总价，要拆开范围、材料、数量、收口、保修和不包含项目。",
    enExcerpt: "A renovation quotation should be checked by scope, material, quantity, finishing details, warranty, and exclusions.",
    zh: [
      ["总价低不代表范围一样", "两个报价差很多时，先看是否都包含拆除、保护、清运、材料、人工、收边、测试和清洁。少一项，后面就可能加价。"],
      ["材料要写到可确认", "只写 premium 或 high quality 不够。最好写清品牌、型号、尺寸、厚度、颜色或同等级替代方式。"],
      ["不包含项目也很重要", "管理处押金、政府费用、电器、灯具、活动家具、隐藏问题和临时追加，最好在报价阶段讲清楚。"],
    ],
    en: [
      ["A lower total may not mean the same scope", "Check whether demolition, protection, disposal, materials, labour, edging, testing, and cleaning are included."],
      ["Materials should be identifiable", "Words like premium or high quality are too vague. Confirm brand, model, size, thickness, colour, or equivalent alternatives."],
      ["Exclusions matter", "Management deposits, authority fees, appliances, loose furniture, hidden defects, and variation works should be stated early."],
    ],
  }),
  article({
    slug: "built-in-furniture-small-condo-storage",
    zhTitle: "小公寓定制收纳怎么规划",
    enTitle: "Built-In Furniture Ideas for Small Condo Storage",
    zhExcerpt: "小公寓收纳重点不是做满柜子，而是把动线、深度、开门方式和日常习惯先排清楚。",
    enExcerpt: "Small-condo storage works best when circulation, cabinet depth, door swing, and daily habits are planned first.",
    zh: [
      ["先保留走动空间", "小户型不要为了收纳把通道压得太窄。玄关、餐边、电视墙和卧室衣柜要先确认人能舒服经过。"],
      ["柜深不是越深越好", "鞋柜、杂物柜、衣柜和展示柜需要不同深度。太深的柜子容易变成堆放区，反而不好找东西。"],
      ["用隐藏式收口减少杂乱", "同色柜门、无把手设计、开放格比例和灯带位置，会让小空间看起来更整齐，也更耐看。"],
    ],
    en: [
      ["Protect walking space first", "Do not sacrifice circulation for storage. Entry, dining, TV wall, and bedroom cabinets should still allow comfortable movement."],
      ["Cabinet depth is not always better", "Shoe cabinets, utility storage, wardrobes, and display shelves need different depths. Over-deep cabinets often become clutter zones."],
      ["Use quiet finishing details", "Matching doors, handle-free fronts, limited open shelves, and controlled lighting help small spaces feel calmer."],
    ],
  }),
  article({
    slug: "renovation-materials-for-malaysia-climate",
    zhTitle: "适合马来西亚气候的装修材料怎么选",
    enTitle: "Renovation Materials for Malaysia's Climate",
    zhExcerpt: "马来西亚湿热，材料选择要优先考虑防潮、防水、通风、清洁和长期变形风险。",
    enExcerpt: "Malaysia's hot and humid climate makes moisture resistance, ventilation, cleaning, and stability important material factors.",
    zh: [
      ["潮湿区域先看防水防潮", "浴室、厨房、靠窗墙面和底层住宅更容易受潮。地板、板材、涂料和收口要按现场湿度选择。"],
      ["通风和清洁也算材料问题", "再好的材料，如果空气不流通、油烟重或清洁困难，也会老化得更快。设计要和使用习惯一起看。"],
      ["样板要放到现场看", "灯光、自然光和周围颜色会改变材料效果。最终确认前，把样板放在现场比较会更稳。"],
    ],
    en: [
      ["Moisture-prone areas need priority", "Bathrooms, kitchens, window walls, and ground-floor homes are more exposed to dampness. Flooring, boards, coatings, and edging should match the site."],
      ["Ventilation and cleaning affect material life", "Even good materials age faster when ventilation is poor, cooking is heavy, or surfaces are hard to clean."],
      ["Review samples on site", "Lighting and surrounding colours change how materials look. Final selection is safer when samples are checked in the actual space."],
    ],
  }),
  article({
    slug: "old-house-renovation-hidden-costs-malaysia",
    zhTitle: "马来西亚旧屋翻新常见隐藏费用",
    enTitle: "Hidden Costs in Old House Renovation in Malaysia",
    zhExcerpt: "旧屋翻新最容易追加的费用，通常来自水电、防水、墙地面、屋顶和拆除后才看见的问题。",
    enExcerpt: "Hidden old-house renovation costs often come from wiring, plumbing, waterproofing, walls, floors, roofs, and post-hacking discoveries.",
    zh: [
      ["拆开后才知道的项目要预留", "旧屋常见隐藏问题包括旧电线、锈蚀水管、空鼓地砖、墙面渗水、白蚁和屋顶漏水。报价前只能先估风险，不能全部当作已知项目。"],
      ["基础维修优先于装饰", "如果预算有限，先处理安全、漏水、排水和电力负载，再安排柜体、背景墙和软装。这样住进去后更安心。"],
      ["报价要写清楚现场确认项", "哪些项目已包含，哪些要拆除后再确认，最好提前写明。这样追加费用出现时，双方比较容易判断是否合理。"],
    ],
    en: [
      ["Allow for items only visible after hacking", "Old wiring, rusty pipes, hollow tiles, seepage, termites, and roof leaks may only be confirmed after opening up."],
      ["Prioritize repairs before decoration", "Handle safety, leaks, drainage, and electrical load before cabinets, feature walls, and styling upgrades."],
      ["State site-confirmation items clearly", "Quotations should separate included work from items that need confirmation after demolition."],
    ],
  }),
  article({
    slug: "shop-renovation-opening-timeline-malaysia",
    zhTitle: "店铺开业前装修时间怎么倒排",
    enTitle: "Shop Renovation Timeline Before Opening in Malaysia",
    zhExcerpt: "店铺装修要从开业日往回排，把审批、招牌、材料、施工、清洁和试营业都算进去。",
    enExcerpt: "A shop renovation timeline should work backwards from opening day and include approval, signage, materials, works, cleaning, and soft-opening checks.",
    zh: [
      ["开业日不是施工结束日", "真正稳妥的排期，要在开业前预留清洁、陈列、设备测试和员工熟悉空间的时间。不要把最后一天排到满。"],
      ["长交期项目先锁定", "招牌、定制柜、特殊灯具、厨房设备和玻璃工程常常需要等待制作。越早确认，越不容易压缩施工。"],
      ["关键工程先完成", "水电、空调、消防、门面、收银区和安全通道会影响能不能营业，装饰细节可以分阶段微调。"],
    ],
    en: [
      ["Opening day is not handover day", "Allow time for cleaning, display setup, equipment testing, and staff orientation before opening to customers."],
      ["Lock long-lead items early", "Signage, custom cabinets, special lights, kitchen equipment, and glass works often need production time."],
      ["Finish business-critical work first", "Electrical, air-conditioning, fire-safety, frontage, cashier area, and safety access affect whether the shop can operate."],
    ],
  }),
  article({
    slug: "office-fit-out-checklist-selangor",
    zhTitle: "雪兰莪办公室装修前要确认什么",
    enTitle: "Office Fit-Out Checklist for Selangor Workplaces",
    zhExcerpt: "办公室装修前要把人数、动线、会议室、弱电、照明、管理处规则和搬迁时间先确认。",
    enExcerpt: "Before office fit-out, confirm headcount, workflow, meeting rooms, data cabling, lighting, building rules, and move-in timing.",
    zh: [
      ["先算团队怎么工作", "人数、部门关系、访客路线、会议频率和未来扩充，会决定开放工位、隔间和公共区比例。"],
      ["弱电不能留到最后", "网络点、插座、门禁、投影、打印区和会议设备要跟家具尺寸一起规划，后改通常更麻烦。"],
      ["搬迁前做一次完整测试", "交付前测试灯、插座、网络、空调、门锁和会议室设备，团队搬进来后才不会被小问题打断。"],
    ],
    en: [
      ["Map how the team works", "Headcount, team relationships, visitor flow, meeting frequency, and expansion plans shape workstations, partitions, and shared areas."],
      ["Do not leave cabling to the end", "Data points, sockets, access control, projection, printers, and meeting equipment should align with furniture dimensions."],
      ["Test before move-in", "Check lighting, sockets, network, air-conditioning, locks, and meeting-room equipment before the team starts work."],
    ],
  }),
  article({
    slug: "bathroom-leakage-renovation-malaysia",
    zhTitle: "浴室漏水翻新要先查什么",
    enTitle: "Bathroom Leakage Renovation in Malaysia: What to Check First",
    zhExcerpt: "浴室漏水不要急着重铺砖，先查水管、地漏、防水层、墙角和楼下渗水位置。",
    enExcerpt: "Before renovating a leaking bathroom, check pipes, floor traps, waterproofing, corners, and the exact seepage location.",
    zh: [
      ["先找漏水来源", "漏水可能来自水管、地漏、墙角、防水层破损、玻璃门挡水或楼上单位。先判断来源，才不会做错工程。"],
      ["翻新时要处理基层", "只是换新砖不一定能解决问题。拆除后要检查基层、找坡、管口和墙地交界，再重新做防水。"],
      ["测试比口头保证重要", "铺砖前做闭水测试，交付前测试排水和挡水。这样比单纯说做了防水更可靠。"],
    ],
    en: [
      ["Find the leak source first", "Leaks may come from pipes, floor traps, corners, damaged membrane, shower kerbs, or an upper unit. The repair scope depends on the source."],
      ["Treat the substrate during renovation", "Changing tiles alone may not solve leakage. After hacking, check substrate, slope, pipe penetrations, and wall-floor junctions."],
      ["Testing matters more than promises", "A ponding test before tiling and drainage checks before handover are important parts of the work."],
    ],
  }),
  article({
    slug: "kitchen-cabinet-price-malaysia",
    zhTitle: "马来西亚厨房橱柜价格怎么拆分",
    enTitle: "Kitchen Cabinet Price in Malaysia: What Affects the Cost",
    zhExcerpt: "厨房橱柜价格受柜体、门板、台面、五金、抽屉、电器位和安装难度影响。",
    enExcerpt: "Kitchen cabinet cost depends on cabinet body, door finish, countertop, hardware, drawers, appliance points, and installation conditions.",
    zh: [
      ["先把柜体和台面分开看", "柜体板材、门板表面、台面材料和五金是不同项目。只看一尺多少钱，很容易忽略规格差异。"],
      ["抽屉和配件会拉开价格", "抽屉、拉篮、转角五金、灯带和隐藏插座会提高实用性，也会影响预算。要按日常使用决定。"],
      ["现场条件也会影响人工", "墙面平整度、水电位置、旧柜拆除、地砖高度和收口方式都会影响安装时间与费用。"],
    ],
    en: [
      ["Separate cabinet body and countertop", "Board material, door finish, countertop, and hardware are separate cost items. A per-foot rate can hide specification differences."],
      ["Drawers and accessories change the budget", "Drawers, pull-out baskets, corner fittings, lighting, and hidden sockets improve use but increase cost."],
      ["Site conditions affect labour", "Wall level, plumbing and electrical points, old-cabinet removal, tile height, and finishing details influence installation cost."],
    ],
  }),
  article({
    slug: "condo-renovation-management-approval-malaysia",
    zhTitle: "公寓装修管理处审批要准备什么",
    enTitle: "Condo Renovation Management Approval in Malaysia",
    zhExcerpt: "公寓装修审批通常要准备表格、施工范围、图纸、承包商资料、押金和工人名单。",
    enExcerpt: "Condo renovation approval usually needs forms, scope, drawings, contractor details, deposits, and worker lists.",
    zh: [
      ["每栋公寓规则不一样", "有些管理处要求图纸，有些会限制噪音工程日期、电梯使用时间、材料进场路线和垃圾清运方式。开工前要先拿到最新规则。"],
      ["资料越齐，越少拖延", "施工范围、平面图、承包商注册资料、保险、工人名单、车辆资料和押金收据都可能被要求。"],
      ["现场保护要提前安排", "电梯、走廊、地面和公共区域保护如果没做好，可能被投诉或扣押金。这个部分要写进施工安排。"],
    ],
    en: [
      ["Every building has different rules", "Some management offices require drawings, noisy-work dates, lift booking, material routes, and disposal methods."],
      ["Complete documents reduce delay", "Scope, plans, contractor registration, insurance, worker lists, vehicle details, and deposit receipts may be requested."],
      ["Plan common-area protection", "Lift, corridor, floor, and common-area protection should be arranged before work starts to avoid complaints or deposit deductions."],
    ],
  }),
  article({
    slug: "klang-valley-renovation-cost-2026",
    zhTitle: "Klang Valley 装修费用 2026 怎么看",
    enTitle: "Klang Valley Renovation Cost in 2026",
    zhExcerpt: "Klang Valley 装修预算要按物业类型、工程范围、材料等级、现场限制和工期要求来判断。",
    enExcerpt: "Klang Valley renovation budgets depend on property type, scope, material grade, site restrictions, and timeline pressure.",
    zh: [
      ["费用差异来自范围", "同样面积的单位，如果一个只做油漆地板，另一个包含水电、橱柜、浴室和天花，预算会完全不同。"],
      ["现场限制也会加成本", "公寓电梯预约、停车、搬运距离、施工时间限制和管理处要求都会影响人工和排期。"],
      ["先做范围表再比价", "把必须做、想升级、可之后再做的项目分开，报价会更清楚，也比较容易控制预算。"],
    ],
    en: [
      ["Cost differences come from scope", "Two units with the same area can have very different budgets if one includes wiring, cabinets, bathrooms, and ceiling work."],
      ["Site restrictions add cost", "Lift booking, parking, carrying distance, working-hour limits, and management requirements affect labour and schedule."],
      ["Prepare a scope list before comparing", "Separate must-do items, upgrades, and later-phase items so quotations become easier to control."],
    ],
  }),
  article({
    slug: "renovation-materials-malaysia",
    zhTitle: "马来西亚装修材料怎么选",
    enTitle: "How to Choose Renovation Materials in Malaysia",
    zhExcerpt: "选材料要看空间用途、耐用度、清洁方式、预算和现场条件，不要只凭照片决定。",
    enExcerpt: "Choose renovation materials by room usage, durability, cleaning needs, budget, and actual site conditions.",
    zh: [
      ["每个空间的重点不同", "浴室看防滑和防水，厨房看耐污和耐热，客厅看耐磨和视觉效果，卧室则更重视舒适和触感。"],
      ["样板比效果图更可靠", "同一款材料在自然光、暖光和冷光下都可能不同。确认前最好把样板放到现场看。"],
      ["维护方式要先问清楚", "有些材料好看但怕刮、怕水或需要特别清洁。日常维护能不能接受，比短时间的视觉效果更重要。"],
    ],
    en: [
      ["Each space has a different priority", "Bathrooms need slip resistance and waterproofing, kitchens need stain and heat resistance, living areas need durability, and bedrooms need comfort."],
      ["Samples are more reliable than renders", "A material can look different under natural, warm, and cool light. Review samples on site before confirming."],
      ["Ask about maintenance early", "Some finishes look good but scratch easily, dislike moisture, or need special cleaning. Daily maintenance should match your habits."],
    ],
  }),
  article({
    slug: "shop-renovation-before-opening",
    zhTitle: "店铺开业前装修重点",
    enTitle: "Shop Renovation Before Opening: Key Priorities",
    zhExcerpt: "开业前装修要优先处理门面、收银、水电、灯光、招牌、动线和交付检查。",
    enExcerpt: "Before opening, shop renovation should prioritize frontage, cashier area, utilities, lighting, signage, flow, and handover checks.",
    zh: [
      ["先完成会影响营业的部分", "门面、招牌、收银区、灯光、水电、空调和安全通道会直接影响开业。装饰细节可以调整，但基础条件不能拖。"],
      ["顾客动线要提前试走", "从门口到展示区、收银、试用区或等候区，路线要顺。货架和柜台不要挡住主要视线。"],
      ["开业前留测试时间", "灯具、插座、门锁、排水、收银设备、招牌和清洁要在试营业前完成检查，避免开门当天才发现问题。"],
    ],
    en: [
      ["Finish operation-critical items first", "Frontage, signage, cashier area, lighting, utilities, air-conditioning, and safe access directly affect opening readiness."],
      ["Walk the customer route", "The route from entrance to display, cashier, trial area, or waiting zone should feel clear. Fixtures should not block key sightlines."],
      ["Leave time for testing", "Lights, sockets, locks, drainage, POS equipment, signage, and cleaning should be checked before soft opening."],
    ],
  }),
  article({
    slug: "selangor-office-fit-out-tips",
    zhTitle: "雪兰莪办公室装修实用提醒",
    enTitle: "Selangor Office Fit-Out Tips",
    zhExcerpt: "办公室装修要把团队工作方式、弱电、灯光、会议需求、管理规则和未来扩充一起规划。",
    enExcerpt: "Office fit-out planning should cover workflow, cabling, lighting, meeting needs, building rules, and future expansion.",
    zh: [
      ["不要只按现在人数排座位", "团队如果还会扩充，工位、电位、网络点和储物要留一点余量。否则很快又要改。"],
      ["会议室要看真实使用频率", "不是每家公司都需要很多大会议室。小讨论区、电话间和安静工作位有时更实用。"],
      ["大楼规则会影响工期", "搬运时间、电梯预约、消防要求和噪音限制要提前确认，避免材料到了却不能进场。"],
    ],
    en: [
      ["Do not plan seats only for today", "If the team may grow, leave allowance for workstations, sockets, network points, and storage."],
      ["Match meeting rooms to real usage", "Not every office needs many large rooms. Small discussion areas, call rooms, and quiet seats may be more useful."],
      ["Building rules affect schedule", "Delivery hours, lift booking, fire-safety requirements, and noisy-work limits should be confirmed before materials arrive."],
    ],
  }),
  article({
    slug: "kl-condo-renovation-approval",
    zhTitle: "KL 公寓装修审批流程提醒",
    enTitle: "KL Condo Renovation Approval: Practical Notes",
    zhExcerpt: "KL 公寓装修审批要先确认管理处表格、图纸要求、施工时间、电梯保护和押金规则。",
    enExcerpt: "KL condo renovation approval starts with management forms, drawings, working hours, lift protection, and deposit rules.",
    zh: [
      ["先拿管理处最新表格", "很多公寓会更新装修规则。用旧表格或少交资料，可能让审批时间变长。"],
      ["噪音工程要特别确认", "拆除、钻孔和打墙通常有固定时间限制。排期时要把这些限制算进去，不然现场会被迫停工。"],
      ["公共区域保护别省", "电梯、走廊、墙角和地面保护是管理处最常检查的部分。保护做不好，容易投诉或扣押金。"],
    ],
    en: [
      ["Get the latest management forms", "Many condos update renovation rules. Old forms or incomplete documents can slow approval."],
      ["Confirm noisy-work limits", "Hacking, drilling, and wall works usually have restricted hours. The schedule must account for this."],
      ["Do not skip common-area protection", "Lift, corridor, wall corner, and floor protection are often checked by management and can affect deposits."],
    ],
  }),
  article({
    slug: "bathroom-waterproofing-guide",
    zhTitle: "浴室防水工程重点",
    enTitle: "Bathroom Waterproofing Guide",
    zhExcerpt: "浴室防水要看基层处理、墙地交界、管口、闭水测试和铺砖收口，不只是刷材料。",
    enExcerpt: "Bathroom waterproofing depends on substrate work, wall-floor junctions, pipe penetrations, ponding tests, and tile finishing.",
    zh: [
      ["基层处理决定成败", "地面和墙角要干净、坚实、没有松动砂浆。防水不是刷一层材料就结束，前期处理很重要。"],
      ["管口和地漏要加固", "很多渗水从地漏、管口、墙角和门槛位置开始。施工时这些点位要特别加强。"],
      ["闭水测试要保留时间", "正式铺砖前做闭水测试，可以提早发现问题。赶工跳过测试，后面维修成本更高。"],
    ],
    en: [
      ["Substrate preparation decides the result", "Floors and corners should be clean, firm, and free from loose mortar before waterproofing starts."],
      ["Reinforce pipe and trap areas", "Leaks often start at floor traps, pipe penetrations, wall corners, and thresholds. These points need extra treatment."],
      ["Allow time for ponding test", "Testing before tiling helps catch issues early. Skipping it to save time can cost more later."],
    ],
  }),
  article({
    slug: "old-house-renovation-checklist",
    zhTitle: "旧屋翻新检查清单",
    enTitle: "Old House Renovation Checklist",
    zhExcerpt: "旧屋翻新前先查结构、水电、防水、屋顶、墙面、地面和白蚁风险，再谈风格。",
    enExcerpt: "Before renovating an old house, check structure, wiring, plumbing, waterproofing, roof, walls, floors, and termite risk.",
    zh: [
      ["先检查看不见的地方", "水管、电线、防水、排水和屋顶是旧屋翻新的重点。表面还能用，不代表里面没有老化。"],
      ["拆除阶段要预留判断时间", "拆掉旧砖、旧柜或旧天花后，可能看到空鼓、渗水、旧线或白蚁痕迹。不要把排期压得太死。"],
      ["预算按优先级排", "安全和防水先做，使用功能第二，最后才是造型和软装。这样钱花得更稳。"],
    ],
    en: [
      ["Inspect hidden areas first", "Pipes, wiring, waterproofing, drainage, and roof condition matter most in old-house renovation."],
      ["Allow time during demolition", "After removing old tiles, cabinets, or ceiling, hollow areas, seepage, old wiring, or termite signs may appear."],
      ["Prioritize the budget", "Safety and waterproofing come first, function comes second, and styling can follow once the basics are secure."],
    ],
  }),
  article({
    slug: "kitchen-cabinet-material-guide",
    zhTitle: "厨房橱柜材料选择",
    enTitle: "Kitchen Cabinet Material Guide",
    zhExcerpt: "厨房橱柜材料要看柜体防潮、门板清洁、台面耐用、五金寿命和烹饪习惯。",
    enExcerpt: "Kitchen cabinet materials should be chosen by cabinet-body moisture resistance, door cleaning, countertop durability, hardware life, and cooking habits.",
    zh: [
      ["柜体和门板分开选", "柜体重结构和防潮，门板重外观、手感和清洁。两者不要混在一起比较。"],
      ["台面按使用强度决定", "常煮饭的厨房要重视耐污、耐热和接缝处理；展示型干厨房可以更看重纹理和整体效果。"],
      ["五金不要只看品牌名", "门铰、抽屉轨道、拉篮和转角配件要看承重、保修、数量和安装调试。每天使用的顺手度很关键。"],
    ],
    en: [
      ["Choose cabinet body and doors separately", "The cabinet body affects structure and moisture resistance. Door finish affects appearance, touch, and cleaning."],
      ["Match countertop to cooking intensity", "Heavy cooking needs stain resistance, heat tolerance, and good joint detailing. A dry kitchen can focus more on texture."],
      ["Hardware is more than a brand name", "Hinges, runners, pull-out baskets, and corner fittings should be checked for load, warranty, quantity, and adjustment."],
    ],
  }),
  article({
    slug: "malaysia-renovation-budget-guide",
    zhTitle: "马来西亚装修预算怎么安排",
    enTitle: "Malaysia Renovation Budget Guide",
    zhExcerpt: "装修预算要拆成基础工程、材料、木作、人工、管理和预留金，才看得出钱花在哪里。",
    enExcerpt: "A renovation budget is clearer when split into base works, materials, carpentry, labour, management, and contingency.",
    zh: [
      ["先拆预算，不要只看总数", "拆除、水电、防水、泥水、木作、油漆、灯具、五金、清洁和管理费用最好分开看。这样比较报价时不会被一个总价带走。"],
      ["预留金不是浪费", "旧屋、浴室和商业空间容易出现隐藏问题。保留 10% 到 15% 预留金，会比中途到处压缩规格更稳。"],
      ["把必须做和想升级分开", "必须做的是安全、功能和长期使用；想升级的是视觉、质感和舒适度。先分清，预算更容易控制。"],
    ],
    en: [
      ["Break down the budget", "Demolition, wiring, waterproofing, wet works, carpentry, painting, lighting, fittings, cleaning, and management should be reviewed separately."],
      ["Contingency is not wasted money", "Older houses, bathrooms, and commercial spaces often reveal hidden issues. A 10% to 15% allowance is practical."],
      ["Separate must-do items from upgrades", "Must-do items cover safety, function, and long-term use. Upgrades cover appearance, texture, and comfort."],
    ],
  }),
  article({
    slug: "modern-warm-minimalist-home-design-malaysia",
    zhTitle: "马来西亚现代暖色极简家居设计",
    enTitle: "Modern Warm Minimalist Home Design in Malaysia",
    zhExcerpt: "暖色极简不只是米色墙面，重点是材质比例、灯光层次、收纳隐藏和线条干净。",
    enExcerpt: "Warm minimalism depends on material balance, layered lighting, hidden storage, and clean detailing, not beige walls alone.",
    zh: [
      ["暖色要有层次", "木纹、浅石纹、布艺、哑光墙面和金属细节可以一起使用，但比例要控制。全部同色会变平，材质对比才有质感。"],
      ["收纳要藏得自然", "极简空间最怕杂物外露。电视墙、玄关、餐边和卧室柜可以用同色门片弱化存在感。"],
      ["灯光决定温度", "主灯、灯带、壁灯和局部照明要分层，色温保持一致，空间才会温暖但不杂乱。"],
    ],
    en: [
      ["Warm tones need layers", "Woodgrain, light stone, fabric, matte walls, and metal details can work together, but the proportion must be controlled."],
      ["Storage should disappear quietly", "Minimal spaces suffer when clutter is exposed. Matching cabinet fronts can soften TV walls, entries, dining areas, and bedrooms."],
      ["Lighting sets the mood", "Main lights, strips, wall lights, and task lighting should be layered with consistent colour temperature."],
    ],
  }),
  article({
    slug: "small-condo-storage-design-ideas",
    zhTitle: "小公寓收纳设计灵感",
    enTitle: "Small Condo Storage Design Ideas",
    zhExcerpt: "小公寓收纳要把玄关、电视墙、床边、餐边和垂直空间一起规划，少做零散柜子。",
    enExcerpt: "Small condo storage works best when entry, TV wall, bedside, dining, and vertical space are planned together.",
    zh: [
      ["把零散柜子整合起来", "小空间如果到处加柜，会显得更乱。可以把电视墙、餐边柜、玄关柜和展示区整合成同一套语言。"],
      ["垂直空间很好用", "到顶柜、吊柜和高柜可以增加容量，但要搭配开放格或灯光，避免压迫感太重。"],
      ["常用物品要顺手", "钥匙、鞋子、清洁工具、行李箱、小家电和文件都要有固定位置，收纳才真的好用。"],
    ],
    en: [
      ["Integrate scattered cabinets", "Too many separate cabinets make a small space feel busier. TV wall, dining storage, entry cabinet, and display shelves can share one design language."],
      ["Use vertical space carefully", "Full-height cabinets and wall units add capacity, but open sections or lighting can reduce heaviness."],
      ["Daily items need easy homes", "Keys, shoes, cleaning tools, luggage, appliances, and documents should each have a planned location."],
    ],
  }),
  article({
    slug: "artistic-wall-coating-guide-remmers",
    zhTitle: "Remmers 艺术涂料墙面指南",
    enTitle: "Remmers Artistic Wall Coating Guide",
    zhExcerpt: "艺术涂料适合背景墙、接待区和局部重点墙，施工前要确认纹理、光泽、样板和现场灯光。",
    enExcerpt: "Artistic wall coating suits feature walls, reception areas, and selected highlight walls when texture, sheen, samples, and lighting are confirmed.",
    zh: [
      ["先决定墙面角色", "艺术涂料不一定要整屋使用。电视墙、床头、玄关、接待区或展示墙局部使用，反而更容易做出重点。"],
      ["样板要在现场确认", "纹理、手感和光泽会受灯光影响。施工前看小样，最好也确认一块现场样板。"],
      ["基层处理不能省", "墙面平整度、裂缝、底漆和收边会影响最终质感。越精致的涂装，越需要干净的基层。"],
    ],
    en: [
      ["Decide the wall role first", "Artistic coating does not need to cover every wall. TV walls, bedhead walls, entries, reception areas, and displays work well as focused areas."],
      ["Confirm samples on site", "Texture, touch, and sheen change under lighting. Review samples and, where possible, a site mock-up."],
      ["Do not skip substrate work", "Wall flatness, cracks, primer, and edging affect the final finish. Refined coatings need a clean base."],
    ],
  }),
  article({
    slug: "built-in-cabinet-cost-malaysia",
    zhTitle: "马来西亚定制内嵌柜价格指南",
    enTitle: "Built-In Cabinet Cost in Malaysia",
    zhExcerpt: "定制柜价格要按尺寸、板材、门板、五金、台面、内部配件和安装难度逐项比较。",
    enExcerpt: "Built-in cabinet cost should be compared by size, board material, door finish, hardware, countertop, accessories, and installation difficulty.",
    zh: [
      ["先确认柜子类型", "衣柜、厨房柜、电视柜、鞋柜、浴室柜和展示柜的结构不同，不能用同一个单价直接比较。"],
      ["内部配件会影响预算", "抽屉、拉篮、灯带、玻璃门、隐藏插座和特殊五金都会提高价格，也会提升日常使用体验。"],
      ["报价要看细节表", "尺寸、板材厚度、封边、五金品牌、台面材料、安装范围和保修要写清楚，比较才公平。"],
    ],
    en: [
      ["Confirm the cabinet type", "Wardrobes, kitchen cabinets, TV units, shoe cabinets, bathroom cabinets, and display units have different structures and cannot be priced the same way."],
      ["Internal accessories affect cost", "Drawers, pull-out baskets, lighting, glass doors, hidden sockets, and special hardware add cost but improve daily use."],
      ["Review the detail sheet", "Dimensions, board thickness, edging, hardware brand, countertop, installation scope, and warranty should be stated clearly."],
    ],
  }),
  article({
    slug: "how-to-choose-renovation-contractor-kl",
    zhTitle: "吉隆坡装修公司怎么选",
    enTitle: "How to Choose a Renovation Contractor in Kuala Lumpur",
    zhExcerpt: "选择装修公司要看沟通、报价清晰度、现场经验、过往案例、付款安排和问题处理方式。",
    enExcerpt: "Choose a KL renovation contractor by checking communication, quotation clarity, site experience, past work, payment terms, and issue handling.",
    zh: [
      ["先看沟通是否清楚", "好的承包商会先问现场条件、预算、工期和使用需求，而不是一开始就给很笼统的价格。"],
      ["报价要能追到细节", "范围、材料、数量、人工、工期、不包含项目和付款节点要写清楚。越清楚，后面越少争议。"],
      ["案例要看真实完成面", "看照片时不要只看效果图，也要看收口、现场保护、柜体细节和完工后的实际质感。"],
    ],
    en: [
      ["Start with communication", "A reliable contractor asks about site conditions, budget, timeline, and usage before giving a broad number."],
      ["The quotation should be traceable", "Scope, materials, quantities, labour, timeline, exclusions, and payment milestones should be clear."],
      ["Look at real completed work", "Do not judge by renders alone. Check finishing details, site protection, cabinet work, and actual handover quality."],
    ],
  }),
  article({
    slug: "renovation-cost-malaysia-2025",
    zhTitle: "马来西亚装修费用要多少（2025）",
    enTitle: "How Much Does Renovation Cost in Malaysia? 2025 Notes",
    zhExcerpt: "装修费用没有单一答案，要按面积、范围、材料等级、屋况和现场限制一起估算。",
    enExcerpt: "Renovation cost depends on area, scope, material grade, existing condition, and site restrictions.",
    zh: [
      ["先定义装修范围", "油漆地板、局部翻新、全屋翻新和商业空间装修，预算逻辑完全不同。没有范围，价格没有比较意义。"],
      ["屋况会改变费用", "旧屋、水电老化、浴室漏水、墙面潮湿和公寓管理限制都会影响预算。现场检查比口头估价更可靠。"],
      ["用同一份需求比价", "准备照片、平面图、预算范围、想保留和想更换的项目，让不同团队按同一范围报价。"],
    ],
    en: [
      ["Define the scope first", "Painting and flooring, partial renovation, full home renovation, and commercial fit-out follow different budget logic."],
      ["Existing condition changes cost", "Old wiring, bathroom leakage, damp walls, and condo management restrictions can affect the final number."],
      ["Compare using the same brief", "Prepare photos, plans, budget range, and items to keep or replace so quotations follow the same scope."],
    ],
  }),
  article({
    slug: "how-to-plan-condo-renovation-kl",
    zhTitle: "如何规划吉隆坡公寓装修",
    enTitle: "How to Plan Your Condo Renovation in Kuala Lumpur",
    zhExcerpt: "KL 公寓装修要先确认管理处规则、预算、工期、材料进场和空间优先级。",
    enExcerpt: "KL condo renovation planning should start with management rules, budget, timeline, delivery access, and space priorities.",
    zh: [
      ["先处理管理处事项", "公寓装修通常要申请、交押金、预约电梯和遵守施工时间。先确认规则，设计和排期才不会反复修改。"],
      ["预算按生活重点分配", "厨房、浴室、收纳、地板和灯光对日常影响较大。预算有限时，先把使用频率高的区域做好。"],
      ["材料进场要有计划", "电梯尺寸、停车、搬运路线和保护工程会影响材料进场。大型柜体和长材料要提前确认能不能进。"],
    ],
    en: [
      ["Handle management matters first", "Condo renovation usually requires application, deposit, lift booking, and working-hour compliance. Confirm rules before final design."],
      ["Allocate budget by daily impact", "Kitchen, bathroom, storage, flooring, and lighting affect daily life most. Prioritize high-use areas when budget is limited."],
      ["Plan material delivery", "Lift size, parking, carrying route, and protection works affect delivery. Large cabinets and long materials need early checking."],
    ],
  }),
  article({
    slug: "renovation-permit-dbkl-guide",
    zhTitle: "DBKL 装修准证要注意什么",
    enTitle: "DBKL Renovation Permit: What to Check",
    zhExcerpt: "涉及结构、外观、用途改变或招牌时，DBKL 准证资料要提前确认，不要等开工才补。",
    enExcerpt: "When structure, facade, usage change, or signage is involved, DBKL permit requirements should be checked before work starts.",
    zh: [
      ["不是每种装修都要准证", "室内油漆、地板和柜体很多时候只需要管理处批准；但结构改动、外观修改、用途改变或招牌通常要额外确认。"],
      ["资料准备影响审批速度", "图纸、施工范围、业主资料、承包商资料和申请表越完整，来回补件的机会越少。"],
      ["先问清楚再排工期", "如果工程需要准证，把审批时间放进计划。先开工后补资料，风险通常更高。"],
    ],
    en: [
      ["Not every renovation needs a permit", "Painting, flooring, and cabinets may only need management approval, while structural changes, facade work, usage change, or signage need further checking."],
      ["Documents affect approval speed", "Drawings, scope, owner details, contractor details, and forms should be prepared clearly to reduce back-and-forth."],
      ["Ask before scheduling work", "If a permit is needed, include approval time in the project plan. Starting first and correcting later is risky."],
    ],
  }),
  article({
    slug: "spc-vinyl-vs-laminate-flooring",
    zhTitle: "SPC 地板和复合地板怎么选",
    enTitle: "SPC Vinyl vs Laminate Flooring for Malaysian Homes",
    zhExcerpt: "SPC 更重视防水稳定，复合地板脚感较自然；选择时要看空间、湿度、基层和预算。",
    enExcerpt: "SPC is valued for water resistance and stability, while laminate feels more natural; choose by room, moisture, subfloor, and budget.",
    zh: [
      ["潮湿区域优先考虑 SPC", "厨房周边、入口和容易清洁的区域，SPC 通常更稳。复合地板不适合长期潮湿或可能积水的地方。"],
      ["脚感和外观也要比较", "复合地板可能更接近木地板脚感，SPC 则更实用。家里有小孩、宠物或出租用途时，耐用度更重要。"],
      ["安装条件会影响结果", "地面平整、门缝高度、防潮垫和收边处理都会影响使用体验。报价前要一起确认。"],
    ],
    en: [
      ["SPC suits moisture-prone areas", "SPC is usually safer near kitchens, entries, and easy-clean zones. Laminate should not be used where water may sit."],
      ["Compare feel and appearance", "Laminate may feel closer to timber, while SPC is often more practical. Durability matters for kids, pets, and rental units."],
      ["Installation conditions affect the result", "Floor level, door clearance, underlay, and edging details should be confirmed before installation."],
    ],
  }),
  article({
    slug: "office-renovation-checklist-malaysia",
    zhTitle: "马来西亚办公室装修检查清单",
    enTitle: "Office Renovation Checklist for Malaysian Businesses",
    zhExcerpt: "办公室装修要确认团队需求、租约限制、图纸、弱电、家具、施工时间和交付测试。",
    enExcerpt: "Office renovation should confirm team needs, lease limits, drawings, cabling, furniture, working hours, and handover testing.",
    zh: [
      ["租约和大楼规则先看", "有些大楼限制施工时间、消防改动、空调工程和还原要求。装修前先看清楚，避免交付时才发现不符合。"],
      ["弱电和家具一起排", "网络点、插座、打印区、会议设备和工位尺寸要一起规划。后期补线通常会影响美观和成本。"],
      ["交付前逐项测试", "灯光、空调、门禁、网络、插座、会议室设备和清洁都要检查。办公室搬迁最怕开工后才发现基础问题。"],
    ],
    en: [
      ["Check lease and building rules first", "Some buildings restrict working hours, fire-safety changes, air-conditioning work, and reinstatement requirements."],
      ["Plan cabling with furniture", "Network points, sockets, printers, meeting equipment, and workstation sizes should be coordinated together."],
      ["Test before handover", "Lighting, air-conditioning, access control, network, sockets, meeting-room equipment, and cleaning should be checked before move-in."],
    ],
  }),
  article({
    slug: "feature-wall-ideas-2025",
    zhTitle: "2025 马来西亚家居背景墙灵感",
    enTitle: "Feature Wall Ideas for Malaysian Homes in 2025",
    zhExcerpt: "背景墙要和电视位、灯光、电位、收纳和整体风格一起规划，才不会只剩装饰效果。",
    enExcerpt: "A feature wall should be planned with TV position, lighting, sockets, storage, and the overall interior style.",
    zh: [
      ["先决定背景墙要解决什么", "有些背景墙是为了遮线，有些是增加收纳，有些是提升空间重点。目的不同，材料和厚度也不同。"],
      ["小空间不要做太重", "浅色线条板、局部木饰面、薄石纹板或艺术涂料会比厚重造型更适合小户型。"],
      ["电位和灯光先排好", "电视、电箱、路由器、壁灯、灯带和插座位置要先确认，不然完工后很难收得干净。"],
    ],
    en: [
      ["Decide what the wall should solve", "Some feature walls hide wiring, some add storage, and some create a focal point. The purpose changes material and thickness choices."],
      ["Keep small spaces lighter", "Light fluted panels, partial timber, thin stone-look panels, or artistic coating can work better than heavy built forms."],
      ["Plan sockets and lighting first", "TV, router, wall lights, strips, and sockets should be placed before construction so the final wall stays clean."],
    ],
  }),
];

const updateMap = new Map(humanizedBlogUpdates.map((item) => [item.slug, item]));

export const getHumanizedBlogPatch = (slug) => updateMap.get(slug) || null;

export const applyHumanizedBlogContent = (posts) => {
  let count = 0;
  for (const post of posts) {
    const patch = getHumanizedBlogPatch(post.slug);
    if (!patch) continue;
    Object.assign(post, patch);
    count += 1;
  }
  return count;
};

