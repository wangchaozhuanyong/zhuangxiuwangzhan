import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { buildTopicClusterBlogRecord, topicClusterBlogConfigs } from "./topic-cluster-blog-records.mjs";
import { lockedR3Candidates } from "./managed-cms-targets-r3-v2.mjs";
import { lockedKlMediaCandidates } from "./managed-cms-targets-kl-media-v1.mjs";
import { lockedBlogMediaCandidates } from "./managed-cms-targets-blog-media-v1.mjs";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const target = args.find((arg) => arg.startsWith("--target="))?.slice("--target=".length) || "";
const approvalId = args.find((arg) => arg.startsWith("--approval-id="))?.slice("--approval-id=".length) || "";
const managedPermitId = args.find((arg) => arg.startsWith("--managed-permit-id="))?.slice("--managed-permit-id=".length) || "";
const rollbackFrom = args.find((arg) => arg.startsWith("--rollback-from="))?.slice("--rollback-from=".length) || "";
const envDir = path.resolve(args.find((arg) => arg.startsWith("--env-dir="))?.slice("--env-dir=".length) || process.cwd());
const artifactRoot = path.resolve(
  args.find((arg) => arg.startsWith("--artifact-dir="))?.slice("--artifact-dir=".length)
    || path.join(process.cwd(), "audits", "content-trust-20260821"),
);

const fail = (message) => {
  throw new Error(message);
};

const serviceFields = [
  "id", "slug", "status", "updated_at", "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en",
  "image_url", "alt_zh", "alt_en", "suitable_for_zh", "suitable_for_en", "common_projects_zh", "common_projects_en",
  "scope_items_zh", "scope_items_en", "process_steps_zh", "process_steps_en", "faqs_zh", "faqs_en", "seo_title_zh",
  "seo_title_en", "seo_description_zh", "seo_description_en", "sort_order",
];

const serviceAreaFields = [
  "id", "slug", "status", "updated_at", "title_zh", "title_en", "excerpt_zh", "excerpt_en",
  "content_zh", "content_en", "area_name", "property_types", "common_needs", "construction_notes_zh",
  "construction_notes_en", "projects", "faqs_zh", "faqs_en", "seo_title_zh", "seo_title_en",
  "seo_description_zh", "seo_description_en", "sort_order",
];

const blogFields = [
  "id", "slug", "status", "updated_at", "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en",
  "category", "tags", "cover_image_url", "alt_zh", "alt_en", "seo_title_zh", "seo_title_en", "seo_description_zh",
  "seo_description_en", "published_at", "sort_order",
];

const projectFields = [
  "id", "slug", "status", "updated_at", "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en",
  "image_url", "location", "area", "duration", "budget", "project_type", "materials", "scope", "highlights_zh", "highlights_en",
  "client_need_zh", "client_need_en", "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en", "sort_order",
];

const sitePageFields = [
  "id", "page_key", "path", "status", "updated_at", "title_zh", "title_en", "subtitle_zh", "subtitle_en", "description_zh",
  "description_en", "content_zh", "content_en", "cta_title_zh", "cta_title_en", "cta_description_zh", "cta_description_en",
  "image_url", "alt_zh", "alt_en", "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en",
  "seo_keywords_zh", "seo_keywords_en", "items_zh", "items_en", "sort_order",
];

const officeRecord = (current) => ({
  ...current,
  title_zh: "马来西亚办公室装修与商业空间规划",
  title_en: "Office Renovation & Commercial Fit-Out Malaysia",
  excerpt_zh: "为吉隆坡、雪兰莪与巴生谷的办公室和商业空间整理布局、隔间、前台、会议室、工作站、灯光、机电协调与报价范围。",
  excerpt_en: "Plan office renovation and commercial fit-out across Kuala Lumpur, Selangor and the Klang Valley, covering layout, partitions, reception, meeting rooms, workstations, lighting, M&E coordination and quotation scope.",
  content_zh: "办公室装修应先确认业务用途、员工人数、客户动线、管理处要求、搬入时间和真实现场条件。FLASH CAST 可协助整理接待区、会议室、工作站、隔间、灯光、地面、机电、局部定制柜和报价范围。最终价格、工期与审批要求以现场查看、确认范围和书面报价为准。",
  content_en: "Office renovation should begin with business use, headcount, customer flow, building-management requirements, move-in timing and the actual site condition. FLASH CAST can help organize reception, meeting rooms, workstations, partitions, lighting, flooring, M&E coordination, selected built-ins and quotation scope. Final price, programme and approval requirements depend on a site review, confirmed scope and written quotation.",
  alt_zh: "办公室前台与等候区规划效果图概念",
  alt_en: "Office reception and waiting-area rendering concept",
  suitable_for_zh: [
    "准备新办公室、诊所前区、展示空间或中小企业工作空间的业主",
    "搬迁、扩充或重新整理现有办公室的企业",
    "需要规划接待区、会议室、工作站、茶水间与收纳的商业客户",
    "希望先整理装修范围，再进入详细报价的商业租户或经营者",
  ],
  suitable_for_en: [
    "Businesses setting up a new office, clinic front area, showroom or SME workspace",
    "Companies relocating, expanding or refreshing an existing office",
    "Commercial owners planning reception, meeting rooms, workstations, pantry and storage",
    "Tenants who want to organize the fit-out scope before requesting a detailed quotation",
  ],
  common_projects_zh: [
    "新办公室装修范围规划",
    "接待区、会议室与工作站布局",
    "玻璃或石膏隔间与功能分区",
    "灯光、地面、数据点与机电协调",
    "品牌墙、柜台、茶水间与收纳方向",
    "基于真实现场条件的报价前准备",
  ],
  common_projects_en: [
    "New office fit-out scope planning",
    "Reception, meeting-room and workstation layouts",
    "Glass or gypsum partitions and functional zoning",
    "Lighting, flooring, data-point and M&E coordination",
    "Brand wall, counter, pantry and storage direction",
    "Quotation preparation based on actual site conditions",
  ],
  scope_items_zh: [
    "办公室布局与客户动线规划",
    "玻璃或石膏隔间方向",
    "接待区、会议室与工作站设置",
    "茶水间、收纳与柜台规划",
    "天花、灯光、地面与墙面方向",
    "数据点、电路与机电范围确认",
    "品牌墙、招牌方向与局部定制柜",
    "需要时确认大楼或管理处要求",
    "清楚标注的办公室设计或效果图概念",
    "基于现场条件整理报价资料",
  ],
  scope_items_en: [
    "Office layout and customer-flow planning",
    "Glass or gypsum partition direction",
    "Reception, meeting-room and workstation setup",
    "Pantry, storage and counter planning",
    "Ceiling, lighting, flooring and wall-finish direction",
    "Data-point, electrical and M&E scope review",
    "Brand-wall, signage direction and selected built-ins",
    "Building-management requirement review where relevant",
    "Clearly labeled office design or rendering concepts",
    "Quotation preparation based on actual site conditions",
  ],
  process_steps_zh: [
    { title: "确认业务用途", desc: "了解办公室类型、员工人数、客户动线、搬入方向与主要使用需求。" },
    { title: "查看真实现场", desc: "确认尺寸、现况、进场限制、管理规则、隔间、机电点位与保留项目。" },
    { title: "整理布局重点", desc: "规划接待区、会议室、工作站、茶水间、收纳与日常动线。" },
    { title: "确认范围方向", desc: "整理隔间、灯光、地面、天花、品牌墙、柜台与数据点等报价项目。" },
    { title: "进入报价沟通", desc: "在使用范围、现场条件与施工优先级清楚后，再准备书面报价。" },
  ],
  process_steps_en: [
    { title: "Confirm Business Use", desc: "Review office type, headcount, customer flow, move-in direction and key operational needs." },
    { title: "Review the Real Site", desc: "Confirm dimensions, condition, access, building rules, partitions, M&E points and retained items." },
    { title: "Organize Layout Priorities", desc: "Plan reception, meeting rooms, workstations, pantry, storage and daily circulation." },
    { title: "Define Scope Direction", desc: "Organize partitions, lighting, flooring, ceiling, brand wall, counters and data points for quotation." },
    { title: "Prepare the Quotation", desc: "Move into a written quotation after use, site conditions and work priorities are clear." },
  ],
  faqs_zh: [
    { q: "办公室装修前要准备什么？", a: "建议准备平面图或现场照片、面积、业务用途、员工人数、管理处要求、预算方向和预计搬入时间。" },
    { q: "哪些因素会影响办公室装修报价？", a: "面积、隔间、机电与数据点、灯光、地面、柜台、品牌墙、施工时段和材料选择都会影响范围与报价。" },
    { q: "可以先做办公室设计方案或效果图吗？", a: "可以。布局概念和效果图可用于前期规划，但必须清楚标注，不能作为真实完工项目或客户案例证明。" },
    { q: "可以协助整理管理处或审批资料吗？", a: "可按已确认项目范围讨论所需图纸与资料；具体要求、责任、费用和时间以大楼管理方或相关单位的实际规定为准。" },
    { q: "怎样开始办公室装修咨询？", a: "提交空间照片或平面图、面积、用途、员工人数、地点和预计时间，先确认是否需要现场查看。" },
  ],
  faqs_en: [
    { q: "What should I prepare before an office renovation?", a: "Prepare a floor plan or site photos, floor area, business use, headcount, building requirements, budget direction and intended move-in timing." },
    { q: "What affects an office renovation quotation?", a: "Area, partitions, M&E and data points, lighting, flooring, counters, brand walls, work-hour restrictions and material choices all affect scope and quotation." },
    { q: "Can we prepare office design or rendering concepts first?", a: "Yes. Layout and rendering concepts can support early planning, but they must be clearly labeled and cannot be used as proof of a completed customer project." },
    { q: "Can you help organize management or approval documents?", a: "Required drawings and documents can be discussed against the confirmed project scope. Exact requirements, responsibility, cost and timing depend on the building management or relevant authority." },
    { q: "How do I start an office renovation enquiry?", a: "Share site photos or a floor plan, floor area, business use, headcount, location and intended timing so the need for a site review can be confirmed." },
  ],
  seo_title_zh: "马来西亚办公室装修与商业空间规划 | FLASH CAST",
  seo_title_en: "Office Renovation & Commercial Fit-Out Malaysia | FLASH CAST",
  seo_description_zh: "了解吉隆坡、雪兰莪与巴生谷办公室装修和商业 fit-out 的布局、隔间、前台、会议室、机电协调、报价因素与咨询步骤。",
  seo_description_en: "Plan an office renovation or commercial fit-out in Kuala Lumpur and Selangor. Review layouts, partitions, reception, M&E coordination, quotation factors and next steps.",
  status: "published",
});

