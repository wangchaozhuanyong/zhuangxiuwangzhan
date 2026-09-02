/**
 * Location data for all service area pages.
 * To add a new location, simply add a new entry here — no code changes needed.
 */

const residentialImg = "/images/projects/residential-renovation.webp";
const commercialImg = "/images/projects/commercial-renovation.webp";
const kitchenImg = "/images/projects/kitchen-cabinet.webp";

export interface LocationProject {
  title: string;
  type: string;
  image: string;
  slug?: string;
  href?: string;
}

export interface LocationData {
  name: string;
  nameZh?: string;
  slug: string;
  metaTitle: string;
  metaTitleZh?: string;
  description: string;
  descriptionZh?: string;
  intro: string;
  introZh?: string;
  propertyTypes: string[];
  propertyTypesZh?: string[];
  commonNeeds: string[];
  commonNeedsZh?: string[];
  constructionNotes: string;
  constructionNotesZh?: string;
  projects: LocationProject[];
  faqs: { q: string; a: string }[];
  faqsZh?: { q: string; a: string }[];
}

export const locationsData: Record<string, LocationData> = {
  "kuala-lumpur": {
    name: "Kuala Lumpur",
    nameZh: "吉隆坡",
    slug: "kuala-lumpur",
    metaTitle: "Renovation Services in Kuala Lumpur | FLASH CAST",
    metaTitleZh: "吉隆坡装修服务 | 住宅与商业空间 | FLASH CAST",
    description: "Plan residential or commercial renovation in Kuala Lumpur with FLASH CAST. Review property types, condo management rules, commercial fit-outs, and quotation scope.",
    descriptionZh: "FLASH CAST 为吉隆坡提供住宅与商业装修服务。覆盖高层公寓管理处申请、有地排屋改造、商业空间与定制柜工程，支持现场评估与明细报价。",
    intro: "Kuala Lumpur renovation projects feature a diverse mix of high-rise condominiums, established landed homes, commercial corporate offices, and street-level shoplots. Renovation planning in KL requires navigating strict Joint Management Body (JMB) or Management Corporation (MC) renovation guidelines, DBKL permits for structural alterations, freight elevator booking, noise and working-hour limitations, and coordinated multi-trade scheduling. FLASH CAST helps property owners and commercial operators define clear project scopes, select appropriate materials, manage site constraints, and execute seamless renovations across all major Kuala Lumpur districts.",
    introZh: "吉隆坡的装修项目涵盖高层公寓、成熟有地住宅、商业写字楼以及沿街商铺等多种物业类型。在吉隆坡进行装修，通常需要应对严格的管理处（JMB/MC）审批流程、DBKL 市政改造报批、货梯保护与使用预约、施工时间与噪音限制，以及泥水、水电、木作等多个工种的交叉协调。FLASH CAST 从真实现场勘测与需求出发，协助业主厘清工程范围、把控选材标准、协调物业审批，并落实明细报价与施工交付。",
    propertyTypes: [
      "High-rise condominiums & serviced apartments (Mont Kiara, KLCC, Bangsar, Sri Hartamas)",
      "Established landed homes & terraces (Cheras, Kepong, Setapak, TTDI)",
      "Commercial corporate offices in office towers (KL Sentral, Mid Valley, Bukit Bintang)",
      "Street-level shoplots & retail units (Telawi Bangsar, Cheras Commercial, Old Klang Road)",
      "Semi-detached & bungalow homes (Damansara Heights, Bangsar, Kenny Hills)",
    ],
    propertyTypesZh: [
      "高层公寓与服务式住宅（Mont Kiara、KLCC、Bangsar、Sri Hartamas）",
      "成熟排屋与有地住宅（Cheras、Kepong、Setapak、TTDI）",
      "商业大楼企业办公室（KL Sentral、Mid Valley、Bukit Bintang）",
      "沿街商铺与零售餐饮空间（Telawi Bangsar、Cheras 商业区、Old Klang Road）",
      "半独立式与独立洋房（Damansara Heights、Bangsar、Kenny Hills）",
    ],
    commonNeeds: [
      "Full condo renovation with management office submission, deposit, and lift protection",
      "Kitchen cabinet replacement, wet/dry kitchen separation, and appliance point planning",
      "Bathroom renovation with multi-layer waterproofing membrane and plumbing renewal",
      "Landed house modernization, electrical rewiring, roof leakage repair, and layout opening",
      "Corporate office partition, glass meeting rooms, ceiling, and M&E / data cabling",
      "Custom built-in wardrobes, TV feature walls, and compact home storage solutions",
    ],
    commonNeedsZh: [
      "整套公寓翻新：包含管理处报备、装修押金、公共走廊与电梯保护",
      "厨房橱柜定制：干湿厨房动线分区、防潮板材与厨电水电点位规划",
      "浴室翻新与防水：多层防水施工、老旧水管更换与坡度排水优化",
      "有地排屋改造：全屋电线重拉、屋顶防漏修缮与室内空间打通",
      "企业办公室 Fit-Out：玻璃隔断、会议室规划、天花与机电网络布线",
      "全屋定制收纳：衣帽间、电视背景墙柜、玄关鞋柜与防潮内嵌家具",
    ],
    constructionNotes: "Kuala Lumpur construction regulations differ significantly between strata developments and landed properties. For condominiums and office towers, building management typically requires contractor public liability insurance, refundable security deposits, designated work hours (usually 9:00 AM to 5:00 PM on weekdays), noise-controlled periods, and strict protection for common corridors and lifts. For landed properties involving structural additions or facade alterations, DBKL (Dewan Bandaraya Kuala Lumpur) drawings and permits must be confirmed with certified consultants before commencing work. We coordinate with owners, property management, and licensed specialists to ensure documentation is properly aligned prior to site mobilization.",
    constructionNotesZh: "吉隆坡的装修施工规范在分层地契建筑（Condo / 写字楼）与有地住宅之间存在明显差异。高层公寓和商业大楼通常要求承包商提供公众责任险（Public Liability Insurance）、缴纳可退还装修押金、限定工作时段（通常为周一至周五 9:00–17:00）、控制高噪音工序，并对公共走廊和货梯进行全方位保护。有地住宅如涉及外扩结构或门面改动，则需由注册执业人士向 DBKL（吉隆坡市政局）报批图纸与准证。FLASH CAST 在施工前协助业主核对管理处规约与报备文件，确保现场合规进场。",
    projects: [
      {
        title: "Modern Condo Renovation in Mont Kiara",
        type: "Residential",
        image: residentialImg,
        slug: "mont-kiara-luxury-condo-renovation",
        href: "/projects/mont-kiara-luxury-condo-renovation",
      },
      {
        title: "Office Fit-Out in KL Sentral",
        type: "Commercial",
        image: commercialImg,
        slug: "kl-sentral-meeting-room-pantry-upgrade",
        href: "/projects/kl-sentral-meeting-room-pantry-upgrade",
      },
      {
        title: "Custom Kitchen in Bangsar",
        type: "Built-In",
        image: kitchenImg,
        slug: "custom-kitchen-bangsar",
        href: "/projects/custom-kitchen-bangsar",
      },
    ],
    faqs: [
      {
        q: "Which districts in Kuala Lumpur do you cover for residential and commercial renovations?",
        a: "We provide renovation and fit-out services across all major Kuala Lumpur areas, including Mont Kiara, Bangsar, Cheras, Kepong, Wangsa Maju, Setapak, Sentul, Sri Hartamas, Damansara Heights, Bukit Bintang, KL Sentral, TTDI, and the Kuala Lumpur city centre.",
      },
      {
        q: "How are condominium renovation permits and management submissions handled in KL?",
        a: "Condominium renovations require prior approval from the Joint Management Body (JMB) or Management Corporation (MC). We assist homeowners by preparing contractor insurance documents, scope descriptions, and work schedules, and review elevator protection and deposit requirements before work begins. Structural alterations requiring DBKL approval must be signed off by a certified engineer.",
      },
      {
        q: "What factors influence the start date of a renovation project in Kuala Lumpur?",
        a: "The start date depends on completing site measurements, finalizing the bill of quantities (BOQ), material lead times (such as custom quartz countertops or specialized carpentry finishes), and obtaining the management renovation permit (which typically takes 5 to 14 working days after submission).",
      },
      {
        q: "What factors affect condo and landed house renovation costs in Kuala Lumpur?",
        a: "Costs depend on property type and access conditions (e.g., high-rise lift access vs landed driveways), the extent of wet works (demolition, masonry, waterproofing), mechanical & electrical renewal requirements, and the grade of materials chosen for cabinetry, flooring, and sanitary fittings. We provide itemized quotations so you can evaluate essential works versus optional aesthetic upgrades.",
      },
    ],
    faqsZh: [
      {
        q: "FLASH CAST 在吉隆坡具体覆盖哪些区域的住宅与商业装修？",
        a: "我们的服务覆盖吉隆坡所有主要区域，包括 Mont Kiara、Bangsar、Cheras（蕉赖）、Kepong（甲洞）、Wangsa Maju、Setapak（文良港）、Sentul（冼都）、Sri Hartamas、Damansara Heights、Bukit Bintang、KL Sentral、TTDI 以及吉隆坡市中心核心区。",
      },
      {
        q: "吉隆坡高层公寓的管理处装修审批流程如何办理？",
        a: "公寓装修需提前向大楼管理处（JMB 或 MC）提交申请。我们协助业主准备施工范围说明、工期计划表及承包商保险（Public Liability）文件，并提前确认货梯保护与装修押金标准。若涉及敲除非承重墙或结构改动，需按 DBKL 规定由注册结构工程师出具图纸。",
      },
      {
        q: "在吉隆坡开始一项装修工程通常需要多长时间准备？",
        a: "开工时间主要取决于现场量房复核、报价方案敲定、定制材料（如橱柜板材、石材台面）的加工周期，以及管理处审批进度。通常管理处审批需要 5 至 14 个工作日，所有手续齐备后方可安排保护进场。",
      },
      {
        q: "影响吉隆坡公寓与排屋装修费用的核心因素有哪些？",
        a: "费用主要取决于物业类型与进场难度（如公寓货梯搬运与保护要求）、泥水与湿作工程量（拆墙、地砖、防水）、水电管线老化是否需要全换，以及橱柜定制与地面材料的选型等级。FLASH CAST 提供详细拆项的工程报价单，帮助业主区分必须工程与升级选项。",
      },
    ],
  },
  "selangor": {
    name: "Selangor",
    slug: "selangor",
    metaTitle: "Renovation Company Selangor | Shah Alam, PJ, Subang | FLASH CAST",
    description: "Discuss renovation planning for selected Selangor areas, including residential, commercial, built-in, and fit-out scope based on the real site.",
    intro: "Selangor includes different local-authority areas, strata buildings, landed homes, commercial units, and industrial spaces. The relevant site, management, landlord, and authority requirements should be checked for each project.",
    propertyTypes: ["Double-storey terrace houses", "Semi-detached and bungalows", "Condominiums and apartments", "Shop lots (single and double storey)", "Industrial units and warehouses", "Office units in commercial complexes"],
    commonNeeds: ["Full landed house renovation and extension", "Kitchen and bathroom overhaul for older homes", "Shop lot renovation for new business setup", "Warehouse racking and storage solutions", "Custom built-in furniture for family homes", "Office renovation and partitioning"],
    constructionNotes: "Requirements vary by local-authority area, property type, management rules, and proposed work. Confirm extension, structural, external, strata, access, and document requirements with the relevant current parties before construction.",
    projects: [
      { title: "Landed House Renovation in Shah Alam", type: "Residential", image: residentialImg },
      { title: "Shop Renovation in Klang", type: "Commercial", image: commercialImg },
      { title: "Custom Kitchen in Subang Jaya", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Which areas in Selangor do you serve?", a: "We serve all major areas including Shah Alam, Petaling Jaya, Subang Jaya, Puchong, Klang, Ampang, Kajang, Rawang, Setia Alam, Kota Kemuning, and surrounding areas." },
      { q: "Can site measurement be arranged in Selangor?", a: "Site measurement can be arranged based on area, project type, access, and schedule." },
      { q: "Can a landed-house extension be assessed?", a: "Yes. Share the existing condition and proposed changes so structural, consultant, authority, neighbour, access, and quotation requirements can be identified." },
      { q: "How are different Selangor approval requirements handled?", a: "First identify the current relevant authority and property rules. The required drawings, submissions, responsible parties, fees, and timing should then be confirmed for that exact scope." },
    ],
  },
  "petaling-jaya": {
    name: "Petaling Jaya",
    nameZh: "八打灵再也",
    slug: "petaling-jaya",
    metaTitle: "Home & Office Renovation Petaling Jaya | FLASH CAST",
    metaTitleZh: "八打灵再也装修服务 | 住宅与办公室装修 | FLASH CAST",
    description: "Plan home or office renovation in Petaling Jaya with FLASH CAST. Review terrace house upgrades, corporate office fit-outs, MBPJ guidelines, and quotation scope.",
    descriptionZh: "FLASH CAST 为八打灵再也（PJ）提供住宅与办公室装修服务。涵盖 SS2 / Section 17 老排屋翻新、商业写字楼 Fit-Out、MBPJ 报批协调与明细报价。",
    intro: "Petaling Jaya is one of Selangor's most established urban centres, featuring mature residential neighbourhoods, active commercial squares, and major corporate office developments. Renovation projects in PJ frequently involve double-storey terrace modernizations with structural kitchen extensions, older electrical rewiring, plumbing renewal, and corporate office fit-outs requiring coordination with building management and Majlis Bandaraya Petaling Jaya (MBPJ). FLASH CAST provides end-to-end renovation planning, space design, trade coordination, and council permit support across SS2, Section 17, Damansara Utama, Kelana Jaya, and all PJ districts.",
    introZh: "八打灵再也（PJ）是雪兰莪最成熟的核心城市之一，兼具历史悠久的成熟住宅社区、活跃的商业街区与现代企业写字楼中心。在 PJ 进行装修，常见的工程包括双层排屋的结构性厨房后扩建、老旧水电管线重拉、屋顶防水，以及企业办公室隔断与机电工程。这些工程通常需要协调大楼物业规约与 MBPJ（八打灵再也市政局）报批手续。FLASH CAST 协助业主从实地勘测开始，把控选材标准、协调市政与管理处报备，并提供明细透明的工程报价与施工交付。",
    propertyTypes: [
      "Established double-storey terrace houses (SS2, Section 17, Taman SEA, Damansara Utama)",
      "Corporate office spaces in commercial towers (PJ Trade Centre, Kelana Jaya, Section 13)",
      "Commercial shophouses & retail units (SS2 Commercial Square, PJ New Town, Damansara Uptown)",
      "Modern condominiums & serviced apartments (Kelana Jaya, Tropicana, Ara Damansara)",
      "Semi-detached & bungalow homes (Section 5, Section 11, Tropicana Golf & Country Resort)",
    ],
    propertyTypesZh: [
      "成熟双层排屋与有地住宅（SS2、Section 17、Taman SEA、Damansara Utama）",
      "商业大楼企业写字楼（PJ Trade Centre、Kelana Jaya、Section 13）",
      "沿街商铺与商业中心单位（SS2 商业区、PJ New Town、Damansara Uptown）",
      "现代公寓与服务式住宅（Kelana Jaya、Tropicana、Ara Damansara）",
      "半独立式与独立洋房（Section 5、Section 11、Tropicana）",
    ],
    commonNeeds: [
      "Full terrace house refurbishment: electrical rewiring, re-plumbing, and rear kitchen extension",
      "Corporate office fit-out: glass partitions, meeting rooms, acoustic ceilings, and network cabling",
      "Wet and dry kitchen renovation with custom cabinets and heavy-duty countertops",
      "Bathroom renovation with multi-layer waterproofing membrane and sanitary upgrades",
      "Commercial shophouse conversion: shopfront, customer flow, display, and lighting",
      "Custom whole-home built-in storage: walk-in wardrobes, TV feature walls, and shoe cabinets",
    ],
    commonNeedsZh: [
      "排屋全屋整修：全屋电线重拉、水管更新与后院厨房扩建",
      "企业办公室 Fit-Out：玻璃隔断、会议室规划、吸音天花与网络弱电布线",
      "干湿厨房动线升级：定制防潮橱柜、耐用石英石台面与厨电点位配置",
      "浴室翻新与防水：多层防水施工、老旧排污管更换与洁具升级",
      "商业店铺改造：门面重塑、店内动线优化、展示收纳与照明设计",
      "全屋定制内嵌家具：步入式衣帽间、电视背景柜与玄关收纳鞋柜",
    ],
    constructionNotes: "For landed property renovations in Petaling Jaya involving rear extensions, car porch reconstructions, or structural alterations, approval drawings must be submitted to Majlis Bandaraya Petaling Jaya (MBPJ) by a registered architect or structural consultant before commencement. For office towers around Kelana Jaya, PJ Trade Centre, or Section 13, contractors must provide public liability insurance, refundable renovation deposits, fire protection drawings (Bomba compliance), and adhere to strict after-hours working schedules. We assist clients in preparing the required architectural details and council submissions to guarantee regulatory compliance.",
    constructionNotesZh: "在八打灵再也进行有地住宅装修，若涉及后院厨房扩建、车房顶棚改造或打拆承重墙等结构变更，必须在动工前由注册建筑师或结构工程师向 MBPJ（八打灵再也市政局）报批施工图纸并取得施工准证。对于 Kelana Jaya、PJ Trade Centre 或 Section 13 等商业写字楼，承包商须按物业规定提交公众责任险、押金、消防（Bomba）合规文件，并严格遵守非办公时段施工规定。FLASH CAST 在施工前协助业主理清报批材料，确保施工全程合规。",
    projects: [
      {
        title: "Corporate Office Fit-Out in Petaling Jaya",
        type: "Commercial",
        image: commercialImg,
        slug: "petaling-jaya-corporate-office-fit-out",
        href: "/projects/petaling-jaya-corporate-office-fit-out",
      },
      {
        title: "Aluminium Glass Entrance in Petaling Jaya",
        type: "Commercial",
        image: commercialImg,
        slug: "petaling-jaya-aluminium-glass-entrance",
        href: "/projects/petaling-jaya-aluminium-glass-entrance",
      },
      {
        title: "Established Home Renovation Reference",
        type: "Residential",
        image: residentialImg,
        slug: "corporate-office-petaling-jaya",
        href: "/projects/corporate-office-petaling-jaya",
      },
    ],
    faqs: [
      {
        q: "Which areas in Petaling Jaya do you serve for residential and commercial renovations?",
        a: "We provide comprehensive renovation and fit-out services across all Petaling Jaya neighbourhoods, including SS2, Section 17, Taman SEA, Damansara Utama (Uptown), Damansara Jaya, Kelana Jaya, Ara Damansara, Kota Damansara, Tropicana, Bandar Utama, PJ New Town, Section 13, and surrounding areas.",
      },
      {
        q: "When is an MBPJ council renovation permit required for a house in PJ?",
        a: "An MBPJ permit is mandatory if your renovation involves structural alterations, knocking down load-bearing walls, extending your kitchen/backyard, rebuilding the car porch, or altering the exterior facade. Purely internal cosmetic work (such as built-in cabinets, floor tiling, painting, or bathroom fixture replacement) does not typically require council approval.",
      },
      {
        q: "How are corporate office fit-outs coordinated in Petaling Jaya commercial towers?",
        a: "We review building-specific tenant fit-out guidelines, submit contractor insurance documents, coordinate acoustic and fire-rated partition installations with Bomba compliance, and schedule noisy drilling or M&E work during designated evening and weekend hours to avoid disrupting other tenants.",
      },
      {
        q: "What factors affect the renovation cost of an older terrace house in Petaling Jaya?",
        a: "Costs in mature PJ neighbourhoods are primarily influenced by existing electrical wiring and plumbing condition (frequently requiring full replacement), roof drainage and leak repairs, soil settlement conditions for rear extensions, and the scope of custom built-in cabinetry and finishes selected.",
      },
    ],
    faqsZh: [
      {
        q: "FLASH CAST 在八打灵再也（PJ）具体服务哪些区域？",
        a: "我们的服务全面覆盖八打灵再也各大区域，包括 SS2、Section 17、Taman SEA、Damansara Utama（Uptown）、Damansara Jaya、Kelana Jaya、Ara Damansara、Kota Damansara、Tropicana、Bandar Utama、PJ New Town、Section 13 及周边区域。",
      },
      {
        q: "在八打灵再也装修排屋，什么时候需要向 MBPJ 市政局申请准证？",
        a: "如果装修涉及结构改动（如敲除承重墙、后院/厨房外扩、重造车房顶棚或改动房屋外立面），必须向 MBPJ 申请报批并取得准证。纯室内表面翻新（如定制橱柜、铺设 SPC 地板、室内油漆、洁具更换等）通常无需向市政局报批。",
      },
      {
        q: "八打灵再也商业大楼与办公室 Fit-Out 如何协调施工？",
        a: "我们协助业主审查大楼租户装修手册，提交承包商保险与安全文件，确保玻璃隔断与吸音工程符合消防（Bomba）规范，并将高噪音工序安排在工作日晚间或周末进行，确保大楼正常运营不受影响。",
      },
      {
        q: "影响八打灵再也成熟排屋装修费用的主要因素有哪些？",
        a: "PJ 成熟排屋的费用主要取决于老化基础设施（旧电线水管是否需要全换）、屋顶防漏修缮、后扩建地基与泥水工程量，以及橱柜定制、石材台面与地面工程的材料规格。我们提供清晰拆项的工程报价单，方便业主按需规划。",
      },
    ],
  },
  "cheras": {
    name: "Cheras",
    slug: "cheras",
    metaTitle: "Renovation Planning Cheras | Homes, Condos & Shops | FLASH CAST",
    description: "Plan renovation, interior layouts, built-in storage, and selected fit-out scope for homes, condos, and commercial spaces in Cheras.",
    intro: "Cheras includes older landed homes, strata properties, and commercial units. Existing wiring, plumbing, moisture, structure, access, management rules, and retained finishes should be reviewed before defining scope.",
    propertyTypes: ["Older terrace houses (Taman Connaught, Taman Midah)", "Modern condominiums (EkoCheras, Southgate)", "Apartments and flats", "Shop lots along Jalan Cheras", "Commercial units"],
    commonNeeds: ["Older terrace house modernization with rewiring and replumbing", "Kitchen and bathroom renovation for aging properties", "Built-in wardrobes and storage maximization", "Condo interior design for new units", "Shop lot renovation for F&B and retail"],
    constructionNotes: "Older properties may need additional checks for electrical wiring, plumbing, moisture, waterproofing, roof condition, structure, and previous alterations. Requirements depend on the real site and proposed work.",
    projects: [
      { title: "Terrace House Renovation in Cheras", type: "Residential", image: residentialImg },
      { title: "Custom Built-In Cabinets in Taman Connaught", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you serve all areas in Cheras?", a: "Yes. We cover Taman Connaught, Taman Midah, Cheras Leisure Mall area, Taman Segar, Batu 9, Taman Yulek, Bandar Tun Razak, and all Cheras neighborhoods." },
      { q: "Can an older terrace house in Cheras be assessed?", a: "Yes. The site should first be reviewed for existing alterations, wiring, plumbing, moisture, roof, structure, access, and the intended renovation scope." },
      { q: "What affects renovation cost in Cheras?", a: "Property size, existing condition, demolition, repairs, services, materials, access, approvals, and confirmed scope all affect the quotation." },
    ],
  },
  "mont-kiara": {
    name: "Mont Kiara",
    slug: "mont-kiara",
    metaTitle: "Mont Kiara Condo Renovation Planning | FLASH CAST",
    description: "Plan a Mont Kiara condo renovation with attention to layout, built-ins, materials, building rules, access, protection, and quotation scope.",
    intro: "Mont Kiara includes high-rise condominiums with building-specific access, protection, work-hour, delivery, deposit, and document requirements. Confirm the exact management guide and unit condition before planning work.",
    propertyTypes: ["Premium condominiums (i-Zen, 28 Mont Kiara, Arcoris)", "Serviced apartments (Solaris Dutamas)", "Penthouse units", "Landed properties in surrounding areas"],
    commonNeeds: ["Condo renovation scope planning", "Walk-in wardrobe and storage planning", "Kitchen layout, countertop, and cabinet review", "Feature-wall and material direction", "Lighting and smart-system coordination", "Bedroom and bathroom planning"],
    constructionNotes: "Rules differ by development. Obtain the current guide for the exact building and confirm approved hours, protection, lift booking, deliveries, deposits, drawings, forms, insurance, and contractor documents.",
    projects: [
      { title: "Luxury Condo Renovation in i-Zen", type: "Residential", image: residentialImg },
      { title: "Premium Kitchen in Solaris Dutamas", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Can you assess a Mont Kiara condo renovation?", a: "Yes. Share the building name, unit condition, management requirements, and intended scope so access, protection, and approval needs can be reviewed before quotation." },
      { q: "Can stone, timber, acrylic, or artistic wall finishes be discussed?", a: "Yes. Suitability depends on the exact product, substrate, sample approval, installation detail, maintenance needs, building access, and confirmed quotation scope." },
      { q: "What affects Mont Kiara condo renovation cost?", a: "Mont Kiara condo renovation cost depends on size, material selection, management requirements, and confirmed scope." },
    ],
  },
  "bangsar": {
    name: "Bangsar",
    slug: "bangsar",
    metaTitle: "Renovation Services Bangsar | Interior Design Bangsar South | FLASH CAST",
    description: "Renovation services in Bangsar and Bangsar South. Interior design, shop renovation, F&B fit-out, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Bangsar includes older landed properties, strata homes, shophouses, F&B units, and offices. Planning should account for the existing building, neighbours, access, operations, services, approvals, and the intended character of the space.",
    propertyTypes: ["Heritage bungalows and semi-detached houses", "Modern condominiums (Bangsar South, The Vertical)", "Shophouses along Jalan Telawi", "F&B outlets and cafés", "Office units in Bangsar South towers"],
    commonNeeds: ["Heritage home renovation preserving character", "Modern condo interior redesign", "Café and restaurant fit-out", "Shop renovation on Jalan Telawi", "Boutique retail interior", "Custom built-in furniture for character homes"],
    constructionNotes: "Older properties, strata developments, and F&B premises can have different planning, management, landlord, fire-safety, ventilation, drainage, signage, or authority requirements. Confirm the current rules for the exact property and use.",
    projects: [
      { title: "Semi-D Renovation in Bangsar", type: "Residential", image: residentialImg },
      { title: "Café Fit-Out in Bangsar South", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Can older and newer Bangsar properties be assessed?", a: "Yes. The review should identify existing condition, structure, services, access, management or neighbour constraints, and the intended scope." },
      { q: "Can an F&B or retail fit-out in Bangsar be discussed?", a: "Yes. Share the business use, tenancy condition, floor plan, landlord or management guide, equipment, services, and intended opening direction for a scope review." },
      { q: "What should be checked for parking and material delivery?", a: "Confirm loading access, lift or stair route, delivery booking, protection, approved hours, vehicle limits, storage, and disruption controls with the relevant property manager." },
    ],
  },
  "subang-jaya": {
    name: "Subang Jaya",
    slug: "subang-jaya",
    metaTitle: "Renovation Company Subang Jaya | USJ, SS Areas | FLASH CAST",
    description: "Plan residential or commercial renovation, built-in storage, and interior fit-out scope in Subang Jaya based on site condition and current requirements.",
    intro: "Subang Jaya includes landed homes, strata properties, shop lots, and office units. The site condition, local requirements, management or landlord rules, access, services, and intended scope should be reviewed together.",
    propertyTypes: ["Double-storey terrace houses (USJ, SS areas)", "Semi-detached and bungalows", "Condominiums (Sunway area)", "Shop lots and commercial units", "Office spaces"],
    commonNeeds: ["Family home renovation and modernization", "Kitchen and bathroom upgrade for older terraces", "Double-storey house extension", "Shop lot renovation for new businesses", "Built-in furniture for growing families", "Home office setup"],
    constructionNotes: "For extensions, structural or external work, identify the current relevant authority and required qualified parties. Strata and commercial properties may also have separate management or landlord requirements.",
    projects: [
      { title: "Double-Storey House Renovation in USJ", type: "Residential", image: residentialImg },
      { title: "Retail Shop Fit-Out in Subang", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you cover USJ and SS areas in Subang Jaya?", a: "Yes. We serve all areas in Subang Jaya including USJ 1-27, SS15, SS16, SS17, SS18, SS19, Sunway, Putra Heights, and surrounding neighborhoods." },
      { q: "Can a landed-house extension in Subang be assessed?", a: "Yes. Share the existing condition and proposed changes so structural, consultant, authority, access, neighbour, and quotation requirements can be identified." },
      { q: "What affects a terrace-house renovation timeline?", a: "Confirmed scope, site condition, approvals, structural or service work, materials, access, sequencing, and change requests all affect timing." },
    ],
  },
  "puchong": {
    name: "Puchong",
    nameZh: "蒲种",
    slug: "puchong",
    metaTitle: "Home & Commercial Renovation Puchong | FLASH CAST",
    metaTitleZh: "蒲种装修服务 | 住宅排屋与商业空间 | FLASH CAST",
    description: "Plan home, office, or shop renovation in Puchong with FLASH CAST. Review Bandar Puteri landed upgrades, MBSJ guidelines, commercial fit-outs, and quotation scope.",
    descriptionZh: "FLASH CAST 为蒲种（Puchong）提供住宅排屋与商业空间装修服务。涵盖 Bandar Puteri / Taman Kinrara 排屋翻新、MBSJ 报批、商铺 Fit-Out 与明细报价。",
    intro: "Puchong is a thriving residential and commercial hub in Selangor, known for mature family-oriented landed townships, active commercial shoplot squares, and modern high-rise developments. Renovation projects across Bandar Puteri, Bandar Puchong Jaya, Taman Kinrara, and Puchong South frequently involve double-storey terrace modernizations with structural rear kitchen extensions, electrical rewiring, and retail or office shopfront fit-outs. Because Puchong falls under the jurisdiction of Majlis Bandaraya Subang Jaya (MBSJ), homeowners and business operators must navigate local council submission guidelines alongside individual building management rules. FLASH CAST provides end-to-end renovation planning, trade coordination, council compliance, and itemized quotations tailored to Puchong properties.",
    introZh: "蒲种（Puchong）是雪兰莪人口密集且极具商业活力的核心区域，兼具成熟家庭住宅社区、繁华的街区商业中心与现代高层公寓。在 Bandar Puteri、Bandar Puchong Jaya、Taman Kinrara 及 Puchong South 进行装修，常见的工程包括双层排屋的后院厨房扩建、全屋水电重拉、屋顶防水修缮，以及沿街商铺与办公空间的 Fit-Out 改造。由于蒲种由梳邦再也市政局（MBSJ）管辖，涉及房屋结构改动与商业招牌必须遵循市政报批程序。FLASH CAST 协助业主从实地测量、动线设计到市政规约合规把控，提供透明规范的明细报价与交付保障。",
    propertyTypes: [
      "Double-storey terrace houses (Bandar Puteri, Taman Kinrara, Puchong Jaya)",
      "Commercial shophouses & retail units (Bandar Puteri, IOI Boulevard, SetiaWalk)",
      "Modern condominiums & serviced apartments (Puchong South, Kinrara, SetiaWalk)",
      "Gated & guarded semi-detached / cluster homes (Bandar Puteri, Lake Edge)",
      "Commercial office & shop-office units (Pusat Bandar Puchong, Bandar Puteri)",
    ],
    propertyTypesZh: [
      "双层排屋与有地住宅（Bandar Puteri、Taman Kinrara、Puchong Jaya）",
      "商业店铺与零售单位（Bandar Puteri 商业区、IOI Boulevard、SetiaWalk）",
      "现代高层公寓与服务式住宅（Puchong South、Kinrara、SetiaWalk）",
      "围篱式半独立与联排别墅（Bandar Puteri、Lake Edge）",
      "办公楼与店屋办公室（Pusat Bandar Puchong、Bandar Puteri）",
    ],
    commonNeeds: [
      "Landed house refurbishment: kitchen extension, electrical upgrade, and roof waterproofing",
      "Dry and wet kitchen separation with custom cabinets and quartz stone countertops",
      "Bathroom renovation: old pipe replacement, waterproofing membrane, and tiling",
      "Retail shophouse & commercial unit fit-out for F&B, beauty, or professional offices",
      "Full-home custom carpentry: walk-in wardrobes, TV feature walls, and shoe cabinets",
      "Condo space planning and interior design for young families and rental units",
    ],
    commonNeedsZh: [
      "有地排屋整体翻新：后院厨房外扩、电线管路更新与屋顶防漏修缮",
      "干湿厨房动线重塑：定制防潮橱柜、石英石耐磨台面与抽油烟机点位规划",
      "卫生间翻新工程：老旧排污管更换、多层防水施工与地砖防滑洁具升级",
      "商业沿街店铺 Fit-Out：餐饮零售动线、门头重塑、照明与强弱电配置",
      "全屋定制内嵌收纳：主卧衣帽间、客厅电视背景柜与玄关储物柜",
      "公寓高空间利用率规划：针对家庭自住或出租单位的耐用软硬件配置",
    ],
    constructionNotes: "For landed property alterations in Puchong involving kitchen extensions, car porch remodeling, or structural modifications, building plans must be prepared and submitted to Majlis Bandaraya Subang Jaya (MBSJ) by an accredited architect or structural engineer. Commercial shophouses around Bandar Puteri and IOI Boulevard must comply with MBSJ commercial guidelines, debris containment rules, and Bomba fire clearance. For high-rise condominiums such as SetiaWalk, Koi Tropika, or The Heron Residency, work must adhere to JMB/MC guidelines, including contractor insurance deposits, elevator protection, and strictly observed working hours.",
    constructionNotesZh: "在蒲种进行有地住宅改造（如后院厨房外扩、车房顶棚重建或打拆承重墙等），必须由具备资质的建筑师向梳邦再也市政局（MBSJ）报批施工图纸并取得施工准证。位于 Bandar Puteri 与 IOI Boulevard 周边的沿街商业店铺，须遵守 MBSJ 商业装修规约、建材建筑废料清运规范与消拯局（Bomba）消防要求。对于 SetiaWalk、Koi Tropika 等高层公寓，施工前须向物业管理处缴纳押金、提交承包商保险，并严格遵守规定的施工时间与电梯保护要求。",
    projects: [
      {
        title: "Home Office Renovation in Puchong",
        type: "Residential",
        image: residentialImg,
        slug: "home-office-puchong",
        href: "/projects/home-office-puchong",
      },
      {
        title: "Puchong Home Library & Built-In Joinery",
        type: "Built-In",
        image: kitchenImg,
        slug: "puchong-home-library-built-in",
        href: "/projects/puchong-home-library-built-in",
      },
      {
        title: "Commercial Storage & Logistics Fit-Out",
        type: "Commercial",
        image: commercialImg,
        slug: "puchong-heavy-duty-warehouse-racking",
        href: "/projects/puchong-heavy-duty-warehouse-racking",
      },
    ],
    faqs: [
      {
        q: "Which areas in Puchong do you serve for home and commercial renovations?",
        a: "We provide comprehensive renovation and fit-out services across all Puchong townships, including Bandar Puteri Puchong, Bandar Puchong Jaya, Taman Kinrara, Pusat Bandar Puchong, Bukit Puchong, Puchong Prima, Puchong Utama, Puchong South, and nearby Kinrara districts.",
      },
      {
        q: "Which local council oversees renovation permits in Puchong, and what requires approval?",
        a: "Puchong falls under Majlis Bandaraya Subang Jaya (MBSJ). Any landed renovation involving structural alterations, rear kitchen extensions, car porch rebuilding, or modifications visible from the exterior requires formal architectural drawings and MBSJ permits before commencement. Purely internal works like cabinetry or tile replacement do not require council permits.",
      },
      {
        q: "Can a Puchong terrace house renovation be phased while the family occupies the home?",
        a: "While cosmetic work or partial kitchen updates can sometimes be zoned, extensive terrace house renovations (such as full electrical rewiring, wet kitchen hacking, structural wall removal, or multiple bathroom overhauls) generate substantial airborne dust, noise, and utility shutdowns. In such cases, we strongly advise temporary vacancy during the heavy structural phase.",
      },
      {
        q: "How long does a typical commercial shophouse fit-out take in Puchong?",
        a: "A standard commercial shoplot fit-out in Bandar Puteri or IOI Boulevard generally takes between 4 to 8 weeks following MBSJ and management permits, depending on partition requirements, electrical/lighting installations, plumbing points, and custom joinery fabrication.",
      },
    ],
    faqsZh: [
      {
        q: "FLASH CAST 在蒲种（Puchong）具体服务哪些片区？",
        a: "我们的服务全面覆盖蒲种各大社区与商业区，包括 Bandar Puteri Puchong、Bandar Puchong Jaya、Taman Kinrara、Pusat Bandar Puchong、Bukit Puchong、Puchong Prima、Puchong Utama、Puchong South 及周边 Kinrara 区域。",
      },
      {
        q: "蒲种装修归哪个市政局管辖？什么情况下需要申请施工准证？",
        a: "蒲种全境由梳邦再也市政局（MBSJ）管辖。有地排屋若涉及任何结构改动（如后院厨房外扩、打拆承重墙、重建车房顶棚或外立面改动），必须在动工前由注册建筑师向 MBSJ 申请施工准证。室内纯装饰性工程（如定制橱柜、铺设地板、室内油漆）无需向市政局报批。",
      },
      {
        q: "蒲种排屋在家人居住的情况下，可以分阶段进行翻新吗？",
        a: "若仅为局部小修或单房间家具定制，可通过防尘保护分阶段进行；但如果涉及全屋电线重拉、暗管敲墙、后院泥水扩建或卫生间防水重做，施工粉尘、噪音及断水断电将严重影响居住安全与健康。在此类重大工序期间，我们建议业主进行短期暂住过渡。",
      },
      {
        q: "蒲种商业沿街店铺的装修周期通常需要多久？",
        a: "在 Bandar Puteri 或 IOI Boulevard 周边的常规商业店铺 Fit-Out，在取得 MBSJ 准证与大楼/物业批准后，施工周期一般为 4 至 8 周，具体取决于空间隔断、强弱电配置、给排水改造及定制展示柜的体量。",
      },
    ],
  },
};
