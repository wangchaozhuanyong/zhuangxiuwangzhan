import { readFileSync, existsSync } from "node:fs";

const loadEnv = () => {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!process.env[key]) process.env[key] = rawValue.replace(/^["']|["']$/g, "");
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
const site = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
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
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${text}`);
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
  ["bukit-jalil-condo-renovation", "Bukit Jalil 公寓装修与收纳升级", "Bukit Jalil Condo Renovation and Storage Upgrade", "Bukit Jalil, Kuala Lumpur", "980 sq ft", "7 weeks", "RM68,000 - RM125,000", "Residential", ["proj1-condo-1.jpg", "proj6-bedroom-2.jpg"], ["before-living.jpg", "after-living.jpg"]],
  ["setia-alam-landed-kitchen", "Setia Alam 有地住宅干湿厨房装修", "Setia Alam Landed Dry and Wet Kitchen Renovation", "Setia Alam, Selangor", "520 sq ft", "7 weeks", "RM72,000 - RM135,000", "Kitchen", ["proj3-kitchen-1.jpg", "proj3-kitchen-2.jpg"], ["before-kitchen.jpg", "after-kitchen.jpg"]],
  ["ttdi-bungalow-refurbishment", "TTDI 独立式住宅局部翻新", "TTDI Bungalow Partial Refurbishment", "Taman Tun Dr Ismail, Kuala Lumpur", "2,600 sq ft", "10 weeks", "RM180,000 - RM320,000", "Residential", ["proj8-homeoffice-1.jpg", "proj1-condo-2.jpg"], ["before-living.jpg", "after-living.jpg"]],
  ["kota-damansara-clinic-fit-out", "Kota Damansara 诊所装修 Fit-Out", "Kota Damansara Clinic Fit-Out", "Kota Damansara, Selangor", "1,250 sq ft", "8 weeks", "RM120,000 - RM230,000", "Commercial", ["proj2-office-1.jpg", "proj5-shopfront-2.jpg"], ["before-living.jpg", "after-living.jpg"]],
  ["wangsa-maju-bathroom-renewal", "Wangsa Maju 公寓浴室翻新", "Wangsa Maju Condo Bathroom Renewal", "Wangsa Maju, Kuala Lumpur", "160 sq ft", "3 weeks", "RM16,000 - RM32,000", "Bathroom", ["proj1-condo-1.jpg", "proj3-kitchen-2.jpg"], ["before-bathroom.jpg", "after-bathroom.jpg"]],
  ["seri-kembangan-shop-renovation", "Seri Kembangan 店铺装修与展示柜", "Seri Kembangan Shop Renovation and Display Cabinets", "Seri Kembangan, Selangor", "1,050 sq ft", "6 weeks", "RM78,000 - RM145,000", "Retail", ["proj5-shopfront-1.jpg", "proj7-restaurant-2.jpg"], ["before-living.jpg", "after-living.jpg"]],
];

const projects = projectRows.map(([slug, zh, en, location, area, duration, budget, type], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${location} ${type} 装修案例，适合参考预算、工期、材料和施工范围。`,
  excerpt_en: `${type} renovation case in ${location}, useful for budget, timeline, material, and scope reference.`,
  content_zh: html([
    `${zh} 位于 ${location}，面积约 ${area}。项目重点是把实际使用需求、预算和现场限制整理成可执行的施工范围。`,
    "FLASH CAST 在报价前会先确认尺寸、照片、管理处要求、材料偏好和关键工期，再拆分必要工程与可选升级，避免装修过程中频繁追加。",
    "这个案例适合正在比较吉隆坡与雪兰莪装修公司、预算范围、定制柜、厨房浴室或商业空间 Fit-Out 的业主参考。",
  ]),
  content_en: html([
    `${en} is located in ${location}, around ${area}. The focus was to turn usage needs, budget, and site limitations into a practical renovation scope.`,
    "Before quoting, FLASH CAST checks dimensions, photos, management requirements, material preference, and key timeline, then separates essential works from optional upgrades.",
    "This case is useful for owners comparing KL and Selangor renovation contractors, budget range, custom cabinets, kitchen, bathroom, or commercial fit-out works.",
  ]),
  location,
  area,
  duration,
  budget,
  project_type: type,
  materials: ["Moisture-resistant board", "Quartz / porcelain finishes", "SPC / tile flooring", "LED lighting", "Soft-close hardware"],
  scope: ["Site measurement", "Approval coordination", "Material selection", "Wet works", "Carpentry", "Electrical points", "Final inspection"],
  highlights_zh: ["按地区限制规划排期", "预算范围清楚", "材料与用途匹配", "交付前完成细节检查"],
  highlights_en: ["Schedule planned around area restrictions", "Clear budget range", "Materials matched to usage", "Detailed pre-handover checks"],
  client_need_zh: "业主希望在预算范围内提升空间功能和质感，并减少工期延误与后期追加风险。",
  client_need_en: "The client wanted to improve function and finishing quality within budget while reducing delay and variation risk.",
  seo_title_zh: `${zh} | ${location} 装修案例`,
  seo_title_en: `${en} | ${location} Renovation Case`,
  seo_description_zh: `${location} 装修案例，包含面积、工期、预算、材料、施工内容、before after 和项目亮点。`,
  seo_description_en: `${location} renovation case with area, duration, budget, materials, scope, before after, and highlights.`,
  status: "published",
  sort_order: 300 + (index + 1) * 10,
}));

