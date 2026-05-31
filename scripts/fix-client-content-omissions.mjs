import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...value] = trimmed.split("=");
    if (!process.env[name]) process.env[name] = value.join("=");
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !key) throw new Error("Missing Supabase URL or service role key.");

const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false } });
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(root, "tmp", `client-content-fix-backup-${timestamp}.json`);
fs.mkdirSync(path.dirname(backupFile), { recursive: true });

const serviceSteps = {
  bathroom: [
    { title: "现场检查", desc: "检查漏水、排水坡度、瓷砖空鼓、通风和原有防水层状态。" },
    { title: "湿区施工", desc: "安排拆除、找坡、防水、铺砖和洁具安装，减少后期渗漏风险。" },
    { title: "测试交付", desc: "完成闭水测试、排水检查、收口验收和现场清洁后交付。" },
  ],
  builtin: [
    { title: "现场量尺", desc: "确认尺寸、墙身条件、收纳习惯、开门方式和电位位置。" },
    { title: "设计确认", desc: "确认柜体结构、门板材质、五金、灯带和收口细节。" },
    { title: "制作安装", desc: "工厂制作后到现场安装，调整门缝、五金和整体完成面。" },
  ],
  kitchen: [
    { title: "量尺规划", desc: "确认橱柜尺寸、水槽、炉具、电器、插座和使用动线。" },
    { title: "材料选择", desc: "比较柜体、门板、台面、五金和后期维护要求。" },
    { title: "制作安装", desc: "协调橱柜制作、台面、水电点位和现场收尾。" },
  ],
  "office-renovation": [
    { title: "空间规划", desc: "按团队人数、工作动线、会议室、接待区和收纳需求规划布局。" },
    { title: "工程协调", desc: "协调电位、网络点、灯光、隔间、冷气和大楼施工规定。" },
    { title: "施工交付", desc: "按营业影响安排工期，完成后检查隔间、灯光、家具和收口。" },
  ],
  "shop-renovation": [
    { title: "品牌与动线", desc: "确认客流、展示需求、收银区、储物区和开业时间。" },
    { title: "审批排期", desc: "规划图纸、业主或管理处要求、材料交期和施工顺序。" },
    { title: "开业检查", desc: "检查灯光、展示、招牌、门面和完成面，确保适合开业使用。" },
  ],
  warehouse: [
    { title: "需求确认", desc: "确认货物尺寸、承重、叉车使用、收发货动线和安全要求。" },
    { title: "布局规划", desc: "规划货架、通道宽度、照明、办公室角落和仓储分区。" },
    { title: "安装验收", desc: "完成货架或基础工程后，检查通行、稳定性和交付细节。" },
  ],
};

const landingRelatedProjects = {
  "kitchen-cabinet": [
    { image: "/images/projects/kitchen-cabinet.webp", title: "Bangsar Condo Kitchen Cabinet", location: "Bangsar, KL" },
    { image: "/images/projects/proj3-kitchen-1.webp", title: "Subang Jaya Open Kitchen Renovation", location: "Subang Jaya" },
  ],
  flooring: [
    { image: "/images/projects/proj1-condo-1.webp", title: "Mont Kiara Condo SPC Flooring", location: "Mont Kiara, KL" },
    { image: "/images/projects/proj2-office-1.webp", title: "Petaling Jaya Office Laminate Flooring", location: "Petaling Jaya" },
  ],
  "office-renovation": [
    { image: "/images/projects/proj2-office-1.webp", title: "KL Sentral Corporate Office Renovation", location: "KL Sentral" },
    { image: "/images/projects/generated-portfolio/bangsar-coworking-space-planning.webp", title: "Petaling Jaya Coworking Space Planning", location: "Petaling Jaya" },
  ],
  "shop-renovation": [
    { image: "/images/projects/proj5-shopfront-1.webp", title: "Bangsar Retail Shopfront Renovation", location: "Bangsar, KL" },
    { image: "/images/projects/proj7-restaurant-1.webp", title: "SS2 Cafe Renovation", location: "Petaling Jaya" },
  ],
  "warehouse-shelving": [
    { image: "/images/projects/proj4-warehouse-1.webp", title: "Shah Alam Warehouse Racking", location: "Shah Alam, Selangor" },
    { image: "/images/projects/generated-portfolio/puchong-heavy-duty-warehouse-racking.webp", title: "Puchong Logistics Storage System", location: "Puchong" },
  ],
};

