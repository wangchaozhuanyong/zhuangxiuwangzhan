import type { Language } from "@/i18n/routes";

export type LocationContextLink = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
};

type LocationContextLinksBySlug = Record<string, readonly LocationContextLink[]>;

const locationContextLinks: Record<Language, LocationContextLinksBySlug> = {
  en: {
    "kuala-lumpur": [
      {
        id: "kl-residential",
        label: "Renovation service",
        title: "Residential renovation in Kuala Lumpur",
        description: "Plan condo, landed-home, partial, or whole-unit renovation scope and quotation priorities.",
        href: "/services/renovation",
      },
      {
        id: "kl-kitchen",
        label: "Renovation service",
        title: "Kitchen renovation & custom cabinets",
        description: "Explore wet and dry kitchen layouts, cabinet materials, countertops, and service points.",
        href: "/services/kitchen",
      },
      {
        id: "kl-bathroom",
        label: "Renovation service",
        title: "Bathroom renovation & waterproofing",
        description: "Review leakage investigation, waterproofing membrane, drainage, and tile replacement.",
        href: "/services/bathroom",
      },
      {
        id: "kl-office",
        label: "Commercial service",
        title: "Office renovation & fit-out in KL",
        description: "Coordinate workspace layout, partitions, M&E, IT requirements, and building guidelines.",
        href: "/services/office-renovation",
      },
      {
        id: "kl-builtin",
        label: "Custom carpentry",
        title: "Custom built-in furniture & storage",
        description: "Plan custom wardrobes, TV cabinets, storage units, and moisture-resistant joinery.",
        href: "/services/builtin",
      },
      {
        id: "kl-project",
        label: "Project reference",
        title: "Mont Kiara condo renovation reference",
        description: "Review published space planning, scope, and labeled concept classification.",
        href: "/projects/mont-kiara-luxury-condo-renovation",
      },
      {
        id: "kl-approval-guide",
        label: "Planning guide",
        title: "Condo renovation management approval guide",
        description: "Prepare building deposit, contractor documents, work hours, and access clearance.",
        href: "/blog/condo-renovation-management-approval-malaysia",
      },
      {
        id: "kl-budget-guide",
        label: "Planning guide",
        title: "Malaysia renovation budget & quotation guide",
        description: "Understand site condition, trade coordination, and factors that shape renovation costs.",
        href: "/blog/malaysia-renovation-budget-guide",
      },
      {
        id: "kl-materials",
        label: "Materials",
        title: "Renovation materials & finishes library",
        description: "Compare cabinetry finishes, stone countertops, SPC flooring, and bathroom fittings.",
        href: "/materials",
      },
      {
        id: "kl-nearby-pj",
        label: "Nearby area",
        title: "Petaling Jaya renovation services",
        description: "Explore renovation service coverage for PJ landed homes, condos, and commercial units.",
        href: "/locations/petaling-jaya",
      },
      {
        id: "kl-nearby-mont-kiara",
        label: "Nearby area",
        title: "Mont Kiara condo renovation",
        description: "See renovation planning considerations for premium high-rise condominiums.",
        href: "/locations/mont-kiara",
      },
      {
        id: "kl-nearby-bangsar",
        label: "Nearby area",
        title: "Bangsar renovation services",
        description: "Check service considerations for character homes, modern condos, and retail spaces.",
        href: "/locations/bangsar",
      },
      {
        id: "kl-nearby-cheras",
        label: "Nearby area",
        title: "Cheras renovation planning",
        description: "Review planning for older terrace homes, commercial shophouses, and rewiring needs.",
        href: "/locations/cheras",
      },
    ],
  },
  zh: {
    "kuala-lumpur": [
      {
        id: "kl-residential",
        label: "服务项目",
        title: "吉隆坡住宅装修",
        description: "规划公寓、有地住宅、局部或整套翻新范围与报价重点。",
        href: "/services/renovation",
      },
      {
        id: "kl-kitchen",
        label: "服务项目",
        title: "厨房装修与橱柜定制",
        description: "了解干湿厨房动线、橱柜基材、台面选择与水电点位规划。",
        href: "/services/kitchen",
      },
      {
        id: "kl-bathroom",
        label: "服务项目",
        title: "浴室装修与防水工程",
        description: "检查漏水原因、防水层施工、排水坡度与瓷砖洁具更换。",
        href: "/services/bathroom",
      },
      {
        id: "kl-office",
        label: "商业服务",
        title: "吉隆坡办公室装修与 Fit-Out",
        description: "协调办公空间动线、隔断、机电、弱电及大楼管理处审批条件。",
        href: "/services/office-renovation",
      },
      {
        id: "kl-builtin",
        label: "定制家具",
        title: "定制家具与收纳柜工程",
        description: "规划定制衣柜、电视背景墙柜、玄关鞋柜与防潮内嵌家具。",
        href: "/services/builtin",
      },
      {
        id: "kl-project",
        label: "项目参考",
        title: "Mont Kiara 公寓装修设计参考",
        description: "查看已发布空间规划、施工范围与已标注概念分类。",
        href: "/projects/mont-kiara-luxury-condo-renovation",
      },
      {
        id: "kl-approval-guide",
        label: "规划指南",
        title: "公寓管理处装修申请指南",
        description: "提前准备大楼装修押金、承包商保险、施工时段与电梯保护要求。",
        href: "/blog/condo-renovation-management-approval-malaysia",
      },
      {
        id: "kl-budget-guide",
        label: "规划指南",
        title: "马来西亚装修预算与报价指南",
        description: "了解现场屋况、多工种协调以及影响装修报价的核心因素。",
        href: "/blog/malaysia-renovation-budget-guide",
      },
      {
        id: "kl-materials",
        label: "装修材料",
        title: "装修材料与饰面库",
        description: "比较橱柜板材、石材台面、SPC 地板和浴室洁具配置。",
        href: "/materials",
      },
      {
        id: "kl-nearby-pj",
        label: "邻近地区",
        title: "Petaling Jaya 装修服务",
        description: "了解八打灵再也有地住宅、公寓与商业单位的服务范围。",
        href: "/locations/petaling-jaya",
      },
      {
        id: "kl-nearby-mont-kiara",
        label: "邻近地区",
        title: "Mont Kiara 装修服务",
        description: "查看高端高层公寓常见的物业管理与装修协调注意事项。",
        href: "/locations/mont-kiara",
      },
      {
        id: "kl-nearby-bangsar",
        label: "邻近地区",
        title: "Bangsar 装修服务",
        description: "了解传统有地住宅、现代公寓与零售空间的装修服务条件。",
        href: "/locations/bangsar",
      },
      {
        id: "kl-nearby-cheras",
        label: "邻近地区",
        title: "Cheras 装修服务",
        description: "了解蕉赖老房排屋翻新、商业店铺与水电老化检查要点。",
        href: "/locations/cheras",
      },
    ],
  },
};

export const getLocationContextLinks = (
  slug?: string,
  language: Language = "en",
): readonly LocationContextLink[] => {
  if (!slug) return [];
  return locationContextLinks[language]?.[slug] || [];
};
