export const beforeAfterPageText = {
  en: {
    metaTitle: "Renovation Planning Comparisons Kuala Lumpur | FLASH CAST",
    metaDescription:
      "Explore clearly labeled renovation planning comparisons for kitchens, living rooms and bathrooms. Visuals are not presented as completed customer projects.",
    metaKeywords:
      "renovation planning comparison Kuala Lumpur, home renovation concept Malaysia, interior planning Klang Valley",
    breadcrumbHome: "Home",
    breadcrumbPage: "Planning Comparisons",
    heroLabel: "Planning Visuals",
    heroTitle: "Space Planning Comparisons",
    heroAlt: "Contemporary living room renovation planning concept",
    heroDescription:
      "Compare an existing-space reference with a possible planning direction before confirming the real project scope.",
    sectionTitle: "Compare planning directions",
    sectionDescription:
      "These visuals are planning references, not verified same-angle photos of completed customer projects. Drag each divider to compare two design states.",
    before: "Existing reference",
    after: "Planning direction",
    itemDescription:
      "Planning comparison only. Final layout, materials and construction scope depend on the actual site and confirmed quotation.",
    compareAria: (title: string) => `Drag to compare the existing reference and planning direction for ${title}`,
    loading: "Loading planning comparisons...",
    error: "The planning comparisons could not be loaded. Please try again shortly.",
    empty: "Published planning comparisons are being updated. Please check back soon.",
    ctaTitle: "Planning a space transformation?",
    ctaDescription:
      "Tell us what is not working in your current space. Our team will help define the scope before the design begins.",
    ctaPrimary: "Get a Free Quote",
    ctaSecondary: "WhatsApp Us",
    fallbackItems: [
      {
        title: "Kitchen Planning Direction",
        location: "",
        description: "Kitchen planning comparison with cabinet, worktop and circulation ideas.",
        alt: "Kitchen renovation planning comparison",
      },
      {
        title: "Living Room Planning Direction",
        location: "",
        description: "Living-room planning comparison with feature-wall, flooring and lighting ideas.",
        alt: "Living room renovation planning comparison",
      },
      {
        title: "Bathroom Planning Direction",
        location: "",
        description: "Bathroom planning comparison covering waterproofing, tiles, fittings and storage direction.",
        alt: "Bathroom renovation planning comparison",
      },
    ],
  },
  zh: {
    metaTitle: "吉隆坡装修规划对比参考 | FLASH CAST",
    metaDescription:
      "查看厨房、客厅和浴室装修规划对比参考。所有视觉均按规划示意标注，不作为真实完工客户案例。",
    metaKeywords: "吉隆坡装修规划对比, 马来西亚装修效果图, 巴生谷空间规划, 装修参考",
    breadcrumbHome: "首页",
    breadcrumbPage: "规划对比",
    heroLabel: "规划视觉",
    heroTitle: "空间规划对比参考",
    heroAlt: "现代客厅装修规划效果图概念",
    heroDescription: "在确认真实工程范围前，对比现况参考与可能的空间规划方向。",
    sectionTitle: "比较不同规划方向",
    sectionDescription:
      "这些图片是规划参考，不是经核实的同角度真实客户完工照片。拖动分隔线可比较两种设计状态。",
    before: "现况参考",
    after: "规划方向",
    itemDescription: "仅作规划对比参考；最终布局、材料与施工范围以真实现场和确认报价为准。",
    compareAria: (title: string) => `拖动滑块查看${title}的现况参考与规划方向`,
    loading: "正在加载规划对比...",
    error: "暂时无法加载规划对比，请稍后再试。",
    empty: "已发布的规划对比正在更新中，请稍后再来查看。",
    ctaTitle: "准备改变现在的空间？",
    ctaDescription: "告诉我们目前空间的问题与期望，我们会先帮你厘清范围，再进入设计。",
    ctaPrimary: "获取免费报价",
    ctaSecondary: "WhatsApp 咨询",
    fallbackItems: [
      {
        title: "厨房规划方向",
        location: "",
        description: "展示橱柜、台面与日常动线的厨房规划对比。",
        alt: "厨房装修规划对比参考",
      },
      {
        title: "客厅规划方向",
        location: "",
        description: "展示背景墙、地板与分层照明方向的客厅规划对比。",
        alt: "客厅装修规划对比参考",
      },
      {
        title: "浴室规划方向",
        location: "",
        description: "展示防水、瓷砖、洁具与收纳方向的浴室规划对比。",
        alt: "浴室装修规划对比参考",
      },
    ],
  },
} as const;
