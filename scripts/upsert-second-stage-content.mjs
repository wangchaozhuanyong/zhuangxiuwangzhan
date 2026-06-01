import { readFileSync, existsSync } from "node:fs";
import { applyHumanizedBlogContent } from "./humanized-blog-content.mjs";

const loadEnv = () => {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
};

loadEnv();

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
const img = (path) => `${site}${path}`;
const html = (paragraphs) => paragraphs.map((item) => `<p>${item}</p>`).join("");
const faq = (items) => items.map(([q, a]) => ({ q, a }));
const dateAt = (day, hour = 0) => new Date(Date.UTC(2026, 4, day, hour, 0, 0)).toISOString();

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

const projectRows = [
  {
    slug: "ampang-terrace-house-refurbishment",
    zh: "Ampang 排屋旧屋翻新",
    en: "Ampang Terrace House Refurbishment",
    location: "Ampang, Selangor",
    area: "1,800 sq ft",
    duration: "11 weeks",
    budget: "RM110,000 - RM190,000",
    type: "Residential",
    files: ["proj1-condo-1.jpg", "proj1-condo-2.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
  {
    slug: "shah-alam-semi-d-kitchen-renovation",
    zh: "Shah Alam 半独立式厨房翻新",
    en: "Shah Alam Semi-D Kitchen Renovation",
    location: "Shah Alam, Selangor",
    area: "420 sq ft",
    duration: "6 weeks",
    budget: "RM55,000 - RM98,000",
    type: "Kitchen",
    files: ["proj3-kitchen-1.jpg", "proj3-kitchen-2.jpg"],
    beforeAfter: ["before-kitchen.jpg", "after-kitchen.jpg"],
  },
  {
    slug: "kepong-condo-built-in-storage",
    zh: "Kepong 公寓内嵌收纳定制",
    en: "Kepong Condo Built-In Storage",
    location: "Kepong, Kuala Lumpur",
    area: "780 sq ft",
    duration: "5 weeks",
    budget: "RM42,000 - RM76,000",
    type: "Built-In",
    files: ["proj6-bedroom-1.jpg", "proj6-bedroom-2.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
  {
    slug: "damansara-retail-fit-out",
    zh: "Damansara 零售店 Fit-Out",
    en: "Damansara Retail Fit-Out",
    location: "Damansara, Selangor",
    area: "950 sq ft",
    duration: "7 weeks",
    budget: "RM82,000 - RM150,000",
    type: "Retail",
    files: ["proj5-shopfront-1.jpg", "proj5-shopfront-2.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
  {
    slug: "cyberjaya-office-renovation",
    zh: "Cyberjaya 科技办公室装修",
    en: "Cyberjaya Tech Office Renovation",
    location: "Cyberjaya, Selangor",
    area: "3,600 sq ft",
    duration: "9 weeks",
    budget: "RM160,000 - RM300,000",
    type: "Office",
    files: ["proj2-office-1.jpg", "proj2-office-2.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
  {
    slug: "klang-bathroom-waterproofing",
    zh: "Klang 浴室防水与瓷砖翻新",
    en: "Klang Bathroom Waterproofing and Tile Renewal",
    location: "Klang, Selangor",
    area: "180 sq ft",
    duration: "3 weeks",
    budget: "RM18,000 - RM38,000",
    type: "Bathroom",
    files: ["proj1-condo-1.jpg", "proj3-kitchen-2.jpg"],
    beforeAfter: ["before-bathroom.jpg", "after-bathroom.jpg"],
  },
  {
    slug: "sri-petaling-shoplot-renovation",
    zh: "Sri Petaling 店铺装修与招牌门面",
    en: "Sri Petaling Shoplot Renovation and Facade",
    location: "Sri Petaling, Kuala Lumpur",
    area: "1,400 sq ft",
    duration: "8 weeks",
    budget: "RM95,000 - RM180,000",
    type: "Retail",
    files: ["proj5-shopfront-1.jpg", "proj7-restaurant-1.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
  {
    slug: "kajang-landed-home-renovation",
    zh: "Kajang 有地住宅全屋装修",
    en: "Kajang Landed Home Full Renovation",
    location: "Kajang, Selangor",
    area: "2,200 sq ft",
    duration: "12 weeks",
    budget: "RM150,000 - RM260,000",
    type: "Residential",
    files: ["proj1-condo-2.jpg", "proj8-homeoffice-1.jpg"],
    beforeAfter: ["before-living.jpg", "after-living.jpg"],
  },
];

const projects = projectRows.map((project, index) => ({
  slug: project.slug,
  title_zh: project.zh,
  title_en: project.en,
  excerpt_zh: `${project.location} ${project.type} 装修案例，重点处理预算控制、材料耐用度、施工排期和收尾品质。`,
  excerpt_en: `${project.type} renovation case in ${project.location}, focused on budget control, durable materials, scheduling, and finishing quality.`,
  content_zh: html([
    `${project.zh} 位于 ${project.location}，面积约 ${project.area}，适合正在比较马来西亚装修预算、材料规格和施工流程的业主参考。`,
    "项目重点包括现场尺寸确认、旧有问题检查、材料搭配、施工顺序和交付前细节检查。FLASH CAST 会按空间用途整理必要工程与可选升级，帮助业主更清楚地控制预算。",
    "这类项目通常需要提前确认管理处审批、搬运路线、施工时间、湿作业保护和水电点位，避免开工后才出现追加项目。",
  ]),
  content_en: html([
    `${project.en} is located in ${project.location}, around ${project.area}. It is useful for owners comparing renovation budget, material specifications, and construction workflow in Malaysia.`,
    "Key work areas include site measurement, existing-condition checks, material coordination, construction sequencing, and pre-handover detailing. FLASH CAST separates essential works from optional upgrades so owners can control budget more clearly.",
    "Projects like this should confirm management approval, delivery route, working hours, wet-work protection, and electrical or plumbing points before work starts.",
  ]),
  location: project.location,
  area: project.area,
  duration: project.duration,
  budget: project.budget,
  project_type: project.type,
  materials: ["Moisture-resistant board", "Quartz / porcelain finishes", "SPC / tile flooring", "LED lighting", "Soft-close hardware"],
  scope: ["Site measurement", "Existing-condition inspection", "Material coordination", "Wet works", "Carpentry", "Electrical points", "Final inspection"],
  highlights_zh: ["预算分项清楚", "管理处审批提前规划", "材料按马来西亚气候选择", "before / after 视觉对比明确"],
  highlights_en: ["Clear itemized budget", "Management approval planned early", "Materials selected for Malaysia climate", "Clear before / after comparison"],
  client_need_zh: "业主希望在预算范围内提升功能、收纳和视觉质感，同时减少工期延误与后期追加费用。",
  client_need_en: "The client wanted better function, storage, and finishing quality within budget while reducing delay and unexpected additions.",
  seo_title_zh: `${project.zh} | ${project.location} 装修案例`,
  seo_title_en: `${project.en} | ${project.location} Renovation Case`,
  seo_description_zh: `${project.location} 装修案例，包含面积、工期、预算、材料、施工范围、before after 和项目亮点。`,
  seo_description_en: `${project.location} renovation case with area, duration, budget, materials, scope, before after, and project highlights.`,
  status: "published",
  sort_order: 100 + (index + 1) * 10,
}));

const materialRows = [
  ["engineered-walnut-herringbone", "胡桃木人字拼工程木地板", "Walnut Herringbone Engineered Wood Flooring", "Flooring", "Engineered Wood", "Engineered Wood", "engineered-walnut-herringbone.jpg", "RM18 - RM45 / sq ft"],
  ["laminate-grey-stone", "灰石纹防火板饰面", "Grey Stone Laminate Finish", "Kitchen Cabinet", "Laminate Finish", "Laminate", "laminate-grey-stone.jpg", "From RM220 / ft run"],
  ["timber-cladding-oak", "橡木木饰面墙板", "Oak Timber Wall Cladding", "Wall Panel", "Timber Cladding", "Timber", "timber-cladding-oak.jpg", "From RM25 / sq ft"],
  ["art-microcement", "Microcement 微水泥艺术墙面", "Microcement Feature Finish", "Art Paint", "Microcement", "Microcement", "art-microcement.jpg", "From RM18 / sq ft"],
  ["art-venetian-plaster", "Venetian Plaster 威尼斯灰泥", "Venetian Plaster Finish", "Art Paint", "Venetian Plaster", "Plaster", "art-venetian-plaster.jpg", "From RM20 / sq ft"],
  ["art-metallic-paint", "金属质感艺术涂料", "Metallic Feature Paint", "Art Paint", "Metallic Paint", "Paint", "art-metallic-paint.jpg", "From RM15 / sq ft"],
  ["solid-wood-teak", "柚木实木饰面", "Teak Solid Wood Finish", "Furniture", "Timber Finish", "Solid Wood", "solid-wood-teak.jpg", "Quote by specification"],
  ["laminate-door-white-oak", "白橡木房门饰面", "White Oak Laminate Door", "Doors & Windows", "Laminate Door", "Laminate", "laminate-door-white-oak.jpg", "Quote by size"],
  ["barn-door-dark-wood", "深色木纹谷仓门", "Dark Wood Barn Door", "Doors & Windows", "Barn Door", "Timber Door", "barn-door-dark-wood.jpg", "Quote by size"],
  ["kitchen-solid-wood-cabinets", "实木风厨房橱柜", "Solid Wood Style Kitchen Cabinets", "Kitchen Cabinet", "Cabinet System", "Cabinet", "kitchen-solid-wood-cabinets.jpg", "From RM450 / ft run"],
];

const materials = materialRows.map(([slug, zh, en, category, subcategory, type, file, price], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${zh} 适合需要兼顾质感、耐用度和维护便利的马来西亚装修项目。`,
  excerpt_en: `${en} suits Malaysia renovation projects that need a balance of appearance, durability, and easy maintenance.`,
  content_zh: html([
    `${zh} 常用于住宅和商业空间，可用于提升视觉质感、收口细节和整体空间层次。`,
    "选择材料时建议同时比较耐潮性、抗刮性、清洁方式、颜色稳定度、安装基层和后期维护。FLASH CAST 会根据预算、空间用途和现场条件建议合适规格。",
  ]),
  content_en: html([
    `${en} is commonly used in residential and commercial spaces to improve appearance, finishing detail, and visual layering.`,
    "When selecting materials, compare moisture resistance, scratch resistance, cleaning method, colour stability, base condition, and long-term maintenance. FLASH CAST recommends specifications based on budget, usage, and site condition.",
  ]),
  category,
  subcategory,
  material_type: type,
  suitable_spaces_zh: ["住宅", "公寓", "办公室", "店铺", "展示区"],
  suitable_spaces_en: ["Home", "Condo", "Office", "Retail shop", "Display area"],
  pros_zh: ["视觉效果好", "适合多种设计风格", "可按预算选择不同规格"],
  pros_en: ["Strong visual effect", "Works with multiple design styles", "Specifications can match different budgets"],
  cons_zh: ["需要正确基层和安装方式", "高端规格预算较高"],
  cons_en: ["Requires proper base and installation", "Premium specifications cost more"],
  reference_price: price,
  image_url: img(`/images/materials/${file}`),
  alt_zh: `${zh} 装修材料样板`,
  alt_en: `${en} renovation material sample`,
  seo_title_zh: `${zh} | 马来西亚装修材料库`,
  seo_title_en: `${en} | Malaysia Renovation Material Library`,
  seo_description_zh: `${zh} 的适用空间、优缺点、参考价格、施工注意事项和相关装修建议。`,
  seo_description_en: `${en} suitable spaces, pros, cons, reference pricing, installation notes, and renovation advice.`,
  status: "published",
  sort_order: 200 + (index + 1) * 10,
}));

const areaDetails = [
  ["kuala-lumpur", "Kuala Lumpur", "公寓、办公室、商业店铺和旧屋翻新需求集中，常见重点是管理处审批、施工时间、停车搬运和材料进场安排。", "condo renovation, office fit-out, shop renovation, kitchen cabinet"],
  ["selangor", "Selangor", "覆盖住宅、工厂、仓库、办公室和有地住宅，项目通常需要更清楚的现场测量、预算分项和施工范围确认。", "home renovation, landed house renovation, warehouse racking, office renovation"],
  ["petaling-jaya", "Petaling Jaya", "老社区和商业区并存，常见需求包括旧屋翻新、厨房橱柜、浴室防水、办公室装修和店铺改造。", "old house renovation, bathroom waterproofing, kitchen renovation, office renovation"],
  ["subang-jaya", "Subang Jaya", "住宅与商业空间密集，适合重点布局厨房翻新、定制柜、办公室隔间和店铺装修页面。", "kitchen cabinet, built-in furniture, shop renovation, office partition"],
  ["puchong", "Puchong", "有地住宅、仓库和商业单位较多，常见需求是全屋翻新、仓储货架、办公室区和外墙门面处理。", "landed renovation, warehouse shelving, commercial renovation, exterior works"],
  ["cheras", "Cheras", "公寓、排屋和店铺类型多，适合覆盖浴室防水、厨房翻新、旧屋维修和店铺开业装修。", "condo renovation, bathroom waterproofing, kitchen renovation, retail fit-out"],
  ["mont-kiara", "Mont Kiara", "高端公寓项目重视管理处审批、保护工程、收纳设计、材料质感和交付细节。", "luxury condo renovation, custom built-in, kitchen cabinet, interior fit-out"],
  ["bangsar", "Bangsar", "老洋房、排屋和商业空间常见，适合强调旧屋翻新、木作定制、餐饮店装修和设计施工。", "old house refurbishment, built-in furniture, restaurant fit-out, design and build"],
  ["shah-alam", "Shah Alam", "半独立式、排屋、办公室和工业单位需求稳定，重点是预算规划、湿作业、柜体和实用空间升级。", "semi-d renovation, office renovation, industrial renovation, kitchen cabinet"],
  ["klang", "Klang", "有地住宅和商业单位较多，常见需求包括浴室防水、旧屋翻新、地板更换和仓储空间整理。", "landed house renovation, bathroom waterproofing, flooring, warehouse works"],
  ["damansara", "Damansara", "商业零售和住宅项目并重，适合强调零售 Fit-Out、办公室装修、定制柜和材料搭配。", "retail fit-out, office renovation, custom cabinet, material selection"],
  ["ampang", "Ampang", "排屋、公寓和旧屋翻新需求明显，常见重点是水电更新、防水、地板和厨房浴室升级。", "terrace house renovation, old house renovation, wiring, waterproofing"],
  ["kepong", "Kepong", "公寓与排屋翻新常见，适合覆盖收纳定制、厨房橱柜、地板和局部翻新服务。", "condo renovation, custom storage, kitchen cabinet, flooring"],
  ["sri-petaling", "Sri Petaling", "店铺、餐饮和住宅项目集中，适合布局开业装修、招牌门面、厨房和商业空间 Fit-Out。", "shop renovation, restaurant fit-out, signage, commercial renovation"],
  ["setapak", "Setapak", "公寓项目较多，常见需求包括出租单位翻新、厨房橱柜、浴室维修和基础装修。", "condo renovation, rental unit renovation, kitchen cabinet, bathroom repair"],
  ["kajang", "Kajang", "有地住宅和新屋装修需求稳定，常见重点是全屋翻新、湿厨房、收纳和预算分阶段安排。", "landed home renovation, wet kitchen, built-in furniture, budget planning"],
  ["cyberjaya", "Cyberjaya", "办公室、公寓和商业空间较多，适合强调办公室 Fit-Out、会议室、网络电位和现代材料。", "office fit-out, meeting room renovation, condo renovation, data cabling"],
  ["putrajaya", "Putrajaya", "住宅和办公室项目重视整洁交付、审批流程、材料耐用度和长期维护。", "home renovation, office renovation, management approval, durable materials"],
];

const areas = areaDetails.map(([slug, name, localNote, keywords], index) => ({
  slug,
  area_name: name,
  title_zh: `${name} 装修公司`,
  title_en: `${name} Renovation Contractor`,
  excerpt_zh: `FLASH CAST 提供 ${name} 住宅装修、旧屋翻新、厨房浴室、办公室、店铺和定制柜服务。`,
  excerpt_en: `FLASH CAST provides ${name} home renovation, old house refurbishment, kitchen, bathroom, office, shop, and custom cabinet services.`,
  content_zh: html([
    `${name} 装修项目需要同时考虑房屋类型、管理处规定、施工时段、材料进场、预算分项和售后责任。${localNote}`,
    "FLASH CAST 会先了解地区、面积、项目类型、预算和照片，再根据现场条件整理可执行的施工范围。业主可以通过 WhatsApp 或免费报价表单先提交资料，我们会协助判断下一步是否需要现场测量。",
    `如果你正在寻找 ${name} renovation contractor、装修公司、厨房橱柜、浴室防水、办公室装修或店铺装修服务，这个页面会持续整理本地区案例、FAQ 和材料建议。`,
  ]),
  content_en: html([
    `${name} renovation projects should consider property type, management rules, working hours, material delivery, itemized budget, and after-sales responsibility. ${localNote}`,
    "FLASH CAST first reviews location, area, project type, budget, and photos, then prepares a practical scope based on site condition. Owners can submit details by WhatsApp or the free quote form before arranging site measurement.",
    `This page supports searches for ${name} renovation contractor, home renovation, kitchen cabinet, bathroom waterproofing, office renovation, and shop renovation services.`,
  ]),
  property_types: ["Condo", "Terrace house", "Semi-D", "Office", "Retail shop", "Warehouse"],
  common_needs: ["Full renovation", "Kitchen cabinet", "Bathroom waterproofing", "Built-in furniture", "Office fit-out", "Shop renovation"],
  construction_notes_zh: `${name} 项目建议提前确认管理处申请、施工时间、材料运输、保护工程、停车安排和噪音限制。`,
  construction_notes_en: `${name} projects should confirm management application, working hours, material delivery, protection works, parking, and noise limits early.`,
  projects: [],
  faqs_zh: faq([
    [`${name} 可以免费上门测量吗？`, "可根据项目类型、时间和地点安排。你可以先发送照片、面积、预算和需求，我们会判断是否需要现场测量。"],
    [`${name} 装修报价通常多久可以出？`, "局部项目通常 3-5 个工作日，全屋或商业空间通常 5-10 个工作日，取决于现场复杂度和材料选择。"],
    ["可以帮忙处理管理处装修申请吗？", "可以。公寓、办公室和商场项目通常需要申请表、施工资料、工人名单和押金，我们会协助整理所需资料。"],
  ]),
  faqs_en: faq([
    [`Can you provide free site measurement in ${name}?`, "It depends on project type, schedule, and location. Send photos, size, budget, and requirements first so we can advise if a site visit is needed."],
    [`How long does a ${name} renovation quotation take?`, "Small projects usually take 3-5 working days. Full renovation or commercial spaces usually take 5-10 working days depending on site complexity and materials."],
    ["Can you help with management renovation applications?", "Yes. Condo, office, and mall projects often need application forms, work documents, worker lists, and deposits. We help prepare the required details."],
  ]),
  seo_title_zh: `${name} 装修公司 | 住宅、旧屋、厨房、办公室与店铺装修`,
  seo_title_en: `${name} Renovation Contractor | Home, Office, Kitchen & Shop`,
  seo_description_zh: `FLASH CAST 提供 ${name} 装修服务，覆盖住宅装修、旧屋翻新、厨房橱柜、浴室防水、办公室、店铺、定制柜和免费报价。`,
  seo_description_en: `FLASH CAST provides ${name} renovation services for homes, old houses, kitchen cabinets, bathroom waterproofing, offices, shops, custom cabinets, and free quotation.`,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const blogPosts = [
  {
    slug: "klang-valley-renovation-cost-2026",
    zh: "Klang Valley 装修费用 2026：预算怎么拆分？",
    en: "Klang Valley Renovation Cost 2026: How to Break Down Your Budget",
    category: "Budget",
    tags: ["renovation cost", "Klang Valley", "budget"],
    cover: "/images/heroes/hero-projects.jpg",
    content_zh: `<h2>先拆范围，再谈总价</h2><p>装修预算不能只看总价。建议先拆成拆除、湿作业、水电、木作、油漆、地板、洁具、灯具和软装，再判断哪些是必要工程，哪些是可选升级。</p><h2>马来西亚项目常见变量</h2><p>管理处审批、搬运路线、电梯保护、隐藏漏水、旧电线、墙地砖空鼓和材料交期都会影响预算。旧屋和商业空间通常需要预留更高缓冲。</p><h2>怎么降低追加风险？</h2><p>开工前准备平面图、照片、面积、预算和风格参考，让装修团队按现场条件做明细报价。FLASH CAST 可协助吉隆坡与雪兰莪业主先做预算方向判断。</p>`,
    content_en: `<h2>Break down the scope before comparing totals</h2><p>A renovation budget should not be judged only by the final number. Split it into hacking, wet works, electrical, plumbing, carpentry, painting, flooring, fittings, lighting, and loose furniture.</p><h2>Common cost variables in Malaysia</h2><p>Management approval, delivery route, lift protection, hidden leakage, old wiring, hollow tiles, and material lead time can affect the final budget. Old houses and commercial spaces usually need a larger buffer.</p><h2>How to reduce variation risk</h2><p>Prepare layout plans, photos, size, budget, and reference style before requesting a quote. FLASH CAST can help owners in KL and Selangor estimate the right budget direction.</p>`,
  },
  {
    slug: "condo-renovation-management-approval-malaysia",
    zh: "马来西亚公寓装修管理处申请要准备什么？",
    en: "Malaysia Condo Renovation Management Approval Checklist",
    category: "Condo",
    tags: ["condo renovation", "management approval", "KL"],
    cover: "/images/heroes/hero-process.jpg",
    content_zh: `<h2>为什么要先处理管理处申请？</h2><p>公寓装修通常受施工时间、噪音、搬运、电梯保护、押金和工人登记限制。若申请资料不完整，容易影响开工日期。</p><h2>常见资料</h2><p>业主资料、装修申请表、承包商资料、工人名单、施工范围、平面图、保险或押金要求，以及施工时间表。</p><h2>FLASH CAST 的做法</h2><p>我们会先确认管理处要求，再安排施工顺序和材料进场，减少因为审批、搬运或保护工程造成的延误。</p>`,
    content_en: `<h2>Why approval should be handled early</h2><p>Condo renovation is usually controlled by working hours, noise rules, delivery access, lift protection, deposits, and worker registration. Incomplete documents can delay the start date.</p><h2>Common documents</h2><p>Owner details, renovation application form, contractor details, worker list, scope of work, layout drawings, insurance or deposit requirements, and a work schedule.</p><h2>How FLASH CAST handles it</h2><p>We check management requirements first, then plan work sequence and material delivery to reduce delays from approval, access, or protection works.</p>`,
  },
  {
    slug: "kitchen-cabinet-price-malaysia",
    zh: "马来西亚厨房橱柜价格为什么差很多？",
    en: "Why Kitchen Cabinet Prices Vary in Malaysia",
    category: "Kitchen",
    tags: ["kitchen cabinet", "cabinet price", "materials"],
    cover: "/images/services/kitchen-renovation.jpg",
    content_zh: `<h2>价格不只看长度</h2><p>橱柜报价通常和柜体板材、门板饰面、台面、五金、抽屉、拉篮、灯带、收口和现场限制有关。只比较每尺价格很容易漏掉规格差异。</p><h2>重点看哪些规格？</h2><p>柜体防潮等级、门板材质、台面厚度、铰链滑轨品牌、水槽和炉具位置、电器尺寸，以及是否包含拆除和水电调整。</p><h2>建议做法</h2><p>先确认厨房平面、干湿区、使用习惯和预算。FLASH CAST 可按现场量尺后提供分项报价和材料建议。</p>`,
    content_en: `<h2>Price is not only about length</h2><p>Cabinet pricing depends on board material, door finish, countertop, hardware, drawers, baskets, lighting, finishing details, and site restrictions. Comparing only per-foot price often misses specification differences.</p><h2>Specifications to check</h2><p>Moisture resistance, door material, countertop thickness, hinge and runner brand, sink and hob position, appliance sizes, and whether hacking or M&E adjustment is included.</p><h2>Recommended approach</h2><p>Confirm kitchen layout, dry and wet zones, usage habits, and budget first. FLASH CAST provides itemized pricing and material advice after site measurement.</p>`,
  },
  {
    slug: "bathroom-leakage-renovation-malaysia",
    zh: "浴室漏水翻新：什么时候需要重做防水？",
    en: "Bathroom Leakage Renovation: When Should Waterproofing Be Redone?",
    category: "Bathroom",
    tags: ["bathroom waterproofing", "leakage", "tile works"],
    cover: "/images/before-after/after-bathroom.jpg",
    content_zh: `<h2>先判断漏水来源</h2><p>浴室漏水可能来自防水层、排水口、墙地砖空鼓、水管、门槛或楼下天花。未判断来源就局部修补，容易反复发生。</p><h2>哪些情况建议重做？</h2><p>大面积拆砖、长期渗水、空鼓明显、排水坡度错误、旧防水层失效，通常建议完整重做防水和闭水测试。</p><h2>施工重点</h2><p>拆除、找坡、防水、闭水测试、铺砖、收口和洁具安装都要按顺序处理。FLASH CAST 会在报价前检查现场状态。</p>`,
    content_en: `<h2>Identify the leakage source first</h2><p>Bathroom leakage may come from waterproofing, floor traps, hollow tiles, pipes, thresholds, or the ceiling below. Patch repairs can fail if the source is not identified.</p><h2>When full waterproofing is recommended</h2><p>Major tile hacking, long-term seepage, obvious hollow tiles, wrong drainage slope, or failed old waterproofing usually require a full waterproofing renewal and ponding test.</p><h2>Key work sequence</h2><p>Hacking, screeding slope, waterproofing, ponding test, tiling, finishing, and fitting installation should be handled in order. FLASH CAST checks site condition before quoting.</p>`,
  },
  {
    slug: "office-fit-out-checklist-selangor",
    zh: "Selangor 办公室装修 Fit-Out 清单",
    en: "Selangor Office Fit-Out Checklist",
    category: "Office",
    tags: ["office renovation", "fit-out", "Selangor"],
    cover: "/images/services/office-renovation.jpg",
    content_zh: `<h2>先确认团队工作方式</h2><p>办公室装修不是只摆桌椅。需要确认部门关系、接待区、会议室、储物、打印区、茶水间、网络、电源和未来扩充。</p><h2>大楼限制很重要</h2><p>施工时间、消防、冷气、公共区域保护、电梯搬运和噪音限制会影响排期。商业项目也要考虑开工前审批。</p><h2>交付前检查</h2><p>检查电位、网络点、灯光、门锁、隔间、收口、空调风口和清洁。FLASH CAST 可协助安排分阶段施工，减少对营业影响。</p>`,
    content_en: `<h2>Start with how the team works</h2><p>Office renovation is not only about desks. Confirm department flow, reception, meeting rooms, storage, printing, pantry, network, power points, and future expansion.</p><h2>Building rules matter</h2><p>Working hours, fire safety, air-conditioning, common-area protection, lift access, and noise limits affect scheduling. Commercial projects also need approval before work starts.</p><h2>Pre-handover checks</h2><p>Check power points, network points, lighting, locks, partitions, finishing, air-conditioning outlets, and cleaning. FLASH CAST can plan phased work to reduce business disruption.</p>`,
  },
  {
    slug: "shop-renovation-opening-timeline-malaysia",
    zh: "店铺装修赶开业日期，时间表怎么倒排？",
    en: "How to Reverse-Plan a Shop Renovation Timeline Before Opening",
    category: "Retail",
    tags: ["shop renovation", "opening timeline", "retail fit-out"],
    cover: "/images/services/shoplot-renovation.jpg",
    content_zh: `<h2>从开业日往前排</h2><p>店铺装修要把审批、设计确认、材料订购、拆除、水电、木作、招牌、灯光、清洁和试营业全部算进去。</p><h2>哪些项目最容易卡？</h2><p>商场审批、招牌申请、定制柜制作、特殊材料交期、消防或冷气限制，都会影响开业日期。</p><h2>建议预留缓冲</h2><p>如果有固定开业日，建议尽早锁定设计和材料。FLASH CAST 会按关键路径排施工，优先处理会影响后续工序的项目。</p>`,
    content_en: `<h2>Plan backward from opening day</h2><p>Shop renovation should include approval, design confirmation, material ordering, hacking, M&E, carpentry, signage, lighting, cleaning, and soft opening.</p><h2>Common bottlenecks</h2><p>Mall approval, signage application, custom cabinet fabrication, special material lead time, fire safety, and air-conditioning restrictions can affect opening date.</p><h2>Keep a buffer</h2><p>If the opening date is fixed, confirm design and materials early. FLASH CAST schedules by critical path and prioritizes work that affects later trades.</p>`,
  },
  {
    slug: "old-house-renovation-hidden-costs-malaysia",
    zh: "旧屋翻新隐藏费用：开工前要检查什么？",
    en: "Old House Renovation Hidden Costs in Malaysia",
    category: "Old House",
    tags: ["old house renovation", "hidden cost", "inspection"],
    cover: "/images/services/old-house-renovation.jpg",
    content_zh: `<h2>旧屋最怕隐藏问题</h2><p>旧屋翻新常见隐藏问题包括漏水、白蚁、旧电线、旧水管、墙体裂缝、瓷砖空鼓、屋顶渗水和排水坡度不足。</p><h2>开工前检查清单</h2><p>检查配电箱、插座、水压、排水、天花、屋顶、墙面、地砖、门窗和湿区。必要时先做维修范围，再做美观升级。</p><h2>预算怎么安排？</h2><p>旧屋建议预留 10-20% 缓冲。FLASH CAST 会帮助业主区分安全维修、功能改善和视觉升级。</p>`,
    content_en: `<h2>Hidden issues are the biggest risk</h2><p>Old house renovation may reveal leakage, termites, old wiring, old pipes, wall cracks, hollow tiles, roof seepage, and poor drainage slope.</p><h2>Pre-work inspection checklist</h2><p>Check distribution board, sockets, water pressure, drainage, ceiling, roof, walls, floor tiles, doors, windows, and wet areas. Repair scope should be clarified before visual upgrades.</p><h2>How to budget</h2><p>Old houses should keep a 10-20% buffer. FLASH CAST helps owners separate safety repairs, functional improvements, and visual upgrades.</p>`,
  },
  {
    slug: "renovation-materials-for-malaysia-climate",
    zh: "马来西亚潮湿气候适合哪些装修材料？",
    en: "Renovation Materials Suitable for Malaysia's Humid Climate",
    category: "Materials",
    tags: ["materials", "humid climate", "Malaysia"],
    cover: "/images/heroes/hero-materials.jpg",
    content_zh: `<h2>材料要看气候和空间用途</h2><p>马来西亚气候潮湿，厨房、浴室、阳台和底楼空间更需要考虑防潮、防霉、耐刮和清洁便利。</p><h2>常见选择</h2><p>SPC 地板、防滑瓷砖、石英石台面、防潮柜体板、铝合金门窗、玻璃隔断和适合湿区的墙面材料都很常见。</p><h2>不要只看颜色</h2><p>材料选择要同时看基层、安装方式、维护习惯和预算。FLASH CAST 材料库会持续补充不同空间的优缺点和参考价格。</p>`,
    content_en: `<h2>Materials should match climate and usage</h2><p>Malaysia's humid climate means kitchens, bathrooms, balconies, and ground-floor spaces need moisture resistance, mould resistance, scratch resistance, and easy cleaning.</p><h2>Common choices</h2><p>SPC flooring, anti-slip tiles, quartz countertops, moisture-resistant cabinet boards, aluminium doors, glass screens, and wet-area wall finishes are common options.</p><h2>Do not choose by colour alone</h2><p>Material selection should consider base condition, installation method, maintenance habits, and budget. FLASH CAST's material library will continue to add pros, cons, and reference prices.</p>`,
  },
  {
    slug: "built-in-furniture-small-condo-storage",
    zh: "小公寓定制柜：如何增加收纳但不压迫？",
    en: "Built-In Furniture for Small Condos: More Storage Without Feeling Heavy",
    category: "Built-In",
    tags: ["built-in furniture", "small condo", "storage"],
    cover: "/images/services/builtin-solutions.jpg",
    content_zh: `<h2>先整理物品，再设计柜体</h2><p>小公寓收纳不能只把墙面做满。先确认衣物、清洁用品、鞋子、行李、厨房用品和展示物品，柜体才会真正好用。</p><h2>减少压迫感的方法</h2><p>使用浅色门板、局部开放格、隐藏把手、灯带、悬空柜和一致的线条，可以让空间更轻盈。</p><h2>施工要注意什么？</h2><p>定制柜要确认插座、冷气、窗帘、门洞、地脚线和墙体平整度。FLASH CAST 会先现场量尺再细化柜体设计。</p>`,
    content_en: `<h2>Sort items before designing cabinets</h2><p>Small condo storage should not simply fill every wall. Confirm clothes, cleaning items, shoes, luggage, kitchen items, and display items before cabinet design.</p><h2>How to reduce visual heaviness</h2><p>Light door finishes, partial open shelves, hidden handles, LED strips, floating cabinets, and consistent lines help the space feel lighter.</p><h2>What to check before installation</h2><p>Custom cabinets should consider sockets, air-conditioning, curtains, door openings, skirting, and wall flatness. FLASH CAST measures the site before refining cabinet design.</p>`,
  },
  {
    slug: "renovation-quotation-checklist-malaysia",
    zh: "装修报价单怎么看？马来西亚业主检查清单",
    en: "How to Read a Renovation Quotation in Malaysia",
    category: "Budget",
    tags: ["quotation", "renovation checklist", "Malaysia"],
    cover: "/images/heroes/hero-quote.jpg",
    content_zh: `<h2>报价单要看明细</h2><p>可靠的报价应列出项目范围、数量、单位、材料规格、人工、运输、保护工程、付款节点和不包含项目。</p><h2>特别注意排除项</h2><p>拆除后的隐藏问题、管理处押金、特殊材料、额外电位、结构修改和家具电器通常需要明确是否包含。</p><h2>比较报价的方法</h2><p>把每家报价拆成同样范围再比较。FLASH CAST 会尽量用清楚分项帮助业主判断预算和优先顺序。</p>`,
    content_en: `<h2>Check itemized details</h2><p>A reliable quotation should list scope, quantity, unit, material specification, labour, delivery, protection works, payment stages, and exclusions.</p><h2>Watch exclusions carefully</h2><p>Hidden issues after hacking, management deposits, special materials, extra electrical points, structural changes, and loose furniture or appliances should be clearly stated.</p><h2>How to compare quotes</h2><p>Compare different quotations using the same scope. FLASH CAST uses clear itemization to help owners understand budget and priorities.</p>`,
  },
  {
    slug: "area-guide-kl-selangor-renovation",
    zh: "吉隆坡与雪兰莪装修地区指南：不同区域要注意什么？",
    en: "KL and Selangor Renovation Area Guide",
    category: "Local SEO",
    tags: ["Kuala Lumpur", "Selangor", "area guide"],
    cover: "/images/heroes/hero-services.jpg",
    content_zh: `<h2>不同地区，施工限制不同</h2><p>Mont Kiara、Bangsar、Petaling Jaya、Subang Jaya、Puchong、Cheras、Shah Alam 和 Klang 的物业类型、管理处要求和材料运输方式都不同。</p><h2>先确认物业类型</h2><p>公寓要看管理处审批，有地住宅要看旧结构和排水，商业空间要看营业日期、消防、冷气和招牌限制。</p><h2>本地 SEO 页面会持续扩充</h2><p>FLASH CAST 会为重点地区整理案例、FAQ、材料建议和报价 CTA，帮助业主更快找到适合自己区域的装修服务。</p>`,
    content_en: `<h2>Different areas have different restrictions</h2><p>Mont Kiara, Bangsar, Petaling Jaya, Subang Jaya, Puchong, Cheras, Shah Alam, and Klang differ in property type, management rules, and material delivery conditions.</p><h2>Confirm property type first</h2><p>Condos need management approval, landed homes need old-structure and drainage checks, while commercial spaces need opening date, fire safety, air-conditioning, and signage planning.</p><h2>Local SEO pages will keep expanding</h2><p>FLASH CAST will keep adding area-specific cases, FAQ, material advice, and quote CTAs to help owners find renovation services in their own location.</p>`,
  },
].map((post, index) => ({
  slug: post.slug,
  title_zh: post.zh,
  title_en: post.en,
  excerpt_zh: `${post.zh} 这篇指南整理马来西亚装修预算、材料、施工和本地审批重点，帮助业主更快做决定。`,
  excerpt_en: `${post.en} explains Malaysia renovation budget, materials, construction, and local approval points so owners can decide faster.`,
  content_zh: post.content_zh,
  content_en: post.content_en,
  category: post.category,
  tags: ["FLASH CAST", ...post.tags],
  cover_image_url: img(post.cover),
  alt_zh: `${post.zh} 装修指南封面`,
  alt_en: `${post.en} renovation guide cover`,
  seo_title_zh: `${post.zh} | FLASH CAST 装修指南`,
  seo_title_en: `${post.en} | FLASH CAST Guide`,
  seo_description_zh: `${post.zh}，适合吉隆坡与雪兰莪业主参考，包含预算、材料、施工、审批和免费报价建议。`,
  seo_description_en: `${post.en}, with practical advice for KL and Selangor owners on budget, materials, construction, approval, and free quotation.`,
  status: "published",
  published_at: dateAt(26, index),
}));

const run = async () => {
  const savedProjects = await upsert("projects", projects);
  await upsert("materials", materials);
  await upsert("service_areas", areas);
  const humanizedBlogCount = applyHumanizedBlogContent(blogPosts);
  await upsert("blog_posts", blogPosts);

  const projectIdBySlug = Object.fromEntries(savedProjects.map((project) => [project.slug, project.id]));
  for (const project of projectRows) {
    const projectId = projectIdBySlug[project.slug];
    if (!projectId) continue;
    await request(`/rest/v1/project_images?project_id=eq.${projectId}`, { method: "DELETE" });
    const imageRows = [
      { file: project.files[0], type: "cover", folder: "projects" },
      { file: project.files[1], type: "gallery", folder: "projects" },
      { file: project.beforeAfter[0], type: "before", folder: "before-after" },
      { file: project.beforeAfter[1], type: "after", folder: "before-after" },
    ].map((image, index) => ({
      project_id: projectId,
      image_url: img(`/images/${image.folder}/${image.file}`),
      image_type: image.type,
      alt_zh: `${project.zh} ${image.type === "before" ? "施工前" : image.type === "after" ? "施工后" : "项目"} 图片 ${index + 1}`,
      alt_en: `${project.en} ${image.type} image ${index + 1}`,
      sort_order: (index + 1) * 10,
    }));
    await request("/rest/v1/project_images", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(imageRows),
    });
  }

  console.log(JSON.stringify({
    ok: true,
    projects_added_or_updated: projects.length,
    materials_added_or_updated: materials.length,
    service_areas_added_or_updated: areas.length,
    blog_posts_added_or_updated: blogPosts.length,
    blog_posts_humanized: humanizedBlogCount,
  }, null, 2));
};

await run();
