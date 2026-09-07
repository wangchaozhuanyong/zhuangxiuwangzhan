import type { Language } from "@/i18n/routes";

export type MaterialSubcategoryGuidance = {
  checklistTitle: string;
  checklistDescription: string;
  checklist: readonly { title: string; description: string }[];
  relatedTitle: string;
  relatedDescription: string;
  relatedLinks: readonly {
    id: string;
    label: string;
    title: string;
    description: string;
    href: string;
  }[];
};

type CategoryPlanningContext = {
  focus: string;
  service: { title: string; description: string; href: string };
  guide: { title: string; description: string; href: string };
};

const categoryPlanningContext: Record<Language, Record<string, CategoryPlanningContext>> = {
  en: {
    "kitchen-cabinets": {
      focus: "cabinet core and door finish, edge treatment, hardware, sink and hob zones, appliance clearances, and the dry- or wet-kitchen layout",
      service: { title: "Kitchen renovation and cabinet planning", description: "Review kitchen layout, cabinets, countertops, appliance points, plumbing and quotation scope together.", href: "/services/kitchen" },
      guide: { title: "Kitchen quotation checklist", description: "Compare cabinet, countertop, wet-work, service-point and exclusion details before accepting a quotation.", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
    },
    "whole-house-custom": {
      focus: "storage purpose, internal layout, board and finish samples, hardware, cable or appliance openings, daily access, and installation clearances",
      service: { title: "Custom built-in furniture planning", description: "Plan wardrobes, TV cabinets, shoe storage, study areas and other fitted units around the measured space.", href: "/services/builtin" },
      guide: { title: "Built-in cabinet cost factors", description: "Understand how dimensions, board material, finish, hardware, accessories and access shape the written scope.", href: "/blog/built-in-cabinet-cost-malaysia" },
    },
    furniture: {
      focus: "room dimensions, circulation, delivery access, seating or table height, finish samples, everyday use, and future maintenance",
      service: { title: "Interior design and space planning", description: "Coordinate furniture scale, circulation, storage and the wider room layout before making a selection.", href: "/services/design" },
      guide: { title: "Storage planning for a small condo", description: "See how furniture, built-ins and circulation can work together in a compact home.", href: "/blog/built-in-furniture-small-condo-storage" },
    },
    bathroom: {
      focus: "existing plumbing and drainage, wet-zone layout, waterproofing interfaces, fixing points, clearances, cleaning access, and slip considerations",
      service: { title: "Bathroom renovation and waterproofing", description: "Review leakage, waterproofing, drainage, tiles, sanitary fittings, shower screens and vanity storage as one scope.", href: "/services/bathroom" },
      guide: { title: "Bathroom waterproofing and drainage planning", description: "Check falls, floor traps, wet zones, pipe penetrations and the sequence between waterproofing and finishes.", href: "/blog/bathroom-waterproofing-drainage-planning-malaysia" },
    },
    "countertops-stone-surfaces": {
      focus: "cabinet support, finished dimensions, sink and hob cut-outs, joint locations, edge profiles, splashbacks, service points, and installation access",
      service: { title: "Kitchen renovation and countertop planning", description: "Coordinate the countertop with cabinets, appliances, plumbing, wall finishes and the quotation scope.", href: "/services/kitchen" },
      guide: { title: "Kitchen quotation checklist", description: "Confirm countertop material, dimensions, cut-outs, edge details, installation and exclusions in writing.", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
    },
    flooring: {
      focus: "subfloor condition, moisture and flatness checks, finished height, transitions, skirting, traffic, cleaning, and the installation sequence",
      service: { title: "Flooring service and site planning", description: "Review the existing floor, preparation, selected finish, transition details and installation scope.", href: "/services/flooring" },
      guide: { title: "SPC, vinyl and laminate flooring comparison", description: "Compare use conditions, installation needs and maintenance before choosing a flooring direction.", href: "/blog/spc-vinyl-vs-laminate-flooring" },
    },
    "doors-windows": {
      focus: "opening size, swing or sliding clearance, frame and wall condition, hardware, glass or panel choice, thresholds, drainage, and installation access",
      service: { title: "Renovation scope and opening coordination", description: "Coordinate doors and windows with retained walls, floor levels, services, finishes and the wider renovation sequence.", href: "/services/renovation" },
      guide: { title: "Old-house renovation checklist", description: "Check existing openings, moisture, wiring, plumbing, retained work and site condition before replacement work starts.", href: "/blog/old-house-renovation-checklist" },
    },
    "wall-panels": {
      focus: "wall condition, moisture, sockets and switches, panel direction, joint rhythm, corner and edge details, cleaning needs, and future access",
      service: { title: "Interior design and feature-wall planning", description: "Coordinate the feature wall with room proportions, lighting, services, furniture and adjoining finishes.", href: "/services/design" },
      guide: { title: "Feature-wall planning ideas", description: "Compare visual focus, material transitions, lighting and maintenance before choosing a feature-wall treatment.", href: "/blog/feature-wall-ideas-2025" },
    },
    "art-paint": {
      focus: "wall condition, moisture, base preparation, colour and texture samples, lighting, edge details, application sequence, and future touch-ups",
      service: { title: "Artistic wall coating service", description: "Review surface preparation, sample approval, application area and the confirmed coating scope.", href: "/services/artistic-coating" },
      guide: { title: "Artistic wall coating guide", description: "Understand sample review, surface preparation, texture direction and practical maintenance before proceeding.", href: "/blog/artistic-wall-coating-guide-remmers" },
    },
  },
  zh: {
    "kitchen-cabinets": {
      focus: "柜体基材、门板饰面、封边、五金、水槽和炉具位置、电器尺寸，以及干湿厨房布局",
      service: { title: "厨房装修与橱柜规划", description: "把厨房布局、柜体、台面、电器点位、给排水和报价范围放在同一套方案里确认。", href: "/services/kitchen" },
      guide: { title: "厨房装修报价检查清单", description: "签报价前逐项比较柜体、台面、湿作、水电点位、安装与排除范围。", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
    },
    "whole-house-custom": {
      focus: "收纳用途、内部布局、板材与饰面样板、五金、线材或电器开口、日常取用和安装空间",
      service: { title: "全屋定制柜与收纳规划", description: "按照现场尺寸规划衣柜、电视柜、鞋柜、书桌和其他固定柜体。", href: "/services/builtin" },
      guide: { title: "定制柜报价影响因素", description: "了解尺寸、板材、饰面、五金、配件和进场条件如何影响书面范围。", href: "/blog/built-in-cabinet-cost-malaysia" },
    },
    furniture: {
      focus: "空间尺寸、行走动线、搬运路线、座面或桌面高度、饰面样板、日常用途和后续保养",
      service: { title: "室内设计与空间规划", description: "选购前先协调家具比例、行走动线、收纳需求和整体空间布局。", href: "/services/design" },
      guide: { title: "小公寓家具与收纳规划", description: "了解紧凑住宅中活动家具、固定柜体和行走空间如何互相配合。", href: "/blog/built-in-furniture-small-condo-storage" },
    },
    bathroom: {
      focus: "现有给排水、湿区布局、防水衔接、固定点、使用净空、清洁空间和地面防滑需求",
      service: { title: "浴室装修与防水工程", description: "把漏水检查、防水、排水、瓷砖、洁具、淋浴屏和浴室柜放在同一范围内确认。", href: "/services/bathroom" },
      guide: { title: "浴室防水与排水规划", description: "施工前检查排水坡度、地漏、湿区、管口以及防水与饰面的衔接顺序。", href: "/blog/bathroom-waterproofing-drainage-planning-malaysia" },
    },
    "countertops-stone-surfaces": {
      focus: "柜体支撑、完成尺寸、水槽和炉具开孔、接缝位置、收边造型、挡水、点位和安装进场",
      service: { title: "厨房装修与台面规划", description: "把台面与柜体、电器、给排水、墙面饰面和报价范围一起协调。", href: "/services/kitchen" },
      guide: { title: "厨房装修报价检查清单", description: "书面确认台面材料、尺寸、开孔、收边、安装和排除范围。", href: "/blog/kitchen-renovation-quotation-checklist-malaysia" },
    },
    flooring: {
      focus: "基层状况、含水与平整检查、完成面高度、收口过渡、踢脚线、人流、清洁和安装顺序",
      service: { title: "地面材料与施工规划", description: "确认现有地面、基层处理、选定饰面、收口过渡和实际安装范围。", href: "/services/flooring" },
      guide: { title: "SPC、Vinyl 与 Laminate 地板比较", description: "按使用环境、安装条件和保养方式比较不同地面方向。", href: "/blog/spc-vinyl-vs-laminate-flooring" },
    },
    "doors-windows": {
      focus: "洞口尺寸、平开或推拉净空、门框墙体状况、五金、玻璃或门板、门槛排水和安装进场",
      service: { title: "装修范围与门窗衔接", description: "把门窗与保留墙体、地面高度、水电、饰面和整体施工顺序一起协调。", href: "/services/renovation" },
      guide: { title: "旧屋翻新检查清单", description: "更换前检查现有洞口、潮湿、水电、保留项目和整体屋况。", href: "/blog/old-house-renovation-checklist" },
    },
    "wall-panels": {
      focus: "墙体状况、潮湿、插座开关、板材方向、接缝节奏、转角收边、清洁和后续检修",
      service: { title: "室内设计与特色墙规划", description: "把特色墙与空间比例、灯光、点位、家具和相邻饰面一起考虑。", href: "/services/design" },
      guide: { title: "特色墙规划参考", description: "选择前比较视觉重点、材料衔接、照明效果和后续保养。", href: "/blog/feature-wall-ideas-2025" },
    },
    "art-paint": {
      focus: "墙面状况、潮湿、基层处理、颜色纹理样板、现场灯光、边缘细节、施工顺序和后续修补",
      service: { title: "艺术墙面涂装服务", description: "确认基层处理、样板、施工位置和最终涂装范围。", href: "/services/artistic-coating" },
      guide: { title: "艺术墙面涂装指南", description: "施工前了解样板确认、基层处理、纹理方向和日常维护。", href: "/blog/artistic-wall-coating-guide-remmers" },
    },
  },
};

const fallbackContext = (language: Language): CategoryPlanningContext => language === "zh"
  ? {
      focus: "实际使用位置、现场尺寸、相邻材料、清洁方式、安装条件和确认后的书面范围",
      service: { title: "装修服务与现场规划", description: "把材料选择与现场条件、施工范围和使用需求一起确认。", href: "/services/renovation" },
      guide: { title: "装修材料选择指南", description: "按实际空间、基层条件、安装和维护需求比较材料。", href: "/blog/renovation-materials-malaysia" },
    }
  : {
      focus: "the intended space, measured site conditions, adjoining finishes, cleaning needs, installation constraints, and the confirmed written scope",
      service: { title: "Renovation service and site planning", description: "Coordinate the material decision with actual site conditions, use requirements and the renovation scope.", href: "/services/renovation" },
      guide: { title: "Renovation materials selection guide", description: "Compare materials by the space, substrate, installation and maintenance requirements.", href: "/blog/renovation-materials-malaysia" },
    };

export const getMaterialSubcategoryGuidance = (
  categorySlug: string,
  categoryName: string,
  subcategoryName: string,
  language: Language,
): MaterialSubcategoryGuidance => {
  const context = categoryPlanningContext[language][categorySlug] || fallbackContext(language);

  if (language === "zh") {
    return {
      checklistTitle: `${subcategoryName} 选择前要确认什么`,
      checklistDescription: `${subcategoryName} 不应只凭目录图片决定。先结合 ${categoryName} 的用途、现场条件、样板和书面施工范围比较，再确认是否适合项目。`,
      checklist: [
        {
          title: `明确 ${subcategoryName} 的使用条件`,
          description: `记录安装空间、日常用途、潮湿、热源、阳光、人流和清洁要求，并重点比较${context.focus}。目录图片只能作为方向，不能代替现场与实物样板确认。`,
        },
        {
          title: "先测量现场，再确定规格",
          description: "检查完成尺寸、水平与垂直状况、相邻材料、水电点位、使用净空、搬运路线和需要保留的工程。这些条件会影响适合的规格、固定方式和安装顺序。",
        },
        {
          title: "确认样板和书面范围",
          description: "在项目实际灯光下查看颜色、纹理、接缝与收边。报价应写明选定样板、基层处理、配件、安装、排除项目，以及已经书面确认的供应商或施工保障。",
        },
      ],
      relatedTitle: `${subcategoryName} 的下一步规划`,
      relatedDescription: "从父分类、相关装修服务和实用指南继续核对；资料准备齐全后，再提交现场情况和需求获取针对性建议。",
      relatedLinks: [
        { id: "parent-category", label: "材料分类", title: `查看全部 ${categoryName}`, description: `返回 ${categoryName} 分类，比较其他子分类和已发布材料选项。`, href: `/materials/category/${categorySlug}` },
        { id: "related-service", label: "相关服务", ...context.service },
        { id: "planning-guide", label: "规划指南", ...context.guide },
        { id: "project-enquiry", label: "项目咨询", title: `咨询 ${subcategoryName} 的项目适用性`, description: "提供空间类型、地点、现场照片、尺寸和预期用途，方便先确认需要补充的资料与范围。", href: "/quote#quote-form" },
      ],
    };
  }

  return {
    checklistTitle: `What to confirm before choosing ${subcategoryName}`,
    checklistDescription: `${subcategoryName} should not be selected from a catalogue image alone. Compare its intended use, measured site conditions, sample and written installation scope within the wider ${categoryName.toLowerCase()} decision.`,
    checklist: [
      {
        title: `Define how ${subcategoryName} will be used`,
        description: `Record the room, daily use, exposure to moisture, heat, sunlight or heavy traffic, and cleaning expectations. For this category, compare ${context.focus}. A catalogue image is a direction, not final sample approval.`,
      },
      {
        title: "Measure the existing site before selection",
        description: "Check finished dimensions, levels, adjoining materials, service points, operating clearances, delivery access and any work that will be retained. These conditions can change the suitable specification, fixing method and installation sequence.",
      },
      {
        title: "Approve a sample and written scope",
        description: "Review colour, texture, joints and edge details under the project's actual lighting. The quotation should identify the selected sample, preparation, accessories, installation, exclusions, and any supplier or workmanship coverage confirmed in writing.",
      },
    ],
    relatedTitle: `Plan the next step for ${subcategoryName}`,
    relatedDescription: "Continue through the parent category, relevant renovation service and practical guide. When the project information is ready, share the site conditions and intended use for a more specific review.",
    relatedLinks: [
      { id: "parent-category", label: "Material category", title: `Browse all ${categoryName}`, description: `Return to the ${categoryName.toLowerCase()} category to compare other subcategories and published material options.`, href: `/materials/category/${categorySlug}` },
      { id: "related-service", label: "Related service", ...context.service },
      { id: "planning-guide", label: "Planning guide", ...context.guide },
      { id: "project-enquiry", label: "Project enquiry", title: `Ask about ${subcategoryName} for your project`, description: "Share the space type, location, site photos, measurements and intended use so the missing information and scope can be clarified first.", href: "/quote#quote-form" },
    ],
  };
};