const materialRows = [
  ["art-texture-paint", "艺术纹理涂料", "Textured Feature Paint", "Art Paint", "Feature Paint", "Texture Paint", "art-texture-paint.jpg", "From RM10 / sq ft"],
  ["kitchen-melamine-cabinets", "Melamine 厨房橱柜系统", "Melamine Kitchen Cabinet System", "Kitchen Cabinet", "Cabinet System", "Melamine", "kitchen-melamine-cabinets.jpg", "From RM250 / ft run"],
  ["kitchen-acrylic-cabinets", "Acrylic 高光厨房橱柜系统", "Acrylic High Gloss Kitchen Cabinet System", "Kitchen Cabinet", "Cabinet System", "Acrylic", "kitchen-acrylic-cabinets.jpg", "From RM350 / ft run"],
  ["category-whole-house-custom", "全屋定制柜方案", "Whole House Custom Cabinet Package", "Furniture", "Whole House Custom", "Cabinet Package", "category-whole-house-custom.jpg", "Quote by scope"],
  ["category-bathroom", "浴室材料搭配方案", "Bathroom Material Combination", "Bathroom", "Material Package", "Tile and Fittings", "category-bathroom.jpg", "Quote by scope"],
  ["category-doors-windows", "门窗材料搭配方案", "Door and Window Material Combination", "Doors & Windows", "Material Package", "Aluminium / Glass / Timber", "category-doors-windows.jpg", "Quote by size"],
];