const montKiaraConceptRecord = (current) => ({
  ...current,
  title_zh: "高级公寓客餐厅设计效果图概念",
  title_en: "Luxury Condo Living & Dining Rendering Concept",
  excerpt_zh: "以石材、木饰面、隐藏灯带和收纳方向构成的高级公寓客餐厅效果图概念；不作为真实完工项目或客户案例证明。",
  excerpt_en: "A luxury condo living-and-dining rendering concept exploring stone, timber veneer, concealed lighting and storage direction. It is not a completed project or customer case.",
  content_zh: "本设计效果图概念用于讨论客餐厅布局、背景墙、定制收纳和分层灯光方向。图片不代表真实完工现场、客户项目、固定材料、预算或工期；最终方案以真实空间、现场条件和确认范围为准。",
  content_en: "This rendering concept explores living-and-dining layout, feature-wall composition, built-in storage and layered lighting. It does not represent a completed site, customer project, fixed material selection, budget or timeline. Final decisions depend on the real space, site conditions and confirmed scope.",
  client_need_zh: "规划说明：在保持日常收纳与动线的前提下，探索石材、木饰面和暖色灯光的空间方向。",
  client_need_en: "Planning brief: explore stone, timber veneer and warm lighting while keeping practical storage and circulation.",
  duration: null,
  budget: null,
  location: null,
  area: null,
  materials: ["Sintered stone direction", "Walnut veneer direction", "Matte laminate direction", "Warm LED lighting direction"],
  scope: ["Living and dining layout concept", "Feature-wall direction", "Built-in storage planning", "Lighting concept"],
  highlights_zh: ["客餐厅布局更开阔", "隐藏收纳减少视觉杂乱", "分层灯光形成温暖氛围"],
  highlights_en: ["Open living-and-dining planning", "Concealed storage direction", "Layered lighting for a warm atmosphere"],
  seo_title_zh: "高级公寓客餐厅效果图概念 | FLASH CAST",
  seo_title_en: "Luxury Condo Living & Dining Rendering Concept | FLASH CAST",
  seo_description_zh: "查看高级公寓客餐厅效果图概念，了解布局、背景墙、收纳与灯光方向。页面明确标注为规划参考，不是真实完工客户案例。",
  seo_description_en: "Explore a luxury condo living-and-dining rendering concept for layout, feature walls, storage and lighting. Clearly labeled as planning reference, not a completed customer project.",
  status: "published",
});

const aboutMetadataRecord = (current) => ({
  ...current,
  title_zh: "关于 FLASH CAST",
  title_en: "About FLASH CAST",
  description_zh: "了解 FLASH CAST 如何为住宅与商业空间整理装修范围、材料方向、现场协调和报价准备。",
  description_en: "Learn how FLASH CAST approaches renovation scope, material direction, site coordination and quotation preparation for homes and commercial spaces.",
  content_zh: "FLASH CAST 为吉隆坡与雪兰莪的住宅和商业空间提供装修规划与项目协调。最终价格、工期、材料和审批要求，以真实现场、确认范围与书面报价为准。",
  content_en: "FLASH CAST supports renovation planning and project coordination for homes and commercial spaces in Kuala Lumpur and Selangor. Final price, programme, materials and approval requirements depend on the real site, confirmed scope and written quotation.",
  seo_title_zh: "关于 FLASH CAST | 吉隆坡装修规划与项目协调",
  seo_title_en: "About FLASH CAST | Renovation Planning in Kuala Lumpur",
  seo_description_zh: "了解 FLASH CAST 如何为吉隆坡与雪兰莪住宅及商业空间整理装修范围、材料方向、现场协调与报价准备。",
  seo_description_en: "Learn how FLASH CAST approaches renovation planning, material decisions, site coordination and quotation preparation in Kuala Lumpur and Selangor.",
  seo_keywords_zh: "FLASH CAST 关于我们, 吉隆坡装修规划, 项目协调",
  seo_keywords_en: "about FLASH CAST, renovation planning Kuala Lumpur, project coordination",
  status: "published",
});

const withPublicFaqs = (current, faqsEn, faqsZh) => ({ ...current, faqs_en: faqsEn, faqs_zh: faqsZh, status: "published" });

const serviceFaqs = {
  design: {
    en: [
      { q: "What does interior design planning cover?", a: "It can cover layout flow, storage, lighting direction, material selection, built-in planning, visualization and coordination with the confirmed renovation scope." },
      { q: "What affects an interior design quotation?", a: "Space size, drawing and visualization needs, material decisions, revision scope and coordination requirements all affect the quotation." },
      { q: "Can design or rendering concepts be used for planning?", a: "Yes. Clearly labeled concepts can support planning, but they are not evidence of a completed customer project." },
      { q: "How do I start an interior design enquiry?", a: "Share a floor plan or site photos, approximate area, intended use, priorities, location and preferred timing." },
    ],
    zh: [
      { q: "室内设计规划包含哪些内容？", a: "可沟通动线、收纳、灯光、材料、定制木作、效果图与已确认装修范围的衔接。" },
      { q: "哪些因素会影响室内设计报价？", a: "空间面积、图纸与效果图需求、材料选择、修改范围和协调需求都会影响报价。" },
      { q: "可以先用设计或效果图概念讨论吗？", a: "可以。概念图会清楚标注为规划参考，不作为真实客户完工项目证明。" },
      { q: "如何开始室内设计咨询？", a: "提交平面图或现场照片、大致面积、用途、优先需求、地点与计划时间。" },
    ],
  },
  builtin: {
    en: [
      { q: "What built-in items can be planned?", a: "Kitchen cabinets, wardrobes, TV storage, shoe cabinets, study units and other fitted storage can be reviewed against actual dimensions and use." },
      { q: "What affects a built-in furniture quotation?", a: "Dimensions, finishes, hardware, internal accessories, countertop needs, edge details, access and site conditions affect the quotation." },
      { q: "Can a cabinet rendering be prepared first?", a: "Yes. A clearly labeled concept can help confirm layout and finish direction before final measurements and material approval." },
      { q: "How do I start a built-in enquiry?", a: "Share site photos, approximate dimensions, storage use, preferred finish, location and relevant appliance or equipment sizes." },
    ],
    zh: [
      { q: "可以规划哪些定制木作？", a: "可根据真实尺寸与使用需求，评估厨柜、衣柜、电视储物、鞋柜、书桌与其他固定收纳。" },
      { q: "哪些因素会影响定制家具报价？", a: "尺寸、饰面、五金、内部配件、台面、收边、进场与现场条件都会影响报价。" },
      { q: "可以先准备柜体效果图吗？", a: "可以。清楚标注的概念图可用于确认布局与饰面方向，最终以复尺与材料确认为准。" },
      { q: "如何开始定制木作咨询？", a: "提交现场照片、大致尺寸、收纳用途、饰面偏好、地点与相关家电或设备尺寸。" },
    ],
  },
  kitchen: {
    en: [
      { q: "What should be reviewed before a kitchen renovation?", a: "Review the layout, cooking habits, storage, appliances, electrical and plumbing points, wet-work condition, access and management requirements." },
      { q: "What affects a kitchen renovation quotation?", a: "Cabinet size, countertop, hardware, appliance points, plumbing, wet works, finishes, demolition and installation complexity affect the quotation." },
      { q: "Can I update only cabinets and countertops?", a: "Yes. That scope can be reviewed first, while connected plumbing, electrical, wall, floor or waterproofing-related work should be identified separately." },
      { q: "Are the kitchen renderings completed projects?", a: "Clearly labeled renderings are planning references, not proof of a completed customer project. Final decisions depend on the real site and approved materials." },
    ],
    zh: [
      { q: "厨房装修前应先检查什么？", a: "先了解布局、烹饪习惯、收纳、家电、水电点位、湿工状况、进场与管理要求。" },
      { q: "哪些因素会影响厨房装修报价？", a: "柜体尺寸、台面、五金、家电点位、水管、湿工、饰面、拆除与安装复杂度都会影响报价。" },
      { q: "可以只更换厨柜和台面吗？", a: "可以先评估这一范围；连动的水管、电位、墙地面或防水相关工作应另行标明。" },
      { q: "页面里的厨房效果图是完工项目吗？", a: "清楚标注的效果图只是规划参考，不作为真实客户完工项目证明。最终以现场与确认材料为准。" },
    ],
  },
};

for (const [key, value] of Object.entries({
  bathroom: {
    en: [
      ["Does bathroom leakage always require a full renovation?", "Not always. The right scope depends on the leak source, waterproofing, drainage, tiles and fittings. A site review should come first."],
      ["What affects a bathroom renovation quotation?", "Size, demolition, waterproofing, drainage, plumbing, tiles, fittings, shower screen, vanity and reinstatement needs affect the quotation."],
      ["Can a bathroom rendering be prepared first?", "Yes. A clearly labeled concept can support planning, but it is not proof of a completed customer project."],
      ["Does a condo bathroom renovation need management approval?", "Requirements vary by building. Confirm working hours, protection, deposits, forms and documents with the property management."],
    ],
    zh: [
      ["浴室漏水一定要全部翻新吗？", "不一定。合适范围取决于漏水来源、防水、排水、瓷砖与洁具，建议先查看现场。"],
      ["哪些因素会影响浴室装修报价？", "尺寸、拆除、防水、排水、水管、瓷砖、洁具、淋浴屏、浴室柜与恢复工程都会影响报价。"],
      ["可以先准备浴室效果图吗？", "可以。清楚标注的概念图可用于规划，但不作为真实客户完工项目证明。"],
      ["公寓浴室装修需要管理处批准吗？", "不同大楼要求不同，应向管理处确认施工时段、保护、押金、表格与所需资料。"],
    ],
  },
  "shop-renovation": {
    en: [
      ["What should be reviewed before a shop renovation?", "Review business use, customer flow, display, counter, storage, frontage, tenancy condition, M&E points and landlord or mall requirements."],
      ["Can a retail rendering be prepared first?", "Yes. Clearly labeled concepts can support planning, but they are not proof of a completed customer project."],
      ["Can approval or permit documents be discussed?", "Yes. Exact responsibility, fees, timing and outcome depend on the landlord, management or relevant authority."],
      ["How do I start a shop renovation enquiry?", "Share site photos or a floor plan, area, business type, tenancy condition, management guidelines, location and intended timing."],
    ],
    zh: [
      ["店铺装修前应先检查什么？", "先了解业务用途、客流、展示、柜台、收纳、门面、交钥状况、机电点位与业主或商场要求。"],
      ["可以先准备零售空间效果图吗？", "可以。清楚标注的概念图可用于规划，但不作为真实客户完工项目证明。"],
      ["可以讨论审批或准证资料吗？", "可以。具体职责、费用、时间与结果取决于业主、管理方或相关单位。"],
      ["如何开始店铺装修咨询？", "提交现场照片或平面图、面积、业务类型、交钥状况、管理指南、地点与计划时间。"],
    ],
  },
  warehouse: {
    en: [
      ["What information is needed for warehouse shelving planning?", "Share dimensions, ceiling height, goods and pallet sizes, load information, handling equipment, aisle needs and fire-safety constraints."],
      ["Can shelving be planned with supporting works?", "Yes. Rack layout can be discussed with storage zoning, lighting, partitions and selected supporting works after the scope is confirmed."],
      ["What affects quotation and programme?", "Area, rack type, verified loads, floor condition, aisle width, access, installation constraints and supporting works affect quotation and timing."],
      ["Can a layout concept be prepared first?", "Yes. Final design and capacity must use verified dimensions, loads, site conditions and applicable requirements."],
    ],
    zh: [
      ["仓库货架规划需要哪些资料？", "请提供尺寸、层高、货物与托盘尺寸、荷载资料、搬运设备、通道需求与消防限制。"],
      ["货架可以和配套工程一起规划吗？", "可以。确认范围后，可将货架布局与储物分区、灯光、隔间和部分配套工程一并讨论。"],
      ["哪些因素会影响报价和时间？", "面积、货架类型、已核实荷载、地面、通道、进场、安装限制与配套工程都会影响报价和时间。"],
      ["可以先准备布局概念吗？", "可以。最终设计与容量必须以已核实尺寸、荷载、现场条件与适用要求为准。"],
    ],
  },
})) {
  serviceFaqs[key] = {
    en: value.en.map(([q, a]) => ({ q, a })),
    zh: value.zh.map(([q, a]) => ({ q, a })),
  };
}