const materialFixes = {
  "anti-slip-bathroom-tile": {
    reference_price: "RM6 - RM25 / sq ft，仅材料参考",
  },
  "subway-wall-tile": {
    title_zh: "白色地铁砖墙面",
    content_zh: "<p>白色地铁砖墙面是常见的浴室和厨房墙面材料。选择时应比较耐用度、防潮性、清洁方式、视觉效果和安装条件。</p><p>FLASH CAST 会根据空间用途和预算建议合适规格，并说明材料优缺点和施工注意事项。</p>",
    reference_price: "RM5 - RM18 / sq ft，仅材料参考",
    alt_zh: "白色地铁砖墙面材料样板",
  },
  "sintered-stone-grey": {
    content_zh: "高性能灰色岩板，适合使用频率高的厨房台面、商业柜台和展示台面。",
    recommended_pairing_zh: "适合搭配极简柜体、深色金属细节和隐藏灯光。",
    note_zh: "正确安装后，耐热和抗污表现较好，适合重视耐用度的空间。",
    pros_zh: ["耐热性较好", "抗污能力强", "适合高级台面效果"],
    cons_zh: ["需要专业切割和安装", "边角处理要仔细确认"],
  },
  "solid-surface-warm-white": {
    content_zh: "暖白人造石台面质感柔和，接缝处理较顺，适合浴室台面、洗手盆区域和定制柜台。",
    recommended_pairing_zh: "适合搭配无缝浴室台面、一体式洗手盆和浅色柜体。",
    note_zh: "适合弧形或特殊造型台面，后期轻微刮痕也较容易修补。",
    pros_zh: ["接缝效果干净", "造型灵活", "后期修补较方便"],
    cons_zh: ["耐刮度要按使用习惯选择", "高温物品不建议直接接触"],
  },
};

const blogFixes = {
  "office-fit-out-checklist-selangor": {
    tags: ["FLASH CAST", "办公室装修", "商业空间规划", "雪兰莪"],
  },
  "shop-renovation-opening-timeline-malaysia": {
    tags: ["FLASH CAST", "店铺装修", "开业时间表", "零售空间装修"],
  },
};

