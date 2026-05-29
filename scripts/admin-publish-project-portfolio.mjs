import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import sharp from "sharp";

const GENERATED_IMAGE_DIR =
  process.env.GENERATED_IMAGE_DIR ||
  "C:/Users/User/.codex/generated_images/019e72bf-f36a-7ff1-8542-6f474f09c97d";

const LOCAL_IMAGE_DIR = "public/images/projects/generated-portfolio";
const BUCKET = "site-images";
const STORAGE_PREFIX = "projects/generated-portfolio";

const sourceFiles = [
  "ig_0e5dc61559c25bae016a1969de39b4819192cbbb9a11b9fa04.png",
  "ig_0e5dc61559c25bae016a196a2edfc881919c6d89b510cde0c0.png",
  "ig_0e5dc61559c25bae016a196a7a9dd0819196a77a97cc27adea.png",
  "ig_0e5dc61559c25bae016a196ad3a5dc8191843a45e6ee8a87dc.png",
  "ig_0e5dc61559c25bae016a196b25b55081919c5f582e9a8e24ac.png",
  "ig_0e5dc61559c25bae016a196b8c64188191982bae778dc554e6.png",
  "ig_0e5dc61559c25bae016a196bea06388191905be5670e184a56.png",
  "ig_0e5dc61559c25bae016a196c414c3081918dd2ef94bef17b37.png",
  "ig_0e5dc61559c25bae016a196c9ae55c8191bc0669982cd3277e.png",
  "ig_0e5dc61559c25bae016a196cfc62888191bb39a6a92a98bb1c.png",
  "ig_0e5dc61559c25bae016a196d6e98248191a8ad15627c8a32b2.png",
  "ig_0e5dc61559c25bae016a196dd23be88191b11a2b2a2a997086.png",
  "ig_0e5dc61559c25bae016a196e3f86688191a66b4b1f8ab0cc18.png",
  "ig_0e5dc61559c25bae016a196e95b7ac8191a3ddb621c5b91855.png",
  "ig_0e5dc61559c25bae016a196eed42c881919dc9a3524583ba5b.png",
  "ig_0e5dc61559c25bae016a196f4c2c60819197955d93826051d5.png",
  "ig_0e5dc61559c25bae016a196fb52fd48191ba7c5d190baa4738.png",
  "ig_0e5dc61559c25bae016a19701c36348191b80e3e9babb918db.png",
  "ig_0e5dc61559c25bae016a1970fd8b088191affcc2aa8200f43a.png",
  "ig_0e5dc61559c25bae016a19717826288191a391694cd125df26.png",
  "ig_0e5dc61559c25bae016a1971e04004819198048deee36c4bc4.png",
  "ig_0e5dc61559c25bae016a197248ef1481918bbe36555a5bf8af.png",
  "ig_0e5dc61559c25bae016a19731bc7588191b5b0a6019a42856d.png",
  "ig_0e5dc61559c25bae016a197381f12c8191b7a5cd49bb90300c.png",
  "ig_0e5dc61559c25bae016a1973ea26188191a7c0cba64296c998.png",
  "ig_0e5dc61559c25bae016a197451484c8191bbf9ac0c7e480f35.png",
  "ig_0e5dc61559c25bae016a1974d13c2881919d6a87848a0ccfae.png",
  "ig_0e5dc61559c25bae016a19754ab95881918855bb8d54fdb676.png",
  "ig_0e5dc61559c25bae016a1975bdb9b881918dee7c6e3d686a8d.png",
  "ig_0e5dc61559c25bae016a1976a00e608191aac247d7205f0829.png",
];

