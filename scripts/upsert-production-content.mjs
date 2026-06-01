import { applyHumanizedBlogContent } from "./humanized-blog-content.mjs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const FORCE_SEED = process.argv.includes("--force") || process.env.SEED_FORCE === "1";
const site = process.env.VITE_SITE_URL || process.env.SITE_URL || "https://flashcast.com.my";
const whatsappNumber = process.env.VITE_SITE_WHATSAPP_NUMBER || process.env.SITE_WHATSAPP_NUMBER || "601128853888";
const img = (path) => `${site}${path}`;
const whatsappLink = (message = "") => {
  const base = `https://wa.me/${whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${text}`);
  }
  return body;
};

const upsert = async (table, rows, conflict = "slug") => {
  if (!rows.length) return [];
  return request(`/rest/v1/${table}?on_conflict=${conflict}`, {
    method: "POST",
    headers: {
      Prefer: `${FORCE_SEED ? "resolution=merge-duplicates" : "resolution=ignore-duplicates"},return=representation`,
    },
    body: JSON.stringify(rows),
  });
};

const insertRows = async (table, rows) => {
  if (!rows.length) return [];
  return request(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
};

const insertRowsIfEmpty = async (table, rows) => {
  const existing = await request(`/rest/v1/${table}?select=id&limit=1`);
  if (existing?.length && !FORCE_SEED) return [];
  return insertRows(table, rows);
};

const selectRowsByValues = async (table, key, values, select = "*") => {
  if (!values.length) return [];
  const encoded = values.map((value) => encodeURIComponent(value)).join(",");
  return request(`/rest/v1/${table}?select=${encodeURIComponent(select)}&${key}=in.(${encoded})`);
};

const html = (paragraphs) => paragraphs.map((item) => `<p>${item}</p>`).join("");
const faq = (items) => items.map(([q, a]) => ({ q, a }));

const services = [
  {
    slug: "renovation",
    title_zh: "住宅装修与旧屋翻新",
    title_en: "Residential Renovation and Home Refurbishment",
    excerpt_zh: "适合公寓、排屋、半独立式和独立式住宅的一站式装修服务。",
    excerpt_en: "End-to-end renovation for condos, terrace houses, semi-D homes, and bungalows.",
    image_url: img("/images/services/renovation-works.jpg"),
    alt_zh: "马来西亚住宅装修施工现场",
    alt_en: "Malaysia residential renovation construction site",
    suitable_for_zh: ["公寓装修", "排屋翻新", "旧屋翻新", "新屋入住前装修"],
    suitable_for_en: ["Condo renovation", "Terrace house refurbishment", "Old house renovation", "Move-in renovation"],
    common_projects_zh: ["全屋翻新", "水电重拉", "地板与油漆", "厨房浴室升级"],
    common_projects_en: ["Full home refurbishment", "Electrical and plumbing renewal", "Flooring and painting", "Kitchen and bathroom upgrades"],
    scope_items_zh: ["现场测量与预算规划", "拆除与基础工程", "水电、防水与泥水", "木作与收尾工程"],
    scope_items_en: ["Site measurement and budget planning", "Hacking and base works", "Electrical, plumbing, waterproofing and wet works", "Carpentry and finishing"],
    process_steps_zh: faq([["第一步", "了解需求、现场情况、预算和工期。"], ["第二步", "整理报价、材料建议和施工顺序。"], ["第三步", "安排施工、进度汇报、验收和保修。"]]),
    process_steps_en: faq([["Step 1", "Understand requirements, site condition, budget, and timeline."], ["Step 2", "Prepare quotation, material advice, and work sequence."], ["Step 3", "Manage construction, progress updates, handover, and warranty."]]),
    faqs_zh: faq([["住宅装修通常多久？", "局部装修约 2-4 周，全屋翻新通常 8-12 周，实际取决于面积、材料和管理处审批。"], ["可以先做预算规划吗？", "可以。我们会先根据现场状态和需求拆分必要工程与可选升级项目。"]]),
    faqs_en: faq([["How long does a home renovation take?", "Partial works usually take 2-4 weeks. Full renovation often takes 8-12 weeks depending on size, materials, and approvals."], ["Can you help with budget planning first?", "Yes. We split essential works and optional upgrades based on site condition and requirements."]]),
    seo_title_zh: "马来西亚住宅装修与旧屋翻新 | FLASH CAST",
    seo_title_en: "Residential Renovation Malaysia | FLASH CAST",
    seo_description_zh: "FLASH CAST 提供住宅装修、旧屋翻新、水电、防水、木作、厨房浴室与施工管理服务，覆盖吉隆坡和雪兰莪。",
    seo_description_en: "FLASH CAST provides home renovation, old house refurbishment, wiring, waterproofing, carpentry, kitchen, bathroom, and project management in KL and Selangor.",
  },
  {
    slug: "kitchen",
    title_zh: "厨房装修与橱柜定制",
    title_en: "Kitchen Renovation and Custom Cabinets",
    excerpt_zh: "从动线、橱柜、台面、防水到电器预留，打造实用耐用的厨房。",
    excerpt_en: "Practical kitchen renovation covering layout, cabinets, countertop, waterproofing, and appliance points.",
    image_url: img("/images/services/kitchen-renovation.jpg"),
    alt_zh: "现代厨房装修和定制橱柜",
    alt_en: "Modern kitchen renovation and custom cabinets",
    suitable_for_zh: ["干湿厨房", "开放式厨房", "公寓厨房", "排屋厨房"],
    suitable_for_en: ["Dry and wet kitchens", "Open kitchens", "Condo kitchens", "Terrace house kitchens"],
    common_projects_zh: ["橱柜定制", "石英石台面", "厨房墙地砖", "水电与电器位"],
    common_projects_en: ["Custom cabinets", "Quartz countertop", "Kitchen wall and floor tiles", "Plumbing and appliance points"],
    scope_items_zh: ["现场量尺", "动线与收纳规划", "柜体和台面制作", "安装与收尾"],
    scope_items_en: ["Site measurement", "Workflow and storage planning", "Cabinet and countertop fabrication", "Installation and finishing"],
    process_steps_zh: faq([["量尺", "确认煤气、水槽、电器和插座位置。"], ["选材", "比较柜体、门板、台面、五金和配件。"], ["安装", "制作橱柜并协调台面、水电和收口。"]]),
    process_steps_en: faq([["Measurement", "Confirm gas, sink, appliance, and socket locations."], ["Material selection", "Compare cabinet body, door finish, countertop, hardware, and accessories."], ["Installation", "Coordinate cabinets, countertop, M&E, and finishing details."]]),
    faqs_zh: faq([["橱柜价格怎么计算？", "通常按长度、板材、门板、台面、五金和配件计算，现场量尺后提供明细报价。"]]),
    faqs_en: faq([["How is cabinet pricing calculated?", "It depends on cabinet length, board, door finish, countertop, hardware, and accessories. We provide itemized pricing after measurement."]]),
    seo_title_zh: "马来西亚厨房装修与橱柜定制 | FLASH CAST",
    seo_title_en: "Kitchen Renovation Malaysia | Custom Cabinets",
    seo_description_zh: "厨房装修、橱柜定制、石英石台面、水电、防水和电器位规划服务。",
    seo_description_en: "Kitchen renovation, custom cabinetry, quartz countertop, plumbing, waterproofing, and appliance point planning.",
  },
  {
    slug: "bathroom",
    title_zh: "浴室装修与防水工程",
    title_en: "Bathroom Renovation and Waterproofing",
    excerpt_zh: "专注防水、排水坡度、瓷砖、洁具、玻璃隔断和通风细节。",
    excerpt_en: "Bathroom works focused on waterproofing, drainage slope, tiles, fittings, glass screens, and ventilation.",
    image_url: img("/images/services/bathroom-renovation.jpg"),
    alt_zh: "浴室装修防水和瓷砖工程",
    alt_en: "Bathroom waterproofing and tile renovation",
    suitable_for_zh: ["公寓浴室", "旧屋浴室", "主人房套厕", "商业厕所"],
    suitable_for_en: ["Condo bathrooms", "Old home bathrooms", "Ensuite bathrooms", "Commercial toilets"],
    common_projects_zh: ["防水重做", "瓷砖更换", "洁具安装", "浴屏和洗手盆柜"],
    common_projects_en: ["Waterproofing renewal", "Tile replacement", "Sanitary fitting installation", "Shower screen and vanity"],
    scope_items_zh: ["拆除旧砖旧洁具", "防水与排水处理", "铺砖和安装", "闭水测试与收尾"],
    scope_items_en: ["Remove old tiles and fittings", "Waterproofing and drainage works", "Tile laying and installation", "Water ponding test and finishing"],
    process_steps_zh: faq([["检查", "确认渗漏、空鼓、排水和原有防水状态。"], ["施工", "拆除、找坡、防水、铺砖和安装洁具。"], ["测试", "闭水测试并检查收口、坡度和排水。"]]),
    process_steps_en: faq([["Inspection", "Check leakage, hollow tiles, drainage, and existing waterproofing."], ["Works", "Hack, screed slope, waterproof, tile, and install fittings."], ["Testing", "Run ponding test and inspect finishing, slope, and drainage."]]),
    faqs_zh: faq([["浴室防水一定要重做吗？", "如果有渗水、空鼓或大面积拆砖，建议完整重做防水层。"]]),
    faqs_en: faq([["Do I need to redo waterproofing?", "If there is leakage, hollow tiles, or major hacking, renewing the waterproofing layer is recommended."]]),
    seo_title_zh: "马来西亚浴室装修与防水工程 | FLASH CAST",
    seo_title_en: "Bathroom Renovation and Waterproofing Malaysia",
    seo_description_zh: "浴室翻新、防水、铺砖、洁具安装、排水优化和玻璃浴屏施工。",
    seo_description_en: "Bathroom renovation, waterproofing, tile works, sanitary fitting installation, drainage improvement, and shower screens.",
  },
  {
    slug: "office-renovation",
    title_zh: "办公室装修与商业空间规划",
    title_en: "Office Renovation and Commercial Space Planning",
    excerpt_zh: "适合办公室、接待区、会议室、员工区和品牌展示墙的设计施工。",
    excerpt_en: "Design and build for offices, reception areas, meeting rooms, staff areas, and brand walls.",
    image_url: img("/images/services/office-renovation.jpg"),
    alt_zh: "办公室装修和商业空间规划",
    alt_en: "Office renovation and commercial space planning",
    suitable_for_zh: ["办公室", "共享办公", "展示厅", "培训中心"],
    suitable_for_en: ["Offices", "Coworking spaces", "Showrooms", "Training centers"],
    common_projects_zh: ["办公室隔间", "前台与展示墙", "工作位系统", "会议室装修"],
    common_projects_en: ["Office partitions", "Reception and feature walls", "Workstation systems", "Meeting room renovation"],
    scope_items_zh: ["空间规划", "水电网络点位", "隔间与木作", "交付前检查"],
    scope_items_en: ["Space planning", "Power and network point coordination", "Partitions and carpentry", "Pre-handover inspection"],
    process_steps_zh: faq([["规划", "按团队人数、部门关系和接待需求规划空间。"], ["协调", "安排电源、网络、灯光、冷气和消防限制。"], ["施工", "按营业影响和大楼规定安排工期。"]]),
    process_steps_en: faq([["Planning", "Plan space by team size, department flow, and reception needs."], ["Coordination", "Coordinate power, network, lighting, air-conditioning, and fire safety limits."], ["Construction", "Schedule works around business impact and building rules."]]),
    faqs_zh: faq([["可以周末施工吗？", "需根据大楼管理规定安排，我们会协助确认施工时段和材料运输。"]]),
    faqs_en: faq([["Can renovation be done on weekends?", "It depends on building rules. We help confirm working hours and delivery arrangements."]]),
    seo_title_zh: "办公室装修马来西亚 | FLASH CAST 商业空间设计施工",
    seo_title_en: "Office Renovation Malaysia | FLASH CAST Commercial Fit-Out",
    seo_description_zh: "办公室装修、商业空间规划、隔间、前台、会议室、工作位和品牌墙施工。",
    seo_description_en: "Office renovation, commercial space planning, partitions, reception, meeting rooms, workstations, and brand wall works.",
  },
  {
    slug: "shop-renovation",
    title_zh: "店铺装修与零售空间 Fit-Out",
    title_en: "Shop Renovation and Retail Fit-Out",
    excerpt_zh: "为零售店、餐饮店、展厅和服务门店打造有转化力的商业空间。",
    excerpt_en: "Retail, F&B, showroom, and service outlet fit-out for customer-facing spaces.",
    image_url: img("/images/services/shoplot-renovation.jpg"),
    alt_zh: "店铺装修和零售空间施工",
    alt_en: "Shop renovation and retail fit-out",
    suitable_for_zh: ["零售店", "餐饮店", "美容美甲店", "展厅"],
    suitable_for_en: ["Retail shops", "F&B outlets", "Beauty and nail salons", "Showrooms"],
    common_projects_zh: ["店面布局", "展示柜", "招牌和门面", "灯光与收银区"],
    common_projects_en: ["Shop layout", "Display cabinets", "Signage and facade", "Lighting and cashier area"],
    scope_items_zh: ["品牌与动线规划", "基础装修", "展示与收纳木作", "开业前收尾"],
    scope_items_en: ["Brand and flow planning", "Base renovation works", "Display and storage carpentry", "Pre-opening finishing"],
    process_steps_zh: faq([["确认品牌", "根据品牌定位和客流设计空间重点。"], ["排期开工", "按开业日期倒排审批、材料和施工。"], ["交付", "完成灯光、展示、收银和门面检查。"]]),
    process_steps_en: faq([["Brand brief", "Shape key areas based on brand positioning and customer flow."], ["Schedule", "Reverse-plan approvals, materials, and works from opening date."], ["Handover", "Check lighting, display, cashier area, and facade before opening."]]),
    faqs_zh: faq([["可以赶开业日期吗？", "可以先按开业日期倒排工期，并优先锁定审批、材料和关键施工项目。"]]),
    faqs_en: faq([["Can you work toward an opening date?", "Yes. We reverse-plan the schedule and prioritize approvals, materials, and critical works."]]),
    seo_title_zh: "店铺装修与零售空间设计施工 | FLASH CAST",
    seo_title_en: "Shop Renovation and Retail Fit-Out Malaysia",
    seo_description_zh: "店铺装修、零售空间、餐饮店、展厅、招牌、门面和商业 Fit-Out 服务。",
    seo_description_en: "Shop renovation, retail space, F&B outlet, showroom, signage, facade, and commercial fit-out services.",
  },
  {
    slug: "builtin",
    title_zh: "定制内嵌家具与收纳系统",
    title_en: "Custom Built-In Furniture and Storage Systems",
    excerpt_zh: "电视柜、衣柜、鞋柜、书柜、展示柜、厨房柜和办公室收纳定制。",
    excerpt_en: "Custom TV cabinets, wardrobes, shoe cabinets, bookshelves, display cabinets, kitchen cabinets, and office storage.",
    image_url: img("/images/services/builtin-solutions.jpg"),
    alt_zh: "定制内嵌家具和收纳系统",
    alt_en: "Custom built-in furniture and storage systems",
    suitable_for_zh: ["小户型收纳", "卧室衣柜", "客厅电视柜", "办公室储物"],
    suitable_for_en: ["Small-space storage", "Bedroom wardrobes", "Living room TV cabinets", "Office storage"],
    common_projects_zh: ["衣柜", "电视墙", "鞋柜", "展示柜"],
    common_projects_en: ["Wardrobes", "TV feature walls", "Shoe cabinets", "Display cabinets"],
    scope_items_zh: ["现场量尺", "柜体设计", "材料确认", "制作安装"],
    scope_items_en: ["Site measurement", "Cabinet design", "Material confirmation", "Fabrication and installation"],
    process_steps_zh: faq([["量尺", "确认尺寸、开门方式、收纳习惯和电位。"], ["设计", "确认柜体结构、门板、五金、灯带和收口。"], ["安装", "制作后现场安装并调整门缝和五金。"]]),
    process_steps_en: faq([["Measure", "Confirm dimensions, door opening, storage habits, and power points."], ["Design", "Confirm structure, door finish, hardware, lighting, and finishing."], ["Install", "Fabricate, install, and adjust doors and hardware on site."]]),
    faqs_zh: faq([["定制柜需要多久？", "确认设计和材料后，常见制作安装周期约 2-5 周，视数量和复杂度而定。"]]),
    faqs_en: faq([["How long does custom cabinetry take?", "After design and material confirmation, typical fabrication and installation takes 2-5 weeks depending on quantity and complexity."]]),
    seo_title_zh: "马来西亚定制家具与内嵌柜 | FLASH CAST",
    seo_title_en: "Custom Built-In Furniture Malaysia | FLASH CAST",
    seo_description_zh: "定制衣柜、橱柜、电视柜、鞋柜、展示柜和收纳系统设计制作安装。",
    seo_description_en: "Custom wardrobes, kitchen cabinets, TV cabinets, shoe cabinets, display cabinets, and storage systems.",
  },
  {
    slug: "warehouse",
    title_zh: "仓储货架与工业空间工程",
    title_en: "Warehouse Shelving and Industrial Space Works",
    excerpt_zh: "仓库货架、储物系统、工业单位基础装修、照明和空间动线优化。",
    excerpt_en: "Warehouse racking, storage systems, industrial unit renovation, lighting, and flow optimization.",
    image_url: img("/images/services/warehouse-shelving.jpg"),
    alt_zh: "仓库货架和工业空间装修",
    alt_en: "Warehouse shelving and industrial space works",
    suitable_for_zh: ["仓库", "工业单位", "后勤空间", "储物房"],
    suitable_for_en: ["Warehouses", "Industrial units", "Logistics spaces", "Storage rooms"],
    common_projects_zh: ["货架系统", "仓库办公室", "地面与照明", "动线规划"],
    common_projects_en: ["Racking systems", "Warehouse office areas", "Flooring and lighting", "Flow planning"],
    scope_items_zh: ["现场尺寸确认", "货架和动线规划", "基础施工", "安装和安全检查"],
    scope_items_en: ["Site dimension check", "Racking and flow planning", "Base construction", "Installation and safety checks"],
    process_steps_zh: faq([["盘点需求", "确认货物尺寸、承重、叉车和出入库方式。"], ["规划", "安排货架、通道、照明和办公室区域。"], ["安装", "完成货架、地面、隔间和安全检查。"]]),
    process_steps_en: faq([["Requirement check", "Confirm goods size, load, forklift use, and receiving flow."], ["Planning", "Plan racking, aisles, lighting, and office areas."], ["Installation", "Complete racking, flooring, partitions, and safety checks."]]),
    faqs_zh: faq([["货架可以按承重规划吗？", "可以。我们会根据货物类型、尺寸、出入库方式和承重需求规划。"]]),
    faqs_en: faq([["Can racking be planned by load requirement?", "Yes. We plan according to item type, dimensions, receiving method, and load requirements."]]),
    seo_title_zh: "仓储货架与工业空间工程 | FLASH CAST",
    seo_title_en: "Warehouse Shelving and Industrial Works Malaysia",
    seo_description_zh: "仓库货架、工业单位装修、储物系统、照明、办公室隔间和空间规划服务。",
    seo_description_en: "Warehouse racking, industrial unit renovation, storage systems, lighting, office partitions, and space planning.",
  },
].map((service, index) => ({
  ...service,
  content_zh: html([`${service.title_zh}需要同时考虑预算、材料、现场限制和长期维护。FLASH CAST 会先确认空间状态和使用需求，再整理施工范围、材料建议和工期安排。`, "我们的目标不是只把空间做漂亮，而是让业主在预算、品质和交付之间取得清楚平衡。"]),
  content_en: html([`${service.title_en} requires clear planning around budget, materials, site restrictions, and long-term maintenance. FLASH CAST confirms site condition and usage needs before preparing scope, material advice, and timeline.`, "Our goal is not just to make the space look good, but to help owners balance budget, quality, and delivery clearly."]),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const heroSlides = [
  {
    title_zh: "马来西亚住宅与商业装修，一站式设计施工",
    title_en: "Design & Build Renovation for Homes and Commercial Spaces in Malaysia",
    excerpt_zh: "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理和售后跟进，帮助业主更安心完成装修。",
    excerpt_en: "FLASH CAST handles site measurement, space planning, material advice, project management, and after-sales support for a smoother renovation experience.",
    button_label_zh: "获取免费报价",
    button_label_en: "Get a Free Quote",
    button_url: "/quote",
    image_url: img("/images/heroes/hero-luxury-living.jpg"),
    alt_zh: "FLASH CAST 马来西亚装修公司首页横幅",
    alt_en: "FLASH CAST Malaysia renovation company hero banner",
    status: "published",
    sort_order: 10,
  },
  {
    title_zh: "旧屋翻新、厨房、浴室、办公室与店铺装修",
    title_en: "Old House, Kitchen, Bathroom, Office and Shop Renovation",
    excerpt_zh: "从预算规划到施工细节，我们根据房屋状态、空间用途和业主预算整理可执行方案。",
    excerpt_en: "From budget planning to construction details, we prepare practical renovation plans based on property condition, usage, and budget.",
    button_label_zh: "WhatsApp 咨询",
    button_label_en: "WhatsApp Consultation",
    button_url: whatsappLink("Hi FLASH CAST, I would like to ask about renovation services."),
    image_url: img("/images/heroes/hero-renovation.jpg"),
    alt_zh: "装修咨询与施工团队",
    alt_en: "Renovation consultation and construction team",
    status: "published",
    sort_order: 20,
  },
];

const projectRows = [
  ["mont-kiara-condo-renovation", "Mont Kiara 公寓全屋翻新", "Mont Kiara Condo Full Renovation", "Mont Kiara, Kuala Lumpur", "1,250 sq ft", "10 weeks", "RM95,000 - RM160,000", "Residential", ["proj1-condo-1.jpg", "proj1-condo-2.jpg"]],
  ["petaling-jaya-office-fit-out", "Petaling Jaya 办公室装修", "Petaling Jaya Office Fit-Out", "Petaling Jaya, Selangor", "2,800 sq ft", "8 weeks", "RM120,000 - RM220,000", "Office", ["proj2-office-1.jpg", "proj2-office-2.jpg"]],
  ["subang-jaya-kitchen-upgrade", "Subang Jaya 厨房与橱柜升级", "Subang Jaya Kitchen and Cabinet Upgrade", "Subang Jaya, Selangor", "220 sq ft", "5 weeks", "RM38,000 - RM70,000", "Kitchen", ["proj3-kitchen-1.jpg", "proj3-kitchen-2.jpg"]],
  ["puchong-warehouse-racking", "Puchong 仓库货架与办公室区", "Puchong Warehouse Racking and Office Area", "Puchong, Selangor", "5,000 sq ft", "6 weeks", "RM85,000 - RM180,000", "Warehouse", ["proj4-warehouse-1.jpg", "proj4-warehouse-2.jpg"]],
  ["cheras-shopfront-renovation", "Cheras 店铺门面与展示区装修", "Cheras Shopfront and Display Renovation", "Cheras, Kuala Lumpur", "1,100 sq ft", "7 weeks", "RM75,000 - RM140,000", "Retail", ["proj5-shopfront-1.jpg", "proj5-shopfront-2.jpg"]],
  ["bangsar-bedroom-wardrobe", "Bangsar 卧室衣柜与收纳定制", "Bangsar Bedroom Wardrobe and Storage", "Bangsar, Kuala Lumpur", "350 sq ft", "4 weeks", "RM28,000 - RM55,000", "Built-In", ["proj6-bedroom-1.jpg", "proj6-bedroom-2.jpg"]],
  ["kl-restaurant-fit-out", "Kuala Lumpur 餐饮店装修", "Kuala Lumpur Restaurant Fit-Out", "Kuala Lumpur", "1,600 sq ft", "9 weeks", "RM150,000 - RM280,000", "F&B", ["proj7-restaurant-1.jpg", "proj7-restaurant-2.jpg"]],
  ["puchong-home-office", "Puchong 住家办公空间改造", "Puchong Home Office Renovation", "Puchong, Selangor", "480 sq ft", "4 weeks", "RM32,000 - RM62,000", "Home Office", ["proj8-homeoffice-1.jpg", "proj8-homeoffice-2.jpg"]],
];

const projects = projectRows.map(([slug, zh, en, location, area, duration, budget, type], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${location} ${type} 装修案例，重点处理空间动线、收纳、材料耐用度和收尾品质。`,
  excerpt_en: `${type} renovation case in ${location}, focused on flow, storage, durable materials, and finishing quality.`,
  content_zh: html([`这个项目位于 ${location}，面积约 ${area}。业主希望在预算范围内提升空间功能、视觉质感和长期维护便利度。`, "FLASH CAST 从现场测量、材料建议、施工排期到交付检查进行统筹，减少装修过程中的沟通成本和返工风险。"]),
  content_en: html([`This project is located in ${location}, around ${area}. The owner wanted to improve function, visual quality, and long-term maintenance within a practical budget.`, "FLASH CAST coordinated measurement, material advice, work scheduling, and handover inspection to reduce communication cost and rework risk."]),
  location,
  area,
  duration,
  budget,
  project_type: type,
  materials: ["Moisture-resistant board", "Quartz / tile finishes", "LED lighting", "Quality hardware"],
  scope: ["Site measurement", "Design coordination", "Wet works / carpentry", "Electrical points", "Final inspection"],
  highlights_zh: ["预算与范围清楚", "动线和收纳优化", "材料适合马来西亚气候", "交付前完成细节检查"],
  highlights_en: ["Clear budget and scope", "Improved flow and storage", "Materials suited for Malaysia climate", "Detailed pre-handover inspection"],
  client_need_zh: "业主希望装修过程透明、报价清楚，并在工期内完成可长期使用的空间。",
  client_need_en: "The client wanted a transparent process, clear pricing, and a durable space completed within schedule.",
  seo_title_zh: `${zh} | FLASH CAST 装修案例`,
  seo_title_en: `${en} | FLASH CAST Case Study`,
  seo_description_zh: `${location} 装修案例，包含面积、工期、预算、材料、施工范围和项目亮点。`,
  seo_description_en: `${location} renovation case study with area, duration, budget, materials, scope, and highlights.`,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const projectImagesBySlug = Object.fromEntries(projectRows.map(([slug,,,,,,,, images]) => [slug, images]));

const materials = [
  ["spc-flooring-natural-oak", "SPC 木纹地板", "Natural Oak SPC Flooring", "Flooring", "SPC Flooring", "SPC", "spc-vinyl-natural-oak.jpg", "RM8 - RM18 / sq ft"],
  ["vinyl-plank-ash-grey", "灰橡木乙烯基地板", "Ash Grey Vinyl Plank", "Flooring", "Vinyl Flooring", "Vinyl", "vinyl-plank-ash-grey.jpg", "RM6 - RM15 / sq ft"],
  ["quartz-countertop-white", "白色石英石台面", "White Quartz Countertop", "Kitchen Cabinet", "Countertop", "Quartz", "porcelain-carrara-white.jpg", "RM180 - RM380 / ft run"],
  ["melamine-cabinet-board", "Melamine 橱柜板材", "Melamine Cabinet Board", "Kitchen Cabinet", "Cabinet Board", "Melamine", "melamine-grey-oak.jpg", "From RM250 / ft run"],
  ["acrylic-cabinet-door", "高光 Acrylic 橱柜门板", "High Gloss Acrylic Cabinet Door", "Kitchen Cabinet", "Door Finish", "Acrylic", "acrylic-high-gloss-white.jpg", "From RM350 / ft run"],
  ["anti-slip-bathroom-tile", "浴室防滑瓷砖", "Anti-Slip Bathroom Tile", "Bathroom", "Tiles", "Porcelain", "hexagon-grey-matte.jpg", "RM6 - RM25 / sq ft material only"],
  ["subway-wall-tile", "白色 Subway 墙砖", "White Subway Wall Tile", "Bathroom", "Wall Tiles", "Ceramic", "subway-tile-white.jpg", "RM5 - RM18 / sq ft material only"],
  ["fluted-wall-panel", "炭灰色格栅墙板", "Charcoal Fluted Wall Panel", "Wall Panel", "Feature Wall", "Panel", "fluted-panel-charcoal.jpg", "From RM18 / sq ft"],
  ["lime-wash-paint", "艺术石灰洗墙面", "Lime Wash Feature Paint", "Art Paint", "Feature Paint", "Lime Wash", "art-lime-wash.jpg", "From RM12 / sq ft"],
  ["frameless-glass-screen", "无框玻璃隔断", "Frameless Glass Screen", "Doors & Windows", "Glass", "Tempered Glass", "frameless-glass-clear.jpg", "Quote by size"],
  ["solid-timber-walnut", "胡桃木实木饰面", "Walnut Solid Timber Finish", "Furniture", "Timber Finish", "Solid Timber", "solid-timber-walnut.jpg", "Quote by specification"],
  ["aluminium-sliding-door", "黑框铝合金推拉门", "Black Aluminium Sliding Door", "Doors & Windows", "Sliding Door", "Aluminium", "aluminium-sliding-black.jpg", "Quote by size"],
].map(([slug, zh, en, category, subcategory, type, file, price], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${zh} 适合马来西亚住宅和商业装修，需根据空间用途、预算和维护习惯选择。`,
  excerpt_en: `${en} is suitable for Malaysian home and commercial renovation when selected by usage, budget, and maintenance needs.`,
  content_zh: html([`${zh} 是常见装修材料之一。选择时应比较耐用度、防潮性、清洁方式、视觉效果和安装条件。`, "FLASH CAST 会根据空间用途和预算建议合适规格，并说明材料优缺点和施工注意事项。"]),
  content_en: html([`${en} is a common renovation material. Selection should compare durability, moisture resistance, cleaning method, appearance, and installation condition.`, "FLASH CAST recommends suitable specifications based on space usage and budget, with clear pros, cons, and installation notes."]),
  category,
  subcategory,
  material_type: type,
  suitable_spaces_zh: ["住宅", "办公室", "店铺", "翻新项目"],
  suitable_spaces_en: ["Home", "Office", "Shop", "Refurbishment projects"],
  pros_zh: ["选择多", "适用范围广", "方便搭配整体风格"],
  pros_en: ["Many options", "Wide application", "Easy to match interior style"],
  cons_zh: ["需按现场条件选规格", "低价材料可能影响耐用度"],
  cons_en: ["Specification depends on site condition", "Very low-cost options may affect durability"],
  reference_price: price,
  image_url: img(`/images/materials/${file}`),
  alt_zh: `${zh} 材料样板`,
  alt_en: `${en} material sample`,
  seo_title_zh: `${zh} 材料介绍 | FLASH CAST`,
  seo_title_en: `${en} Material Guide | FLASH CAST`,
  seo_description_zh: `${zh} 的适用空间、优缺点、参考价格和装修建议。`,
  seo_description_en: `${en} suitable spaces, pros, cons, reference pricing, and renovation advice.`,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const areas = ["kuala-lumpur", "selangor", "petaling-jaya", "subang-jaya", "puchong", "cheras", "mont-kiara", "bangsar"].map((slug, index) => {
  const name = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  return {
    slug,
    area_name: name,
    title_zh: `${name} 装修公司`,
    title_en: `${name} Renovation Contractor`,
    excerpt_zh: `FLASH CAST 为 ${name} 住宅、办公室、店铺和旧屋翻新提供装修服务。`,
    excerpt_en: `FLASH CAST provides renovation services for homes, offices, shops, and old houses in ${name}.`,
    content_zh: html([`${name} 业主通常需要清楚预算、管理处审批、施工时间和材料交付安排。`, "我们会根据物业类型、现场限制和预算整理可执行的装修范围，并提供免费咨询和报价。"]),
    content_en: html([`Owners in ${name} often need clear budgeting, building approval, working-hour planning, and material delivery coordination.`, "We prepare practical renovation scope based on property type, site restrictions, and budget, with free consultation and quotation."]),
    property_types: ["Condo", "Terrace house", "Office", "Retail shop", "Old house"],
    common_needs: ["Kitchen renovation", "Bathroom waterproofing", "Custom cabinets", "Office fit-out", "Full refurbishment"],
    construction_notes_zh: `${name} 项目通常需提前确认管理处施工时段、搬运路线、电梯保护和噪音限制。`,
    construction_notes_en: `${name} projects usually need early checks on management working hours, delivery route, lift protection, and noise restrictions.`,
    projects: [],
    faqs_zh: faq([["可以免费上门测量吗？", "可根据地区、项目类型和时间安排确认现场测量。"], ["报价需要多久？", "普通项目现场确认后通常 3-7 个工作日可整理报价。"]]),
    faqs_en: faq([["Can you provide free site measurement?", "Site measurement can be arranged based on area, project type, and schedule."], ["How long does quotation take?", "After site confirmation, most quotations can be prepared within 3-7 working days."]]),
    seo_title_zh: `${name} 装修公司 | 住宅与商业装修 FLASH CAST`,
    seo_title_en: `${name} Renovation Contractor | FLASH CAST Malaysia`,
    seo_description_zh: `FLASH CAST 提供 ${name} 住宅装修、旧屋翻新、厨房、浴室、办公室、店铺和定制柜服务。`,
    seo_description_en: `FLASH CAST provides ${name} home renovation, old house refurbishment, kitchen, bathroom, office, shop, and custom cabinet services.`,
    status: "published",
    sort_order: (index + 1) * 10,
  };
});

const landingSlugs = [
  ["flooring", "地板装修", "Flooring Installation", "/images/materials/category-flooring.jpg"],
  ["kitchen-cabinet", "厨房橱柜定制", "Kitchen Cabinet Renovation", "/images/services/kitchen-renovation.jpg"],
  ["office-renovation", "办公室装修", "Office Renovation", "/images/services/office-renovation.jpg"],
  ["shop-renovation", "店铺装修", "Shop Renovation", "/images/services/shoplot-renovation.jpg"],
  ["warehouse-shelving", "仓储货架", "Warehouse Shelving", "/images/services/warehouse-shelving.jpg"],
  ["bathroom-renovation", "浴室翻新", "Bathroom Renovation", "/images/services/bathroom-renovation.jpg"],
  ["old-house-renovation", "旧屋翻新", "Old House Renovation", "/images/services/old-house-renovation.jpg"],
  ["custom-built-in", "定制内嵌家具", "Custom Built-In Furniture", "/images/services/builtin-solutions.jpg"],
];

const landingPages = landingSlugs.map(([slug, zh, en, image], index) => ({
  slug,
  title_zh: `${zh}服务`,
  title_en: `${en} Services`,
  excerpt_zh: `${zh} 从现场评估、预算规划、材料建议到施工管理，适合马来西亚住宅和商业空间。`,
  excerpt_en: `${en} from site assessment and budget planning to material advice and project management for Malaysian homes and commercial spaces.`,
  content_zh: html([`${zh} 需要结合现场条件、使用需求、预算和长期维护。FLASH CAST 会先确认空间状态，再整理施工范围、材料建议和工期。`, "欢迎通过 WhatsApp 或免费报价表单提交资料，我们会根据地区和项目类型安排下一步。"]),
  content_en: html([`${en} should consider site condition, usage needs, budget, and long-term maintenance. FLASH CAST confirms the space first, then prepares scope, material advice, and timeline.`, "Send your requirements via WhatsApp or the quote form, and we will arrange the next step based on location and project type."]),
  hero_image_url: img(image),
  alt_zh: `${zh}施工效果图`,
  alt_en: `${en} project image`,
  benefits_zh: ["清楚报价范围", "材料建议实用", "施工流程透明", "适合吉隆坡与雪兰莪项目"],
  benefits_en: ["Clear quotation scope", "Practical material advice", "Transparent construction flow", "Suitable for KL and Selangor projects"],
  related_projects: [],
  faqs_zh: faq([["可以先咨询预算吗？", "可以。请提供地区、面积、项目类型和照片，我们会先给出方向性建议。"], ["是否提供材料建议？", "提供。我们会根据预算、使用频率和维护需求推荐材料。"]]),
  faqs_en: faq([["Can I ask about budget first?", "Yes. Send location, area, project type, and photos for initial advice."], ["Do you provide material advice?", "Yes. We recommend materials based on budget, usage frequency, and maintenance needs."]]),
  seo_title_zh: `${zh}马来西亚 | FLASH CAST`,
  seo_title_en: `${en} Malaysia | FLASH CAST`,
  seo_description_zh: `${zh}服务，包含现场评估、材料建议、施工范围、预算规划和免费报价。`,
  seo_description_en: `${en} services with site assessment, material advice, scope planning, budget planning, and free quotation.`,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const blogTopics = [
  ["malaysia-renovation-budget-guide", "马来西亚装修预算怎么规划？", "How to Plan a Renovation Budget in Malaysia", "Budget"],
  ["kitchen-cabinet-material-guide", "厨房橱柜材料怎么选？", "How to Choose Kitchen Cabinet Materials", "Kitchen"],
  ["old-house-renovation-checklist", "旧屋翻新前要检查什么？", "Old House Renovation Checklist", "Old House"],
  ["bathroom-waterproofing-guide", "浴室防水工程要注意什么？", "Bathroom Waterproofing Guide", "Bathroom"],
  ["kl-condo-renovation-approval", "KL 公寓装修管理处审批指南", "KL Condo Renovation Approval Guide", "Local SEO"],
  ["selangor-office-fit-out-tips", "Selangor 办公室装修注意事项", "Selangor Office Fit-Out Tips", "Office"],
  ["shop-renovation-before-opening", "店铺开业前装修时间怎么排？", "Shop Renovation Timeline Before Opening", "Retail"],
  ["renovation-materials-malaysia", "马来西亚装修材料选择指南", "Renovation Materials Guide Malaysia", "Materials"],
];

const blogPosts = blogTopics.map(([slug, zh, en, category], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${zh} 这篇文章帮助业主了解预算、材料、施工和沟通重点，减少装修过程中的不确定性。`,
  excerpt_en: `${en} helps owners understand budget, materials, construction, and communication points before starting renovation.`,
  content_zh: `<h2>为什么这件事重要？</h2><p>装修不是只比较总价。业主需要确认范围、材料规格、现场限制、工期和售后责任，才能避免后期追加和沟通误差。</p><h2>建议怎么做？</h2><p>先整理房屋类型、面积、地区、预算和照片，再让装修团队根据现场条件拆分必要工程与可选升级。对于旧屋、浴室和商业空间，更要预留审批和隐藏问题的处理时间。</p><h2>FLASH CAST 可以怎么帮你？</h2><p>我们提供免费咨询、现场测量、材料建议、明细报价和施工管理，服务范围覆盖吉隆坡与雪兰莪。</p>`,
  content_en: `<h2>Why does this matter?</h2><p>Renovation is not only about comparing the total price. Owners should confirm scope, material specifications, site restrictions, timeline, and after-sales responsibility to avoid later additions and miscommunication.</p><h2>What should you prepare?</h2><p>Start with property type, area, location, budget, and photos. A renovation team can then split essential works from optional upgrades based on actual site condition. Old houses, bathrooms, and commercial spaces need extra allowance for approvals and hidden issues.</p><h2>How can FLASH CAST help?</h2><p>We provide free consultation, site measurement, material advice, itemized quotation, and project management across Kuala Lumpur and Selangor.</p>`,
  category,
  tags: ["Malaysia renovation", category, "FLASH CAST"],
  cover_image_url: img(index % 2 === 0 ? "/images/heroes/hero-projects.jpg" : "/images/heroes/hero-materials.jpg"),
  alt_zh: `${zh} 封面图`,
  alt_en: `${en} cover image`,
  seo_title_zh: `${zh} | FLASH CAST 装修指南`,
  seo_title_en: `${en} | FLASH CAST Guide`,
  seo_description_zh: `${zh}，了解马来西亚装修预算、材料、施工和报价重点。`,
  seo_description_en: `${en}, with practical Malaysia renovation budget, material, construction, and quotation advice.`,
  status: "published",
  published_at: new Date(Date.UTC(2026, 4, 25, index, 0, 0)).toISOString(),
}));

const testimonials = [
  ["Mont Kiara Homeowner", "团队报价清楚，施工期间会持续更新照片，厨房和客厅收尾比预期更细。", "The quotation was clear and the team kept us updated with photos. Kitchen and living area finishing was more detailed than expected."],
  ["Petaling Jaya Business Owner", "办公室装修按计划交付，电位、网络和隔间安排都很顺。", "The office fit-out was delivered on schedule. Power, network points, and partitions were coordinated smoothly."],
  ["Puchong Family Client", "旧屋翻新最担心漏水和追加费用，FLASH CAST 帮我们先把重点问题整理清楚。", "Our biggest concern was leakage and extra cost. FLASH CAST helped us clarify the priority issues first."],
  ["Cheras Shop Owner", "店铺装修赶开业日期，团队愿意配合管理处时间，沟通很直接。", "The shop renovation had to meet our opening date. The team worked with building management hours and communicated directly."],
  ["Bangsar Condo Owner", "定制柜尺寸精准，收纳比原本多很多，整体风格也统一。", "The custom cabinets fit well, storage improved a lot, and the overall style feels consistent."],
].map(([customer_name, content_zh, content_en], index) => ({
  customer_name,
  rating: 5,
  content_zh,
  content_en,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const run = async () => {
  if (FORCE_SEED) {
    await request("/rest/v1/hero_slides?id=not.is.null", { method: "DELETE" });
    await request("/rest/v1/testimonials?id=not.is.null", { method: "DELETE" });
    await request("/rest/v1/projects?slug=in.(puchong-home-office-renovation,cheras-bathroom-waterproofing)", { method: "DELETE" });
    await request("/rest/v1/materials?slug=eq.porcelain-bathroom-tile", { method: "DELETE" });
  }

  await insertRowsIfEmpty("hero_slides", heroSlides);
  await upsert("services", services);
  await upsert("service_areas", areas);
  await upsert("landing_pages", landingPages);
  await upsert("projects", projects);
  await upsert("materials", materials);
  const humanizedBlogCount = applyHumanizedBlogContent(blogPosts);
  await upsert("blog_posts", blogPosts);
  await insertRowsIfEmpty("testimonials", testimonials);

  const savedProjects = await selectRowsByValues("projects", "slug", projects.map((project) => project.slug), "id,slug");
  const projectIdBySlug = Object.fromEntries(savedProjects.map((project) => [project.slug, project.id]));
  for (const [slug, files] of Object.entries(projectImagesBySlug)) {
    const projectId = projectIdBySlug[slug];
    if (!projectId) continue;
    if (FORCE_SEED) {
      await request(`/rest/v1/project_images?project_id=eq.${projectId}`, { method: "DELETE" });
    } else {
      const existingImages = await request(`/rest/v1/project_images?select=id&project_id=eq.${projectId}&limit=1`);
      if (existingImages?.length) continue;
    }
    const rows = files.map((file, index) => ({
      project_id: projectId,
      image_url: img(`/images/projects/${file}`),
      image_type: index === 0 ? "cover" : "gallery",
      alt_zh: `${projects.find((project) => project.slug === slug)?.title_zh || "装修案例"} 图片 ${index + 1}`,
      alt_en: `${projects.find((project) => project.slug === slug)?.title_en || "Renovation case"} image ${index + 1}`,
      sort_order: (index + 1) * 10,
    }));
    await request("/rest/v1/project_images", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  console.log(JSON.stringify({
    ok: true,
    mode: FORCE_SEED ? "force-overwrite" : "safe-insert-missing",
    hero_slides: heroSlides.length,
    services: services.length,
    service_areas: areas.length,
    landing_pages: landingPages.length,
    projects: projects.length,
    materials: materials.length,
    blog_posts: blogPosts.length,
    blog_posts_humanized: humanizedBlogCount,
    testimonials: testimonials.length,
  }, null, 2));
};

await run();