const projectFixes = {
  "bangsar-walk-in-wardrobe-system": {
    content_zh: "这个步入式衣帽间结合玻璃柜门、中岛抽屉和隐藏灯带，让收纳更清楚，也让卧室空间更有精品感。\n\n施工重点包括衣柜柜体、中岛抽屉、灯光整合和玻璃门。材料建议为深胡桃木饰面、茶色玻璃、石材台面和拉丝金属。",
    highlights_zh: ["收纳分区更清楚", "整体空间更像精品展示间", "灯光提升材料质感"],
    client_need_zh: "客户希望衣帽间看起来更高级，同时保留实用收纳、耐用做工和清楚预算。",
  },
  "corporate-office-petaling-jaya": {
    content_zh: "<p>这个企业办公室装修面积约 3,000 平方英尺，包含玻璃隔间、会议室、茶水间、接待柜台和约 50 个工位。</p><p>设计重点是专业、现代和安静的办公氛围，同时把电位、网络点、动线和收纳一起规划好。</p>",
    highlights_zh: ["玻璃会议室兼顾通透和隐私", "开放式工位动线清楚", "接待区搭配发光招牌更专业", "电线和网络线集中整理"],
    client_need_zh: "一家成长中的科技公司需要容纳约 50 名员工，并希望有会议室、茶水间和专业接待区。",
  },
  "damansara-heights-semi-d-refurbishment": {
    content_zh: "这个半独立住宅主卧升级采用软包墙板、茶色玻璃衣柜和温暖灯光，营造安静、舒适、有酒店感的主卧空间。\n\n施工重点包括卧室翻新、衣柜入口、墙板和灯光升级。材料建议为软包墙板、茶色玻璃、木饰面和大理石边几台面。",
    highlights_zh: ["主卧氛围更有层次", "衣柜入口更整洁", "夜间灯光更柔和"],
    client_need_zh: "客户希望主卧更有高级感，同时保留日常收纳、耐用做工和清楚预算。",
  },
  "home-office-puchong": {
    scope: ["定制书桌", "整墙书架", "吊柜", "窗边座位", "地板", "灯光"],
    highlights_zh: ["整合电线收纳系统", "到顶书架搭配灯带", "窗边座位暗藏收纳", "一面墙加入吸音板"],
    client_need_zh: "客户长期在家办公，希望把小卧室改成专用工作区，同时提升收纳和使用舒适度。",
  },
  "kl-showroom-gallery-renovation": {
    content_zh: "这个材料展厅通过样板墙、洽谈桌和展示收纳，让客户看材料时更直观，也更容易建立信任。\n\n施工重点包括材料展示墙、洽谈桌、收纳墙和展厅灯光。材料建议为大理石样板、木饰面、金属框架和玻璃隔间。",
    highlights_zh: ["材料展示更专业", "客户洽谈动线更顺", "展厅整体形象更高级"],
    client_need_zh: "客户希望展厅更有质感，同时保留展示、收纳和日常接待功能。",
  },
  "luxury-master-bedroom-damansara": {
    content_zh: "<p>这个高级主卧套房包含步入式衣帽间、灯带层板、隐藏灯光背景墙、定制梳妆台和高级地板。</p><p>整体重点是酒店式舒适感、收纳规划和柔和灯光，让主卧更安静也更有质感。</p>",
    highlights_zh: ["步入式衣帽间搭配感应灯带", "炭灰色格栅背景墙作为床头重点", "人字拼地板提升高级感", "床头整合 USB 充电位"],
    client_need_zh: "屋主希望打造酒店式主卧套房，需要定制收纳、氛围灯光和更高级的完成面。",
  },
  "mont-kiara-luxury-condo-renovation": {
    content_zh: "这个满家乐高级公寓以石材、木饰面和隐藏灯带打造客餐厅，适合重视质感、收纳和长期耐看的家庭。\n\n施工重点包括客厅翻新、背景墙、定制收纳和灯光协调。材料建议为岩板、胡桃木饰面、哑光板材和暖色灯带。",
    highlights_zh: ["客餐厅规划更开阔", "隐藏收纳减少杂乱", "分层灯光营造高级氛围"],
    client_need_zh: "客户希望公寓更有高级感，同时保留实用收纳、耐用做工和清楚预算。",
  },
  "restaurant-fitout-subang": {
    highlights_zh: ["开放式厨房搭配玻璃隔间", "木饰面背景墙提升用餐氛围", "定制石材吧台", "白色墙砖厨房挡水墙"],
    client_need_zh: "餐饮业主准备开设新的休闲餐厅，需要从空单位做到可开业状态。",
  },
  "shopfront-renovation-cheras": {
    scope: ["店面玻璃工程", "立体招牌制作与安装", "卷闸门更换", "室内展示柜台", "外墙油漆", "电工"],
    highlights_zh: ["发光招牌更吸引路人", "玻璃门面提升商品可见度", "室内外风格统一", "配合紧凑工期完成"],
    client_need_zh: "零售业主希望更新店面形象，吸引更多人流，并加强街边品牌识别度。",
  },
  "sri-petaling-beauty-salon-fit-out": {
    content_zh: "这个美容沙龙采用柔和拱形、镜面区和展示层板，呈现干净精致的服务体验。\n\n施工重点包括沙龙接待区、造型区、展示层板和灯光设计。材料建议为微水泥、水磨石、长虹玻璃和香槟金属。",
    highlights_zh: ["沙龙环境更适合拍照分享", "镜面区更明亮", "客户体验更精致"],
    client_need_zh: "客户希望沙龙空间更有高级感，同时保留展示、服务动线和日常收纳。",
  },
};

async function fetchRows(table, slugs) {
  const { data, error } = await supabase.from(table).select("*").in("slug", slugs).order("slug");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function updateBySlug(table, slug, patch) {
  const { error } = await supabase.from(table).update(patch).eq("slug", slug);
  if (error) throw new Error(`${table}/${slug}: ${error.message}`);
  console.log(`updated ${table}/${slug}`);
}

const backup = {
  services: await fetchRows("services", Object.keys(serviceSteps)),
  landing_pages: await fetchRows("landing_pages", Object.keys(landingRelatedProjects)),
  materials: await fetchRows("materials", Object.keys(materialFixes)),
  blog_posts: await fetchRows("blog_posts", Object.keys(blogFixes)),
  projects: await fetchRows("projects", Object.keys(projectFixes)),
};
fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
console.log(`backup ${backupFile}`);

for (const [slug, process_steps_zh] of Object.entries(serviceSteps)) {
  await updateBySlug("services", slug, { process_steps_zh });
}

for (const [slug, related_projects] of Object.entries(landingRelatedProjects)) {
  await updateBySlug("landing_pages", slug, { related_projects });
}

for (const [slug, patch] of Object.entries(materialFixes)) {
  await updateBySlug("materials", slug, patch);
}

for (const [slug, patch] of Object.entries(blogFixes)) {
  await updateBySlug("blog_posts", slug, patch);
}

for (const [slug, patch] of Object.entries(projectFixes)) {
  await updateBySlug("projects", slug, patch);
}

console.log("done");