const projects = [
  {
    slug: "mont-kiara-luxury-condo-renovation",
    type: "Residential",
    titleZh: "满家乐高级公寓全屋翻新",
    titleEn: "Mont Kiara Luxury Condo Renovation",
    location: "Mont Kiara, Kuala Lumpur",
    area: "1,250 sq ft",
    duration: "8 weeks",
    budget: "Premium residential renovation",
    excerptZh: "以石材、木饰面和隐藏灯带打造高级公寓客餐厅，适合重视质感和收纳的家庭。",
    excerptEn: "A premium condo renovation with stone, timber veneer, concealed lighting, and refined storage planning.",
    scope: ["Living room renovation", "Feature wall", "Built-in storage", "Lighting coordination"],
    materials: ["Sintered stone", "Walnut veneer", "Matte laminate", "Warm LED lighting"],
    highlightsZh: ["客餐厅视觉更开阔", "隐藏收纳减少杂乱", "灯光层次提升首屏质感"],
    highlightsEn: ["Open living and dining planning", "Concealed storage", "Layered lighting for a premium mood"],
  },
  {
    slug: "damansara-heights-semi-d-refurbishment",
    type: "Residential",
    titleZh: "白沙罗高地半独立住宅主卧升级",
    titleEn: "Damansara Heights Semi-D Master Suite Upgrade",
    location: "Damansara Heights, Kuala Lumpur",
    area: "680 sq ft",
    duration: "6 weeks",
    budget: "Master suite refurbishment",
    excerptZh: "主卧结合软包背景、玻璃衣柜和温暖灯光，做出酒店式安静高级感。",
    excerptEn: "A calm hotel-inspired master suite with upholstered wall panels, glass wardrobes, and warm lighting.",
    scope: ["Bedroom refurbishment", "Wardrobe entry", "Wall panels", "Lighting upgrade"],
    materials: ["Upholstered panels", "Tinted glass", "Timber veneer", "Marble side surfaces"],
    highlightsZh: ["主卧空间更有层次", "衣柜入口更整洁", "夜间灯光更柔和"],
    highlightsEn: ["Layered master suite ambience", "Cleaner wardrobe entry", "Soft evening lighting"],
  },
  {
    slug: "ttdi-bungalow-partial-renovation",
    type: "Residential",
    titleZh: "TTDI 独栋住宅餐厨局部翻新",
    titleEn: "TTDI Bungalow Dining and Kitchen Renovation",
    location: "Taman Tun Dr Ismail, Kuala Lumpur",
    area: "920 sq ft",
    duration: "7 weeks",
    budget: "Kitchen and dining renovation",
    excerptZh: "以岛台、餐区和高柜为核心，提升独栋住宅餐厨动线和高级感。",
    excerptEn: "A dining and kitchen upgrade centred on the island counter, tall cabinetry, and better family circulation.",
    scope: ["Dry kitchen", "Dining zone", "Tall cabinet system", "Glass partition"],
    materials: ["Quartz stone", "Oak veneer", "Fluted glass", "Brass details"],
    highlightsZh: ["餐厨动线更顺", "高柜收纳更完整", "石材台面更耐用"],
    highlightsEn: ["Improved dining-kitchen flow", "Full-height storage", "Durable stone worktops"],
  },
  {
    slug: "kajang-landed-house-modern-renovation",
    type: "Residential",
    titleZh: "加影有地住宅现代客厅翻新",
    titleEn: "Kajang Landed House Modern Living Renovation",
    location: "Kajang, Selangor",
    area: "1,480 sq ft",
    duration: "9 weeks",
    budget: "Landed house renovation",
    excerptZh: "围绕楼梯、客厅和石材墙面重整空间，让有地住宅更现代、更大气。",
    excerptEn: "A landed house upgrade with a staircase feature, stone wall, and a more open modern living area.",
    scope: ["Living room", "Staircase feature", "Wall finishes", "Storage planning"],
    materials: ["Travertine", "Oak timber", "Black steel", "Textured wall paint"],
    highlightsZh: ["楼梯区变成视觉重点", "客厅比例更大气", "收纳与造型结合"],
    highlightsEn: ["Staircase as a design feature", "More spacious living proportion", "Storage integrated with the design"],
  },
  {
    slug: "bukit-jalil-family-condo-upgrade",
    type: "Residential",
    titleZh: "武吉加里尔家庭公寓书房角升级",
    titleEn: "Bukit Jalil Family Condo Study Corner Upgrade",
    location: "Bukit Jalil, Kuala Lumpur",
    area: "520 sq ft",
    duration: "4 weeks",
    budget: "Compact condo upgrade",
    excerptZh: "小面积公寓加入定制书桌、弧形层板和隐藏柜，让家庭空间更实用。",
    excerptEn: "A compact condo upgrade with a custom study nook, curved shelving, and practical hidden storage.",
    scope: ["Study nook", "Curved shelving", "Compact storage", "Living corner styling"],
    materials: ["Light oak laminate", "Textured paint", "Glass", "Fabric upholstery"],
    highlightsZh: ["小空间功能变多", "书房角不压迫", "客厅更整洁"],
    highlightsEn: ["More functions in a compact space", "Lightweight study corner", "Cleaner living area"],
  },
  {
    slug: "kota-damansara-clinic-fit-out",
    type: "Commercial",
    titleZh: "哥打白沙罗诊所接待区装修",
    titleEn: "Kota Damansara Clinic Reception Fit-Out",
    location: "Kota Damansara, Selangor",
    area: "1,050 sq ft",
    duration: "6 weeks",
    budget: "Clinic commercial fit-out",
    excerptZh: "诊所接待区采用弧形前台、柔和灯光和浅木色，提升专业和安心感。",
    excerptEn: "A clinic reception fit-out with curved counters, soft lighting, and calm professional finishes.",
    scope: ["Reception counter", "Waiting area", "Consultation corridor", "Commercial lighting"],
    materials: ["Solid surface", "Light oak veneer", "Terrazzo", "Frosted glass"],
    highlightsZh: ["接待区更有信任感", "候诊空间更明亮", "动线更清楚"],
    highlightsEn: ["More trustworthy reception", "Brighter waiting area", "Clearer circulation"],
  },
  {
    slug: "subang-jaya-restaurant-fit-out",
    type: "Commercial",
    titleZh: "梳邦再也餐厅空间装修",
    titleEn: "Subang Jaya Restaurant Fit-Out",
    location: "Subang Jaya, Selangor",
    area: "1,680 sq ft",
    duration: "8 weeks",
    budget: "Restaurant fit-out",
    excerptZh: "餐厅通过木饰面、石材吧台和暖光座位区，营造高级但亲近的用餐氛围。",
    excerptEn: "A restaurant fit-out using timber, stone counters, and warm booth lighting for a premium dining mood.",
    scope: ["Dining area", "Bar counter", "Booth seating", "Ceiling feature"],
    materials: ["Timber slats", "Stone counter", "Leather seating", "Ribbed glass"],
    highlightsZh: ["用餐氛围更高级", "座位区更舒适", "商业灯光更有层次"],
    highlightsEn: ["More premium dining atmosphere", "Comfortable seating zones", "Layered hospitality lighting"],
  },
  {
    slug: "cheras-retail-boutique-renovation",
    type: "Commercial",
    titleZh: "蕉赖精品零售店装修",
    titleEn: "Cheras Boutique Retail Renovation",
    location: "Cheras, Kuala Lumpur",
    area: "980 sq ft",
    duration: "5 weeks",
    budget: "Retail shop fit-out",
    excerptZh: "以弧形展示墙、收银台和灯光陈列，提升零售店进店第一印象。",
    excerptEn: "A boutique retail fit-out with curved displays, premium counters, and focused merchandise lighting.",
    scope: ["Display wall", "Cashier counter", "Retail lighting", "Product plinths"],
    materials: ["Travertine", "Lacquered panels", "Glass", "Brushed metal"],
    highlightsZh: ["产品展示更聚焦", "门店更像品牌空间", "灯光更适合转化"],
    highlightsEn: ["Focused product display", "Brand-like retail space", "Lighting designed for conversion"],
  },
  {
    slug: "sri-petaling-beauty-salon-fit-out",
    type: "Commercial",
    titleZh: "斯里八打灵美容沙龙装修",
    titleEn: "Sri Petaling Beauty Salon Fit-Out",
    location: "Sri Petaling, Kuala Lumpur",
    area: "1,180 sq ft",
    duration: "6 weeks",
    budget: "Salon fit-out",
    excerptZh: "美容沙龙采用柔和拱形、镜面区和展示层板，呈现干净精致的服务体验。",
    excerptEn: "A refined salon fit-out with soft arches, styling mirrors, and display shelving.",
    scope: ["Salon reception", "Styling zone", "Display shelving", "Lighting design"],
    materials: ["Microcement", "Terrazzo", "Ribbed glass", "Champagne metal"],
    highlightsZh: ["空间更适合拍照传播", "镜面区更明亮", "接待体验更精致"],
    highlightsEn: ["More shareable salon environment", "Brighter mirror zones", "Refined client experience"],
  },
  {
    slug: "kl-showroom-gallery-renovation",
    type: "Commercial",
    titleZh: "吉隆坡材料展厅装修",
    titleEn: "Kuala Lumpur Showroom Gallery Renovation",
    location: "Kuala Lumpur",
    area: "1,450 sq ft",
    duration: "7 weeks",
    budget: "Showroom renovation",
    excerptZh: "展厅通过石材样板墙、洽谈桌和展示柜，让客户看材料时更有信任感。",
    excerptEn: "A showroom gallery with material display walls, consultation tables, and refined storage.",
    scope: ["Material displays", "Consultation table", "Storage wall", "Gallery lighting"],
    materials: ["Marble slabs", "Timber veneer", "Metal frames", "Glass partitions"],
    highlightsZh: ["材料展示更专业", "客户洽谈更顺畅", "空间质感更强"],
    highlightsEn: ["More professional material display", "Smoother client consultation", "Stronger showroom presence"],
  },
  {
    slug: "bangsar-walk-in-wardrobe-system",
    type: "Built-In",
    titleZh: "孟沙步入式衣帽间定制",
    titleEn: "Bangsar Walk-In Wardrobe System",
    location: "Bangsar, Kuala Lumpur",
    area: "260 sq ft",
    duration: "4 weeks",
    budget: "Custom wardrobe system",
    excerptZh: "玻璃门、岛台抽屉和灯带结合，做出高级衣帽间收纳体验。",
    excerptEn: "A walk-in wardrobe system with glass doors, island drawers, and integrated LED lighting.",
    scope: ["Wardrobe cabinetry", "Drawer island", "Lighting integration", "Glass doors"],
    materials: ["Dark walnut veneer", "Tinted glass", "Stone countertop", "Brushed metal"],
    highlightsZh: ["衣物收纳更清晰", "空间更像精品店", "灯光提升质感"],
    highlightsEn: ["Clearer wardrobe storage", "Boutique-like room feel", "Lighting improves the material quality"],
  },
  {
    slug: "subang-jaya-dry-wet-kitchen-cabinet",
    type: "Built-In",
    titleZh: "梳邦再也干湿厨房柜定制",
    titleEn: "Subang Jaya Dry and Wet Kitchen Cabinet",
    location: "Subang Jaya, Selangor",
    area: "420 sq ft",
    duration: "5 weeks",
    budget: "Custom kitchen cabinet",
    excerptZh: "干湿厨房分区、高柜和岛台组合，提升厨房收纳、烹饪和日常使用效率。",
    excerptEn: "A dry and wet kitchen cabinet system with tall storage, island planning, and practical workflow.",
    scope: ["Dry kitchen", "Wet kitchen partition", "Tall pantry", "Island cabinet"],
    materials: ["Quartz stone", "Matte laminate", "Fluted glass", "Brass handles"],
    highlightsZh: ["厨房动线更顺", "高柜容量更足", "台面更耐用易清理"],
    highlightsEn: ["Smoother kitchen workflow", "More tall storage", "Durable easy-clean counters"],
  },
  {
    slug: "kepong-tv-feature-wall-storage",
    type: "Built-In",
    titleZh: "甲洞电视背景墙与收纳柜",
    titleEn: "Kepong TV Feature Wall and Storage",
    location: "Kepong, Kuala Lumpur",
    area: "320 sq ft",
    duration: "3 weeks",
    budget: "Built-in TV wall",
    excerptZh: "电视墙把石材、木饰面、展示层板和隐藏收纳整合到一个完整视觉面。",
    excerptEn: "A built-in TV feature wall combining stone, timber, display shelving, and hidden storage.",
    scope: ["TV feature wall", "Floating console", "Display niche", "Cable concealment"],
    materials: ["Sintered stone", "Walnut veneer", "Matte laminate", "Glass shelves"],
    highlightsZh: ["电视墙更完整", "电线隐藏更干净", "客厅储物不外露"],
    highlightsEn: ["More complete TV wall", "Cleaner cable concealment", "Living storage kept hidden"],
  },
  {
    slug: "puchong-home-library-built-in",
    type: "Built-In",
    titleZh: "蒲种家庭书房柜定制",
    titleEn: "Puchong Home Library Built-In",
    location: "Puchong, Selangor",
    area: "300 sq ft",
    duration: "4 weeks",
    budget: "Home library cabinetry",
    excerptZh: "满墙书柜、书桌和阅读凳结合，让家庭书房兼顾展示、办公和收纳。",
    excerptEn: "A home library with full-height shelves, integrated desk, reading bench, and concealed storage.",
    scope: ["Bookcase", "Integrated desk", "Display lighting", "Storage bench"],
    materials: ["Timber veneer", "Matte laminate", "Glass cabinet doors", "Fabric bench"],
    highlightsZh: ["书房更有秩序", "展示与收纳结合", "办公区更舒适"],
    highlightsEn: ["More orderly study room", "Display and storage combined", "More comfortable work zone"],
  },
  {
    slug: "setia-alam-shoe-display-cabinet",
    type: "Built-In",
    titleZh: "实达阿南玄关鞋柜与展示柜",
    titleEn: "Setia Alam Shoe Display and Entry Cabinet",
    location: "Setia Alam, Selangor",
    area: "180 sq ft",
    duration: "3 weeks",
    budget: "Entry cabinet system",
    excerptZh: "玄关鞋柜结合坐凳、镜面和展示格，让入户区域更整齐、更有第一印象。",
    excerptEn: "An entry cabinet system with shoe storage, bench seating, mirror panels, and display niches.",
    scope: ["Shoe cabinet", "Entry bench", "Mirror panel", "Display niche"],
    materials: ["Light walnut veneer", "Mirror glass", "Textured stone", "Leather cushion"],
    highlightsZh: ["入户更整洁", "鞋柜容量更足", "展示区提升高级感"],
    highlightsEn: ["Cleaner foyer", "More shoe storage", "Display area improves the entry impression"],
  },
  {
    slug: "puchong-heavy-duty-warehouse-racking",
    type: "Warehouse",
    titleZh: "蒲种重型仓储货架工程",
    titleEn: "Puchong Heavy-Duty Warehouse Racking",
    location: "Puchong, Selangor",
    area: "5,800 sq ft",
    duration: "5 weeks",
    budget: "Warehouse racking installation",
    excerptZh: "重型货架与通道规划同步处理，让仓库容量、动线和安全性更稳定。",
    excerptEn: "A heavy-duty warehouse racking project planned around storage capacity, aisle flow, and safety.",
    scope: ["Pallet racking", "Aisle planning", "Floor marking", "Storage zoning"],
    materials: ["Powder-coated steel", "Concrete floor coating", "Safety marking paint", "Metal guardrail"],
    highlightsZh: ["仓储容量提升", "叉车通道更清楚", "现场更整洁安全"],
    highlightsEn: ["Higher storage capacity", "Clearer forklift aisles", "Cleaner and safer site flow"],
  },
  {
    slug: "shah-alam-logistics-packing-zone",
    type: "Warehouse",
    titleZh: "莎阿南物流打包区规划",
    titleEn: "Shah Alam Logistics Packing Zone",
    location: "Shah Alam, Selangor",
    area: "2,200 sq ft",
    duration: "4 weeks",
    budget: "Logistics packing zone",
    excerptZh: "打包台、暂存区和出货动线重新规划，提高物流仓库日常操作效率。",
    excerptEn: "A logistics packing zone with benches, staging areas, and clearer dispatch circulation.",
    scope: ["Packing benches", "Dispatch staging", "Overhead shelving", "Workflow planning"],
    materials: ["Plywood worktops", "Powder-coated steel", "Concrete sealer", "Storage bins"],
    highlightsZh: ["打包效率更高", "货物暂存更有序", "通道不容易拥堵"],
    highlightsEn: ["More efficient packing", "More ordered staging", "Less congestion in the aisles"],
  },
  {
    slug: "klang-industrial-storage-upgrade",
    type: "Warehouse",
    titleZh: "巴生工业仓库夹层升级",
    titleEn: "Klang Industrial Storage Upgrade",
    location: "Klang, Selangor",
    area: "4,600 sq ft",
    duration: "6 weeks",
    budget: "Warehouse mezzanine and storage",
    excerptZh: "通过夹层平台和模块化货架，把仓库垂直空间利用起来，减少地面堆放。",
    excerptEn: "A warehouse storage upgrade using mezzanine platforms and modular shelving to use vertical space.",
    scope: ["Mezzanine platform", "Steel staircase", "Modular shelving", "Industrial safety upgrade"],
    materials: ["Galvanized steel", "Mesh decking", "Concrete", "Powder-coated rails"],
    highlightsZh: ["垂直空间利用更好", "地面堆放减少", "仓库动线更安全"],
    highlightsEn: ["Better use of vertical space", "Less floor stacking", "Safer warehouse flow"],
  },
  {
    slug: "balakong-warehouse-office-corner",
    type: "Warehouse",
    titleZh: "无拉港仓库办公室角落改造",
    titleEn: "Balakong Warehouse Office Corner",
    location: "Balakong, Selangor",
    area: "760 sq ft",
    duration: "4 weeks",
    budget: "Warehouse office fit-out",
    excerptZh: "在仓库内加入玻璃办公室和收纳区，让现场管理、开会和文件存放更方便。",
    excerptEn: "A warehouse office corner with glass partitions, admin desks, and practical storage near the operation area.",
    scope: ["Glass office", "Admin desks", "Filing cabinets", "Storage interface"],
    materials: ["Aluminium glass partition", "Laminate cabinetry", "Steel racks", "Concrete floor"],
    highlightsZh: ["仓库管理更方便", "办公区不影响仓储", "文件和工具更好收纳"],
    highlightsEn: ["Easier warehouse management", "Office zone kept separate from storage", "Better file and tool storage"],
  },
  {
    slug: "cheras-stockroom-shelving-system",
    type: "Warehouse",
    titleZh: "蕉赖店铺后场库房货架",
    titleEn: "Cheras Stockroom Shelving System",
    location: "Cheras, Kuala Lumpur",
    area: "520 sq ft",
    duration: "3 weeks",
    budget: "Stockroom shelving",
    excerptZh: "小型后场库房用墙面货架、打包台和分类收纳提升日常补货效率。",
    excerptEn: "A compact stockroom shelving system with wall shelves, packing counter, and organized back-of-house storage.",
    scope: ["Wall shelving", "Packing counter", "Overhead storage", "Back-of-house planning"],
    materials: ["Melamine board", "Powder-coated brackets", "Plywood", "Epoxy floor"],
    highlightsZh: ["小库房更好找货", "补货动线更清楚", "空间利用更充分"],
    highlightsEn: ["Easier stock finding", "Clearer restocking flow", "Better use of compact storage space"],
  },
  {
    slug: "cheras-glass-shopfront-facade",
    type: "Exterior",
    titleZh: "蕉赖玻璃店面门头翻新",
    titleEn: "Cheras Glass Shopfront Facade",
    location: "Cheras, Kuala Lumpur",
    area: "980 sq ft facade",
    duration: "4 weeks",
    budget: "Shopfront facade renovation",
    excerptZh: "玻璃入口、石材立面和金属雨棚组合，让店面第一眼更干净高级。",
    excerptEn: "A shopfront facade renovation with glass entrance, stone cladding, and a refined metal canopy.",
    scope: ["Glass entrance", "Facade cladding", "Canopy", "Exterior lighting"],
    materials: ["Tempered glass", "Aluminium frame", "Stone cladding", "Metal canopy"],
    highlightsZh: ["门头更有商业质感", "入口更通透", "夜间照明更醒目"],
    highlightsEn: ["More premium shopfront impression", "Clearer entrance visibility", "Better evening lighting"],
  },
  {
    slug: "ampang-landed-exterior-repaint",
    type: "Exterior",
    titleZh: "安邦有地住宅外墙翻新",
    titleEn: "Ampang Landed Exterior Repaint",
    location: "Ampang, Selangor",
    area: "2-storey exterior",
    duration: "5 weeks",
    budget: "Exterior repaint and refresh",
    excerptZh: "外墙重新配色，结合石材柱和门廊灯光，让住宅外观更耐看、更有价值感。",
    excerptEn: "A landed home exterior refresh with new paint colours, stone features, and warm porch lighting.",
    scope: ["Exterior repaint", "Stone feature", "Porch lighting", "Driveway refresh"],
    materials: ["Exterior paint", "Textured stone", "Aluminium gate", "Concrete sealer"],
    highlightsZh: ["外观更干净耐看", "门廊层次更好", "旧屋感明显减少"],
    highlightsEn: ["Cleaner lasting exterior look", "Better porch depth", "Less dated appearance"],
  },
  {
    slug: "sri-petaling-signage-canopy-upgrade",
    type: "Exterior",
    titleZh: "斯里八打灵店铺雨棚与立面升级",
    titleEn: "Sri Petaling Signage Canopy Upgrade",
    location: "Sri Petaling, Kuala Lumpur",
    area: "1,200 sq ft facade",
    duration: "4 weeks",
    budget: "Commercial facade upgrade",
    excerptZh: "立面板、雨棚和外墙灯光统一处理，让店铺门面更完整、更适合商业引流。",
    excerptEn: "A commercial facade upgrade with cladding panels, canopy work, and coordinated exterior lighting.",
    scope: ["Facade panels", "Canopy works", "Exterior lighting", "Entrance finishing"],
    materials: ["Aluminium composite panel", "Glass", "Stone tile", "Exterior paint"],
    highlightsZh: ["商业门面更统一", "雨棚更实用", "夜间识别度提升"],
    highlightsEn: ["More unified commercial frontage", "More practical canopy", "Improved evening visibility"],
  },
  {
    slug: "petaling-jaya-aluminium-glass-entrance",
    type: "Exterior",
    titleZh: "八打灵再也铝框玻璃入口工程",
    titleEn: "Petaling Jaya Aluminium Glass Entrance",
    location: "Petaling Jaya, Selangor",
    area: "860 sq ft entrance",
    duration: "4 weeks",
    budget: "Entrance glazing upgrade",
    excerptZh: "办公室入口采用铝框玻璃、石材门套和遮雨结构，提升专业第一印象。",
    excerptEn: "An office entrance upgrade with aluminium glazing, stone portal, and a covered arrival area.",
    scope: ["Aluminium glazing", "Stone portal", "Covered entrance", "Exterior steps"],
    materials: ["Aluminium frame", "Laminated glass", "Limestone cladding", "Porcelain tiles"],
    highlightsZh: ["入口更专业", "玻璃门更通透", "客户到访体验更好"],
    highlightsEn: ["More professional entrance", "Clearer glazed frontage", "Better client arrival experience"],
  },
  {
    slug: "setia-alam-gate-wall-feature",
    type: "Exterior",
    titleZh: "实达阿南围墙与大门特色工程",
    titleEn: "Setia Alam Gate Wall Feature",
    location: "Setia Alam, Selangor",
    area: "Front boundary wall",
    duration: "5 weeks",
    budget: "Gate and wall feature",
    excerptZh: "围墙、大门和景观灯光统一设计，让住宅外部更完整、更有高级感。",
    excerptEn: "A landed home gate and boundary wall feature with coordinated lighting and premium finishes.",
    scope: ["Boundary wall", "Automatic gate", "Feature screen", "Landscape lighting"],
    materials: ["Powder-coated metal", "Textured stone", "Timber-look screen", "Concrete pavers"],
    highlightsZh: ["门面更完整", "夜景更有层次", "安全和美观兼顾"],
    highlightsEn: ["More complete frontage", "Layered evening lighting", "Security and appearance balanced"],
  },
  {
    slug: "petaling-jaya-corporate-office-fit-out",
    type: "Office",
    titleZh: "八打灵再也企业办公室前台装修",
    titleEn: "Petaling Jaya Corporate Office Fit-Out",
    location: "Petaling Jaya, Selangor",
    area: "2,100 sq ft",
    duration: "7 weeks",
    budget: "Corporate office fit-out",
    excerptZh: "企业前台、玻璃会议室和等候区统一设计，提升客户到访的专业感。",
    excerptEn: "A corporate office fit-out with reception, glass meeting rooms, and refined waiting areas.",
    scope: ["Reception", "Meeting rooms", "Waiting lounge", "Office lighting"],
    materials: ["Stone counter", "Timber veneer", "Glass partitions", "Acoustic panels"],
    highlightsZh: ["前台更有公司形象", "会议室更通透", "客户等待区更舒适"],
    highlightsEn: ["Stronger reception image", "More transparent meeting rooms", "More comfortable waiting area"],
  },
  {
    slug: "cyberjaya-tech-office-renovation",
    type: "Office",
    titleZh: "赛城科技办公室装修",
    titleEn: "Cyberjaya Tech Office Renovation",
    location: "Cyberjaya, Selangor",
    area: "3,400 sq ft",
    duration: "8 weeks",
    budget: "Open office renovation",
    excerptZh: "开放办公区、会议舱和协作区结合，让科技团队空间更明亮、更高效。",
    excerptEn: "A tech office renovation with open desks, meeting pods, collaboration areas, and cable-conscious planning.",
    scope: ["Open office", "Meeting pod", "Collaboration area", "Cable management"],
    materials: ["Acoustic panels", "Glass partitions", "Carpet tiles", "Metal frames"],
    highlightsZh: ["办公区更明亮", "协作区更清楚", "线缆更好管理"],
    highlightsEn: ["Brighter open office", "Clearer collaboration zones", "Better cable management"],
  },
  {
    slug: "mont-kiara-consulting-office-suite",
    type: "Office",
    titleZh: "满家乐咨询公司办公室套间",
    titleEn: "Mont Kiara Consulting Office Suite",
    location: "Mont Kiara, Kuala Lumpur",
    area: "1,520 sq ft",
    duration: "6 weeks",
    budget: "Professional office suite",
    excerptZh: "小型咨询办公室加入接待、独立办公室和洽谈区，整体更稳重专业。",
    excerptEn: "A professional consulting office suite with reception lounge, private office, and discussion area.",
    scope: ["Reception lounge", "Private office", "Discussion table", "Storage wall"],
    materials: ["Walnut veneer", "Stone desktop", "Glass partitions", "Carpet tile"],
    highlightsZh: ["空间更适合接待客户", "独立办公室更安静", "整体形象更稳重"],
    highlightsEn: ["Better for client visits", "Quieter private office", "More refined professional image"],
  },
  {
    slug: "bangsar-coworking-space-planning",
    type: "Office",
    titleZh: "孟沙联合办公空间规划",
    titleEn: "Bangsar Coworking Space Planning",
    location: "Bangsar, Kuala Lumpur",
    area: "2,850 sq ft",
    duration: "7 weeks",
    budget: "Coworking space renovation",
    excerptZh: "联合办公空间把开放工位、电话亭、休闲区和茶水区做成灵活组合。",
    excerptEn: "A coworking renovation with flexible desks, phone booths, lounge seating, and pantry integration.",
    scope: ["Flexible desks", "Phone booths", "Lounge zone", "Pantry edge"],
    materials: ["Timber veneer", "Acoustic panels", "Glass pods", "Fabric seating"],
    highlightsZh: ["空间使用更灵活", "安静通话区更清楚", "办公氛围更轻松"],
    highlightsEn: ["More flexible space use", "Clearer quiet call zones", "More relaxed work atmosphere"],
  },
  {
    slug: "kl-sentral-meeting-room-pantry-upgrade",
    type: "Office",
    titleZh: "吉隆坡中环会议室与茶水间升级",
    titleEn: "KL Sentral Meeting Room and Pantry Upgrade",
    location: "KL Sentral, Kuala Lumpur",
    area: "880 sq ft",
    duration: "4 weeks",
    budget: "Meeting room and pantry upgrade",
    excerptZh: "会议室和茶水间连贯升级，让办公室日常会议、接待和休息更方便。",
    excerptEn: "A meeting room and pantry upgrade designed for better daily meetings, hosting, and team breaks.",
    scope: ["Meeting room", "Pantry counter", "Glass partition", "Storage cabinet"],
    materials: ["Quartz counter", "Timber veneer", "Glass partition", "Acoustic fabric"],
    highlightsZh: ["会议空间更正式", "茶水区更干净", "储物与使用更顺手"],
    highlightsEn: ["More formal meeting space", "Cleaner pantry area", "Storage and use are more convenient"],
  },
];

