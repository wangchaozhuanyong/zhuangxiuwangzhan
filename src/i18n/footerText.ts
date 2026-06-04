export const footerLocationLinks = {
  en: [
    { name: "Kuala Lumpur", slug: "kuala-lumpur" },
    { name: "Petaling Jaya", slug: "petaling-jaya" },
    { name: "Selangor", slug: "selangor" },
    { name: "Mont Kiara", slug: "mont-kiara" },
    { name: "Cheras", slug: "cheras" },
    { name: "Bangsar", slug: "bangsar" },
    { name: "Subang Jaya", slug: "subang-jaya" },
    { name: "Puchong", slug: "puchong" },
  ],
  zh: [
    { name: "吉隆坡", slug: "kuala-lumpur" },
    { name: "八打灵再也", slug: "petaling-jaya" },
    { name: "雪兰莪", slug: "selangor" },
    { name: "满家乐", slug: "mont-kiara" },
    { name: "蕉赖", slug: "cheras" },
    { name: "孟沙", slug: "bangsar" },
    { name: "梳邦再也", slug: "subang-jaya" },
    { name: "蒲种", slug: "puchong" },
  ],
} as const;

export const footerCopy = {
  en: {
    ctaTitle: "Planning to Renovate Your Home or Office?",
    ctaText: "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    ctaButton: "Get Free Quote",
    brandText:
      "FLASH CAST SDN. BHD. provides residential renovation, commercial fit-out, custom built-in furniture, and premium wall finishing services in Kuala Lumpur and Selangor.",
    trustLine: "SSM Registered / Design, Build & Project Coordination",
    hours: "Mon - Sat / 9:00 AM - 6:00 PM",
    servicesTitle: "Services",
    companyTitle: "Company",
    areasTitle: "Service Areas",
    rights: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    serviceLinks: [
      { name: "Interior Renovation", slug: "renovation" },
      { name: "Custom Built-In Furniture", slug: "builtin" },
      { name: "Commercial Renovation", slug: "commercial" },
      { name: "Artistic Wall Coating", slug: "artistic-coating" },
      { name: "Design Services", slug: "design" },
      { name: "Exterior Works", slug: "exterior" },
      { name: "Warehouse & Shelving", slug: "warehouse" },
    ],
    companyLinks: [
      { name: "About Us", path: "/about" },
      { name: "Projects", path: "/projects" },
      { name: "Materials Library", path: "/materials" },
      { name: "Our Process", path: "/process" },
      { name: "Blog & Guides", path: "/blog" },
      { name: "FAQ", path: "/faq" },
      { name: "Get a Quote", path: "/quote" },
      { name: "Contact Us", path: "/contact" },
    ],
  },
  zh: {
    ctaTitle: "计划装修您的住宅或办公室？",
    ctaText: "立即获取免费咨询和报价。我们服务吉隆坡、雪兰莪及周边地区。",
    ctaButton: "获取免费报价",
    brandText:
      "FLASH CAST SDN. BHD. 专注吉隆坡与雪兰莪住宅装修、商业空间装修、定制内嵌家具和高级墙面涂装服务。",
    trustLine: "SSM 注册公司 / 设计、施工与项目统筹",
    hours: "周一至周六 / 9:00 AM - 6:00 PM",
    servicesTitle: "服务项目",
    companyTitle: "公司信息",
    areasTitle: "服务地区",
    rights: "保留所有权利。",
    privacy: "隐私政策",
    terms: "使用条款",
    serviceLinks: [
      { name: "室内装修", slug: "renovation" },
      { name: "定制内嵌家具", slug: "builtin" },
      { name: "商业空间装修", slug: "commercial" },
      { name: "艺术墙面涂装", slug: "artistic-coating" },
      { name: "设计服务", slug: "design" },
      { name: "外墙与门面工程", slug: "exterior" },
      { name: "仓库与货架工程", slug: "warehouse" },
    ],
    companyLinks: [
      { name: "关于我们", path: "/about" },
      { name: "装修案例", path: "/projects" },
      { name: "材料库", path: "/materials" },
      { name: "施工流程", path: "/process" },
      { name: "装修博客", path: "/blog" },
      { name: "常见问题", path: "/faq" },
      { name: "获取报价", path: "/quote" },
      { name: "联系我们", path: "/contact" },
    ],
  },
} as const;

export const footerServiceOverrides = {
  commercial: {
    en: { name: "Office Renovation", slug: "office-renovation" },
    zh: { name: "办公室装修", slug: "office-renovation" },
  },
  exterior: {
    en: { name: "Shop Renovation", slug: "shop-renovation" },
    zh: { name: "店铺装修", slug: "shop-renovation" },
  },
} as const;

export const footerUiText = {
  en: {
    socialAria: "Social media",
    navigationAria: "Footer navigation",
    preludeEyebrow: "Project consultation",
    whatsappLabel: "WhatsApp",
  },
  zh: {
    socialAria: "社交媒体",
    navigationAria: "页脚导航",
    preludeEyebrow: "项目咨询",
    whatsappLabel: "WhatsApp 咨询",
  },
} as const;