const serviceFaqRecord = (key) => (current) => ({
  ...withPublicFaqs(current, serviceFaqs[key].en, serviceFaqs[key].zh),
  ...(key === "kitchen" ? { image_url: "/images/services/kitchen-renovation.webp" } : {}),
});

const kitchenRecord = (current) => ({
  ...current,
  title_zh: "吉隆坡与雪兰莪厨房装修服务",
  title_en: "Kitchen Renovation in Kuala Lumpur & Selangor",
  excerpt_zh: "根据真实现场规划厨房动线、收纳、橱柜、台面、家电点位、给排水、湿作状况与书面报价范围。",
  excerpt_en: "Plan kitchen layout, storage, cabinets, countertop options, appliance points, plumbing, wet-work condition, and written quotation scope around the real site.",
  content_zh: "厨房装修不只是换橱柜，而是重新整理日常使用动线、收纳、台面、家电点位、给排水和湿作范围。FLASH CAST 可从现场测量、现有水电点位、干湿厨房分区、柜体结构、材料方向和报价范围开始整理；最终范围以真实现场与书面报价为准。",
  content_en: "Kitchen renovation should address daily workflow, storage, countertop use, appliance points, plumbing, and wet-work scope together. FLASH CAST can begin with site measurements, existing service points, dry and wet kitchen zoning, cabinet structure, material direction, and quotation scope. Final scope follows the real site and written quotation.",
  suitable_for_zh: [
    "旧厨房橱柜老化、台面损坏或收纳不足的业主",
    "想把公寓厨房升级成更实用布局的屋主",
    "有地住宅需要规划干湿厨房、岛台或高柜系统的客户",
    "准备旧屋翻新，同时需要厨房、浴室、水电和柜体一起协调的客户",
    "希望在报价前把柜体、家电、水电和湿作范围一起确认的屋主",
  ],
  suitable_for_en: [
    "Homeowners with old cabinets, damaged countertops, or poor kitchen storage",
    "Condo owners who want a more practical kitchen layout",
    "Landed-house owners planning wet and dry kitchen zones, island counters, or tall cabinets",
    "Old-house renovation clients coordinating kitchen, bathroom, wiring, plumbing, and cabinet work",
    "Homeowners who need cabinet, appliance, plumbing, and wet-work scope coordinated before quotation",
  ],
  common_projects_zh: [
    "公寓旧厨房翻新", "有地住宅干湿厨房改造", "厨房收纳与家电点位优化", "厨房橱柜与台面选择评估",
    "餐厨一体或开放式厨房规划", "厨房与饭厅局部升级", "厨房与饭厅使用动线规划", "清楚标注的厨房效果图或柜体规划概念",
  ],
  common_projects_en: [
    "Old condo kitchen upgrades", "Landed-home dry and wet kitchen renovation", "Kitchen storage and appliance-point improvements",
    "Kitchen cabinet and countertop option review", "Open kitchen or dining-kitchen layout planning", "Partial dining and kitchen upgrade work",
    "Kitchen and dining circulation planning", "Clearly labeled kitchen rendering or cabinet-planning concepts",
  ],
  scope_items_zh: [
    "现场测量与现有水电点位确认", "干厨房、湿厨房或开放式厨房布局建议", "地柜、吊柜、高柜、岛台或半岛台收纳规划",
    "台面、柜门、五金、背板和墙地面材料建议", "水槽、炉具、抽油烟机、冰箱、洗碗机等家电点位规划",
    "给排水、防水相关范围、瓷砖与湿作范围评估", "报价范围检查、施工协调和交付检查", "厨房装修设计方案效果图，不代表真实完工案例",
  ],
  scope_items_en: [
    "Site measurement and existing point checking", "Dry kitchen, wet kitchen, or open kitchen layout planning",
    "Base cabinet, wall cabinet, tall unit, island, or peninsula storage planning", "Countertop, cabinet door, hardware, backsplash, wall, and floor material advice",
    "Sink, hob, hood, fridge, dishwasher, and appliance point coordination", "Plumbing, waterproofing-related, tile, and wet-work scope review",
    "Quotation scope review, site coordination, and handover checking", "Kitchen renovation rendering concept, not a completed project photo",
  ],
  faqs_zh: [
    { q: "FLASH CAST 可以协助哪些厨房装修范围？", a: "可以协助检查公寓与有地住宅厨房、干湿厨房分区、橱柜布局、台面选择、家电点位、给排水、湿作和相关协调。最终范围以真实现场和书面报价为准。" },
    { q: "厨房装修报价会受什么影响？", a: "主要取决于橱柜尺寸、台面选择、五金、家电点位、给排水调整、湿作范围、墙地面处理、拆除和安装复杂度。" },
    { q: "是否可以只做厨房橱柜和台面？", a: "可以先评估橱柜、台面和家电点位是否能单独更新；如果涉及水电、墙地面或防水相关范围，需要一起确认施工边界。" },
    { q: "干厨房和湿厨房应该怎么规划？", a: "建议根据煮食频率、油烟、收纳、采光、用餐动线和家电清单规划。湿厨房偏实际烹饪，干厨房可承担备餐、展示和收纳功能。" },
    { q: "页面里的效果图方案是真实完工案例吗？", a: "不是。清楚标注的效果图只是规划参考，不作为真实客户完工项目证明。最终以现场与确认材料为准。" },
  ],
  faqs_en: [
    { q: "What kitchen renovation work can FLASH CAST help with?", a: "FLASH CAST can help review condo and landed-home kitchens, dry and wet kitchen zoning, cabinet layouts, countertop options, appliance points, plumbing, wet works, and related coordination. Final scope follows the real site and written quotation." },
    { q: "What affects a kitchen renovation quotation?", a: "Key factors include cabinet size, countertop choice, hardware, appliance points, plumbing changes, wet-work scope, wall and floor finishes, demolition, and installation complexity." },
    { q: "Can I update only kitchen cabinets and countertops?", a: "Yes, the cabinet and countertop scope can be reviewed first. If plumbing, electrical points, wall or floor finishes, or waterproofing-related work is involved, the construction boundary should be confirmed together." },
    { q: "How should dry and wet kitchen zones be planned?", a: "Planning should consider cooking frequency, smoke and grease, storage, natural light, dining flow, and the appliance list. Wet kitchens usually support heavier cooking, while dry kitchens can support prep, display, and storage." },
    { q: "Are rendering concepts on the page completed projects?", a: "No. Clearly labeled rendering concepts are planning references, not proof of a completed customer project. Final decisions depend on the real site and approved materials." },
  ],
  seo_title_zh: "吉隆坡与雪兰莪厨房装修｜橱柜、台面与干湿厨房规划 | FLASH CAST",
  seo_title_en: "Kitchen Renovation Kuala Lumpur & Selangor | FLASH CAST",
  seo_description_zh: "根据真实现场规划吉隆坡与雪兰莪厨房装修，包括动线、收纳、橱柜、台面选择、家电点位、给排水、湿作状况与书面报价范围。",
  seo_description_en: "Plan kitchen renovation in Kuala Lumpur and Selangor around the actual layout, storage, cabinets, countertop options, appliance points, plumbing, wet-work condition, and confirmed quotation scope.",
  image_url: "/images/services/kitchen-renovation.webp",
  status: "published",
});

const appendOnce = (content, marker, sentence) => {
  const html = String(content || "");
  if (html.includes(marker)) return html;
  const paragraphEnd = html.indexOf("</p>");
  if (paragraphEnd < 0) return `${html}<p>${sentence}</p>`;
  return `${html.slice(0, paragraphEnd)} ${sentence}${html.slice(paragraphEnd)}`;
};

const oldHouseBlogRecord = (current) => {
  const checklist = current.slug === "old-house-renovation-checklist";
  return {
    ...current,
    content_zh: appendOnce(
      current.content_zh,
      'href="/zh/services/old-house"',
      checklist
        ? '如果多个系统或空间都需要处理，可在申请报价前先查看我们的<a href="/zh/services/old-house">吉隆坡与雪兰莪旧屋翻新规划</a>。'
        : '在比较暂定项目之前，可先了解我们的<a href="/zh/services/old-house">吉隆坡与雪兰莪旧屋翻新规划</a>，看清现场条件、工程范围与报价假设如何衔接。',
    ),
    content_en: appendOnce(
      current.content_en,
      'href="/en/services/old-house"',
      checklist
        ? 'If several systems or rooms need attention, review our <a href="/en/services/old-house">old house renovation planning in Kuala Lumpur and Selangor</a> before requesting a quote.'
        : 'Before comparing provisional items, review our <a href="/en/services/old-house">old house renovation planning in Kuala Lumpur and Selangor</a> to understand how site condition, scope, and quotation assumptions connect.',
    ),
    status: "published",
  };
};

const approvalServiceRecord = (current) => ({
  ...current,
  excerpt_en: "Review renovation approval, management, drawing and document-coordination needs against the property and confirmed project scope.",
  excerpt_zh: "根据房产类型与已确认项目范围，检查装修审批、管理方、图纸与文件协调需求。",
  content_en: "Approval and document requirements vary by property, proposed work, management or landlord rules, and the relevant current authority process. FLASH CAST can help identify and coordinate selected drawings or documents when they are included in the confirmed scope. Exact responsibility, qualified-party input, fees, timing and outcome must be confirmed for the project.",
  content_zh: "审批与文件要求取决于房产类型、拟议工程、管理方或业主规则，以及相关单位的当前流程。如已纳入确认范围，FLASH CAST 可协助检查与协调部分图纸或文件。具体责任、专业人士参与、费用、时间与结果必须针对项目确认。",
  process_steps_en: [
    { title: "Requirement Check", desc: "Identify the property, proposed work, current requirements and responsible parties." },
    { title: "Document Scope", desc: "Confirm which drawings, forms, supporting documents, fees and qualified parties are required." },
    { title: "Submission Coordination", desc: "Coordinate the agreed submission tasks and responses when included in the project scope." },
    { title: "Record Handover", desc: "Keep relevant submitted, approved or returned documents with the project records." },
  ],
  process_steps_zh: [
    { title: "要求检查", desc: "确认房产、拟议工程、当前要求与责任方。" },
    { title: "文件范围", desc: "确认所需图纸、表格、支持文件、费用与专业人士。" },
    { title: "提交协调", desc: "如已纳入项目范围，协调已约定的提交与回复任务。" },
    { title: "记录交付", desc: "将相关已提交、已批准或退回文件纳入项目记录。" },
  ],
  faqs_en: [
    { q: "How long does a renovation approval take?", a: "Timing depends on the current process, document completeness, review comments, responsible parties, fees and the management or authority. Confirm the latest requirements before scheduling work." },
    { q: "Can document preparation and follow-up be coordinated?", a: "Selected tasks can be coordinated when they are included in the confirmed scope. Owner, consultant, landlord, management and authority responsibilities should be listed separately." },
    { q: "What should I prepare for an initial approval review?", a: "Share the site address, property type, management or landlord guide, existing and proposed plans, intended work, and any correspondence already received." },
  ],
  faqs_zh: [
    { q: "装修审批需要多长时间？", a: "时间取决于当前流程、文件完整度、审核意见、责任方、费用与管理方或相关单位。排期前应确认最新要求。" },
    { q: "可以协调文件准备与跟进吗？", a: "已纳入确认范围的部分任务可以协调。业主、顾问、房东、管理方与相关单位的责任应分别列明。" },
    { q: "初步检查审批需求时应准备什么？", a: "提交现场地址、房产类型、管理方或房东指南、现有与拟议图纸、计划工程与已收到的往来文件。" },
  ],
  status: "published",
});