if (projects.length !== sourceFiles.length) {
  throw new Error(`Project/image count mismatch: ${projects.length} projects, ${sourceFiles.length} images`);
}

function loadEnv() {
  const envPath = ".env";
  if (!fsSync.existsSync(envPath)) return;
  const envText = fsSync.readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

async function prepareImages() {
  await fs.mkdir(LOCAL_IMAGE_DIR, { recursive: true });
  const output = [];

  for (const [index, project] of projects.entries()) {
    const source = path.join(GENERATED_IMAGE_DIR, sourceFiles[index]);
    const target = path.join(LOCAL_IMAGE_DIR, `${project.slug}.webp`);
    await sharp(source)
      .resize(1600, 1200, { fit: "cover", position: "attention" })
      .webp({ quality: 82, effort: 6 })
      .toFile(target);

    const stat = await fs.stat(target);
    const meta = await sharp(target).metadata();
    output.push({
      slug: project.slug,
      target,
      sizeBytes: stat.size,
      width: meta.width,
      height: meta.height,
    });
  }

  return output;
}

function buildContent(project) {
  return {
    zh: `${project.excerptZh}\n\n施工重点包括：${project.scope.join("、")}。材料建议：${project.materials.join("、")}。`,
    en: `${project.excerptEn}\n\nScope includes: ${project.scope.join(", ")}. Recommended materials: ${project.materials.join(", ")}.`,
  };
}

async function signInAdmin() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !anonKey) throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  if (!email || !password) throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD");

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError) throw adminError;
  if (!isAdmin) throw new Error("Signed-in user is not an active admin");

  return { supabase, userId: data.user?.id };
}

