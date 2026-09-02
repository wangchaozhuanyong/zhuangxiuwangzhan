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
  },
};

export const getServiceContextLinks = (slug: string, language: Language): readonly ServiceContextLink[] =>
  serviceContextLinks[language][slug] || [];
