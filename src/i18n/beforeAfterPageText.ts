export const beforeAfterPageText = {
  en: {
    metaTitle: "Renovation Before and After Kuala Lumpur | FLASH CAST",
    metaDescription:
      "Explore renovation before-and-after comparisons by FLASH CAST across Kuala Lumpur and Klang Valley.",
    metaKeywords:
      "renovation before after Kuala Lumpur, home makeover Malaysia, interior transformation Klang Valley",
    breadcrumbHome: "Home",
    breadcrumbPage: "Before & After",
    heroLabel: "Renovation Results",
    heroTitle: "Before & After",
    heroAlt: "Completed contemporary living room renovation by FLASH CAST",
    heroDescription:
      "See how thoughtful planning, material choices and precise execution transform everyday spaces.",
    sectionTitle: "See what changed",
    sectionDescription:
      "Drag each divider to compare the original condition with the completed space.",
    before: "Before",
    after: "After",
    compareAria: (title: string) => `Drag to compare the before and after views of ${title}`,
    loading: "Loading renovation comparisons...",
    error: "The renovation comparisons could not be loaded. Please try again shortly.",
    empty: "Published renovation comparisons are being updated. Please check back soon.",
    ctaTitle: "Planning a space transformation?",
    ctaDescription:
      "Tell us what is not working in your current space. Our team will help define the scope before the design begins.",
    ctaPrimary: "Get a Free Quote",
    ctaSecondary: "WhatsApp Us",
    fallbackItems: [
      {
        title: "Kitchen Renovation",
        location: "Mont Kiara, Kuala Lumpur",
        description: "Kitchen renovation with new cabinets, worktop and a clearer daily-use layout.",
        alt: "Kitchen renovation before and after comparison",
      },
      {
        title: "Living Room Makeover",
        location: "Petaling Jaya, Selangor",
        description: "A warmer living space with an upgraded feature wall, flooring and layered lighting.",
        alt: "Living room renovation before and after comparison",
      },
      {
        title: "Bathroom Renovation",
        location: "Cheras, Kuala Lumpur",
        description: "Bathroom renewal covering waterproofing, tiles, fittings and practical storage.",
        alt: "Bathroom renovation before and after comparison",
      },
    ],
  },
  zh: {
    metaTitle: "吉隆坡装修前后对比案例 | 闪铸装饰 FLASH CAST",
    metaDescription:
      "查看闪铸装饰在吉隆坡与 Klang Valley 的装修前后对比示例，了解空间改造效果。",
    metaKeywords: "吉隆坡装修前后对比, 马来西亚旧屋翻新, Klang Valley 空间改造, 装修案例",
    breadcrumbHome: "首页",
    breadcrumbPage: "改造前后",
    heroLabel: "空间改造成果",
    heroTitle: "改造前后",
    heroAlt: "闪铸装饰完成的现代客厅装修空间",
    heroDescription: "从规划、选材到现场执行，直观看见日常空间完成改造后的变化。",
    sectionTitle: "看清每一处改变",
    sectionDescription: "拖动画面中的分隔线，对比改造前的原始状态与完工后的空间效果。",
    before: "改造前",
    after: "改造后",
    compareAria: (title: string) => `拖动滑块查看${title}的前后对比`,
    loading: "正在加载改造对比...",
    error: "暂时无法加载改造对比，请稍后再试。",
    empty: "已发布的改造对比正在更新中，请稍后再来查看。",
    ctaTitle: "准备改变现在的空间？",
    ctaDescription: "告诉我们目前空间的问题与期望，我们会先帮你厘清范围，再进入设计。",
    ctaPrimary: "获取免费报价",
    ctaSecondary: "WhatsApp 咨询",
    fallbackItems: [
      {
        title: "厨房翻新",
        location: "Mont Kiara, Kuala Lumpur",
        description: "更新橱柜与台面，并重新梳理更适合日常使用的厨房动线。",
        alt: "厨房翻新前后对比",
      },
      {
        title: "客厅改造",
        location: "Petaling Jaya, Selangor",
        description: "通过背景墙、地板与分层照明升级，让客厅空间更温暖完整。",
        alt: "客厅改造前后对比",
      },
      {
        title: "浴室翻新",
        location: "Cheras, Kuala Lumpur",
        description: "完成防水、瓷砖、洁具与实用收纳的整体更新。",
        alt: "浴室翻新前后对比",
      },
    ],
  },
} as const;