// Locked QA candidates: exact CMS field snapshots, never arbitrary workflow payloads.
const lockedServiceCandidates = Object.freeze({
  "builtin-whole-house-custom-v1": {
    "taskId": "fc-20260920-builtin-whole-house-custom-v1",
    "candidateVersion": "builtin-whole-house-custom-v1",
    "qaEvidenceVersion": "builtin-whole-house-custom-v1",
    "actionId": "publish-builtin-whole-house-custom-v1",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
    "sourceCandidatePath": "drafts/seo/fc-20260920-builtin-whole-house-custom-v1/builtin-service-cms-candidate-v1.json",
    "sourceCandidateSha256": "1c2e381e6393dc588d11df2e960641a3d37a5c0145d61dc3b95804129fa1dd45",
    "rollbackPackagePath": "backups/fc-20260920-builtin-whole-house-custom-v1/rollback-package.json",
    "rollbackPackageSha256": "1dcafc0f1a003835c519e15b3ff2b4f840898c1596396cbeb210f20f48e2feb6",
    "recordId": "b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
    "slug": "builtin",
    "expectedUpdatedAt": "2026-08-30T10:55:12.151465+00:00",
    "status": "published",
    "baselineFieldsSha256": "b53000ea599fc4a5d27640ff1c2f3aa577301571362f3da1d40ed49de1b92adf",
    "desiredFieldsSha256": "899871a94cff6ed9185bcda7ef6c7d388e34ee22d7ee347e9bf3c6ec92c774ca",
    "changedFields": [
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "desiredFields": {
      "title_zh": "全屋定制、定制家具与定制衣柜",
      "title_en": "Whole-House Custom Furniture, Built-In Storage & Wardrobes",
      "excerpt_zh": "为吉隆坡、雪兰莪与巴生谷住宅及商业空间规划全屋定制、定制家具、定制衣柜、电视柜、鞋柜、展示柜与书桌收纳；报价按现场尺寸、使用需求、材料、五金和安装范围评估。",
      "excerpt_en": "Plan whole-house custom furniture, built-in wardrobes, TV units, shoe cabinets, display storage and study areas across Kuala Lumpur, Selangor and Klang Valley, with scope assessed from site measurements, use, materials, hardware and installation conditions.",
      "content_zh": "<p><strong>直接答案：</strong>FLASH CAST 为吉隆坡、雪兰莪与巴生谷的住宅及商业空间规划全屋定制、定制家具与定制衣柜。方案会按现场尺寸、日常使用、收纳分类、材料、五金、搬运和安装条件整理，而不是套用一个固定套餐。</p>\n<h2>按空间和使用方式规划</h2>\n<p>可讨论的范围包括定制衣柜、walk-in wardrobe、电视柜、鞋柜、餐边柜、展示柜、书柜、工作区与其他嵌入式收纳。若需求属于厨房橱柜与厨房整体动线，应进入独立的 <a href=\"/zh/services/kitchen\">定制厨房与厨房装修服务</a>，避免两个页面争夺同一搜索意图。</p>\n<h2>报价前先确认的项目</h2>\n<p>报价会根据现场量度、柜体尺寸与分区、板材和饰面、门板、台面、五金、内部配件、灯光衔接、搬运、电梯、安装通道及其他工种配合范围评估。可讨论的材料方向包括 Melamine、Acrylic 与 Solid Wood，最终规格应以样板、现场条件和书面报价为准。</p>\n<h2>从参考到咨询</h2>\n<p>可先查看 <a href=\"/zh/materials/category/whole-house-custom/wardrobes\">衣柜材料</a>、<a href=\"/zh/materials/category/whole-house-custom/storage-cabinets\">收纳柜材料</a>、<a href=\"/zh/projects/bangsar-walk-in-wardrobe-system\">Bangsar walk-in wardrobe 参考</a> 和 <a href=\"/zh/blog/built-in-cabinet-cost-malaysia\">马来西亚定制柜报价影响因素</a>。准备地点、平面图或现场照片及主要收纳需求后，可前往 <a href=\"/zh/quote\">获取免费报价</a>。距离公司或服务点 30 公里以内可免费上门量房；超过 30 公里会收费，具体费用需先确认。</p>",
      "content_en": "<p><strong>Direct answer:</strong> FLASH CAST plans whole-house custom furniture, built-in storage and fitted wardrobes for homes and commercial spaces across Kuala Lumpur, Selangor and Klang Valley. Each scope is organised around site measurements, daily use, storage categories, materials, hardware, delivery and installation conditions instead of a fixed package.</p>\n<h2>Plan around the room and how it is used</h2>\n<p>The scope can cover fitted wardrobes, walk-in wardrobes, TV units, shoe cabinets, sideboards, display cabinets, bookshelves, study areas and other built-in storage. Kitchen cabinetry and the wider kitchen workflow belong on the dedicated <a href=\"/en/services/kitchen\">custom kitchen and kitchen renovation service</a>, keeping the search intent of both pages clear.</p>\n<h2>What shapes the quotation</h2>\n<p>The quotation is assessed from site measurements, cabinet dimensions and zones, board and finish direction, doors, worktops, hardware, internal accessories, lighting coordination, delivery, lift and installation access, and coordination with other trades. Material directions can include Melamine, Acrylic and Solid Wood; final specifications remain subject to approved samples, site conditions and the written quotation.</p>\n<h2>Move from research to an enquiry</h2>\n<p>Review <a href=\"/en/materials/category/whole-house-custom/wardrobes\">wardrobe materials</a>, <a href=\"/en/materials/category/whole-house-custom/storage-cabinets\">storage cabinet materials</a>, the <a href=\"/en/projects/bangsar-walk-in-wardrobe-system\">Bangsar walk-in wardrobe reference</a> and the <a href=\"/en/blog/built-in-cabinet-cost-malaysia\">Malaysia built-in cabinet cost guide</a>. When the location, floor plan or site photos and main storage needs are ready, <a href=\"/en/quote\">request a free quotation</a>. Site measurement is free within 30 km of the company or service point; travel beyond 30 km is chargeable and the amount must be confirmed first.</p>",
      "alt_zh": "吉隆坡与雪兰莪全屋定制、定制家具和衣柜收纳规划概念图",
      "alt_en": "Whole-house custom furniture, fitted wardrobe and storage planning concept for Kuala Lumpur and Selangor",
      "suitable_for_zh": [
        "需要全屋柜体与收纳统一规划的住宅业主",
        "需要定制衣柜或 walk-in wardrobe 的卧室与更衣区",
        "需要电视柜、鞋柜、展示柜或书桌收纳的单一区域",
        "需要定制展示与后场收纳的商业空间"
      ],
      "suitable_for_en": [
        "Homeowners planning coordinated built-in storage across several rooms",
        "Bedrooms and dressing areas needing fitted or walk-in wardrobes",
        "Single areas needing a TV unit, shoe cabinet, display cabinet or study storage",
        "Commercial spaces needing custom display or back-of-house storage"
      ],
      "common_projects_zh": [
        "全屋定制柜与跨房间收纳",
        "定制衣柜与 walk-in wardrobe",
        "电视柜、电视墙与展示柜",
        "玄关鞋柜、餐边柜与杂物收纳",
        "书柜、书桌与工作区收纳",
        "商业展示柜与后场收纳"
      ],
      "common_projects_en": [
        "Whole-house built-ins and storage across several rooms",
        "Fitted wardrobes and walk-in wardrobes",
        "TV units, feature walls and display cabinets",
        "Entrance shoe cabinets, sideboards and utility storage",
        "Bookshelves, study desks and work-area storage",
        "Commercial display and back-of-house storage"
      ],
      "process_steps_zh": [
        {
          "title": "整理需求",
          "desc": "说明地点、空间用途、主要收纳物品、现有问题和希望保留的设备。"
        },
        {
          "title": "现场量度",
          "desc": "核对墙体、梁柱、门窗、插座、空调、搬运路线和安装条件。"
        },
        {
          "title": "配置与材料",
          "desc": "确认柜体分区、开门与取用动线、板材、饰面、门板、五金和内部配件方向。"
        },
        {
          "title": "范围与报价",
          "desc": "把制作、安装、其他工种衔接、包含项和排除项写入可核对的范围与报价。"
        },
        {
          "title": "安装与检查",
          "desc": "按已确认范围协调进场、安装、调整和完工检查。"
        }
      ],
      "process_steps_en": [
        {
          "title": "Organise the brief",
          "desc": "Share the location, room use, main storage items, current pain points and equipment that must remain."
        },
        {
          "title": "Measure the site",
          "desc": "Check walls, beams, doors, windows, sockets, air-conditioning, delivery routes and installation access."
        },
        {
          "title": "Plan configuration and materials",
          "desc": "Confirm cabinet zones, door and access flow, board, finish, fronts, hardware and internal accessories."
        },
        {
          "title": "Confirm scope and quotation",
          "desc": "Document fabrication, installation, trade coordination, inclusions and exclusions in a reviewable scope and quotation."
        },
        {
          "title": "Install and inspect",
          "desc": "Coordinate access, installation, adjustments and completion checks against the confirmed scope."
        }
      ],
      "scope_items_zh": [
        "现场量度与空间条件核对",
        "收纳分类、柜体分区与日常取用动线",
        "板材、饰面、门板、台面与五金方向",
        "衣柜、电视柜、鞋柜、展示柜、书柜与书桌收纳",
        "内部配件、灯光与设备位置衔接",
        "搬运、电梯、安装通道与其他工种协调",
        "制作与安装范围、包含项和排除项确认",
        "安装后的调整与范围检查"
      ],
      "scope_items_en": [
        "Site measurement and room-condition checks",
        "Storage categories, cabinet zoning and daily access flow",
        "Board, finish, door, worktop and hardware direction",
        "Wardrobes, TV units, shoe cabinets, displays, bookshelves and study storage",
        "Internal accessories, lighting and equipment coordination",
        "Delivery, lift, installation access and coordination with other trades",
        "Fabrication and installation scope, inclusions and exclusions",
        "Post-installation adjustments and scope checks"
      ],
      "faqs_zh": [
        {
          "q": "全屋定制与单个定制柜有什么区别？",
          "a": "全屋定制会同时整理多个空间的柜体、收纳和安装衔接；单个衣柜、电视柜、鞋柜、展示柜或书桌区域也可以独立讨论。最终范围按现场条件和实际需求确认。"
        },
        {
          "q": "第一次咨询需要准备什么？",
          "a": "建议提供项目地点、平面图或现场照片、主要尺寸、需要收纳的物品、现有设备位置，以及偏好的材料或外观方向。资料不完整时，可先说明需求，再确认是否需要现场量度。"
        },
        {
          "q": "哪些因素会影响定制家具报价？",
          "a": "主要包括柜体尺寸与分区、板材与饰面、门板、台面、五金、内部配件、灯光衔接、搬运与安装条件，以及与其他工种配合的范围。固定总价只能在范围与现场条件确认后提供。"
        },
        {
          "q": "Melamine、Acrylic 和 Solid Wood 应怎样选择？",
          "a": "三种材料方向的外观、保养、结构做法和成本不同。应结合使用位置、清洁需求、预算方向、样板和书面规格比较，不能只按图片决定。"
        },
        {
          "q": "厨房橱柜也属于这个服务吗？",
          "a": "可以一起讨论，但厨房橱柜涉及厨房动线、家电、台面、水电和其他施工衔接，网站由独立的厨房服务页承接详细需求与搜索意图。"
        },
        {
          "q": "可以先承诺固定价格或固定工期吗？",
          "a": "不能。价格和工期需根据现场尺寸、材料、五金、制作与安装范围、进场条件和其他工种衔接评估，并以最终书面报价和排期为准。"
        },
        {
          "q": "上门量房和报价是否收费？",
          "a": "报价免费。距离公司或服务点 30 公里以内可免费上门量房；超过 30 公里会收费，具体费用需要先根据地点确认。"
        }
      ],
      "faqs_en": [
        {
          "q": "How does whole-house custom furniture differ from a single built-in?",
          "a": "Whole-house planning coordinates cabinetry, storage and installation across several rooms. A single wardrobe, TV unit, shoe cabinet, display cabinet or study area can also be discussed on its own. The final scope depends on the site and actual requirements."
        },
        {
          "q": "What should I prepare for the first consultation?",
          "a": "Share the project location, a floor plan or site photos, key dimensions, what needs to be stored, equipment positions and any material or visual direction. If the information is incomplete, start with the requirements and confirm whether a site measurement is needed."
        },
        {
          "q": "What affects a custom furniture quotation?",
          "a": "The main factors are cabinet dimensions and zones, board and finish, doors, worktops, hardware, internal accessories, lighting coordination, delivery and installation access, and coordination with other trades. A fixed total can only follow a confirmed scope and site conditions."
        },
        {
          "q": "How should I compare Melamine, Acrylic and Solid Wood?",
          "a": "The three material directions differ in appearance, care, construction and cost. Compare them against the room, cleaning needs, budget direction, approved samples and written specification instead of choosing from images alone."
        },
        {
          "q": "Is kitchen cabinetry included in this service?",
          "a": "It can be discussed together, but kitchen cabinetry also depends on kitchen workflow, appliances, worktops, plumbing, electrical points and related work. The dedicated kitchen service page handles that detailed scope and search intent."
        },
        {
          "q": "Can you promise a fixed price or completion period before measurement?",
          "a": "No. Price and timing depend on site dimensions, materials, hardware, fabrication and installation scope, access and coordination with other trades, and remain subject to the final written quotation and schedule."
        },
        {
          "q": "Are site measurement and quotations free?",
          "a": "The quotation is free. Site measurement is free within 30 km of the company or service point; travel beyond 30 km is chargeable and the amount must be confirmed from the location first."
        }
      ],
      "seo_title_zh": "全屋定制与定制家具｜衣柜、电视柜、收纳柜｜FLASH CAST",
      "seo_title_en": "Custom Built-In Furniture & Wardrobes | FLASH CAST",
      "seo_description_zh": "FLASH CAST 为吉隆坡、雪兰莪与巴生谷规划全屋定制、定制家具与定制衣柜，按现场尺寸、收纳需求、材料、五金和安装范围整理免费报价。",
      "seo_description_en": "Custom built-in furniture and wardrobes for Kuala Lumpur and Selangor, planned around site measurements, storage needs, materials, hardware and installation."
    },
    "publicPaths": [
      {
        "path": "/en/services/builtin",
        "expected": "Custom Built-In Furniture &amp; Wardrobes | FLASH CAST"
      },
      {
        "path": "/zh/services/builtin",
        "expected": "全屋定制与定制家具｜衣柜、电视柜、收纳柜｜FLASH CAST"
      }
    ]
  },
  "en-renovation-owner-cms-v2": {
    "taskId": "fc-20260920-en-renovation-owner-publish-v2",
    "candidateVersion": "en-renovation-owner-cms-v2",
    "qaEvidenceVersion": "en-renovation-owner-cms-v2-rework-1",
    "actionId": "publish-en-renovation-owner-cms-v2",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:/en/services/renovation:service:renovation:english-content-fields",
    "sourceCandidatePath": "drafts/seo/fc-20260920-en-renovation-owner-publish-v2/cms-content-candidate.json",
    "sourceCandidateSha256": "85826741469e39663ab6bf42411eaccb4186dacc128c0b32f8846d6549510c50",
    "rollbackPackagePath": "drafts/seo/fc-20260920-en-renovation-owner-publish-v2/rollback-plan.json",
    "rollbackPackageSha256": "241768c4365a6ce4b8d5466184b5d66ab2ae38d313162b0dae28f9e12f842f5d",
    "rollbackRecordPath": "drafts/seo/fc-20260920-en-renovation-owner-publish-v2/cms-current-record.json",
    "rollbackRecordSha256": "03de585899e38f33e8e5c9097c3414e458cd43b5aa86838192aa0317bbbdf4d3",
    "recordId": "0d947129-0595-43ef-baa1-0fd9d8b870e6",
    "slug": "renovation",
    "expectedUpdatedAt": "2026-06-21T17:14:31.227425+00:00",
    "status": "published",
    "baselineFieldsSha256": "ebf7e4881b057e34e622da06d06cef670faece0efcf94d2902a363a1f50fc4a2",
    "desiredFieldsSha256": "074462622c8c58f0a88c11a103165cb05ac60993c595cbcae08e3a357d401d3e",
    "changedFields": [
      "excerpt_en",
      "content_en",
      "suitable_for_en",
      "common_projects_en",
      "scope_items_en",
      "process_steps_en",
      "faqs_en"
    ],
    "desiredFields": {
      "excerpt_en": "Residential renovation for condos and landed homes across Kuala Lumpur, Selangor, and Klang Valley, planned around the real site, confirmed work scope, materials, and trade coordination.",
      "content_en": "<p>Residential renovation can involve demolition, masonry, electrical, plumbing, waterproofing, carpentry, ceilings, flooring, painting, kitchens, bathrooms, and other selected work. FLASH CAST starts by reviewing the property type, current condition, intended use, items to keep or remove, site access, management requirements, and budget direction.</p><p>Before quotation, the scope should separate essential work from optional upgrades and record exclusions, owner-supplied items, material choices, trade dependencies, responsibilities, programme assumptions, progress communication, and handover items. Final pricing and timing depend on the confirmed scope and actual site conditions; this page does not promise a fixed price, fixed completion date, approval outcome, or structural conclusion.</p><p>For condos and managed properties, management or authority requirements vary by property and work scope. FLASH CAST can coordinate documented preparation where it is included in the agreed scope, but approval is not guaranteed. Kitchen, bathroom, old-house, and custom built-in work should be assessed under their relevant specialist scope and measured before quotation.</p>",
      "suitable_for_en": [
        "Condo or apartment owners planning a partial or whole-unit renovation",
        "Landed, terrace, semi-D, or bungalow owners coordinating several rooms or trades",
        "Families moving into a new, subsale, or older property",
        "Landlords or property owners preparing a practical upgrade for rent or sale"
      ],
      "common_projects_en": [
        "Partial or whole-unit condo and apartment renovation",
        "Landed-home living, dining, bedroom, and common-area upgrades",
        "Kitchen and bathroom renovation coordinated with the wider home scope",
        "Flooring, ceiling, lighting, painting, carpentry, and storage upgrades",
        "Rewiring, replumbing, waterproofing-related, and reinstatement scope review"
      ],
      "scope_items_en": [
        "Site measurement, property-condition, access, and requirement review",
        "Demolition, preliminary protection, masonry, and reinstatement scope where confirmed",
        "Electrical, plumbing, waterproofing, flooring, ceiling, painting, door, and window coordination",
        "Kitchen and bathroom work coordinated with the wider residential scope",
        "Built-in carpentry coordination based on measurements, materials, hardware, and installation scope",
        "Material options, owner-supplied items, exclusions, and trade dependencies",
        "Management or permit-document coordination where required, without an approval guarantee",
        "Written quotation scope, responsibilities, programme assumptions, progress communication, and handover items"
      ],
      "process_steps_en": [
        {
          "title": "Requirement Review",
          "desc": "Confirm the property type, location, current condition, intended use, main issues, and rooms or items to keep or remove."
        },
        {
          "title": "Site Assessment",
          "desc": "Measure the site and review visible conditions, access, management requirements, existing services, and coordination constraints."
        },
        {
          "title": "Scope and Material Direction",
          "desc": "Separate essential work, suitable upgrades, material options, owner-supplied items, exclusions, and dependencies."
        },
        {
          "title": "Quotation and Scheduling",
          "desc": "Itemize the confirmed scope and record responsibilities, programme assumptions, approval needs, and progress communication."
        },
        {
          "title": "Work Coordination and Handover",
          "desc": "Coordinate the agreed trades, review milestone items, and record outstanding work, documents, and after-sales terms at handover."
        }
      ],
      "faqs_en": [
        {
          "q": "What should I prepare before requesting a residential renovation quotation?",
          "a": "Share the property location and type, approximate floor area, site photos, a layout plan if available, current-condition concerns, priorities, budget direction, and the rooms or work you want assessed."
        },
        {
          "q": "What affects residential renovation cost and timing?",
          "a": "Area, demolition, hidden conditions, wet works, wiring, plumbing, waterproofing, carpentry, material grade, site access, management rules, and trade dependencies can change the scope, quotation, and programme. Final figures require confirmed site information and work scope."
        },
        {
          "q": "Can FLASH CAST help with condo management or permit requirements?",
          "a": "Support can include document preparation and coordination when it is part of the agreed scope. Requirements vary by property, management, work scope, and current authority process, so approval and timing cannot be guaranteed."
        },
        {
          "q": "When should I request an old-house renovation assessment?",
          "a": "An old-house assessment is relevant when recurring wiring, plumbing, waterproofing, layout, deterioration, or hidden-condition issues need to be reviewed before cosmetic upgrades are planned."
        },
        {
          "q": "How are custom cabinets handled within a renovation quotation?",
          "a": "Built-in cabinets should be assessed from site measurements, storage needs, materials, hardware, finishes, and installation scope. Kitchen cabinets and wider built-in furniture remain separate specialist owner scopes even when coordinated with the renovation."
        },
        {
          "q": "Is site measurement free?",
          "a": "Site measurement is free within 30 km of the company or service point. Locations beyond 30 km may incur a fee, so share the project location first for confirmation."
        }
      ]
    },
    "publicPaths": [
      {
        "path": "/en/services/renovation",
        "expected": "Residential Renovation Kuala Lumpur &amp; Selangor | FLASH CAST"
      },
      {
        "path": "/zh/services/renovation",
        "expected": "吉隆坡住宅装修与旧屋翻新 | FLASH CAST"
      }
    ]
  },
  "pg002-shop-cms-v1": {
    "taskId": "fc-20260921-seo-pg002-shop-candidate-v1",
    "candidateVersion": "pg002-shop-cms-v1",
    "qaEvidenceVersion": "pg002-shop-cms-v1",
    "actionId": "publish-pg002-shop-cms-v1",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services/32f5374f-9919-41ea-80c7-00b5ac917532",
    "sourceCandidatePath": "drafts/seo/fc-20260921-seo-pg002-shop-candidate-v1/shop-service-cms-candidate-v1.json",
    "sourceCandidateSha256": "cfeecb6ae5bcb55c9c2bb2f0993aaf4de309906dd1e2ed6dd189e29e18e2c988",
    "rollbackPackagePath": "backups/fc-20260921-seo-pg002-shop-candidate-v1/rollback-package.json",
    "rollbackPackageSha256": "05a9e506f3ed1d517a36387543309befffd70d3dab4dcab8b4cd68cefa074a04",
    "rollbackRecordPath": "backups/fc-20260921-seo-pg002-shop-candidate-v1/current-service-record.json",
    "rollbackRecordSha256": "6cf7b916c5d945b7bf8582cd0168d0cde30701630a10d982bcb25689e70258d4",
    "recordId": "32f5374f-9919-41ea-80c7-00b5ac917532",
    "slug": "shop-renovation",
    "expectedUpdatedAt": "2026-08-22T07:17:50.285924+00:00",
    "status": "published",
    "baselineFieldsSha256": "6303ddf9510e9a1c25c8b644cf9353f639bc6ffb04562beec581546476bcc548",
    "desiredFieldsSha256": "ed7532831b3912b5ab3b4a37be52636e56f8e9e8ebb2bce6f1ea1a9363531905",
    "changedFields": [
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "faqs_zh",
      "faqs_en",
      "seo_description_zh",
      "seo_description_en"
    ],
    "desiredFields": {
      "excerpt_zh": "吉隆坡与雪兰莪的店铺装修与零售 fit-out：零售、餐饮营业空间、诊所前区、美容美发、展厅及服务门店可先讨论动线、展示、柜台、收纳与现场条件；实际范围经现场核对和书面报价确认。",
      "excerpt_en": "Shop renovation for retail, F&B premises, clinic front areas, salons and showrooms in Kuala Lumpur and Selangor. Review customer flow, counters, storage and site conditions before agreeing the scope and quotation.",
      "content_zh": "<p>FLASH CAST 为吉隆坡、雪兰莪与巴生谷的零售店、餐饮营业空间、诊所前区、美容/理发门店、展厅及服务门店讨论店铺装修与商业 fit-out。按经营用途和现场条件，先确认顾客动线、展示或服务区、柜台、后场收纳、灯光与现有机电点位，再整理报价范围。</p><p>咨询时可提供地点、面积或平面图、现场照片、租约交付状态、管理方要求和预期开业时间；资料不齐也可先咨询。专业设备、行业许可、专业签字或管理方审批须逐项核实，不因本页而视为已包含或保证通过。报价和施工安排以现场核对及书面范围为准；可通过页内项目参考、相关服务与免费报价入口继续了解。</p>",
      "content_en": "<p>FLASH CAST can discuss shop renovation and commercial fit-out for retail stores, F&B premises, clinic front areas, beauty and hair salons, showrooms and service outlets across Kuala Lumpur, Selangor and the Klang Valley. Business use and site conditions guide the review of customer flow, display or service zones, counters, back-of-house storage, lighting and existing M&E points before a quotation scope is defined.</p><p>For an enquiry, share the location, floor area or plan, site photos, tenancy handover condition, management requirements and intended opening date if available; an initial enquiry can start without every item. Specialist equipment, industry licences, professional sign-off and management approvals need project-specific checks and are not implied or guaranteed by this page. Quotation and scheduling depend on site review and written scope. Existing project-reference, related-service and free-quote links on the page support the next step.</p>",
      "faqs_zh": [
        {
          "q": "哪些商业店铺适合先咨询？",
          "a": "零售店、餐饮营业空间、诊所前区、美容/理发门店、展厅和服务门店都可先讨论动线、展示或服务区、柜台与收纳。实际承接范围须按现场条件及书面报价确认；这不是任何行业的完工案例声明。"
        },
        {
          "q": "店铺装修开工前可先提供什么资料？",
          "a": "建议提供地点、营业用途、面积或平面图、现场照片、租约交付状态、业主或商场装修要求，以及目标开业时间。资料不齐也可先咨询，缺项在范围确认时补核。"
        },
        {
          "q": "专业设备或行业特殊范围是否自动包含？",
          "a": "不自动包含。设备、诊疗或餐饮专门区域、行业许可与专业签字等事项，须按具体项目、管理方要求和相关专业责任单独核对，并写入确认的工作范围。"
        },
        {
          "q": "招牌、装修准证或管理处审批由谁负责？",
          "a": "可先核对可能需要的图纸、文件和协调事项；具体责任、费用、时间及结果须按租约、业主或管理方、地方单位与相关专业要求确认，不保证审批通过。"
        },
        {
          "q": "报价是否免费，能否保证开业前完工？",
          "a": "报价免费。面积、拆改、机电、进场条件与管理要求会影响范围和安排；未现场核对并确认书面范围前，不承诺固定价格或完工日期。"
        },
        {
          "q": "哪里可以查看参考并开始咨询？",
          "a": "可使用页面现有的项目参考、开店规划和准证指南及相关商业服务链接；每项参考须区分已公开项目与概念图。准备好基本现场资料后，通过页面免费报价或 WhatsApp 入口咨询。"
        }
      ],
      "faqs_en": [
        {
          "q": "Which commercial spaces can start an enquiry?",
          "a": "Retail stores, F&B trading areas, clinic front areas, beauty and hair salons, showrooms and service outlets can discuss customer flow, display or service zones, counters and storage. The deliverable scope needs a site review and written quotation; this is not a claim of completed work in every industry."
        },
        {
          "q": "What information helps before a shop fit-out starts?",
          "a": "Share the location, business use, floor area or plan, site photos, tenancy handover condition, landlord or mall fit-out requirements, and intended opening date where available. An enquiry can start with incomplete information; gaps are checked when defining the scope."
        },
        {
          "q": "Are specialist equipment and industry-specific works included automatically?",
          "a": "No. Equipment, specialist clinical or food-service areas, industry licences and professional sign-off must be checked for the individual project, management requirements and responsible professionals, then stated in the agreed scope."
        },
        {
          "q": "Who handles signage, permits or management approval?",
          "a": "Possible drawings, documents and coordination needs can be reviewed first. Responsibility, fees, timing and outcome depend on the tenancy, landlord or management, local authority and relevant professional requirements; approval is not guaranteed."
        },
        {
          "q": "Is the quotation free, and is an opening date guaranteed?",
          "a": "The quotation is free. Area, alteration scope, M&E, access and management rules affect scope and scheduling. No fixed price or completion date is promised before site review and written scope confirmation."
        },
        {
          "q": "Where can I view references and start an enquiry?",
          "a": "Use the page's existing project references, opening and permit guides, and related commercial-service links; distinguish published projects from labeled concepts. Then use the free-quote or WhatsApp action with the available site information."
        }
      ],
      "seo_description_zh": "FLASH CAST 为吉隆坡及雪兰莪零售、餐饮营业空间、诊所前区、美容美发和展厅讨论店铺装修 fit-out；先核对现场、经营需求与物业要求，再确认报价范围。",
      "seo_description_en": "Shop renovation in Kuala Lumpur and Selangor for retail, F&B, clinic front areas, salons and showrooms. Review site needs before a written quotation."
    },
    "publicPaths": [
      {
        "path": "/en/services/shop-renovation",
        "expected": "Shop Renovation &amp; Retail Fit-Out | FLASH CAST"
      },
      {
        "path": "/zh/services/shop-renovation",
        "expected": "店铺装修与零售空间规划 | 商业空间 Fit-Out | FLASH CAST"
      }
    ]
  }
});

const targetConfigs = {
  "office-renovation": {
    contentType: "service",
    table: "services",
    keyField: "slug",
    key: "office-renovation",
    fields: serviceFields,
    buildRecord: officeRecord,
    publicPaths: [
      { path: "/en/services/office-renovation", expected: "Office Renovation &amp; Commercial Fit-Out Malaysia" },
      { path: "/zh/services/office-renovation", expected: "马来西亚办公室装修与商业空间规划" },
    ],
  },
  design: {
    contentType: "service", table: "services", keyField: "slug", key: "design", fields: serviceFields, buildRecord: serviceFaqRecord("design"),
    publicPaths: [
      { path: "/en/services/design", expected: "Interior Design Kuala Lumpur | FLASH CAST", forbidden: ["Specific numeric pricing should only be published", "The page can cover"] },
      { path: "/zh/services/design", expected: "吉隆坡室内设计与空间规划", forbidden: ["页面可以", "业主确认"] },
    ],
  },
  builtin: {
    contentType: "service", table: "services", keyField: "slug", key: "builtin", fields: serviceFields, buildRecord: serviceFaqRecord("builtin"),
    publicPaths: [
      { path: "/en/services/builtin", expected: "Built-In Furniture Malaysia | FLASH CAST", forbidden: ["Should this page publish", "owner provides real project"] },
      { path: "/zh/services/builtin", expected: "定制家具与收纳柜设计", forbidden: ["页面是否应该", "业主确认"] },
    ],
  },
  kitchen: {
    contentType: "service", table: "services", keyField: "slug", key: "kitchen", fields: serviceFields, buildRecord: kitchenRecord,
    publicPaths: [
      { path: "/en/services/kitchen", expected: "Kitchen Renovation Kuala Lumpur &amp; Selangor | FLASH CAST", forbidden: ["Kitchen Renovation Malaysia | FLASH CAST", "owner-confirmed project"] },
      { path: "/zh/services/kitchen", expected: "吉隆坡与雪兰莪厨房装修｜橱柜、台面与干湿厨房规划", forbidden: ["出租单位或转售单位", "TTDI 餐厨翻新参考"] },
    ],
  },
  "old-house-renovation-checklist": {
    contentType: "blog", table: "blog_posts", keyField: "slug", key: "old-house-renovation-checklist", fields: blogFields, buildRecord: oldHouseBlogRecord,
    publicPaths: [
      // Edge HTML exposes blog metadata, while rowMismatches validates the complete body and its contextual link.
      { path: "/en/blog/old-house-renovation-checklist", expected: "Old House Renovation Checklist | FLASH CAST" },
      { path: "/zh/blog/old-house-renovation-checklist", expected: "旧屋翻新检查清单 | FLASH CAST" },
    ],
  },
  "old-house-renovation-hidden-costs-malaysia": {
    contentType: "blog", table: "blog_posts", keyField: "slug", key: "old-house-renovation-hidden-costs-malaysia", fields: blogFields, buildRecord: oldHouseBlogRecord,
    publicPaths: [
      { path: "/en/blog/old-house-renovation-hidden-costs-malaysia", expected: "Hidden Costs in Old House Renovation in Malaysia | FLASH CAST" },
      { path: "/zh/blog/old-house-renovation-hidden-costs-malaysia", expected: "马来西亚旧屋翻新常见隐藏费用 | FLASH CAST" },
    ],
  },
  bathroom: {
    contentType: "service", table: "services", keyField: "slug", key: "bathroom", fields: serviceFields, buildRecord: serviceFaqRecord("bathroom"),
    publicPaths: [
      { path: "/en/services/bathroom", expected: "Bathroom Renovation Malaysia | FLASH CAST", forbidden: ["Specific numeric pricing should only be published", "the page should not promise"] },
      { path: "/zh/services/bathroom", expected: "浴室装修与防水工程", forbidden: ["页面不应", "业主确认"] },
    ],
  },
  "shop-renovation": {
    contentType: "service", table: "services", keyField: "slug", key: "shop-renovation", fields: serviceFields, buildRecord: serviceFaqRecord("shop-renovation"),
    publicPaths: [
      { path: "/en/services/shop-renovation", expected: "Shop Renovation &amp; Retail Fit-Out | FLASH CAST", forbidden: ["Can the page mention", "verified commercial service scope"] },
      { path: "/zh/services/shop-renovation", expected: "店铺装修与零售空间规划", forbidden: ["页面可以", "已验证的商业"] },
    ],
  },
  warehouse: {
    contentType: "service", table: "services", keyField: "slug", key: "warehouse", fields: serviceFields, buildRecord: serviceFaqRecord("warehouse"),
    publicPaths: [
      { path: "/en/services/warehouse", expected: "Warehouse Shelving and Storage Planning", forbidden: ["The page can cover", "Can the page mention"] },
      { path: "/zh/services/warehouse", expected: "雪兰莪仓库货架规划", forbidden: ["页面可以", "业主确认"] },
    ],
  },
  approval: {
    contentType: "service", table: "services", keyField: "slug", key: "approval", fields: serviceFields, buildRecord: approvalServiceRecord,
    publicPaths: [
      { path: "/en/services/approval", expected: "Permit &amp; Drawing Support Kuala Lumpur | FLASH CAST", forbidden: ["typically take 1-2 weeks", "may take 2-4 weeks", "handle the entire permit process"] },
      { path: "/zh/services/approval", expected: "装修准证", forbidden: ["1-2 周", "2-4 周", "全流程"] },
    ],
  },
  "mont-kiara-concept": {
    contentType: "project",
    table: "projects",
    keyField: "slug",
    key: "mont-kiara-luxury-condo-renovation",
    fields: projectFields,
    buildRecord: montKiaraConceptRecord,
    publicPaths: [
      { path: "/en/projects/mont-kiara-luxury-condo-renovation", expected: "Luxury Condo Living &amp; Dining Rendering Concept" },
      { path: "/zh/projects/mont-kiara-luxury-condo-renovation", expected: "高级公寓客餐厅效果图概念" },
    ],
  },
  "about-metadata": {
    contentType: "site_page",
    table: "site_pages",
    keyField: "page_key",
    key: "about",
    fields: sitePageFields,
    buildRecord: aboutMetadataRecord,
    publicPaths: [
      { path: "/en/about", expected: "About FLASH CAST | Renovation Planning in Kuala Lumpur" },
      { path: "/zh/about", expected: "关于 FLASH CAST | 吉隆坡装修规划与项目协调" },
    ],
  },
  ...Object.fromEntries(
    Object.entries({ ...lockedServiceCandidates, ...lockedR3Candidates, ...lockedKlMediaCandidates, ...lockedBlogMediaCandidates }).map(([name, locked]) => [name, {
      contentType: locked.contentType || "service",
      table: locked.contentType === "service_area" ? "service_areas" : locked.contentType === "blog" ? "blog_posts" : "services",
      keyField: "slug",
      key: locked.slug,
      fields: locked.contentType === "service_area" ? serviceAreaFields : locked.contentType === "blog" ? blogFields : serviceFields,
      buildRecord: (current) => ({ ...current, ...locked.desiredFields }),
      publicPaths: locked.publicPaths,
      lockedCandidate: locked,
    }]),
  ),
  ...Object.fromEntries(
    Object.entries(topicClusterBlogConfigs).map(([slug, config]) => [slug, {
      contentType: "blog",
      table: "blog_posts",
      keyField: "slug",
      key: slug,
      fields: blogFields,
      buildRecord: buildTopicClusterBlogRecord,
      publicPaths: config.publicPaths,
    }]),
  ),
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value ?? null;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};

const valuesMatch = (left, right) => JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
const stableDigest = (value) => createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");

const assertLockedServiceCandidate = (locked, current) => {
  if (current.id !== locked.recordId || current.slug !== locked.slug || current.status !== locked.status) {
    fail(`Locked CMS identity mismatch for ${locked.candidateVersion}.`);
  }
  if (current.updated_at !== locked.expectedUpdatedAt) {
    fail(`Locked CMS updated_at drift for ${locked.candidateVersion}; obtain a new QA candidate.`);
  }
  const fields = locked.contentType === "service_area" ? serviceAreaFields : locked.contentType === "blog" ? blogFields : serviceFields;
  const baseline = Object.fromEntries(fields.map((field) => [field, current[field]]));
  if (stableDigest(baseline) !== locked.baselineFieldsSha256) {
    fail(`Locked CMS field drift for ${locked.candidateVersion}; obtain a new QA candidate.`);
  }
  const changedFields = Object.keys(locked.desiredFields).sort();
  if (!valuesMatch(changedFields, [...locked.changedFields].sort())
      || changedFields.some((field) => !fields.includes(field) || ["id", "slug", "status", "updated_at"].includes(field))
      || stableDigest(locked.desiredFields) !== locked.desiredFieldsSha256) {
    fail(`Locked candidate payload mismatch for ${locked.candidateVersion}.`);
  }
};

const assertLockedRollbackCurrent = (locked, current) => {
  if (current.id !== locked.recordId || current.slug !== locked.slug || current.status !== "published"
      || !valuesMatch(Object.fromEntries(locked.changedFields.map((field) => [field, current[field]])), locked.desiredFields)) {
    fail(`Rollback target does not match the exact published candidate ${locked.candidateVersion}.`);
  }
};

const assertLockedPublishGate = (locked, environment = process.env, permitId = managedPermitId) => {
  if (environment.GITHUB_ACTIONS !== "true" || environment.GITHUB_REF !== "refs/heads/main"
      || !environment.ACTIONS_ID_TOKEN_REQUEST_URL || !environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(permitId)) {
    fail(`Locked CMS publish for ${locked.candidateVersion} requires the approved main workflow and an exact single-use permit.`);
  }
};

const requestGithubOidcToken = async () => {
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set("audience", "api://flashcast-managed-cms-publish");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
  });
  if (!response.ok) fail(`GitHub OIDC request failed with HTTP ${response.status}.`);
  const result = await response.json();
  if (!result || typeof result.value !== "string" || !result.value) fail("GitHub OIDC response has no token.");
  return result.value;
};