const materials = materialRows.map(([slug, zh, en, category, subcategory, type, file, price], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${zh} 适合马来西亚住宅、办公室和商业空间装修，重点看预算、耐用度和维护方式。`,
  excerpt_en: `${en} suits Malaysian residential, office, and commercial renovation, with focus on budget, durability, and maintenance.`,
  content_zh: html([
    `${zh} 可以用于提升空间质感、收纳效率或湿区耐用度。选择时应根据空间用途、预算、基层条件和后期维护方式判断。`,
    "FLASH CAST 会把材料优缺点、参考价格、适用空间和施工注意事项整理给业主，方便在报价前做出更清楚的选择。",
  ]),
  content_en: html([
    `${en} can improve visual quality, storage efficiency, or wet-area durability. Selection should consider usage, budget, base condition, and maintenance method.`,
    "FLASH CAST explains pros, cons, reference pricing, suitable spaces, and installation notes so owners can decide more clearly before quotation.",
  ]),
  category,
  subcategory,
  material_type: type,
  suitable_spaces_zh: ["住宅", "公寓", "办公室", "店铺", "商业空间"],
  suitable_spaces_en: ["Home", "Condo", "Office", "Shop", "Commercial space"],
  pros_zh: ["容易搭配设计风格", "可按预算选择规格", "适合本地常见装修需求"],
  pros_en: ["Easy to match design styles", "Specifications can match budget", "Suitable for common local renovation needs"],
  cons_zh: ["需要按现场条件确认规格", "不同供应商品质差异明显"],
  cons_en: ["Specification depends on site condition", "Quality varies across suppliers"],
  reference_price: price,
  image_url: img(`/images/materials/${file}`),
  alt_zh: `${zh} 装修材料参考图`,
  alt_en: `${en} renovation material reference image`,
  seo_title_zh: `${zh} | 装修材料优缺点与参考价格`,
  seo_title_en: `${en} | Pros, Cons and Reference Pricing`,
  seo_description_zh: `${zh} 的适用空间、优缺点、参考价格、施工注意事项和装修建议。`,
  seo_description_en: `${en} suitable spaces, pros, cons, reference pricing, installation notes, and renovation advice.`,
  status: "published",
  sort_order: 350 + (index + 1) * 10,
}));

const areaRows = [
  ["wangsa-maju", "Wangsa Maju", "公寓和排屋项目较多，常见需求包括出租单位翻新、浴室维修、厨房橱柜和基础装修。"],
  ["setia-alam", "Setia Alam", "有地住宅和新屋装修需求稳定，常见重点是干湿厨房、定制柜、地板和实用收纳。"],
  ["rawang", "Rawang", "有地住宅、工厂和仓储空间较多，预算规划、排期和材料运输需要提前确认。"],
  ["semenyih", "Semenyih", "新屋和有地住宅项目较多，适合规划全屋装修、湿厨房、收纳和分阶段预算。"],
  ["bukit-jalil", "Bukit Jalil", "公寓和商业空间集中，常见需求包括公寓装修、厨房橱柜、办公室和店铺 Fit-Out。"],
  ["desa-parkcity", "Desa ParkCity", "高端住宅和公寓项目重视管理处审批、保护工程、材料质感和收尾细节。"],
  ["taman-tun-dr-ismail", "Taman Tun Dr Ismail", "老洋房、排屋和商业单位常见，旧屋翻新、防水、水电和木作定制是重点。"],
  ["kota-damansara", "Kota Damansara", "商业和住宅需求并重，适合覆盖诊所、办公室、零售店和住宅装修。"],
  ["ara-damansara", "Ara Damansara", "公寓、办公室和商业单位集中，重点是审批、空间规划、材料进场和交付效率。"],
  ["seri-kembangan", "Seri Kembangan", "店铺、住宅和商业空间需求稳定，常见服务包括店铺装修、厨房、浴室和定制柜。"],
  ["balakong", "Balakong", "工业单位、仓库和住宅项目并存，适合规划仓储、办公室区、地面和照明工程。"],
  ["sungai-buloh", "Sungai Buloh", "有地住宅、工业和商业项目较多，常见需求包括旧屋翻新、仓库工程和办公室装修。"],
];

const areas = areaRows.map(([slug, name, note], index) => ({
  slug,
  area_name: name,
  title_zh: `${name} 装修公司`,
  title_en: `${name} Renovation Contractor`,
  excerpt_zh: `FLASH CAST 提供 ${name} 住宅装修、旧屋翻新、厨房浴室、办公室、店铺和定制柜服务。`,
  excerpt_en: `FLASH CAST provides ${name} home renovation, old house refurbishment, kitchen, bathroom, office, shop, and custom cabinet services.`,
  content_zh: html([
    `${name} 装修项目需要结合地区、物业类型、管理处规定、施工时间、材料运输和预算分项来规划。${note}`,
    "FLASH CAST 会先了解面积、照片、预算、项目类型和期望工期，再判断是否需要现场测量，并整理适合本地区的施工范围和材料建议。",
    `如果你正在搜索 ${name} 装修公司、renovation contractor、厨房橱柜、浴室防水、旧屋翻新、办公室装修或店铺装修，可以先通过 WhatsApp 或免费报价表单提交资料。`,
  ]),
  content_en: html([
    `${name} renovation projects should be planned around area, property type, management rules, working hours, material delivery, and itemized budget. ${note}`,
    "FLASH CAST reviews area, photos, budget, project type, and expected timeline before advising whether a site measurement is needed and preparing suitable scope and material recommendations.",
    `If you are looking for a ${name} renovation contractor, kitchen cabinet, bathroom waterproofing, old house renovation, office renovation, or shop renovation service, send your details by WhatsApp or the free quotation form.`,
  ]),
  property_types: ["Condo", "Terrace house", "Semi-D", "Bungalow", "Office", "Retail shop", "Warehouse"],
  common_needs: ["Full renovation", "Kitchen cabinet", "Bathroom waterproofing", "Custom built-in", "Office fit-out", "Shop renovation"],
  construction_notes_zh: `${name} 项目建议提前确认施工时间、搬运路线、停车、保护工程、管理处或业主委员会要求。`,
  construction_notes_en: `${name} projects should confirm working hours, delivery route, parking, protection works, and management or committee requirements early.`,
  projects: [],
  faqs_zh: faq([
    [`${name} 装修可以先线上估价吗？`, "可以。请先提供照片、面积、地点、项目类型和预算范围，我们会先判断大概施工范围。"],
    [`${name} 是否提供免费报价？`, "提供。我们会根据项目类型和现场条件整理报价，必要时安排现场测量。"],
    ["可以做中文和英文沟通吗？", "可以。网站和后台内容支持中英文，项目沟通也可按业主习惯进行。"],
  ]),
  faqs_en: faq([
    [`Can I get an online estimate for ${name}?`, "Yes. Send photos, area, location, project type, and budget range so we can advise the likely scope first."],
    [`Do you provide free quotation in ${name}?`, "Yes. We prepare quotations based on project type and site condition, with site measurement arranged when needed."],
    ["Can communication be in Chinese or English?", "Yes. The website and admin content support both Chinese and English, and project communication can follow the owner's preference."],
  ]),
  seo_title_zh: `${name} 装修公司 | 厨房、浴室、旧屋、办公室与店铺装修`,
  seo_title_en: `${name} Renovation Contractor | Kitchen, Bathroom, Home, Office & Shop`,
  seo_description_zh: `FLASH CAST 提供 ${name} 装修服务，覆盖住宅、旧屋、厨房橱柜、浴室防水、办公室、店铺、定制柜和免费报价。`,
  seo_description_en: `FLASH CAST provides ${name} renovation services for homes, old houses, kitchen cabinets, bathroom waterproofing, offices, shops, custom built-ins, and free quotation.`,
  status: "published",
  sort_order: 200 + (index + 1) * 10,
}));

const blogRows = [
  ["dry-wet-kitchen-renovation-malaysia", "马来西亚干湿厨房装修怎么规划？", "How to Plan Dry and Wet Kitchen Renovation in Malaysia", "Kitchen", "干湿厨房要先分清烹饪习惯、油烟、水槽、炉具、电器和收纳动线。湿厨房重点看防水、排水、耐热和清洁；干厨房则更重视展示、台面和收纳。", "Dry and wet kitchen planning should start with cooking habits, fumes, sink, hob, appliances, and storage flow. Wet kitchens focus on waterproofing, drainage, heat resistance, and cleaning, while dry kitchens focus on display, countertop, and storage."],
  ["landed-house-renovation-selangor", "Selangor 有地住宅装修重点清单", "Selangor Landed House Renovation Checklist", "Residential", "有地住宅装修通常比公寓更复杂，需要检查屋顶、排水、墙体裂缝、水电、湿区和外墙。预算应区分维修、功能升级和美观工程。", "Landed house renovation is usually more complex than condo renovation. Check roof, drainage, wall cracks, wiring, plumbing, wet areas, and exterior walls. Budget should separate repairs, functional upgrades, and visual works."],
  ["shoplot-renovation-permit-malaysia", "店铺装修需要哪些审批和资料？", "What Approval Documents Are Needed for Shoplot Renovation?", "Retail", "店铺装修可能涉及商场、业主、管理处、招牌、消防、冷气和施工时间限制。开工前应确认申请表、施工范围、承包商资料、保险或押金要求。", "Shoplot renovation may involve mall, landlord, management, signage, fire safety, air-conditioning, and working-hour restrictions. Before work starts, confirm forms, scope, contractor details, insurance, or deposit requirements."],
  ["office-reinstatement-vs-renovation", "办公室还原工程和装修工程有什么不同？", "Office Reinstatement vs Renovation: What Is the Difference?", "Office", "办公室还原工程是把空间恢复到业主或大楼要求的交付状态；装修工程则是为新租户或企业打造可使用空间。两者报价、排期和验收标准不同。", "Office reinstatement restores the space to landlord or building requirements, while renovation prepares the space for a new tenant or business. Pricing, schedule, and handover standards are different."],
  ["custom-wardrobe-price-malaysia", "马来西亚定制衣柜价格怎么看？", "How to Compare Custom Wardrobe Prices in Malaysia", "Built-In", "定制衣柜价格取决于尺寸、柜体板材、门板、五金、抽屉、灯带、内部配件和安装难度。比较报价时要看规格，不只看总价。", "Custom wardrobe pricing depends on size, board material, door finish, hardware, drawers, LED strips, internal accessories, and installation difficulty. Compare specifications, not just total price."],
  ["spc-vs-vinyl-flooring-malaysia", "SPC 地板和 Vinyl 地板怎么选？", "SPC vs Vinyl Flooring in Malaysia", "Materials", "SPC 和 Vinyl 都常用于马来西亚住宅装修。SPC 稳定性较好，Vinyl 脚感较软。选择时要看基层平整度、防潮、耐磨、预算和使用空间。", "SPC and vinyl flooring are both common in Malaysian homes. SPC is generally more stable, while vinyl feels softer underfoot. Selection should consider subfloor flatness, moisture, wear resistance, budget, and room usage."],
  ["renovation-payment-schedule-malaysia", "装修付款进度表怎么安排比较安全？", "How to Plan a Safer Renovation Payment Schedule", "Budget", "装修付款应配合施工节点，例如订金、材料进场、湿作业完成、木作安装和交付验收。不要只看总价，也要确认每个阶段对应的工程内容。", "Renovation payments should match work milestones such as deposit, material delivery, wet works completion, carpentry installation, and handover. Do not only compare totals; confirm what each stage covers."],
  ["rental-unit-renovation-kl", "KL 出租单位装修：如何控制预算和耐用度？", "KL Rental Unit Renovation: Budget and Durability Tips", "Rental", "出租单位装修要优先考虑耐用、易清洁、维修方便和预算回收。材料不一定要最贵，但要适合高频使用和未来维护。", "Rental unit renovation should prioritize durability, easy cleaning, maintenance, and return on budget. Materials do not need to be the most expensive, but they must suit frequent use and future repair."],
];

const blogPosts = blogRows.map(([slug, zh, en, category, zhBody, enBody], index) => ({
  slug,
  title_zh: zh,
  title_en: en,
  excerpt_zh: `${zh} 这篇文章帮助业主在询价前先理解预算、材料、审批和施工重点。`,
  excerpt_en: `${en} helps owners understand budget, materials, approval, and construction points before requesting quotation.`,
  content_zh: `<h2>为什么这个主题重要？</h2><p>${zhBody}</p><h2>询价前要准备什么？</h2><p>建议准备地点、面积、照片、预算范围、期望工期和主要需求。如果是公寓、办公室或店铺，也要确认管理处或业主方的施工规定。</p><h2>FLASH CAST 可以怎么协助？</h2><p>我们会根据吉隆坡与雪兰莪的现场条件，提供材料建议、施工范围拆分、预算方向和免费报价。</p>`,
  content_en: `<h2>Why this topic matters</h2><p>${enBody}</p><h2>What to prepare before asking for a quote</h2><p>Prepare location, area, photos, budget range, expected timeline, and main requirements. For condos, offices, or shops, confirm management or landlord renovation rules too.</p><h2>How FLASH CAST can help</h2><p>We provide material advice, scope breakdown, budget direction, and free quotation based on KL and Selangor site conditions.</p>`,
  category,
  tags: ["FLASH CAST", category, "Malaysia renovation"],
  cover_image_url: img(index % 3 === 0 ? "/images/heroes/hero-materials.jpg" : index % 3 === 1 ? "/images/services/kitchen-renovation.jpg" : "/images/heroes/hero-projects.jpg"),
  alt_zh: `${zh} 装修博客封面`,
  alt_en: `${en} renovation blog cover`,
  seo_title_zh: `${zh} | FLASH CAST 装修指南`,
  seo_title_en: `${en} | FLASH CAST Renovation Guide`,
  seo_description_zh: `${zh}，适合吉隆坡与雪兰莪业主参考，包含预算、材料、审批、施工和免费报价建议。`,
  seo_description_en: `${en}, with budget, material, approval, construction, and free quotation advice for KL and Selangor owners.`,
  status: "published",
  published_at: dateAt(27, index),
}));

const run = async () => {
  const savedProjects = await upsert("projects", projects);
  await upsert("materials", materials);
  await upsert("service_areas", areas);
  await upsert("blog_posts", blogPosts);

  const projectIdBySlug = Object.fromEntries(savedProjects.map((project) => [project.slug, project.id]));
  for (const row of projectRows) {
    const [slug, zh, en, , , , , , files, beforeAfter] = row;
    const projectId = projectIdBySlug[slug];
    if (!projectId) continue;
    await request(`/rest/v1/project_images?project_id=eq.${projectId}`, { method: "DELETE" });
    const imageRows = [
      { file: files[0], type: "cover", folder: "projects" },
      { file: files[1], type: "gallery", folder: "projects" },
      { file: beforeAfter[0], type: "before", folder: "before-after" },
      { file: beforeAfter[1], type: "after", folder: "before-after" },
    ].map((image, index) => ({
      project_id: projectId,
      image_url: img(`/images/${image.folder}/${image.file}`),
      image_type: image.type,
      alt_zh: `${zh} ${image.type === "before" ? "施工前" : image.type === "after" ? "施工后" : "装修案例"} 图片 ${index + 1}`,
      alt_en: `${en} ${image.type} image ${index + 1}`,
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
  }, null, 2));
};

await run();
