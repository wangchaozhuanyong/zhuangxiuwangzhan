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
    slug: "petaling-jaya",
    metaTitle: "Renovation Services Petaling Jaya | Interior Design PJ | FLASH CAST",
    description: "Renovation and interior design services in Petaling Jaya. Custom built-in, office fit-outs, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Petaling Jaya includes established landed neighbourhoods, strata homes, shop lots, and commercial offices. Renovation planning should reflect the property condition, access, management or landlord rules, services, and confirmed work scope.",
    propertyTypes: ["Terrace houses (SS2, Section 17, Taman SEA)", "Condominiums (Kelana Jaya, Damansara)", "Semi-detached and bungalows (Damansara Heights area)", "Shop lots (SS2, PJ New Town)", "Office units (Kelana Jaya, PJ Trade Centre)"],
    commonNeeds: ["Terrace house full renovation", "Condo interior redesign", "Office partition and modern fit-out", "Kitchen cabinet replacement", "Bathroom waterproofing and upgrade", "Feature wall and built-in furniture"],
    constructionNotes: "Check the current local-authority, management, landlord, access, protection, work-hour, drawing, and submission requirements for the specific PJ property and proposed scope before work.",
    projects: [
      { title: "Condo Renovation in Damansara", type: "Residential", image: residentialImg },
      { title: "Office Renovation in Kelana Jaya", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you do renovations in all PJ areas?", a: "Yes. We cover SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA, SS15, Tropicana, and all surrounding areas in Petaling Jaya." },
      { q: "Can an office renovation in PJ be assessed?", a: "Yes. Share the floor plan or photos, area, headcount, business use, management guide, M&E needs, and intended timing for an initial scope review." },
      { q: "What affects terrace house renovation cost in PJ?", a: "Terrace house renovation cost in PJ depends on size, structure, wiring, plumbing, materials, and confirmed scope." },
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
    slug: "puchong",
    metaTitle: "Renovation Company Puchong | Home, Office & Shop Renovation | FLASH CAST",
    description: "Discuss renovation planning in Puchong for landed homes, condos, offices, shops, and selected commercial spaces based on the real site and scope.",
    intro: "Puchong has a strong mix of family homes, new condominiums, shop lots, and light commercial spaces. FLASH CAST supports homeowners and business owners with practical renovation planning, custom built-in work, waterproofing, electrical upgrades, office fit-outs, and shop renovations across Bandar Puchong Jaya, Bandar Puteri, IOI Boulevard, Taman Kinrara, and surrounding areas.",
    propertyTypes: ["Double-storey terrace houses", "Condominiums and serviced apartments", "Shop lots and retail units", "Offices around IOI Boulevard and Bandar Puteri", "Light industrial and warehouse units"],
    commonNeeds: ["Kitchen and bathroom renovation", "Full landed house refurbishment", "Custom built-in cabinets and wardrobes", "Retail shop and office fit-out", "Waterproofing and repair works", "Space planning for growing families"],
    constructionNotes: "Most Puchong landed house extensions require local council checks, while strata properties need management approval before work starts. FLASH CAST helps coordinate site measurement, renovation scope, material planning, and required approval documents before construction begins.",
    projects: [
      { title: "Home Office Renovation in Puchong", type: "Residential", image: residentialImg },
      { title: "Retail Fit-Out near Bandar Puteri", type: "Commercial", image: commercialImg },
      { title: "Kitchen Cabinet Upgrade in Taman Kinrara", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you provide renovation service in all Puchong areas?", a: "Yes. We cover Bandar Puchong Jaya, Bandar Puteri, Taman Kinrara, Puchong South, IOI Boulevard, and nearby Klang Valley areas." },
      { q: "Can a Puchong terrace-house renovation be phased while occupied?", a: "It may be possible for limited scopes, but dust, noise, safety, services, access, protection, and sequencing must be reviewed first. Some work may require temporary vacancy." },
      { q: "Can site measurement be arranged in Puchong?", a: "Site measurement in Puchong can be arranged based on project type, access, and schedule." },
    ],
  },
};
