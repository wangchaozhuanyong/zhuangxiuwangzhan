/** Static route SEO (mirrors in-app PageMeta copy; does not change visible UI). */
export const SITE_URL = (process.env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
export const OG_IMAGE = `${SITE_URL}/og-image.webp`;
export const COMPANY = "FLASH CAST SDN. BHD.";

const page = (lang, path, title, description, keywords = "", extra = {}) => ({
  lang,
  path,
  title: title.includes("FLASH CAST") ? title : `${title} | ${COMPANY}`,
  description,
  keywords,
  ...extra,
});

const homeFaqs = {
  en: [
    {
      question: "What types of renovation do you handle?",
      answer:
        "FLASH CAST plans and coordinates residential and commercial renovation, including kitchens, bathrooms, offices, shops, old-house upgrades, custom built-ins, selected finishes, and related installation work. The final scope is confirmed after reviewing your site and requirements.",
    },
    {
      question: "How do I request a renovation quote?",
      answer:
        "Share the location, space type, approximate area, site photos, current issues, and the work you are considering. We can then clarify the scope, arrange a site review where needed, and prepare a written proposal or quotation for the confirmed items.",
    },
    {
      question: "Which areas does FLASH CAST serve?",
      answer:
        "FLASH CAST mainly serves Kuala Lumpur, Selangor, and the Klang Valley. Send us the exact project location so we can confirm availability for your area and project type.",
    },
    {
      question: "What should I prepare before the consultation?",
      answer:
        "Useful information includes the property or business type, floor area, photos or floor plans, preferred style, must-have work, target use, and any management-office, landlord, or mall renovation rules.",
    },
    {
      question: "Can you help coordinate condominium or commercial renovation requirements?",
      answer:
        "Where included in the confirmed scope, we can help coordinate the documents and work requirements requested by the management office, landlord, or mall. Final approval remains subject to the relevant management or authority.",
    },
    {
      question: "How are renovation cost and timeline determined?",
      answer:
        "They depend on the site condition, floor area, demolition, wet works, wiring, plumbing, carpentry, materials, lead times, and approval requirements. A reliable cost and schedule can only be prepared after the scope is confirmed.",
    },
    {
      question: "Is after-sales support or warranty included?",
      answer:
        "After-sales follow-up is handled according to the confirmed project scope. Any workmanship coverage, supplier warranty, exclusions, and duration should be stated in the quotation or project documents for your review.",
    },
  ],
  zh: [
    {
      question: "FLASH CAST 提供哪些装修服务？",
      answer:
        "FLASH CAST 提供住宅与商业空间装修规划及施工协调，包括厨房、浴室、办公室、店铺、旧屋翻新、定制柜、部分饰面与相关安装工程。最终范围会在了解现场与需求后确认。",
    },
    {
      question: "如何申请装修报价？",
      answer:
        "请提供地点、空间类型、大约面积、现场照片、现有问题和计划进行的项目。我们会先梳理需求，必要时安排现场评估，再按确认范围准备书面方案或报价。",
    },
    {
      question: "FLASH CAST 服务哪些地区？",
      answer:
        "FLASH CAST 主要服务吉隆坡、雪兰莪与巴生谷。请提供具体项目地点，我们会根据地区与项目类型确认是否可以安排。",
    },
    {
      question: "装修咨询前要准备什么资料？",
      answer:
        "建议准备房屋或商业空间类型、面积、现场照片或平面图、喜欢的风格、必须完成的项目、空间用途，以及管理处、业主或商场的装修规定。",
    },
    {
      question: "可以协助处理公寓或商业空间的装修要求吗？",
      answer:
        "如确认范围包含相关工作，我们可协助整理和协调管理处、业主或商场要求的文件与施工条件；最终批准仍以相关管理单位或主管机构为准。",
    },
    {
      question: "装修费用和工期如何确定？",
      answer:
        "费用和工期会受现场状况、面积、拆除、泥水、水电、木作、材料、供货时间与审批要求影响。确认项目范围后，才能提供较可靠的报价与进度安排。",
    },
    {
      question: "是否提供售后跟进或保修？",
      answer:
        "售后会按已确认的项目范围跟进。施工保障、供应商保修、适用范围、例外情况与期限，应以报价单或项目文件中的书面说明为准。",
    },
  ],
};

const servicesFaqs = {
  en: [
    {
      question: "What renovation services does FLASH CAST provide?",
      answer:
        "Current public services include residential renovation, interior design, kitchen renovation, bathroom renovation, office renovation, shop renovation, custom built-in furniture, artistic wall coating, old-house renovation, approval coordination, and warehouse shelving related space planning.",
    },
    {
      question: "What if I am not sure whether I need home renovation, kitchen renovation, or custom built-ins?",
      answer:
        "Start with the problem. For a whole home or multiple rooms, review residential renovation. For kitchen or bathroom issues, use the matching service page. For wardrobes, shoe cabinets, TV cabinets, or storage, start with custom built-in furniture.",
    },
    {
      question: "What should I prepare before requesting advice?",
      answer:
        "Prepare the location, space type, site photos, current issues, intended scope, style references, management or mall work restrictions if any, and the service type you want to discuss.",
    },
    {
      question: "Should the service page show fixed prices or fixed timelines?",
      answer:
        "Not unless confirmed by the owner. Quotation and scheduling depend on area size, demolition, materials, carpentry, wiring, plumbing, waterproofing, approvals, site conditions, and commercial opening timing.",
    },
    {
      question: "Can the page show design concepts or rendering concepts?",
      answer:
        "Yes, but they must be clearly labelled as design concepts, rendering concepts, or planning examples, not as completed project proof, customer reviews, or before-after evidence.",
    },
  ],
  zh: [
    {
      question: "FLASH CAST 提供哪些装修服务？",
      answer:
        "当前公开服务包括住宅装修、室内设计、厨房装修、浴室装修、办公室装修、店铺装修、定制家具、艺术墙面涂料、旧屋翻新、装修申请协调和仓库货架相关空间规划。",
    },
    {
      question: "我不确定该选住宅装修、厨房装修还是定制家具，怎么办？",
      answer:
        "可以先按问题判断。如果是整屋或多个空间，先看住宅装修；如果集中在厨房或浴室，先看对应服务页；如果主要是柜体、衣柜、鞋柜或收纳，先看定制家具。",
    },
    {
      question: "咨询前需要准备哪些资料？",
      answer:
        "建议准备地点、空间类型、现场照片、现有问题、预计装修范围、喜欢的风格参考、是否有管理处或商场施工限制，以及希望咨询的服务类型。",
    },
    {
      question: "服务页可以写固定价格或固定工期吗？",
      answer:
        "不建议。装修报价和安排会受面积、拆除范围、材料、木作、水电、防水、审批、现场条件和商业开业时间影响，未经业主确认不能写固定承诺。",
    },
    {
      question: "可以展示设计方案或效果图方案吗？",
      answer:
        "可以，但必须明确标注为设计方案、效果图方案、概念设计或规划示例，不能写成真实完工案例、客户评价或 before/after 证明。",
    },
  ],
};

const staticDefs = [
  page("en", "/", "Renovation Company Kuala Lumpur & Selangor | FLASH CAST", "FLASH CAST plans and coordinates home and commercial renovation across Kuala Lumpur, Selangor, and Klang Valley, including kitchens, bathrooms, offices, shops, custom built-ins, material advice, and site work.", "", { faqs: homeFaqs.en }),
  page("zh", "/", "吉隆坡装修公司 | 住宅、商业装修与定制柜 | FLASH CAST", "FLASH CAST 为吉隆坡、雪兰莪与巴生谷提供住宅装修、旧屋翻新、厨房与浴室、办公室与店铺装修、定制柜体、材料建议和施工协调。提交空间照片、地点与计划范围，获取免费报价。", "", { faqs: homeFaqs.zh }),
  page("en", "/about", "About FLASH CAST | Renovation Company Kuala Lumpur", "Learn about FLASH CAST SDN. BHD., a Kuala Lumpur renovation company specializing in residential, commercial, and custom interior projects."),
  page("zh", "/about", "关于 FLASH CAST | 吉隆坡装修公司", "了解 FLASH CAST SDN. BHD.，专注住宅、商业与定制室内工程的吉隆坡装修公司。"),
  page(
    "en",
    "/services",
    "Renovation Services Kuala Lumpur | Home, Kitchen, Office & Shop | FLASH CAST",
    "Explore FLASH CAST renovation services in Kuala Lumpur, Selangor, and Klang Valley, including home, kitchen, bathroom, office, shop, built-in furniture, design, approval, and warehouse planning.",
    "renovation services kuala lumpur, home renovation malaysia, kitchen renovation malaysia, bathroom renovation malaysia, office renovation malaysia, shop renovation malaysia, custom built in furniture malaysia",
    { faqs: servicesFaqs.en },
  ),
  page(
    "zh",
    "/services",
    "吉隆坡装修服务项目 | 住宅、厨房、办公室与店铺装修 | FLASH CAST",
    "FLASH CAST 提供吉隆坡、雪兰莪与巴生谷装修服务，包括住宅装修、厨房、浴室、办公室、店铺、定制家具、旧屋翻新、设计、申请协调和仓库空间规划。",
    "吉隆坡装修服务项目, 住宅装修 吉隆坡, 厨房装修 吉隆坡, 浴室装修 防水 吉隆坡, 办公室装修 马来西亚, 店铺装修 马来西亚, 定制家具 吉隆坡",
    { faqs: servicesFaqs.zh },
  ),
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
  page("en", "/products", "Renovation Products Kuala Lumpur | FLASH CAST", "Browse renovation products, materials, finishes, cabinets, flooring, surfaces, and fittings available for project consultation with FLASH CAST."),
  page("zh", "/products", "吉隆坡装修商品与材料 | FLASH CAST", "浏览 FLASH CAST 装修商品、材料、饰面、柜体、地板、台面与配件，并咨询项目适用方案。"),
  page("en", "/promotions", "Renovation Promotions Kuala Lumpur | FLASH CAST", "Review current FLASH CAST renovation promotion enquiries and the conditions that apply before quotation confirmation."),
  page("zh", "/promotions", "吉隆坡装修优惠活动 | FLASH CAST", "查看 FLASH CAST 当前装修优惠咨询方向与报价确认前的适用条件。"),
  page("en", "/locations", "Renovation Service Areas KL & Selangor | FLASH CAST", "Explore FLASH CAST renovation service areas across Kuala Lumpur, Selangor, and Klang Valley."),
  page("zh", "/locations", "吉隆坡与雪兰莪装修服务地区 | FLASH CAST", "查看 FLASH CAST 在吉隆坡、雪兰莪与巴生谷的装修服务覆盖地区。"),
  page("en", "/projects", "Renovation Projects Portfolio | Kuala Lumpur | FLASH CAST", "View completed renovation projects by FLASH CAST in Kuala Lumpur and Selangor."),
  page("zh", "/projects", "装修案例 | 吉隆坡 | FLASH CAST", "查看 FLASH CAST 在吉隆坡与雪兰莪完成的装修案例。"),
  page("en", "/before-after", "Renovation Before and After Kuala Lumpur | FLASH CAST", "Explore renovation before-and-after comparisons by FLASH CAST across Kuala Lumpur and Klang Valley."),
  page("zh", "/before-after", "吉隆坡装修前后对比案例 | FLASH CAST", "查看 FLASH CAST 在吉隆坡与 Klang Valley 的装修前后对比示例与空间改造效果。"),
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
      ...(def.faqs ? { faqs: def.faqs } : {}),
    };
  }
  return manifest;
}