async function uploadImage(supabase, project, prepared) {
  const objectPath = `${STORAGE_PREFIX}/${project.slug}.webp`;
  const bytes = await fs.readFile(prepared.target);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
}

async function publishPortfolio() {
  const preparedImages = await prepareImages();
  const { supabase, userId } = await signInAdmin();
  const activeSlugs = new Set(projects.map((project) => project.slug));
  const publishedProjectIds = [];

  const { data: existingRows, error: existingError } = await supabase
    .from("projects")
    .select("id,slug,status");
  if (existingError) throw existingError;

  for (const row of existingRows || []) {
    if (row.status === "published" && !activeSlugs.has(row.slug)) {
      const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", row.id);
      if (error) throw error;
    }
  }

  for (const [index, project] of projects.entries()) {
    const prepared = preparedImages[index];
    const { objectPath, publicUrl } = await uploadImage(supabase, project, prepared);
    const content = buildContent(project);
    const sortOrder = index + 1;

    const payload = {
      slug: project.slug,
      title_zh: project.titleZh,
      title_en: project.titleEn,
      excerpt_zh: project.excerptZh,
      excerpt_en: project.excerptEn,
      content_zh: content.zh,
      content_en: content.en,
      location: project.location,
      area: project.area,
      duration: project.duration,
      budget: project.budget,
      project_type: project.type,
      materials: project.materials,
      scope: project.scope,
      highlights_zh: project.highlightsZh,
      highlights_en: project.highlightsEn,
      client_need_zh: "客户希望空间看起来更高级，同时保留实用收纳、施工耐用性和清晰预算。",
      client_need_en: "The client needed a more premium look while keeping practical storage, durable workmanship, and clear budgeting.",
      seo_title_zh: `${project.titleZh} | FLASH CAST 装修案例`,
      seo_title_en: `${project.titleEn} | FLASH CAST Renovation Project`,
      seo_description_zh: project.excerptZh,
      seo_description_en: project.excerptEn,
      status: "published",
      sort_order: sortOrder,
      image_url: publicUrl,
    };

    const { data: saved, error: projectError } = await supabase
      .from("projects")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .single();
    if (projectError) throw projectError;

    const { error: imageDeleteError } = await supabase
      .from("project_images")
      .delete()
      .eq("project_id", saved.id);
    if (imageDeleteError) throw imageDeleteError;

    const imagePayload = {
      project_id: saved.id,
      image_url: publicUrl,
      image_type: "cover",
      alt_zh: `${project.titleZh}案例封面`,
      alt_en: `${project.titleEn} project cover`,
      sort_order: 0,
    };
    const { error: imageInsertError } = await supabase.from("project_images").insert(imagePayload);
    if (imageInsertError) throw imageInsertError;

    const { error: assetDeleteError } = await supabase
      .from("media_assets")
      .delete()
      .eq("file_path", objectPath);
    if (assetDeleteError) throw assetDeleteError;

    const { error: assetInsertError } = await supabase.from("media_assets").insert({
      file_url: publicUrl,
      file_path: objectPath,
      file_name: `${project.slug}.webp`,
      mime_type: "image/webp",
      size_bytes: prepared.sizeBytes,
      width: prepared.width,
      height: prepared.height,
      folder: STORAGE_PREFIX,
      alt_zh: `${project.titleZh}案例封面`,
      alt_en: `${project.titleEn} project cover`,
      usage_type: "project-cover",
      created_by: userId,
    });
    if (assetInsertError) throw assetInsertError;

    publishedProjectIds.push(saved.id);
  }

  const { data: verificationRows, error: verificationError } = await supabase
    .from("projects")
    .select("id,slug,project_type,status,project_images(image_url,image_type)")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (verificationError) throw verificationError;

  const counts = {};
  for (const row of verificationRows || []) {
    counts[row.project_type] = (counts[row.project_type] || 0) + 1;
  }

  return {
    preparedImages: preparedImages.length,
    uploadedBucket: BUCKET,
    storagePrefix: STORAGE_PREFIX,
    publishedProjects: publishedProjectIds.length,
    counts,
  };
}

const mode = process.argv[2] || "publish";

if (mode === "prepare") {
  const result = await prepareImages();
  console.log(JSON.stringify({ preparedImages: result.length, localDir: LOCAL_IMAGE_DIR, images: result }, null, 2));
} else if (mode === "publish") {
  const result = await publishPortfolio();
  console.log(JSON.stringify(result, null, 2));
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