const buildLockedDryRunRequest = (locked, record, source, operation = "publish") => ({
  contentType: locked.contentType || "service",
  mode: "dry-run",
  nextStatus: "published",
  expectedUpdatedAt: locked.expectedUpdatedAt,
  managedCandidate: {
    taskId: locked.taskId,
    actionId: operation === "rollback" ? `rollback-${locked.candidateVersion}` : locked.actionId,
    operation,
    scope: locked.scope,
    candidateVersion: operation === "rollback" ? `${locked.candidateVersion}-rollback-v1` : locked.candidateVersion,
  },
  ...(locked.contentType === "blog" ? { managedOperation: operation } : {}),
  record,
  source,
});

const assertLockedDryRunResult = (locked, response, httpStatus, before, after, desired) => {
  if (httpStatus !== 200 || response.ok !== true || response.dry_run !== true
      || response.content_type !== (locked.contentType || "service") || response.existing_id !== locked.recordId
      || response.slug !== locked.slug || response.saved_id) {
    fail(`Protected dry-run did not confirm the exact locked candidate ${locked.candidateVersion}.`);
  }
  if (!valuesMatch(after, before)) fail(`CMS row changed during dry-run for ${locked.candidateVersion}.`);
  if (locked.changedFields && (locked.contentType === "blog"
      || (locked.contentType === "service_area" && locked.baselineFieldsSha256)
      || (locked.contentType || "service") === "service")) {
    const patch = Object.fromEntries(locked.changedFields.map((field) => [field, desired[field]]));
    if (!valuesMatch(response.payload_preview, patch) || stableDigest(response.payload_preview) !== stableDigest(patch)) {
      fail(`Managed dry-run payload does not match its exact SQL patch for ${locked.candidateVersion}.`);
    }
  }
};

