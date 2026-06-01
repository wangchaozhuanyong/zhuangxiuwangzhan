// Deprecated one-off production repair script.
// Keep for audit/history only. Do not run against production without a fresh backup
// and explicit owner approval; current content maintenance should use the admin UI
// or the documented seed scripts in package.json.
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[fix-content-reasonableness] Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const REST_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};
const jsonHeaders = { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" };
const STATIC_PROJECT_ASSET_VERSION = "20260601-content";
const versionedProjectImage = (src) => `${src}?v=${STATIC_PROJECT_ASSET_VERSION}`;
const brandPartnerUpdates = [
  { name: "Remmers", logo_url: "/images/brands/remmers.webp", website_url: "", status: "published", sort_order: 10 },
  { name: "Hafele", logo_url: "/images/brands/hafele.webp", website_url: "", status: "published", sort_order: 20 },
  { name: "Blum", logo_url: "/images/brands/blum.webp", website_url: "", status: "published", sort_order: 30 },
  { name: "Nippon Paint", logo_url: "/images/brands/nippon-paint.webp", website_url: "", status: "published", sort_order: 40 },
  { name: "Bosch", logo_url: "/images/brands/bosch.webp", website_url: "", status: "published", sort_order: 50 },
  { name: "GROHE", logo_url: "/images/brands/grohe.webp", website_url: "", status: "published", sort_order: 60 },
  { name: "Hettich", logo_url: "/images/brands/hettich.webp", website_url: "", status: "published", sort_order: 70 },
  { name: "JOTUN", logo_url: "/images/brands/jotun.webp", website_url: "", status: "published", sort_order: 80 },
];

const reportDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(reportDir, { recursive: true });

async function rest(table, query = "select=*&limit=1000") {
  const response = await fetch(`${REST_BASE}/${table}?${query}`, { headers });
  if (!response.ok) throw new Error(`${table} ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return response.json();
}

async function patchById(table, id, body) {
  const response = await fetch(`${REST_BASE}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${table} ${id} ${response.status}: ${(await response.text()).slice(0, 240)}`);
}

async function upsertBrandPartner(row) {
  const existing = await rest("brand_partners", `select=id&name=eq.${encodeURIComponent(row.name)}&limit=1`);
  if (existing[0]?.id) {
    await patchById("brand_partners", existing[0].id, { ...row, updated_at: new Date().toISOString() });
    return;
  }
  const response = await fetch(`${REST_BASE}/brand_partners`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(row),
  });
  if (!response.ok) throw new Error(`brand_partners ${row.name} ${response.status}: ${(await response.text()).slice(0, 240)}`);
}

const serviceSeo = {
  shoplot: {
    seo_description_zh: "面向零售、餐饮、诊所、美容院和服务型店铺，提供店面、室内、招牌和交付前细节统筹。",
  },
  design: {
    seo_description_zh: "提供住宅与商业空间规划、动线布局、3D 效果、施工图和材料搭配建议，让报价和施工更清楚。",
  },
  approval: {
    seo_description_zh: "协助准备装修准证、管理处申请、施工图纸和现场资料，减少审批来回和开工延误。",
  },
  office: {
    seo_description_zh: "办公室装修包含布局规划、隔间、工作位、会议室、弱电点位和收尾工程，适合中小型团队升级办公环境。",
  },
  "old-house": {
    seo_description_zh: "旧屋翻新重点检查水电、防水、墙地面、屋顶和隐藏问题，再按预算规划必要工程与空间升级。",
  },
  "artistic-coating": {
    seo_description_en:
      "Premium Remmers artistic wall coating for feature walls, reception areas, selected interiors, and refined textured finishes.",
  },
  "shop-renovation": {
    seo_description_zh: "店铺装修覆盖零售、餐饮、展厅和服务空间，从门面形象、动线到交付前细节一起规划。",
  },
};

const landingUpdates = {
  flooring: {
    seo_description_zh: "地板装修包含 SPC、复合地板和局部地面更新建议，适合住宅、办公室和店铺项目的预算规划。",
    seo_description_en: "Flooring installation for SPC, laminate, and selected floor upgrades, with site assessment and material guidance.",
    related_projects: [
      { title: "Mont Kiara Condo SPC Flooring", location: "Mont Kiara, KL", image: "/images/projects/proj1-condo-1.webp" },
      { title: "Petaling Jaya Office Laminate Flooring", location: "Petaling Jaya", image: "/images/projects/proj2-office-1.webp" },
    ],
  },
  "kitchen-cabinet": {
    seo_description_zh: "厨房橱柜定制包含干湿厨房布局、柜体材料、台面、电器位和收纳细节规划。",
    seo_description_en: "Kitchen cabinet renovation with dry and wet kitchen planning, cabinet materials, countertops, appliances, and storage details.",
    related_projects: [
      { title: "Bangsar Condo Kitchen Cabinet", location: "Bangsar, KL", image: "/images/projects/kitchen-cabinet.webp" },
      { title: "Subang Jaya Dry and Wet Kitchen Cabinet", location: "Subang Jaya", image: "/images/projects/generated-portfolio/subang-jaya-dry-wet-kitchen-cabinet.webp" },
    ],
  },
  "shop-renovation": {
    seo_description_zh: "店铺装修服务适合零售、餐饮、美容、诊所和展厅，从门面、室内动线到收尾交付一起安排。",
    seo_description_en: "Shop renovation for retail, F&B, salons, clinics, and showrooms, covering frontage, interior flow, and handover details.",
    related_projects: [
      { title: "Bangsar Retail Shopfront Renovation", location: "Bangsar, KL", image: "/images/projects/proj5-shopfront-1.webp" },
      { title: "SS2 Cafe Renovation", location: "Petaling Jaya", image: "/images/projects/proj7-restaurant-1.webp" },
    ],
  },
  "warehouse-shelving": {
    seo_description_zh: "仓储货架服务包含现场尺寸、承重需求、通道规划、照明和办公室角落配置建议。",
    seo_description_en: "Warehouse shelving services with site measurement, load planning, aisle layout, lighting, and office corner coordination.",
    related_projects: [
      { title: "Shah Alam Warehouse Racking", location: "Shah Alam, Selangor", image: "/images/projects/proj4-warehouse-1.webp" },
      { title: "Puchong Logistics Storage System", location: "Puchong", image: "/images/projects/generated-portfolio/puchong-heavy-duty-warehouse-racking.webp" },
    ],
  },
  "bathroom-renovation": {
    seo_description_zh: "浴室翻新重点处理防水、排水、铺砖、洁具和玻璃浴屏，适合旧浴室漏水或风格升级。",
    seo_description_en: "Bathroom renovation focused on waterproofing, drainage, tiles, sanitary fittings, and shower screen coordination.",
    related_projects: [
      { title: "Petaling Jaya Bathroom Waterproofing Upgrade", location: "Petaling Jaya", image: "/images/services/bathroom-renovation.webp" },
      { title: "Condo Bathroom Tile Upgrade", location: "Klang Valley", image: versionedProjectImage("/images/projects/residential-renovation.webp") },
    ],
  },
  "office-renovation": {
    seo_description_zh: "办公室装修服务覆盖前台、会议室、工作位、隔间、弱电和品牌墙，适合团队扩充或形象升级。",
    seo_description_en: "Office renovation covering reception, meeting rooms, workstations, partitions, data points, and brand wall upgrades.",
    related_projects: [
      { title: "KL Sentral Corporate Office Renovation", location: "KL Sentral", image: "/images/projects/proj2-office-1.webp" },
      { title: "Petaling Jaya Coworking Space Planning", location: "Petaling Jaya", image: "/images/projects/generated-portfolio/bangsar-coworking-space-planning.webp" },
    ],
  },
  "old-house-renovation": {
    seo_description_zh: "旧屋翻新会先检查水电、防水、墙地面和结构风险，再安排必要维修与空间风格更新。",
    seo_description_en: "Old house renovation starts with wiring, waterproofing, wall, floor, and hidden-condition checks before planning upgrades.",
    related_projects: [
      { title: "Mont Kiara Modern Condo Renovation", location: "Mont Kiara", image: versionedProjectImage("/images/projects/residential-renovation.webp") },
      { title: "Kajang Landed House Living Renovation", location: "Kajang", image: "/images/projects/generated-portfolio/kajang-landed-house-modern-renovation.webp" },
    ],
  },
  "custom-built-in": {
    seo_description_zh: "定制内嵌家具适合橱柜、衣柜、电视柜、鞋柜和展示柜，按尺寸、材料和使用习惯规划。",
    seo_description_en: "Custom built-in furniture for kitchen cabinets, wardrobes, TV cabinets, shoe cabinets, and display storage.",
    related_projects: [
      { title: "Subang Jaya Dry and Wet Kitchen Cabinet", location: "Subang Jaya", image: "/images/projects/generated-portfolio/subang-jaya-dry-wet-kitchen-cabinet.webp" },
      { title: "Kepong TV Feature Wall and Storage", location: "Kepong", image: "/images/projects/generated-portfolio/kepong-tv-feature-wall-storage.webp" },
    ],
  },
};

const blogUpdates = {
  "malaysia-renovation-budget-guide": {
    excerpt_zh: "整理马来西亚装修预算的拆分方式，帮助业主看懂工程范围、材料等级、预留费用和报价比较重点。",
    excerpt_en: "A practical guide to renovation budgeting in Malaysia, covering scope, materials, contingency, and quotation comparison.",
    content_zh:
      "<h2>先把预算分成几块</h2><p>装修预算不要只看一个总数。建议先分成拆除与保护、水电、防水、泥水、木作、油漆、五金电器、清洁和项目管理。这样报价一来，业主比较容易看出钱花在哪里。</p><h2>必须预留隐藏费用</h2><p>旧屋、浴室和商业空间最容易出现临时追加，例如墙内水管、电线老化、地面不平或管理处要求。建议至少预留 10% 到 15% 作为缓冲，不要把预算压到完全没有余地。</p><h2>比较报价时看范围</h2><p>同样是厨房或浴室，不同报价可能包含不同材料、收边方式、保修和现场协调。确认品牌、尺寸、数量、施工责任和不包含项目，比单纯比较总价更可靠。</p>",
    content_en:
      "<h2>Break the budget into clear sections</h2><p>Do not judge a renovation budget by the final number alone. Separate demolition, protection, wiring, plumbing, waterproofing, tiling, carpentry, painting, fittings, cleaning, and project management so each quotation is easier to compare.</p><h2>Keep a contingency allowance</h2><p>Older houses, bathrooms, and commercial spaces often reveal hidden issues after work starts. Keep around 10% to 15% aside for wiring, pipe, levelling, or management-office requirements.</p><h2>Compare scope, not just price</h2><p>A low quotation may exclude finishing details, warranty, site coordination, or material upgrades. Confirm brands, dimensions, quantities, responsibilities, and exclusions before deciding.</p>",
  },
  "bathroom-waterproofing-guide": {
    excerpt_zh: "说明浴室防水工程的重点，包括拆除、基层处理、防水高度、闭水测试和后续铺砖注意事项。",
    excerpt_en: "Key points for bathroom waterproofing, from hacking and substrate preparation to membrane height, ponding test, and tiling.",
    content_zh:
      "<h2>防水不是只刷一层材料</h2><p>浴室防水要先处理基层，确保地面和墙角干净、坚实、没有松动砂浆。地漏、墙角和管口位置要特别加强，因为漏水通常不是从大面积中间开始。</p><h2>高度和测试要讲清楚</h2><p>淋浴区、干区和墙面防水高度应按使用方式决定。正式铺砖前建议做闭水测试，确认楼下或相邻墙面没有渗水迹象，再继续下一步。</p><h2>铺砖也会影响结果</h2><p>防水层完成后，铺砖坡度、地漏收口、玻璃门挡水和填缝材料都会影响使用效果。报价时要把这些细节一起确认。</p>",
    content_en:
      "<h2>Waterproofing is more than one coating layer</h2><p>The substrate must be clean, firm, and properly prepared before waterproofing. Floor traps, pipe penetrations, and wall corners need extra attention because leaks usually start at weak junctions.</p><h2>Confirm height and testing</h2><p>Waterproofing height should match the shower area and usage pattern. A ponding test before tiling helps confirm that the membrane is working before the next trade starts.</p><h2>Tiling details still matter</h2><p>Slope, floor-trap finishing, shower-screen kerbs, and grout selection affect the final result. These details should be included in the quotation discussion.</p>",
  },
  "kl-condo-renovation-approval": {
    excerpt_zh: "说明 KL 公寓装修常见的管理处申请资料、施工时间限制、保护要求和开工前沟通重点。",
    excerpt_en: "A guide to KL condo renovation approval, including documents, working-hour limits, protection requirements, and site coordination.",
    content_zh:
      "<h2>先确认管理处规则</h2><p>KL 公寓装修通常需要提交申请表、承包商资料、施工范围、图纸、押金和工人名单。不同管理处要求不一样，开工前先确认可以减少停工风险。</p><h2>注意施工时间和公共区域保护</h2><p>公寓一般会限制施工时间、噪音工程日期、电梯使用和材料搬运路线。地面、电梯和走廊保护也要提前安排，否则可能被投诉或罚款。</p><h2>把图纸和范围讲清楚</h2><p>涉及墙体、厨房、浴室、水电或空调排水时，最好用图纸和文字说明清楚，方便管理处审核，也方便业主和施工团队对齐范围。</p>",
    content_en:
      "<h2>Check management rules first</h2><p>KL condo renovations usually require application forms, contractor details, scope of work, drawings, deposits, and worker lists. Requirements vary by building, so checking early reduces delay.</p><h2>Plan working hours and protection</h2><p>Most condos limit noisy works, working hours, lift usage, and material movement. Floor, corridor, and lift protection should be arranged before work begins.</p><h2>Clarify drawings and scope</h2><p>Wall changes, kitchens, bathrooms, wiring, and air-conditioner drainage should be explained clearly in drawings and notes so approval and site execution stay aligned.</p>",
  },
  "shop-renovation-before-opening": {
    excerpt_zh: "帮助店主倒排开业前装修时间，包括审批、设计确认、招牌、材料、施工和软开业检查。",
    excerpt_en: "Plan a shop renovation timeline before opening, including approval, design confirmation, signage, materials, site works, and handover checks.",
    content_zh:
      "<h2>从开业日倒推时间</h2><p>店铺装修不要只看施工天数，还要把设计确认、管理处或商场审批、招牌制作、材料到货和清洁陈列时间算进去。越接近开业日，变更成本越高。</p><h2>先锁定影响营业的重点</h2><p>门面、收银区、水电点位、灯光、空调、招牌和安全通道会直接影响开业验收。装饰细节可以分阶段优化，但关键工程必须先完成。</p><h2>预留试营业检查</h2><p>正式开业前最好预留几天检查灯具、插座、排水、门锁、招牌和清洁问题。这样开业当天不会被小问题打乱节奏。</p>",
    content_en:
      "<h2>Work backwards from the opening date</h2><p>A shop renovation timeline should include design confirmation, management or mall approval, signage production, material lead time, cleaning, and display setup. Changes become more expensive near opening day.</p><h2>Prioritize business-critical work</h2><p>Shopfront, cashier area, electrical points, lighting, air-conditioning, signage, and safety access affect opening readiness. Decorative items can be phased, but key works must be completed first.</p><h2>Leave time for soft-opening checks</h2><p>Reserve a few days to test lights, sockets, drainage, locks, signage, and cleaning before opening to customers.</p>",
  },
  "renovation-materials-malaysia": {
    excerpt_zh: "整理马来西亚常见装修材料的选择重点，包括耐用度、防潮、预算、维护和适合空间。",
    excerpt_en: "A Malaysia renovation material guide covering durability, moisture resistance, budget, maintenance, and suitable spaces.",
    content_zh:
      "<h2>材料要配合使用环境</h2><p>马来西亚气候潮湿，厨房、浴室和靠窗区域要优先考虑防潮、防水和容易清洁。展示墙、卧室和干区可以更重视质感、颜色和触感。</p><h2>不要只比较单价</h2><p>材料价格还要加上安装方式、收边、损耗、基层处理和后期维护。便宜材料如果安装复杂或维修频繁，长期成本未必更低。</p><h2>先看样板再决定</h2><p>同一种木纹、石纹或哑光表面，在不同灯光下效果会不同。建议把样板放到现场看采光、柜体颜色和墙地面搭配，再确认最终选择。</p>",
    content_en:
      "<h2>Match materials to the environment</h2><p>Malaysia's humid climate makes moisture resistance, waterproofing, and easy cleaning important for kitchens, bathrooms, and window areas. Bedrooms and feature walls can focus more on texture and colour.</p><h2>Do not compare unit price only</h2><p>Installation method, edging, wastage, substrate preparation, and maintenance all affect total cost. A cheaper material may not be cheaper in the long run.</p><h2>Review samples on site</h2><p>Woodgrain, stone patterns, and matte finishes can look different under real lighting. Check samples with wall, cabinet, and floor colours before confirming.</p>",
  },
  "old-house-renovation-checklist": {
    excerpt_zh: "旧屋翻新前应检查水电、防水、屋顶、墙体、地面和隐藏问题，避免开工后预算失控。",
    excerpt_en: "A checklist for old house renovation covering wiring, plumbing, waterproofing, roof, walls, floors, and hidden-condition risks.",
    content_zh:
      "<h2>先检查隐藏工程</h2><p>旧屋翻新最重要的是水管、电线、防水、排水和屋顶状态。表面看起来还能用，不代表墙内和地底没有老化问题。</p><h2>分清必要维修和风格升级</h2><p>预算有限时，先处理安全、漏水、潮湿和结构相关项目，再安排橱柜、墙面、灯光和软装升级。这样比较不容易为了外观牺牲基础工程。</p><h2>开工前确认风险</h2><p>拆除后可能发现空鼓、渗水、白蚁或旧线路问题。报价阶段应先说明哪些属于已包含，哪些需要现场确认后再报价。</p>",
    content_en:
      "<h2>Inspect hidden works first</h2><p>For older houses, wiring, plumbing, waterproofing, drainage, and roof condition are more important than surface appearance. A room may look acceptable while hidden services are aging.</p><h2>Separate repairs from upgrades</h2><p>When budget is limited, handle safety, leaks, dampness, and structural concerns before cabinets, finishes, lighting, and styling upgrades.</p><h2>Confirm site risks early</h2><p>Hacking may reveal hollow tiles, seepage, termites, or old wiring. Quotations should state what is included and what needs confirmation after opening up.</p>",
  },
  "kitchen-cabinet-material-guide": {
    excerpt_zh: "厨房橱柜材料选择要看防潮、门板表面、台面、五金、清洁习惯和预算，不只看颜色。",
    excerpt_en: "Choose kitchen cabinet materials by considering moisture resistance, door finish, countertop, hardware, cleaning habits, and budget.",
    content_zh:
      "<h2>柜体和门板分开看</h2><p>厨房橱柜通常要分别确认柜体板材、门板饰面、台面和五金。柜体重视结构和防潮，门板则影响外观、清洁和耐刮表现。</p><h2>台面要配合使用习惯</h2><p>石英石、岩板和人造石都有不同优点。常煮饭的厨房要重视耐污、耐热和接缝处理；展示型干厨房可以更重视纹理和整体效果。</p><h2>五金影响每天使用</h2><p>抽屉轨道、铰链、拉篮和转角五金会影响顺手程度和寿命。报价时要确认品牌、数量、保修和是否包含安装调试。</p>",
    content_en:
      "<h2>Separate cabinet body and door finish</h2><p>Kitchen cabinets should be reviewed by cabinet body, door finish, countertop, and hardware. The body affects structure and moisture resistance, while the door finish affects appearance and cleaning.</p><h2>Match countertops to usage</h2><p>Quartz, sintered stone, and solid surface each suit different habits. Heavy cooking needs stain resistance, heat tolerance, and good joint detailing.</p><h2>Hardware affects daily use</h2><p>Drawer runners, hinges, pull-out baskets, and corner fittings affect comfort and durability. Confirm brand, quantity, warranty, and adjustment work.</p>",
  },
  "selangor-office-fit-out-tips": {
    excerpt_zh: "雪兰莪办公室装修要先规划座位、会议室、前台、弱电、灯光、消防和未来扩充需求。",
    excerpt_en: "Selangor office fit-out tips covering seating, meeting rooms, reception, data cabling, lighting, safety, and future expansion.",
    content_zh:
      "<h2>先规划团队怎么使用空间</h2><p>办公室装修不只是摆桌椅。要先确认人数、部门关系、会议频率、收纳、访客动线和未来扩充，才能决定隔间和工作位比例。</p><h2>弱电和灯光要提前定</h2><p>网络点、插座、投影、门禁、监控和照明位置一旦施工后再改，会增加成本。设计阶段就把设备和家具尺寸一起对齐。</p><h2>交付前做完整检查</h2><p>办公室交付前应测试插座、网络、空调、门锁、灯具和会议室设备。小问题提前处理，团队搬入后才不会影响办公。</p>",
    content_en:
      "<h2>Plan how the team uses the space</h2><p>An office fit-out is more than placing desks. Confirm headcount, team relationships, meeting frequency, storage, visitor flow, and future expansion before fixing partitions and workstations.</p><h2>Decide cabling and lighting early</h2><p>Data points, sockets, projection, access control, CCTV, and lighting are costly to change after installation. Align equipment and furniture sizes during planning.</p><h2>Check before handover</h2><p>Test sockets, network, air-conditioning, locks, lights, and meeting-room equipment before the team moves in.</p>",
  },
};

const sitePageUpdates = {
  process: {
    content_zh: "每个项目都会从需求沟通、现场测量、范围确认、报价、施工管理到交付检查逐步推进，让业主清楚知道每个阶段要确认什么、什么时候开工、哪些项目会影响预算和工期。",
    content_en:
      "Every project moves through consultation, site measurement, scope confirmation, quotation, project coordination, and handover checks, so owners understand what needs approval, when works can start, and which items affect budget or timeline.",
  },
};

const homeSectionUpdates = {
  stats: {
    content_zh: "这些数据用于帮助客户快速了解 FLASH CAST 的服务基础，包括注册公司资料、服务地区、项目类型和咨询响应方式。",
    content_en:
      "These proof points help customers quickly understand FLASH CAST's registered company background, service areas, project types, and enquiry response process.",
  },
  why_choose_us: {
    content_zh: "我们重视的不只是好看的完工照片，也包括前期规划、材料建议、现场沟通、施工协调和收尾检查，尽量让客户在装修过程中少踩坑。",
    content_en:
      "We focus on more than attractive finished photos: planning, material advice, site communication, work coordination, and handover checks all matter during a renovation.",
  },
};

const aboutSectionUpdates = {
  office: {
    content_zh: "办公室位于 Taman United, Kuala Lumpur，方便吉隆坡与雪兰莪客户沟通装修需求、查看资料并预约项目咨询。",
    content_en:
      "Our office is located in Taman United, Kuala Lumpur, making it convenient for clients from Kuala Lumpur and Selangor to discuss renovation needs and arrange project consultation.",
  },
  core_values: {
    content_zh: "我们坚持清楚沟通、实用规划、可靠执行和负责任收尾，让客户在预算、材料、工期和施工范围上都有更明确的判断。",
    content_en:
      "We value clear communication, practical planning, reliable execution, and responsible handover so clients can make clearer decisions on budget, materials, timeline, and scope.",
  },
  milestones: {
    content_zh: "FLASH CAST 从住宅装修团队逐步发展为覆盖吉隆坡与雪兰莪的一站式设计施工公司，服务范围也扩展到商业空间、定制家具和工业配套工程。",
    content_en:
      "FLASH CAST grew from a residential renovation team into a design-and-build company serving Kuala Lumpur and Selangor, with work now covering commercial spaces, custom built-ins, and selected industrial support works.",
  },
  stats: {
    content_zh: "公司数据用于概览 FLASH CAST 的服务经验、服务范围和项目执行能力，帮助客户在咨询前快速建立基本判断。",
    content_en:
      "This company snapshot summarises FLASH CAST's service experience, coverage, and project delivery capability, helping clients form a quick overview before enquiry.",
  },
  team: {
    content_zh: "团队由设计、项目管理、木工和专业施工人员协作组成，负责从前期沟通、材料建议到现场协调和交付检查的不同环节。",
    content_en:
      "Our team combines design, project management, carpentry, and specialist trades, supporting clients from early discussion and material advice to site coordination and handover checks.",
  },
};

function materialAppend(row) {
  const text = `${row.title_zh || ""} ${row.category || ""} ${row.subcategory || ""}`.toLowerCase();
  if (/tile|瓷砖|砖/.test(text)) return "施工时建议一起确认防滑度、填缝颜色、收边方式和现场采光，避免完工后色差或清洁压力太大。";
  if (/floor|spc|vinyl|laminate|地板/.test(text)) return "下单前应检查地面平整度、门缝高度和踢脚线做法，才能保证铺设后走动稳定、收口自然。";
  if (/cabinet|melamine|acrylic|wood|柜|板|木/.test(text)) return "适合搭配现场尺寸定制，报价前需要确认板材厚度、封边、五金等级和日常清洁习惯。";
  if (/stone|quartz|surface|台面|石|岩板/.test(text)) return "台面类材料建议同步确认开孔、接缝、挡水边和承重方式，厨房或商业柜台使用会更安心。";
  if (/door|window|aluminium|门|窗/.test(text)) return "安装前要确认洞口尺寸、轨道位置、开关方向和五金配置，确保日常使用顺畅。";
  return "选择前建议结合预算、现场尺寸、采光、维护方式和整体风格一起判断，避免只凭单张图片决定。";
}

function materialAppendEn(row) {
  const text = `${row.title_en || ""} ${row.category || ""} ${row.subcategory || ""}`.toLowerCase();
  if (/tile/.test(text)) return "Confirm slip resistance, grout colour, edging, and lighting before installation so the final surface is easier to maintain.";
  if (/floor|spc|vinyl|laminate/.test(text)) return "Check floor level, door clearance, skirting, and transition details before ordering or installation.";
  if (/cabinet|melamine|acrylic|wood/.test(text)) return "Confirm board thickness, edging, hardware grade, and cleaning habits before finalising the quotation.";
  if (/stone|quartz|surface|counter/.test(text)) return "Confirm cut-outs, joints, backsplash, and support details for kitchen or commercial counter use.";
  if (/door|window|aluminium/.test(text)) return "Confirm opening size, track position, swing direction, and hardware before installation.";
  return "Review budget, dimensions, lighting, maintenance, and the overall design direction before final selection.";
}

const backupTables = ["site_settings", "services", "landing_pages", "service_areas", "blog_posts", "materials", "site_pages", "home_sections", "about_sections", "brand_partners"];
const backup = {};
for (const table of backupTables) backup[table] = await rest(table);
const backupPath = path.join(reportDir, `content-reasonableness-fix-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

const summary = {
  backupPath,
  siteSettingsUpdates: 0,
  serviceUpdates: 0,
  landingUpdates: 0,
  serviceAreaUpdates: 0,
  blogUpdates: 0,
  materialUpdates: 0,
  sitePageUpdates: 0,
  homeSectionUpdates: 0,
  aboutSectionUpdates: 0,
  brandPartnerUpdates: 0,
};

for (const row of backup.site_settings) {
  const body = {};
  if (row.logo_url !== "/logo-flashcast.png") body.logo_url = "/logo-flashcast.png";
  if (Object.keys(body).length) {
    await patchById("site_settings", row.id, body);
    summary.siteSettingsUpdates += 1;
  }
}

for (const row of brandPartnerUpdates) {
  await upsertBrandPartner(row);
  summary.brandPartnerUpdates += 1;
}

for (const row of backup.services) {
  const body = serviceSeo[row.slug];
  if (body) {
    await patchById("services", row.id, body);
    summary.serviceUpdates += 1;
  }
}

for (const row of backup.landing_pages) {
  const body = landingUpdates[row.slug];
  if (body) {
    await patchById("landing_pages", row.id, body);
    summary.landingUpdates += 1;
  }
}

for (const row of backup.service_areas) {
  const area = row.area_name || row.title_en?.replace(/\s+Renovation Company.*$/i, "") || row.title_zh?.replace(/\s*装修公司$/, "") || "Klang Valley";
  const projects = [
    { title: `${area} Residential Renovation Reference`, type: "Residential Renovation", image: versionedProjectImage("/images/projects/residential-renovation.webp") },
    { title: `${area} Commercial Fit-Out Reference`, type: "Commercial Fit-Out", image: versionedProjectImage("/images/projects/commercial-renovation.webp") },
  ];
  await patchById("service_areas", row.id, { projects });
  summary.serviceAreaUpdates += 1;
}

for (const row of backup.blog_posts) {
  const body = { ...(blogUpdates[row.slug] || {}) };
  if (row.slug === "spc-vinyl-vs-laminate-flooring" && typeof row.content_en === "string") {
    body.content_en = row.content_en
      .replace(/RM 4-8 per sqft \(material only\)\./g, "RM 4-8 per sqft before installation.")
      .replace(/RM 3-7 per sqft \(material only\)\./g, "RM 3-7 per sqft before installation.");
  }
  if (Object.keys(body).length) {
    await patchById("blog_posts", row.id, body);
    summary.blogUpdates += 1;
  }
}

for (const row of backup.materials) {
  const body = {};
  if (typeof row.content_zh === "string" && row.content_zh.trim().length < 70) {
    body.content_zh = `${row.content_zh.trim()}${row.content_zh.trim().endsWith("。") ? "" : "。"}${materialAppend(row)}`;
  }
  if (typeof row.content_en === "string" && row.content_en.trim().length < 95) {
    body.content_en = `${row.content_en.trim()}${/[.!?]$/.test(row.content_en.trim()) ? "" : "."} ${materialAppendEn(row)}`;
  }
  if (Object.keys(body).length) {
    await patchById("materials", row.id, body);
    summary.materialUpdates += 1;
  }
}

for (const row of backup.site_pages) {
  const body = sitePageUpdates[row.page_key];
  if (body) {
    await patchById("site_pages", row.id, body);
    summary.sitePageUpdates += 1;
  }
}

for (const row of backup.home_sections) {
  const body = homeSectionUpdates[row.section_key];
  if (body) {
    await patchById("home_sections", row.id, body);
    summary.homeSectionUpdates += 1;
  }
}

for (const row of backup.about_sections) {
  const body = aboutSectionUpdates[row.section_key];
  if (body) {
    await patchById("about_sections", row.id, body);
    summary.aboutSectionUpdates += 1;
  }
}

console.log(JSON.stringify(summary, null, 2));
