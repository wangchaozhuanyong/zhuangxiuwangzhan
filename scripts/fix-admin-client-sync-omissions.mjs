import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[fix-admin-client-sync-omissions] Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const REST_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const reportDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(reportDir, { recursive: true });

async function rest(table, query = "select=*") {
  const response = await fetch(`${REST_BASE}/${table}?${query}`, { headers });
  if (!response.ok) throw new Error(`${table} ${response.status}: ${await response.text()}`);
  return response.json();
}

async function patch(table, id, body) {
  const response = await fetch(`${REST_BASE}/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`${table}/${id} ${response.status}: ${await response.text()}`);
}

const termMap = new Map(
  Object.entries({
    "TV feature wall": "电视背景墙",
    "Floating console": "悬浮电视柜",
    "Display niche": "展示格",
    "Cable concealment": "线路隐藏",
    "Bookcase": "整墙书柜",
    "Integrated desk": "一体式书桌",
    "Display lighting": "展示灯光",
    "Storage bench": "收纳坐凳",
    "Pallet racking": "重型货架",
    "Aisle planning": "通道规划",
    "Floor marking": "地面标线",
    "Storage zoning": "仓储分区",
    "Glass office": "玻璃办公室",
    "Admin desks": "办公桌位",
    "Filing cabinets": "文件柜",
    "Storage interface": "仓储衔接区",
    "Wall shelving": "墙面货架",
    "Packing counter": "打包台",
    "Overhead storage": "上方收纳",
    "Back-of-house planning": "后场动线规划",
    "Exterior repaint": "外墙重漆",
    "Stone feature": "石材造型",
    "Porch lighting": "门廊灯光",
    "Driveway refresh": "车道翻新",
    "Facade panels": "门面板材",
    "Canopy works": "雨棚工程",
    "Exterior lighting": "户外照明",
    "Entrance finishing": "入口收口",
    "Reception": "接待前台",
    "Meeting rooms": "会议室",
    "Waiting lounge": "等候区",
    "Office lighting": "办公室照明",
    "Open office": "开放办公区",
    "Meeting pod": "会议舱",
    "Collaboration area": "协作区",
    "Cable management": "线缆管理",
    "Flexible desks": "灵活工位",
    "Phone booths": "电话亭",
    "Lounge zone": "休闲区",
    "Pantry edge": "茶水区",
    "Dry kitchen": "干厨房",
    "Dining zone": "餐区",
    "Tall cabinet system": "高柜系统",
    "Glass partition": "玻璃隔断",
    "Wet kitchen partition": "湿厨房分区",
    "Tall pantry": "高身储物柜",
    "Island cabinet": "岛台柜",
    "Mezzanine platform": "夹层平台",
    "Steel staircase": "钢结构楼梯",
    "Modular shelving": "模块化货架",
    "Industrial safety upgrade": "工业安全升级",
    "Aluminium glazing": "铝框玻璃",
    "Stone portal": "石材门套",
    "Covered entrance": "遮雨入口",
    "Exterior steps": "户外台阶",
    "Shoe cabinet": "玄关鞋柜",
    "Entry bench": "入户坐凳",
    "Mirror panel": "镜面板",
    "Packing benches": "打包工作台",
    "Dispatch staging": "出货暂存区",
    "Workflow planning": "作业动线规划",
    "Glass entrance": "玻璃入口",
    "Facade cladding": "门面包覆",
    "Canopy": "雨棚",
    "Boundary wall": "围墙",
    "Automatic gate": "自动大门",
    "Feature screen": "特色屏风",
    "Landscape lighting": "景观灯光",
    "Reception lounge": "接待休息区",
    "Private office": "独立办公室",
    "Discussion table": "洽谈桌",
    "Storage wall": "收纳墙",
    "Reception counter": "接待柜台",
    "Waiting area": "候诊区",
    "Consultation corridor": "诊室走廊",
    "Commercial lighting": "商业照明",
    "Living room": "客厅",
    "Staircase feature": "楼梯造型",
    "Wall finishes": "墙面饰面",
    "Storage planning": "收纳规划",
    "Display wall": "展示墙",
    "Cashier counter": "收银台",
    "Retail lighting": "零售灯光",
    "Product plinths": "产品展示台",
    "Study nook": "书房角",
    "Curved shelving": "弧形层板",
    "Compact storage": "小型收纳",
    "Living corner styling": "客厅角落造型",
    "Dining area": "用餐区",
    "Bar counter": "吧台",
    "Booth seating": "卡座",
    "Ceiling feature": "天花造型",
    "Sintered stone": "岩板",
    "Wood veneer": "木饰面",
    "Warm LED": "暖色灯带",
    "Matte laminate": "哑光饰面板",
    "Timber veneer": "木皮饰面",
    "Acoustic panels": "吸音板",
    "Glass pods": "玻璃舱",
    "Fabric seating": "布艺座椅",
    "Quartz counter": "石英石台面",
    "Acoustic fabric": "吸音布料",
    "Walnut veneer": "胡桃木饰面",
    "Stone desktop": "石材桌面",
    "Glass partitions": "玻璃隔断",
    "Carpet tile": "方块地毯",
    "Quartz stone": "石英石",
    "Oak veneer": "橡木饰面",
    "Fluted panel": "凹槽饰板",
    "Tempered glass": "钢化玻璃",
    "Aluminium frame": "铝合金框",
    "Powder-coated steel": "粉末喷涂钢材",
    "Exterior paint": "外墙漆",
    "Anti-slip tile": "防滑砖",
    "Stone counter": "石材柜台",
    "Stone cladding": "石材饰面",
    "Plywood worktop": "夹板工作台",
    "Metal shelving": "金属货架",
    "Solid surface": "人造石",
    "Vinyl flooring": "PVC 地板",
    "Travertine": "洞石",
    "Light oak laminate": "浅橡木饰面板",
    "Lacquered panels": "烤漆板",
    "Timber slats": "木格栅",
    "Stone counter": "石材台面",
  }),
);

const cleanItem = (item) => {
  const trimmed = String(item || "").trim();
  if (!trimmed) return "";
  return termMap.get(trimmed) || trimmed;
};

const cleanList = (text) =>
  String(text || "")
    .split(/、|,|，/)
    .map(cleanItem)
    .filter(Boolean)
    .join("、");

function cleanProjectContent(content) {
  let next = String(content || "");
  next = next.replace(/施工重点包括：([^。]+)。/g, (_, list) => `施工重点包括：${cleanList(list)}。`);
  next = next.replace(/材料建议：([^。]+)。/g, (_, list) => `材料建议：${cleanList(list)}。`);
  return next;
}

const projectOverrides = {
  "custom-kitchen-bangsar": {
    client_need_zh: "客户希望厨房更现代、收纳更充足，同时保留大岛台用餐功能，并让全屋定制柜体风格统一。",
    highlights_zh: ["无拉手柜门让线条更干净", "石英石瀑布岛台提升高级感", "内嵌电器和柜体更统一", "门板和抽屉全部采用缓冲五金"],
  },
  "warehouse-racking-shah-alam": {
    client_need_zh: "物流公司希望提升仓库储存容量，同时保留清楚的拣货、打包和出货动线。",
    highlights_zh: ["仓储容量明显提升", "叉车通道规划更清楚", "打包和出货区独立划分", "立柱位置加装安全防护"],
  },
  "modern-condo-mont-kiara": {
    client_need_zh: "业主希望把旧公寓改造成更现代、收纳更完整、线条更干净的居住空间。",
    content_zh:
      "<p>满家乐现代公寓全屋装修覆盖客厅、厨房、衣柜、背景墙、地板和电工更新，重点是把旧单位整理成更明亮、更利落的现代居住空间。</p><p>项目规划时同步处理收纳、灯光、插座位置和材料搭配，减少后期返工，让整体风格更统一。</p>",
    highlights_zh: ["开放式厨房搭配岛台", "步入式衣帽间加入灯光设计", "每个房间安排隐藏收纳", "智能灯光让日常使用更方便"],
  },
};

const materialByType = {
  tile: {
    pros_zh: ["耐磨好清洁", "适合厨房和浴室", "颜色和规格选择多"],
    cons_zh: ["铺贴需要平整基层", "缝隙需要定期清洁"],
    recommended_pairing_zh: "适合搭配浅色柜体、防水涂料和耐污填缝。",
    note_zh: "施工前需要确认基层平整度、防滑需求和收边方式。",
  },
  cabinet: {
    pros_zh: ["收纳整齐", "可按尺寸定制", "外观容易和整体风格统一"],
    cons_zh: ["需要现场量尺", "五金和板材等级会影响预算"],
    recommended_pairing_zh: "适合搭配石英石台面、隐藏灯带和缓冲五金。",
    note_zh: "报价前需要现场量尺，并确认板材、门板和五金等级。",
  },
  flooring: {
    pros_zh: ["脚感舒适", "视觉温暖", "适合大面积铺设"],
    cons_zh: ["基层不平会影响效果", "需要注意防潮和收边"],
    recommended_pairing_zh: "适合搭配浅色墙面、木饰面和柔和灯光。",
    note_zh: "铺设前需要确认地面平整度、防潮层和踢脚线收口。",
  },
  door: {
    pros_zh: ["节省空间", "提升入口质感", "可按现场尺寸定制"],
    cons_zh: ["轨道和五金要选稳", "隔音效果需按材质确认"],
    recommended_pairing_zh: "适合搭配现代空间、黑色五金和简洁墙面。",
    note_zh: "安装前需要确认门洞尺寸、轨道位置和墙体承重。",
  },
  panel: {
    pros_zh: ["墙面层次更明显", "适合背景墙", "安装速度较快"],
    cons_zh: ["基层要平整", "转角和收边要处理好"],
    recommended_pairing_zh: "适合搭配电视背景墙、接待区和隐藏灯带。",
    note_zh: "施工前建议先排版，确认转角、插座和边框收口。",
  },
  stone: {
    pros_zh: ["质感高级", "耐用度好", "适合台面和重点墙面"],
    cons_zh: ["重量和运输需提前规划", "高端规格预算较高"],
    recommended_pairing_zh: "适合搭配木饰面、金属五金和暖色灯光。",
    note_zh: "安装前需要确认尺寸、开孔、接缝和搬运条件。",
  },
};

const lettersCount = (value) => (String(value || "").match(/[A-Za-z]/g) || []).length;

function materialType(row) {
  const text = `${row.slug} ${row.title_zh} ${row.category} ${row.subcategory}`.toLowerCase();
  if (/tile|瓷砖|砖/.test(text)) return "tile";
  if (/cabinet|橱柜|柜|melamine|acrylic/.test(text)) return "cabinet";
  if (/floor|地板|spc|timber/.test(text)) return "flooring";
  if (/door|门|sliding/.test(text)) return "door";
  if (/panel|饰板|墙板|cladding/.test(text)) return "panel";
  if (/stone|石|quartz|countertop/.test(text)) return "stone";
  return "panel";
}

const materialOverrides = {
  "porcelain-carrara-white": {
    content_zh: "卡拉拉白瓷砖适合客厅、厨房和浴室墙地面，亮面纹理能让空间更干净明亮，也方便后期清洁维护。",
    recommended_pairing_zh: "适合搭配白色柜体、浅木色饰面和暖色灯光。",
    note_zh: "可按现场选择不同尺寸，铺贴前需要确认基层平整度和防滑需求。",
    alt_zh: "卡拉拉白瓷砖材料样板",
  },
  "hexagon-grey-matte": {
    content_zh: "灰色哑光六角砖适合浴室、厨房墙面和局部特色墙，几何纹理能增加层次，但整体不会太抢眼。",
    recommended_pairing_zh: "适合搭配白色洁具、黑色五金和浅灰墙面。",
    note_zh: "建议由师傅按排版图铺贴，避免边角收口不整齐。",
    alt_zh: "灰色哑光六角砖材料样板",
  },
  "subway-tile-white": {
    content_zh: "白色地铁砖适合厨房挡水墙、浴室墙面和商业空间局部墙面，风格耐看，也容易搭配不同柜体颜色。",
    recommended_pairing_zh: "适合搭配厨房挡水墙、浴室墙面和黑色或拉丝金属五金。",
    note_zh: "按箱计算用量，施工前需要确认缝宽和填缝颜色。",
    alt_zh: "白色亮面地铁砖材料样板",
    suitable_spaces_zh: ["厨房挡水墙", "浴室墙面"],
  },
  "solid-wood-cabinet-teak": {
    content_zh: "柚木实木橱柜适合想要温润木质感和耐用柜体的空间，纹理自然，适合高端厨房和展示柜。",
    recommended_pairing_zh: "适合搭配石英石台面、暖色灯光和哑光五金。",
    note_zh: "实木需要定期保养，现场湿度和通风也要一起考虑。",
    alt_zh: "柚木实木橱柜材料样板",
  },
  "acrylic-cabinet-gloss-white": {
    content_zh: "高光白亚克力橱柜门板表面亮度高，适合现代厨房和小空间，让整体看起来更干净明亮。",
    recommended_pairing_zh: "适合搭配无拉手设计、石英石台面和隐藏灯带。",
    note_zh: "可选择抗指纹表层，日常清洁更省心。",
    alt_zh: "高光白亚克力橱柜门板材料样板",
  },
  "acrylic-high-gloss-white": {
    content_zh: "高光白亚克力板适合现代橱柜、展示柜和收纳系统，镜面质感强，空间会显得更利落。",
    recommended_pairing_zh: "适合现代简洁风格、浅色台面和隐藏式把手。",
    note_zh: "属于偏高端选择，制作周期通常会比普通板材更长。",
    alt_zh: "高光白亚克力板材料样板",
  },
  "spc-vinyl-natural-oak": {
    content_zh: "自然橡木纹 SPC 地板防水、耐磨、容易保养，适合住宅客厅、卧室和办公室大面积铺设。",
    recommended_pairing_zh: "适合搭配浅色墙面、暖木色家具和柔和灯光。",
    note_zh: "可安排安装，施工前需要确认地面平整度和收边方式。",
    alt_zh: "自然橡木纹 SPC 地板材料样板",
  },
  "quartz-countertop-carrara-white": {
    content_zh: "卡拉拉白石英石台面适合厨房岛台、干厨房和洗手台，纹理干净，耐用度和清洁便利性都比较好。",
    recommended_pairing_zh: "适合搭配白色、灰色或木色橱柜。",
    note_zh: "常用于干厨房和岛台，现场需确认开孔、收边和接缝位置。",
    alt_zh: "卡拉拉白石英石台面材料样板",
  },
  "melamine-grey-oak": {
    content_zh: "灰橡木纹美耐板适合橱柜、衣柜和收纳柜，颜色耐看，预算相对好控制，也方便大面积统一。",
    recommended_pairing_zh: "适合现代简约、办公室和出租单位收纳柜。",
    note_zh: "制作快、选择多，是常见柜体饰面方案。",
    alt_zh: "灰橡木纹美耐板材料样板",
  },
  "aluminium-sliding-black": {
    content_zh: "黑框铝合金推拉门适合客厅、阳台、厨房和书房分隔，线条利落，也能保留采光。",
    recommended_pairing_zh: "适合开放式空间、现代风格和黑色五金搭配。",
    note_zh: "可按现场尺寸定制，报价需确认玻璃厚度、轨道和安装条件。",
    alt_zh: "黑框铝合金推拉门材料样板",
  },
  "fluted-panel-charcoal": {
    content_zh: "炭灰凹槽饰板适合电视背景墙、接待区和局部重点墙面，可以增加垂直线条和空间层次。",
    recommended_pairing_zh: "适合搭配背景墙、隐藏灯带和浅色石材。",
    note_zh: "建议按墙面尺寸排版，避免边角收口太碎。",
    alt_zh: "炭灰凹槽饰板材料样板",
  },
  "melamine-cabinet-grey-oak": {
    content_zh: "灰橡木纹美耐板橱柜适合厨房、储物柜和出租单位，耐用、预算友好，日常维护也比较简单。",
    recommended_pairing_zh: "适合搭配石英石台面和哑光五金。",
    note_zh: "是厨房柜常用选择，适合希望快速制作和控制预算的项目。",
    alt_zh: "灰橡木纹美耐板橱柜材料样板",
  },
};

const landingRelated = {
  "bathroom-renovation": [
    { title: "八打灵再也浴室防水翻新", location: "Petaling Jaya", image: "/images/projects/bathroom-renovation.webp?v=20260531-contentfix" },
    { title: "公寓浴室墙地砖升级", location: "Klang Valley", image: "/images/projects/residential-renovation.webp?v=20260531-contentfix" },
  ],
  "old-house-renovation": [
    { title: "满家乐现代公寓全屋装修", location: "Mont Kiara", image: "/images/projects/residential-renovation.webp?v=20260531-contentfix" },
    { title: "加影有地住宅现代客厅翻新", location: "Kajang", image: "/images/projects/living-room.webp?v=20260531-contentfix" },
  ],
  "custom-built-in": [
    { title: "梳邦再也干湿厨房柜定制", location: "Subang Jaya", image: "/images/projects/kitchen-cabinet.webp?v=20260531-contentfix" },
    { title: "甲洞电视背景墙与收纳柜", location: "Kepong", image: "/images/projects/built-in-cabinet.webp?v=20260531-contentfix" },
  ],
};

const before = {};

const projects = await rest("projects", "select=*&status=eq.published&limit=1000");
before.projects = projects;
let projectUpdates = 0;
for (const row of projects) {
  const body = {};
  const cleaned = cleanProjectContent(row.content_zh);
  if (cleaned !== row.content_zh) body.content_zh = cleaned;
  Object.assign(body, projectOverrides[row.slug] || {});
  if (Object.keys(body).length) {
    await patch("projects", row.id, body);
    projectUpdates += 1;
  }
}

const materials = await rest("materials", "select=*&status=eq.published&limit=1000");
before.materials = materials;
let materialUpdates = 0;
for (const row of materials) {
  const kind = materialType(row);
  const defaults = materialByType[kind] || materialByType.panel;
  const override = materialOverrides[row.slug] || {};
  const body = { ...override };
  if (!row.pros_zh?.length) body.pros_zh = defaults.pros_zh;
  if (!row.cons_zh?.length) body.cons_zh = defaults.cons_zh;
  if (!/[\u4e00-\u9fff]/.test(String(row.recommended_pairing_zh || "")) || lettersCount(row.recommended_pairing_zh) >= 12) {
    body.recommended_pairing_zh = override.recommended_pairing_zh || defaults.recommended_pairing_zh;
  }
  if (!/[\u4e00-\u9fff]/.test(String(row.note_zh || "")) || lettersCount(row.note_zh) >= 12) {
    body.note_zh = override.note_zh || defaults.note_zh;
  }
  if (row.alt_zh && /[A-Za-z]{4,}/.test(row.alt_zh)) body.alt_zh = `${row.title_zh}材料样板`;
  if (Object.keys(body).length) {
    await patch("materials", row.id, body);
    materialUpdates += 1;
  }
}

const landings = await rest("landing_pages", "select=*&status=eq.published&limit=1000");
before.landing_pages = landings;
let landingUpdates = 0;
for (const row of landings) {
  const related = landingRelated[row.slug];
  if (related && (!Array.isArray(row.related_projects) || row.related_projects.length === 0)) {
    await patch("landing_pages", row.id, { related_projects: related });
    landingUpdates += 1;
  }
}

const serviceAreas = await rest("service_areas", "select=*&status=eq.published&limit=1000");
before.service_areas = serviceAreas;
let serviceAreaUpdates = 0;
for (const row of serviceAreas) {
  if (Array.isArray(row.projects) && row.projects.length > 0) continue;
  const area = row.area_name || row.title_zh?.replace(/\s*装修公司$/, "") || "Klang Valley";
  const projects = [
    {
      title: `${area} 住宅装修参考`,
      type: "住宅装修",
      image: "/images/projects/residential-renovation.webp?v=20260531-contentfix",
    },
    {
      title: `${area} 商业空间装修参考`,
      type: "商业装修",
      image: "/images/projects/commercial-renovation.webp?v=20260531-contentfix",
    },
  ];
  await patch("service_areas", row.id, { projects });
  serviceAreaUpdates += 1;
}

const backupPath = path.join(reportDir, `admin-client-sync-fix-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(backupPath, JSON.stringify(before, null, 2));

console.log(JSON.stringify({ backupPath, projectUpdates, materialUpdates, landingUpdates, serviceAreaUpdates }, null, 2));
