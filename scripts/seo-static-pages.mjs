/** Static route SEO (mirrors in-app PageMeta copy; does not change visible UI). */
export const SITE_URL = (process.env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
export const OG_IMAGE = `${SITE_URL}/og-image.webp`;
export const COMPANY = "FLASH CAST SDN. BHD.";

const page = (lang, path, title, description, keywords = "") => ({
  lang,
  path,
  title: title.includes("FLASH CAST") ? title : `${title} | ${COMPANY}`,
  description,
  keywords,
});

const staticDefs = [
  page("en", "/", "Renovation Company Kuala Lumpur | Condo, Landed & Commercial | FLASH CAST", "FLASH CAST SDN. BHD. provides professional renovation, interior design, custom built-in furniture, and commercial fit-out services in Kuala Lumpur and Selangor."),
  page("zh", "/", "吉隆坡装修公司 | 住宅商业装修与定制家具 | FLASH CAST", "FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，提供住宅装修、商业空间装修、厨房翻新、旧屋翻新、定制家具、材料建议与项目管理。"),
  page("en", "/about", "About FLASH CAST | Renovation Company Kuala Lumpur", "Learn about FLASH CAST SDN. BHD., a Kuala Lumpur renovation company specializing in residential, commercial, and custom interior projects."),
  page("zh", "/about", "关于 FLASH CAST | 吉隆坡装修公司", "了解 FLASH CAST SDN. BHD.，专注住宅、商业与定制室内工程的吉隆坡装修公司。"),
  page("en", "/services", "Renovation Services Kuala Lumpur | Interior, Built-In, Commercial & Artistic Coating", "Explore FLASH CAST's comprehensive renovation services in Kuala Lumpur and Selangor."),
  page("zh", "/services", "吉隆坡装修服务 | 室内装修、定制家具、商业空间 | FLASH CAST", "FLASH CAST 提供吉隆坡与雪兰莪装修服务：室内设计、定制家具、商业空间装修等。"),
  page("en", "/services/renovation", "Full Renovation Kuala Lumpur | FLASH CAST", "Full home and commercial renovation services in Kuala Lumpur and Selangor, including coordination, site work, and finishing."),
  page("zh", "/services/renovation", "吉隆坡全屋装修 | FLASH CAST", "FLASH CAST 提供吉隆坡与雪兰莪全屋装修、旧屋翻新、施工协调和收尾工程。"),
  page("en", "/services/design", "Interior Design Kuala Lumpur | FLASH CAST", "Interior design, space planning, 3D visualization, and renovation drawings for homes and commercial spaces."),
  page("zh", "/services/design", "吉隆坡室内设计 | FLASH CAST", "住宅与商业空间室内设计、空间规划、3D 效果图和施工图服务。"),
  page("en", "/services/builtin", "Custom Built-In Furniture Kuala Lumpur | FLASH CAST", "Custom wardrobes, kitchen cabinets, TV cabinets, vanities, and storage systems for Malaysian homes and businesses."),
  page("zh", "/services/builtin", "吉隆坡定制家具与内嵌柜 | FLASH CAST", "定制衣柜、橱柜、电视柜、浴室柜和收纳系统设计制作安装。"),
  page("en", "/services/kitchen", "Kitchen Renovation KL & Selangor | Cabinets, Countertops, Layout Planning | FLASH CAST", "FLASH CAST plans kitchen renovation in KL, Selangor, and Klang Valley, covering site measurement, cabinets, quartz countertops, dry/wet kitchen layout, plumbing, waterproofing-related scope, and coordination."),
  page("zh", "/services/kitchen", "吉隆坡厨房装修服务 | 橱柜、台面、干湿厨房规划 | FLASH CAST", "FLASH CAST 提供 KL、Selangor 与 Klang Valley 厨房装修规划，包括现场测量、橱柜、石英石台面、干湿厨房、给排水、防水相关范围和施工协调。先获取厨房装修报价。"),
  page("en", "/services/bathroom", "Bathroom Renovation Kuala Lumpur | FLASH CAST", "Bathroom renovation, waterproofing, tiling, vanity installation, shower upgrades, and plumbing works."),
  page("zh", "/services/bathroom", "吉隆坡浴室装修与防水工程 | FLASH CAST", "浴室翻新、防水、铺砖、浴室柜、淋浴系统和水喉排水工程。"),
  page("en", "/services/shop-renovation", "Shop Renovation Malaysia | Retail Fit-Out Planning | FLASH CAST", "Plan shop renovation, retail fit-out, display layout, counter storage, frontage direction, and quotation preparation for Kuala Lumpur and Selangor commercial spaces."),
  page("zh", "/services/shop-renovation", "马来西亚店铺装修与零售空间规划 | FLASH CAST", "FLASH CAST 提供 Kuala Lumpur、Selangor 与 Klang Valley 店铺装修和 retail fit-out 规划，包括展示动线、柜台收纳、门头方向、材料灯光和报价前资料整理。"),
  page("en", "/services/artistic-coating", "Artistic Wall Coating Malaysia | FLASH CAST", "Premium artistic wall coating and Remmers decorative finishes for residential and commercial interiors."),
  page("zh", "/services/artistic-coating", "马来西亚艺术墙面涂装 | FLASH CAST", "Remmers 艺术墙面涂装、纹理漆、特色墙和高级室内墙面效果施工。"),
  page("en", "/services/old-house", "Old House Renovation Kuala Lumpur | FLASH CAST", "Specialist old house and landed property renovation in Kuala Lumpur and Selangor."),
  page("zh", "/services/old-house", "老房翻新装修 | 吉隆坡 | FLASH CAST", "FLASH CAST 提供吉隆坡与雪兰莪老房、排屋翻新装修服务。"),
  page("en", "/services/approval", "Renovation Permit and Drawing Support | FLASH CAST", "Renovation permit support, management office coordination, drawings, and documentation for renovation projects."),
  page("zh", "/services/approval", "装修准证与图纸文件支持 | FLASH CAST", "装修准证申请、管理处协调、图纸文件和施工资料准备服务。"),
  page("en", "/materials", "Renovation Materials Guide | Flooring, Cabinets, Tiles | FLASH CAST", "Browse renovation materials including flooring, kitchen cabinets, tiles, and wall finishes."),
  page("zh", "/materials", "装修材料指南 | 地板、橱柜、瓷砖 | FLASH CAST", "浏览地板、橱柜、瓷砖、墙面等装修材料与搭配建议。"),
  page("en", "/projects", "Renovation Projects Portfolio | Kuala Lumpur | FLASH CAST", "View completed renovation projects by FLASH CAST in Kuala Lumpur and Selangor."),
  page("zh", "/projects", "装修案例 | 吉隆坡 | FLASH CAST", "查看 FLASH CAST 在吉隆坡与雪兰莪完成的装修案例。"),
  page("en", "/process", "Our Renovation Process | FLASH CAST Kuala Lumpur", "Understand FLASH CAST's renovation process from consultation to handover."),
  page("zh", "/process", "装修流程 | FLASH CAST 吉隆坡", "了解 FLASH CAST 从咨询、设计、施工到交付的装修流程。"),
  page("en", "/faq", "Renovation FAQ | Kuala Lumpur | FLASH CAST", "Frequently asked questions about renovation services, pricing, and timelines."),
  page("zh", "/faq", "装修常见问题 | 吉隆坡 | FLASH CAST", "关于装修服务、报价与工期的常见问题解答。"),
  page("en", "/contact", "Contact FLASH CAST | Renovation Company Kuala Lumpur", "Contact FLASH CAST for renovation enquiries in Kuala Lumpur and Selangor."),
  page("zh", "/contact", "联系 FLASH CAST | 吉隆坡装修公司", "联系 FLASH CAST，咨询吉隆坡与雪兰莪装修服务。"),
  page("en", "/quote", "Get a Free Renovation Quote | Kuala Lumpur & Selangor | FLASH CAST", "Request a free renovation quotation from FLASH CAST. Free site measurement included."),
  page("zh", "/quote", "免费装修报价 | 吉隆坡与雪兰莪 | FLASH CAST", "向 FLASH CAST 索取免费装修报价，含免费上门测量。"),
  page("en", "/blog", "Renovation Blog & Guides | FLASH CAST Malaysia", "Renovation tips, material guides, and project insights from FLASH CAST."),
  page("zh", "/blog", "装修博客与指南 | FLASH CAST 马来西亚", "FLASH CAST 装修技巧、材料指南与案例分享。"),
  page("en", "/privacy", "Privacy Policy | FLASH CAST", "Privacy policy for FLASH CAST SDN. BHD."),
  page("zh", "/privacy", "隐私政策 | FLASH CAST", "FLASH CAST SDN. BHD. 隐私政策。"),
  page("en", "/terms", "Terms of Service | FLASH CAST", "Terms of service for FLASH CAST SDN. BHD."),
  page("zh", "/terms", "服务条款 | FLASH CAST", "FLASH CAST SDN. BHD. 服务条款。"),
];

export function buildStaticManifest() {
  const manifest = {};
  for (const def of staticDefs) {
    const localizedPath = def.path === "/" ? `/${def.lang}` : `/${def.lang}${def.path}`;
    const canonicalPath = def.path === "/" ? `/${def.lang}` : `/${def.lang}${def.path}`;
    const enPath = def.path === "/" ? "/en" : `/en${def.path}`;
    const zhPath = def.path === "/" ? "/zh" : `/zh${def.path}`;
    manifest[localizedPath] = {
      lang: def.lang,
      path: def.path,
      title: def.title,
      description: def.description,
      keywords: def.keywords,
      canonical: `${SITE_URL}${canonicalPath}`,
      hreflang: {
        en: `${SITE_URL}${enPath}`,
        zh: `${SITE_URL}${zhPath}`,
        xDefault: `${SITE_URL}${enPath}`,
      },
      ogImage: OG_IMAGE,
    };
  }
  return manifest;
}
