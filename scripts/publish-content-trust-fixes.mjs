import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const target = args.find((arg) => arg.startsWith("--target="))?.slice("--target=".length) || "";
const approvalId = args.find((arg) => arg.startsWith("--approval-id="))?.slice("--approval-id=".length) || "";
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
    contentType: "service", table: "services", keyField: "slug", key: "kitchen", fields: serviceFields, buildRecord: serviceFaqRecord("kitchen"),
    publicPaths: [
      { path: "/en/services/kitchen", expected: "Kitchen Renovation Malaysia | FLASH CAST", forbidden: ["This page should not publish", "owner-confirmed project"] },
      { path: "/zh/services/kitchen", expected: "厨房装修与橱柜定制", forbidden: ["业主确认", "页面不应"] },
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

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) fail(body.error || `HTTP ${response.status}`);
  return body;
};

const main = async () => {
  const config = targetConfigs[target];
  if (!config) fail(`--target must be one of: ${Object.keys(targetConfigs).join(", ")}`);
  if (execute && !approvalId) fail("--execute requires --approval-id=<authorization reference>.");
  if (rollbackFrom && !execute) fail("--rollback-from requires --execute.");

  const env = loadEnv("", envDir, "");
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const publishSecret = env.CONTENT_PUBLISH_SECRET;
  const publicSiteUrl = (env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
  if (!supabaseUrl || !anonKey || !publishSecret) {
    fail("SUPABASE_URL/VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and CONTENT_PUBLISH_SECRET are required.");
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
    if (!Array.isArray(rows) || !rows[0]) fail(`Published ${config.table}.${config.key} was not found.`);
    return rows[0];
  };
  const postContentPublish = async (body) => fetchJson(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/content-publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": publishSecret },
      body: JSON.stringify(body),
    },
  );

  const current = await fetchCurrent();
  const backup = { target, contentType: config.contentType, table: config.table, keyField: config.keyField, key: config.key, capturedAt: new Date().toISOString(), record: current };
  writeJson(path.join(outputDir, "backup.json"), backup);

  let desired;
  let operation = "optimize";
  if (rollbackFrom) {
    const rollback = JSON.parse(fs.readFileSync(path.resolve(rollbackFrom), "utf8"));
    if (rollback.target !== target || rollback.key !== config.key || !rollback.record) fail("Rollback backup does not match the selected target.");
    desired = rollback.record;
    operation = "rollback";
  } else {
    desired = config.buildRecord(current);
  }
  writeJson(path.join(outputDir, "desired.json"), { target, operation, record: desired });

  const source = `content-trust-20260821:${target}:${operation}`;
  const dryRun = await postContentPublish({
    contentType: config.contentType,
    mode: "dry-run",
    nextStatus: "published",
    expectedUpdatedAt: current.updated_at || null,
    record: desired,
    source,
  });
  writeJson(path.join(outputDir, "dry-run.json"), dryRun);

  const rollbackCommand = `npm run content:trust-fixes -- --target=${target} --execute --approval-id=${approvalId || "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14"} --rollback-from=${path.join(outputDir, "backup.json")} --env-dir=${envDir}`;
  writeText(path.join(outputDir, "CHANGELOG.md"), `# ${target} content trust change\n\n- Operation: ${operation}\n- Content type: ${config.contentType}\n- Bilingual paths: ${config.publicPaths.map((item) => item.path).join(", ")}\n- Backup: \`backup.json\`\n- Desired payload: \`desired.json\`\n- Dry run: \`dry-run.json\`\n- Rollback command: \`${rollbackCommand}\`\n`);

  if (!execute) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", target, outputDir, dryRun }, null, 2));
    return;
  }

  const published = await postContentPublish({
    contentType: config.contentType,
    mode: "publish",
    nextStatus: "published",
    expectedUpdatedAt: current.updated_at || null,
    ownerApproved: true,
    explicitExecution: true,
    approvalId,
    record: desired,
    source,
  });
  const postRecord = await fetchCurrent();

  const ignoredComparisonFields = new Set(["id", "updated_at", "created_at", "version"]);
  const desiredComparable = Object.fromEntries(Object.entries(desired).filter(([key]) => !ignoredComparisonFields.has(key)));
  const rowMismatches = Object.entries(desiredComparable)
    .filter(([key, value]) => !valuesMatch(postRecord[key], value))
    .map(([key]) => key);

  const pageChecks = [];
  for (const page of config.publicPaths) {
    let last = { path: page.path, status: 0, expected: page.expected, found: false, forbiddenFound: [] };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${publicSiteUrl}${page.path}?content_audit=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
      const html = await response.text();
      const forbiddenFound = (page.forbidden || []).filter((phrase) => html.includes(phrase));
      last = { path: page.path, status: response.status, expected: page.expected, found: html.includes(page.expected), forbiddenFound };
      if (last.status === 200 && last.found && forbiddenFound.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    pageChecks.push(last);
  }

  const postcheck = {
    ok: rowMismatches.length === 0 && pageChecks.every((check) => check.status === 200 && check.found && check.forbiddenFound.length === 0),
    checkedAt: new Date().toISOString(),
    rowMismatches,
    pageChecks,
  };
  writeJson(path.join(outputDir, "postcheck.json"), postcheck);

  if (!postcheck.ok && operation !== "rollback") {
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
