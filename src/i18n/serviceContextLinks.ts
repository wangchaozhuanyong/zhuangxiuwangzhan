import type { Language } from "@/i18n/routes";

export type ServiceContextLink = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
};

type ServiceContextLinksBySlug = Record<string, readonly ServiceContextLink[]>;

const serviceContextLinks: Record<Language, ServiceContextLinksBySlug> = {
  en: {
    renovation: [
      { id: "renovation-kl", label: "Service area", title: "Kuala Lumpur renovation", description: "Review property types, common renovation needs, and service coverage in Kuala Lumpur.", href: "/locations/kuala-lumpur" },
      { id: "renovation-mont-kiara", label: "Service area", title: "Mont Kiara renovation", description: "See local planning considerations for condos and managed residential properties.", href: "/locations/mont-kiara" },
      { id: "renovation-project", label: "Project reference", title: "Mont Kiara condo renovation reference", description: "Open the project page to review its published scope, classification, and supporting details.", href: "/projects/mont-kiara-luxury-condo-renovation" },
      { id: "renovation-budget", label: "Planning guide", title: "Malaysia renovation budget guide", description: "Understand the scope and site factors that can change a renovation quotation.", href: "/blog/malaysia-renovation-budget-guide" },
      { id: "renovation-approval", label: "Planning guide", title: "Condo renovation management approval", description: "Prepare building forms, deposits, protection, work-hour, and contractor requirements.", href: "/blog/condo-renovation-management-approval-malaysia" },
      { id: "renovation-materials", label: "Materials", title: "Renovation materials library", description: "Compare published flooring, cabinetry, wall, countertop, door, and bathroom material options.", href: "/materials" },
    ],
    kitchen: [
      { id: "kitchen-bangsar", label: "Service area", title: "Bangsar renovation", description: "Review local property and kitchen-planning considerations for Bangsar homes.", href: "/locations/bangsar" },
      { id: "kitchen-subang", label: "Service area", title: "Subang Jaya renovation", description: "Explore service coverage for condos, landed homes, and kitchen upgrade work.", href: "/locations/subang-jaya" },
      { id: "kitchen-project", label: "Project reference", title: "Bangsar custom kitchen reference", description: "Open the published project page to review its scope and content classification.", href: "/projects/custom-kitchen-bangsar" },
      { id: "kitchen-quote-guide", label: "Planning guide", title: "Kitchen renovation quotation checklist", description: "Check cabinets, countertops, wet works, services points, and exclusions before comparing quotes.", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
      { id: "kitchen-layout-guide", label: "Planning guide", title: "Dry and wet kitchen planning", description: "Compare cooking flow, storage, appliance positions, and dry or wet kitchen zoning.", href: "/blog/dry-wet-kitchen-renovation-malaysia" },
      { id: "kitchen-materials", label: "Materials", title: "Kitchen cabinet materials", description: "Browse published cabinet systems and finish options before confirming samples and scope.", href: "/materials/category/kitchen-cabinets" },
    ],
    bathroom: [
      { id: "bathroom-kl", label: "Service area", title: "Kuala Lumpur renovation", description: "Review local property types, management considerations, and renovation service coverage.", href: "/locations/kuala-lumpur" },
      { id: "bathroom-pj", label: "Service area", title: "Petaling Jaya renovation", description: "See service considerations for condos, landed homes, and older properties in Petaling Jaya.", href: "/locations/petaling-jaya" },
      { id: "bathroom-projects", label: "Project references", title: "Browse renovation project references", description: "Review published project pages and check whether each item is a completed project or a labeled concept.", href: "/projects" },
      { id: "bathroom-leakage", label: "Planning guide", title: "Bathroom leakage and renovation", description: "Understand why the leakage source and site condition should be checked before choosing a repair scope.", href: "/blog/bathroom-leakage-renovation-malaysia" },
      { id: "bathroom-waterproofing", label: "Planning guide", title: "Waterproofing and drainage planning", description: "Review floor falls, traps, wet zones, pipe penetrations, and tile-work coordination.", href: "/blog/bathroom-waterproofing-drainage-planning-malaysia" },
      { id: "bathroom-materials", label: "Materials", title: "Bathroom materials and fittings", description: "Browse published tile, basin, toilet, shower, cabinet, and related bathroom options.", href: "/materials/category/bathroom" },
    ],
    "office-renovation": [
      { id: "office-pj", label: "Service area", title: "Petaling Jaya office renovation", description: "Review local planning considerations for offices, commercial units, access, and building requirements.", href: "/locations/petaling-jaya" },
      { id: "office-cyberjaya", label: "Service area", title: "Cyberjaya office renovation", description: "Explore office and technology-workspace planning around operations, M&E, data, access, and fit-out scope.", href: "/locations/cyberjaya" },
      { id: "office-projects", label: "Project references", title: "Browse office and commercial references", description: "Review published project pages and confirm whether each item is completed work or a labeled planning concept.", href: "/projects" },
      { id: "office-checklist", label: "Planning guide", title: "Office renovation checklist", description: "Prepare headcount, layout, building rules, services, quotation scope, coordination, and handover requirements.", href: "/blog/office-renovation-checklist-malaysia" },
      { id: "office-reinstatement", label: "Planning guide", title: "Office reinstatement or renovation", description: "Clarify the difference between fitting out a workspace and returning a tenancy to its required handover condition.", href: "/blog/office-reinstatement-vs-renovation" },
      { id: "office-materials", label: "Materials", title: "Office flooring options", description: "Compare published flooring types against subfloor condition, traffic, maintenance, acoustic needs, and building rules.", href: "/materials/category/flooring" },
    ],
    "shop-renovation": [
      { id: "shop-cheras", label: "Service area", title: "Cheras shop renovation", description: "Review planning considerations for shoplots, retail units, access, existing services, and opening priorities.", href: "/locations/cheras" },
      { id: "shop-subang", label: "Service area", title: "Subang Jaya shop renovation", description: "Explore retail and F&B fit-out considerations for shoplots, commercial units, landlord rules, and site services.", href: "/locations/subang-jaya" },
      { id: "shop-projects", label: "Project references", title: "Browse retail and commercial references", description: "Review published project pages and confirm whether each item is completed work or a labeled planning concept.", href: "/projects" },
      { id: "shop-opening", label: "Planning guide", title: "Shop renovation before opening", description: "Prepare the business brief, tenancy condition, customer flow, back-of-house needs, services, and opening sequence.", href: "/blog/shop-renovation-before-opening" },
      { id: "shop-permit", label: "Planning guide", title: "Shoplot permit and management planning", description: "Check which landlord, management, signage, work-hour, protection, or authority requirements may apply to the site.", href: "/blog/shoplot-renovation-permit-malaysia" },
      { id: "shop-materials", label: "Materials", title: "Retail display and storage cabinet", description: "Review a published display-storage option for counters, merchandise, back storage, and practical maintenance.", href: "/materials/display-storage-cabinet" },
    ],
    "old-house": [
      { id: "old-house-cheras", label: "Service area", title: "Cheras old-house renovation", description: "Review planning considerations for older landed homes, existing wiring and plumbing, moisture, access, and staged work.", href: "/locations/cheras" },
      { id: "old-house-pj", label: "Service area", title: "Petaling Jaya home renovation", description: "Explore renovation planning for established landed homes, strata properties, access, retained items, and site condition.", href: "/locations/petaling-jaya" },
      { id: "old-house-projects", label: "Project references", title: "Browse landed-home renovation references", description: "Review published project pages and confirm whether each item is completed work or a labeled planning concept.", href: "/projects" },
      { id: "old-house-checklist", label: "Planning guide", title: "Old-house renovation checklist", description: "Check site condition, safety priorities, wiring, plumbing, moisture, roof, layout, approvals, and quotation scope.", href: "/blog/old-house-renovation-checklist" },
      { id: "old-house-costs", label: "Planning guide", title: "Hidden old-house renovation costs", description: "Understand how investigation, repairs, access, retained work, provisional scope, and discoveries can affect a quotation.", href: "/blog/old-house-renovation-hidden-costs-malaysia" },
      { id: "old-house-materials", label: "Materials", title: "Renovation materials library", description: "Compare published flooring, doors, cabinetry, wall finishes, and bathroom options after the repair scope is clear.", href: "/materials" },
    ],
    builtin: [
      { id: "builtin-puchong", label: "Service area", title: "Puchong custom built-ins", description: "Review local planning considerations for landed homes, condos, commercial storage, measurement, and installation access.", href: "/locations/puchong" },
      { id: "builtin-bangsar", label: "Service area", title: "Bangsar custom cabinets", description: "Explore cabinet and storage planning for landed homes, strata properties, retail units, and existing site conditions.", href: "/locations/bangsar" },
      { id: "builtin-projects", label: "Project references", title: "Browse cabinet and storage references", description: "Review published project pages and confirm whether each item is completed work or a labeled planning concept.", href: "/projects" },
      { id: "builtin-cost", label: "Planning guide", title: "Built-in cabinet cost factors", description: "Compare how dimensions, board material, finishes, hardware, accessories, access, and installation affect scope.", href: "/blog/built-in-cabinet-cost-malaysia" },
      { id: "builtin-storage", label: "Planning guide", title: "Built-in storage for small condos", description: "Plan full-height storage, wardrobes, TV walls, shoe cabinets, study areas, and everyday access in compact homes.", href: "/blog/built-in-furniture-small-condo-storage" },
      { id: "builtin-materials", label: "Materials", title: "Whole-home custom cabinet options", description: "Browse published wardrobe, kitchen, TV, shoe, study, and storage cabinet categories before approving samples.", href: "/materials/category/whole-house-custom" },
    ],
  },
  zh: {
    renovation: [
      { id: "renovation-kl", label: "服务地区", title: "吉隆坡装修服务", description: "了解吉隆坡常见房产类型、装修需求和实际服务范围。", href: "/locations/kuala-lumpur" },
      { id: "renovation-mont-kiara", label: "服务地区", title: "Mont Kiara 装修服务", description: "查看公寓和有管理处住宅常见的装修规划事项。", href: "/locations/mont-kiara" },
      { id: "renovation-project", label: "项目参考", title: "Mont Kiara 公寓装修参考", description: "进入已发布项目页，查看范围、内容分类和现有说明。", href: "/projects/mont-kiara-luxury-condo-renovation" },
      { id: "renovation-budget", label: "规划指南", title: "马来西亚装修预算指南", description: "了解哪些施工范围和现场因素会影响装修报价。", href: "/blog/malaysia-renovation-budget-guide" },
      { id: "renovation-approval", label: "规划指南", title: "公寓管理处装修申请", description: "提前准备表格、押金、保护、施工时间和承包商资料。", href: "/blog/condo-renovation-management-approval-malaysia" },
      { id: "renovation-materials", label: "装修材料", title: "装修材料库", description: "比较已发布的地面、柜体、墙面、台面、门窗和浴室材料。", href: "/materials" },
    ],
    kitchen: [
      { id: "kitchen-bangsar", label: "服务地区", title: "Bangsar 装修服务", description: "了解 Bangsar 住宅和厨房规划常见注意事项。", href: "/locations/bangsar" },
      { id: "kitchen-subang", label: "服务地区", title: "Subang Jaya 装修服务", description: "查看公寓、有地住宅和厨房升级的服务范围。", href: "/locations/subang-jaya" },
      { id: "kitchen-project", label: "项目参考", title: "Bangsar 定制厨房参考", description: "进入已发布项目页，查看范围和内容分类。", href: "/projects/custom-kitchen-bangsar" },
      { id: "kitchen-quote-guide", label: "规划指南", title: "厨房装修报价检查清单", description: "比较报价前先确认柜体、台面、湿作、水电点位和排除范围。", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
      { id: "kitchen-layout-guide", label: "规划指南", title: "干湿厨房规划", description: "比较煮食动线、收纳、家电位置和干湿厨房分区。", href: "/blog/dry-wet-kitchen-renovation-malaysia" },
      { id: "kitchen-materials", label: "装修材料", title: "厨房橱柜材料", description: "确认样板与范围前，先浏览已发布的柜体系统和饰面选择。", href: "/materials/category/kitchen-cabinets" },
    ],
    bathroom: [
      { id: "bathroom-kl", label: "服务地区", title: "吉隆坡装修服务", description: "了解当地房产类型、管理处事项和装修服务范围。", href: "/locations/kuala-lumpur" },
      { id: "bathroom-pj", label: "服务地区", title: "Petaling Jaya 装修服务", description: "查看公寓、有地住宅和旧房常见服务条件。", href: "/locations/petaling-jaya" },
      { id: "bathroom-projects", label: "项目参考", title: "浏览装修项目参考", description: "查看已发布项目，并确认每个项目属于真实完工内容还是已标注概念。", href: "/projects" },
      { id: "bathroom-leakage", label: "规划指南", title: "浴室漏水与翻新", description: "了解为什么决定维修范围前，应先检查漏水来源和现场条件。", href: "/blog/bathroom-leakage-renovation-malaysia" },
      { id: "bathroom-waterproofing", label: "规划指南", title: "防水与排水规划", description: "检查排水坡度、地漏、湿区、管口和瓷砖工程衔接。", href: "/blog/bathroom-waterproofing-drainage-planning-malaysia" },
      { id: "bathroom-materials", label: "装修材料", title: "浴室材料与洁具", description: "浏览已发布的瓷砖、洗手盆、马桶、淋浴、浴室柜和相关选择。", href: "/materials/category/bathroom" },
    ],
    "office-renovation": [
      { id: "office-pj", label: "服务地区", title: "Petaling Jaya 办公室装修", description: "了解办公室、商业单位、进场条件和大楼要求的当地规划事项。", href: "/locations/petaling-jaya" },
      { id: "office-cyberjaya", label: "服务地区", title: "Cyberjaya 办公室装修", description: "查看办公室与科技工作空间的运营、机电、数据、进场和 fit-out 范围考虑。", href: "/locations/cyberjaya" },
      { id: "office-projects", label: "项目参考", title: "浏览办公室与商业项目参考", description: "查看已发布项目，并确认每项内容属于完工项目还是已标注的规划概念。", href: "/projects" },
      { id: "office-checklist", label: "规划指南", title: "办公室装修检查清单", description: "准备员工人数、布局、大楼规定、设备服务、报价范围、协调和交付要求。", href: "/blog/office-renovation-checklist-malaysia" },
      { id: "office-reinstatement", label: "规划指南", title: "办公室复原还是装修", description: "分清新办公空间 fit-out 与按租约要求恢复交付状态的不同。", href: "/blog/office-reinstatement-vs-renovation" },
      { id: "office-materials", label: "装修材料", title: "办公室地面材料", description: "按基层状况、人流、保养、声学需求和大楼规定比较已发布的地面选择。", href: "/materials/category/flooring" },
    ],
    "shop-renovation": [
      { id: "shop-cheras", label: "服务地区", title: "Cheras 店铺装修", description: "了解 shoplot、零售单位、进场、现有设备和开业优先项的规划事项。", href: "/locations/cheras" },
      { id: "shop-subang", label: "服务地区", title: "Subang Jaya 店铺装修", description: "查看 shoplot 和商业单位的零售、餐饮 fit-out、业主规定和现场设备考虑。", href: "/locations/subang-jaya" },
      { id: "shop-projects", label: "项目参考", title: "浏览零售与商业项目参考", description: "查看已发布项目，并确认每项内容属于完工项目还是已标注的规划概念。", href: "/projects" },
      { id: "shop-opening", label: "规划指南", title: "开店前的店铺装修规划", description: "提前整理营业需求、租约交付状态、顾客动线、后场、设备和开业顺序。", href: "/blog/shop-renovation-before-opening" },
      { id: "shop-permit", label: "规划指南", title: "Shoplot 准证与管理要求", description: "检查现场可能涉及的业主、管理处、招牌、施工时段、保护或地方单位要求。", href: "/blog/shoplot-renovation-permit-malaysia" },
      { id: "shop-materials", label: "装修材料", title: "零售展示与收纳柜", description: "查看已发布的展示收纳选项，用于柜台、商品展示、后场收纳和保养规划。", href: "/materials/display-storage-cabinet" },
    ],
    "old-house": [
      { id: "old-house-cheras", label: "服务地区", title: "Cheras 旧屋翻新", description: "了解旧有地住宅的电线水管、潮湿、进场和分阶段施工规划事项。", href: "/locations/cheras" },
      { id: "old-house-pj", label: "服务地区", title: "Petaling Jaya 住宅翻新", description: "查看成熟有地住宅、分层物业、进场、保留项目和现场状况的规划考虑。", href: "/locations/petaling-jaya" },
      { id: "old-house-projects", label: "项目参考", title: "浏览有地住宅翻新参考", description: "查看已发布项目，并确认每项内容属于完工项目还是已标注的规划概念。", href: "/projects" },
      { id: "old-house-checklist", label: "规划指南", title: "旧屋翻新检查清单", description: "检查屋况、安全顺序、电线、水管、潮湿、屋顶、格局、申请和报价范围。", href: "/blog/old-house-renovation-checklist" },
      { id: "old-house-costs", label: "规划指南", title: "旧屋翻新隐藏成本", description: "了解检查、必要修复、进场、保留工程、暂定范围和现场发现如何影响报价。", href: "/blog/old-house-renovation-hidden-costs-malaysia" },
      { id: "old-house-materials", label: "装修材料", title: "装修材料库", description: "在必要修复范围清楚后，再比较已发布的地面、门窗、柜体、墙面和浴室材料。", href: "/materials" },
    ],
    builtin: [
      { id: "builtin-puchong", label: "服务地区", title: "Puchong 定制柜", description: "了解有地住宅、公寓、商业收纳、现场测量和安装进场的当地规划事项。", href: "/locations/puchong" },
      { id: "builtin-bangsar", label: "服务地区", title: "Bangsar 定制柜", description: "查看有地住宅、分层物业、零售空间和现场条件下的柜体与收纳规划。", href: "/locations/bangsar" },
      { id: "builtin-projects", label: "项目参考", title: "浏览柜体与收纳项目参考", description: "查看已发布项目，并确认每项内容属于完工项目还是已标注的规划概念。", href: "/projects" },
      { id: "builtin-cost", label: "规划指南", title: "定制柜报价影响因素", description: "比较尺寸、板材、饰面、五金、内部配件、进场和安装如何影响范围。", href: "/blog/built-in-cabinet-cost-malaysia" },
      { id: "builtin-storage", label: "规划指南", title: "小公寓内嵌收纳规划", description: "规划到顶收纳、衣柜、电视墙、鞋柜、书桌区和紧凑住宅的日常取用。", href: "/blog/built-in-furniture-small-condo-storage" },
      { id: "builtin-materials", label: "装修材料", title: "全屋定制柜选择", description: "确认样板前，先浏览已发布的衣柜、厨房柜、电视柜、鞋柜、书桌和收纳柜分类。", href: "/materials/category/whole-house-custom" },
    ],
  },
};

export const getServiceContextLinks = (slug: string, language: Language): readonly ServiceContextLink[] =>
  serviceContextLinks[language][slug] || [];