const fetchJson = async (url, options = {}, onStatus) => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) fail(body.error || `HTTP ${response.status}`);
  onStatus?.(response.status);
  return body;
};

const main = async () => {
  const config = targetConfigs[target];
  if (!config) fail(`--target must be one of: ${Object.keys(targetConfigs).join(", ")}`);
  if (rollbackFrom && config.lockedCandidate?.rollbackAllowed === false) {
    fail("Restoring the unverified prior service image is blocked; prepare a separately reviewed forward correction.");
  }
  if (config.lockedCandidate && execute) assertLockedPublishGate(config.lockedCandidate);
  if (execute && !approvalId) fail("--execute requires --approval-id=<authorization reference>.");
  if (rollbackFrom && !execute && !config.lockedCandidate) fail("--rollback-from requires --execute for legacy targets.");
  if (rollbackFrom && !config.lockedCandidate && managedPermitId) fail("Managed permits only apply to locked CMS targets.");

  const env = loadEnv("", envDir, "");
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const publishSecret = env.CONTENT_PUBLISH_SECRET;
  const publicSiteUrl = (env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
  if (!supabaseUrl || !anonKey || !publishSecret) {
    fail("SUPABASE_URL/VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and CONTENT_PUBLISH_SECRET are required.");
  }
  if (config.lockedCandidate && new URL(supabaseUrl).host !== "rbsnyexjifounogswrjp.supabase.co") {
    fail("Locked CMS target must use the approved FLASH CAST Supabase project.");
  }

  const outputDir = path.join(artifactRoot, target);
  fs.mkdirSync(outputDir, { recursive: true });
  const restUrl = new URL(`/rest/v1/${config.table}`, supabaseUrl);
  restUrl.searchParams.set(config.keyField, `eq.${config.key}`);
  restUrl.searchParams.set("select", config.fields.join(","));
  restUrl.searchParams.set("limit", "1");
  const restHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const fetchCurrent = async () => {
    const rows = await fetchJson(restUrl, { headers: restHeaders });
    if (!Array.isArray(rows) || rows.length !== 1 || !rows[0]) fail(`Expected exactly one published ${config.table}.${config.key} record.`);
    return rows[0];
  };
  let publisherHttpStatus = null;
  const postContentPublish = async (body, extraHeaders = {}) => fetchJson(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/content-publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": publishSecret, ...extraHeaders },
      body: JSON.stringify(body),
    },
    (status) => { publisherHttpStatus = status; },
  );

  const current = await fetchCurrent();
  if (config.lockedCandidate) {
    if (rollbackFrom) assertLockedRollbackCurrent(config.lockedCandidate, current);
    else assertLockedServiceCandidate(config.lockedCandidate, current);
  }
  const backup = { target, contentType: config.contentType, table: config.table, keyField: config.keyField, key: config.key, capturedAt: new Date().toISOString(), record: current };
  writeJson(path.join(outputDir, "backup.json"), backup);

  let desired;
  let operation = "optimize";
  if (rollbackFrom) {
    const rollback = JSON.parse(fs.readFileSync(path.resolve(rollbackFrom), "utf8"));
    if (rollback.target !== target || rollback.key !== config.key || !rollback.record) fail("Rollback backup does not match the selected target.");
    if (config.lockedCandidate) {
      const locked = config.lockedCandidate;
      const baseline = Object.fromEntries(config.fields.map((field) => [field, rollback.record[field]]));
      if (rollback.record.id !== locked.recordId || rollback.record.slug !== locked.slug
          || stableDigest(baseline) !== locked.baselineFieldsSha256) {
        fail(`Rollback artifact does not contain the exact prior version of ${locked.candidateVersion}.`);
      }
      if (config.fields.some((field) => !["updated_at", ...locked.changedFields].includes(field)
          && !valuesMatch(current[field], rollback.record[field]))) {
        fail(`Rollback would overwrite an unrelated field of ${locked.candidateVersion}.`);
      }
    }
    desired = rollback.record;
    operation = "rollback";
  } else {
    desired = config.buildRecord(current);
  }
  if (config.lockedCandidate && !rollbackFrom) {
    const locked = config.lockedCandidate;
    if (!valuesMatch(Object.fromEntries(locked.changedFields.map((field) => [field, desired[field]])), locked.desiredFields)) {
      fail(`Desired record differs from locked candidate ${locked.candidateVersion}.`);
    }
    writeJson(path.join(outputDir, "locked-candidate.json"), {
      task_id: locked.taskId,
      candidate_version: locked.candidateVersion,
      qa_evidence_version: locked.qaEvidenceVersion,
      action_id: locked.actionId,
      action_class: locked.actionClass,
      scope: locked.scope,
      source_candidate_path: locked.sourceCandidatePath,
      source_candidate_sha256: locked.sourceCandidateSha256,
      rollback_package_path: locked.rollbackPackagePath,
      rollback_package_sha256: locked.rollbackPackageSha256,
      rollback_record_path: locked.rollbackRecordPath || null,
      rollback_record_sha256: locked.rollbackRecordSha256 || null,
      expected_updated_at: locked.expectedUpdatedAt,
      changed_fields: locked.changedFields,
      baseline_fields_sha256: locked.baselineFieldsSha256,
      desired_fields_sha256: locked.desiredFieldsSha256,
    });
  }
  writeJson(path.join(outputDir, "desired.json"), { target, operation, record: desired });

  const source = config.lockedCandidate
    ? `managed-cms:${config.lockedCandidate.taskId}:${rollbackFrom ? `rollback-${config.lockedCandidate.candidateVersion}` : config.lockedCandidate.actionId}`
    : `content-trust-20260821:${target}:${operation}`;
  const dryRun = await postContentPublish(config.lockedCandidate
    ? { ...buildLockedDryRunRequest(config.lockedCandidate, desired, source, rollbackFrom ? "rollback" : "publish"), expectedUpdatedAt: rollbackFrom ? current.updated_at : config.lockedCandidate.expectedUpdatedAt }
    : {
      contentType: config.contentType,
      mode: "dry-run",
      nextStatus: "published",
      expectedUpdatedAt: current.updated_at || null,
      record: desired,
      source,
    });
  if (config.lockedCandidate) {
    const locked = config.lockedCandidate;
    const afterDryRun = await fetchCurrent();
    assertLockedDryRunResult(locked, dryRun, publisherHttpStatus, current, afterDryRun, desired);
    writeJson(path.join(outputDir, "locked-dry-run-receipt.json"), {
      task_id: locked.taskId,
      candidate_version: locked.candidateVersion,
      action_id: rollbackFrom ? `rollback-${locked.candidateVersion}` : locked.actionId,
      operation: rollbackFrom ? "rollback" : "publish",
      scope: locked.scope,
      http_status: publisherHttpStatus,
      dry_run: true,
      performed_write: false,
      external_writes: 0,
      row_unchanged_after_dry_run: true,
      expected_updated_at: rollbackFrom ? current.updated_at : locked.expectedUpdatedAt,
      checked_at: new Date().toISOString(),
    });
  }
  writeJson(path.join(outputDir, "dry-run.json"), dryRun);
  if (config.lockedCandidate) {
    writeJson(path.join(outputDir, "managed-payload-digest.json"), {
      task_id: config.lockedCandidate.taskId,
      candidate_version: config.lockedCandidate.candidateVersion,
      operation: rollbackFrom ? "rollback" : "publish",
      payload_sha256: stableDigest(dryRun.payload_preview),
      expected_updated_at: rollbackFrom ? current.updated_at : config.lockedCandidate.expectedUpdatedAt,
    });
    if (!rollbackFrom) {
      const restoreDryRun = await postContentPublish(buildLockedDryRunRequest(config.lockedCandidate, current, `${source}:rollback-preview`, "rollback"));
      const afterRestorePreview = await fetchCurrent();
      assertLockedDryRunResult(config.lockedCandidate, restoreDryRun, publisherHttpStatus, current, afterRestorePreview, current);
      writeJson(path.join(outputDir, "rollback-payload-digest.json"), {
        task_id: config.lockedCandidate.taskId,
        candidate_version: config.lockedCandidate.candidateVersion,
        payload_sha256: stableDigest(restoreDryRun.payload_preview),
        baseline_fields_sha256: config.lockedCandidate.baselineFieldsSha256,
      });
    }
    if (process.env.GITHUB_ACTIONS === "true") {
      const probeToken = await requestGithubOidcToken();
      const identityProbe = await postContentPublish({ managedIdentityProbe: true }, { "x-managed-github-oidc": probeToken });
      if (identityProbe.ok !== true || identityProbe.dry_run !== true || identityProbe.performed_write !== false
          || Number(identityProbe.identity?.runId) !== Number(process.env.GITHUB_RUN_ID)
          || Number(identityProbe.identity?.runAttempt) !== Number(process.env.GITHUB_RUN_ATTEMPT)
          || !/^[0-9a-f]{40}$/.test(String(identityProbe.identity?.workflowSha || ""))) {
        fail("Managed OIDC identity probe did not verify this exact GitHub run without a write.");
      }
      writeJson(path.join(outputDir, "managed-identity-probe.json"), identityProbe);
    }
  }

  const rollbackCommand = config.lockedCandidate
    ? `Issue a distinct one-time rollback permit bound to this completed publish permit and its saved_updated_at; run content-publish-approved.yml with managed_operation=rollback, parent_run_id=${process.env.GITHUB_RUN_ID || "PARENT_RUN_ID"}, and the new permit ID.`
    : `npm run content:trust-fixes -- --target=${target} --execute --approval-id=${approvalId || "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14"} --rollback-from=${path.join(outputDir, "backup.json")} --env-dir=${envDir}`;
  writeText(path.join(outputDir, "CHANGELOG.md"), `# ${target} content trust change\n\n- Operation: ${operation}\n- Content type: ${config.contentType}\n- Bilingual paths: ${config.publicPaths.map((item) => item.path).join(", ")}\n- Backup: \`backup.json\`\n- Desired payload: \`desired.json\`\n- Dry run: \`dry-run.json\`\n- Rollback command: \`${rollbackCommand}\`\n`);

  if (!execute) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", target, outputDir, dryRun }, null, 2));
    return;
  }

  const managedOidcToken = config.lockedCandidate && execute ? await requestGithubOidcToken() : null;
  const published = await postContentPublish({
    contentType: config.contentType,
    mode: "publish",
    nextStatus: "published",
    expectedUpdatedAt: rollbackFrom ? current.updated_at || null : config.lockedCandidate?.expectedUpdatedAt || current.updated_at || null,
    ownerApproved: true,
    explicitExecution: true,
    approvalId,
    record: desired,
    source,
    ...(config.lockedCandidate ? { managedPermit: {
      permitId: managedPermitId,
      taskId: config.lockedCandidate.taskId,
      actionId: rollbackFrom ? `rollback-${config.lockedCandidate.candidateVersion}` : config.lockedCandidate.actionId,
      operation: rollbackFrom ? "rollback" : "publish",
      scope: config.lockedCandidate.scope,
      candidateVersion: rollbackFrom ? `${config.lockedCandidate.candidateVersion}-rollback-v1` : config.lockedCandidate.candidateVersion,
    } } : {}),
  }, managedOidcToken ? { "x-managed-github-oidc": managedOidcToken } : {});
  const postRecord = await fetchCurrent();

  const ignoredComparisonFields = new Set(["id", "updated_at", "created_at", "version"]);
  const desiredComparable = Object.fromEntries(Object.entries(desired).filter(([key]) => !ignoredComparisonFields.has(key)));
  const rowMismatches = Object.entries(desiredComparable)
    .filter(([key, value]) => !valuesMatch(postRecord[key], value))
    .map(([key]) => key);

  const pageChecks = [];
  const publicPaths = rollbackFrom && config.lockedCandidate
    ? config.publicPaths.map((page) => ({
      ...page,
      expected: String(page.path.startsWith("/zh/") ? desired.seo_title_zh : desired.seo_title_en).replaceAll("&", "&amp;"),
      ...(page.requiredPhrases?.length ? {
        requiredPhrases: (page.path.startsWith("/zh/") ? desired.faqs_zh : desired.faqs_en).map((faq) => faq.q),
        forbidden: [...(page.forbidden || []), ...page.requiredPhrases],
      } : {}),
    }))
    : config.publicPaths;
  for (const page of publicPaths) {
    let last = { path: page.path, status: 0, expected: page.expected, found: false, forbiddenFound: [], missingRequired: [] };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${publicSiteUrl}${page.path}?content_audit=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
      const html = await response.text();
      const forbiddenFound = (page.forbidden || []).filter((phrase) => html.includes(phrase));
      const missingRequired = (page.requiredPhrases || []).filter((phrase) => !html.includes(phrase));
      last = { path: page.path, status: response.status, expected: page.expected, found: html.includes(page.expected), forbiddenFound, missingRequired };
      if (last.status === 200 && last.found && forbiddenFound.length === 0 && missingRequired.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    pageChecks.push(last);
  }

  const postcheck = {
    ok: rowMismatches.length === 0 && pageChecks.every((check) => check.status === 200 && check.found && check.forbiddenFound.length === 0 && check.missingRequired.length === 0),
    checkedAt: new Date().toISOString(),
    rowMismatches,
    pageChecks,
  };
  writeJson(path.join(outputDir, "postcheck.json"), postcheck);

  if (!postcheck.ok && operation !== "rollback" && !config.lockedCandidate) {
    const rollbackResult = await postContentPublish({
      contentType: config.contentType,
      mode: "publish",
      nextStatus: "published",
      expectedUpdatedAt: postRecord.updated_at || published.saved_updated_at || null,
      ownerApproved: true,
      explicitExecution: true,
      approvalId,
      record: backup.record,
      source: `${source}:automatic-rollback`,
    });
    const receipt = { ok: false, target, operation, published, postcheck, automaticRollback: rollbackResult };
    writeJson(path.join(outputDir, "publish-receipt.json"), receipt);
    fail(`Post-publish verification failed for ${target}; the previous content was restored automatically.`);
  }
  if (!postcheck.ok && config.lockedCandidate) {
    writeJson(path.join(outputDir, "publish-receipt.json"), {
      ok: false, target, operation, published, postcheck,
      recovery: "CMS row readback and a separately issued single-use rollback permit are required; do not retry the publish permit.",
    });
    fail(`Post-publish verification failed for ${target}; the one-time permit cannot be replayed.`);
  }

  const receipt = {
    ok: postcheck.ok,
    target,
    operation,
    approvalId,
    publishedAt: new Date().toISOString(),
    published,
    postcheck,
    rollbackCommand,
  };
  writeJson(path.join(outputDir, "publish-receipt.json"), receipt);
  console.log(JSON.stringify({ ok: true, mode: "publish", target, outputDir, receipt }, null, 2));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export { targetConfigs, assertLockedServiceCandidate, assertLockedRollbackCurrent, assertLockedPublishGate, buildLockedDryRunRequest, assertLockedDryRunResult, stableDigest };
