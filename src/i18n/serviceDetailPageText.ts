import type { Language } from "@/i18n/routes";

export const serviceDetailPageText = {
  en: {
    notFound: "Service Not Found",
    notFoundDescription: "This service page is not available. Please return to the service list.",
    loadingTitle: "Loading service",
    loadingDescription: "Service details are loading.",
    viewAll: "View All Services",
    metaSuffix: "FLASH CAST Renovation Services",
    metaTitleFallback: (title: string, suffix: string) => `${title} Kuala Lumpur | ${suffix}`,
    metaKeywords: (title: string) => `${title} KL, ${title} Malaysia, renovation Kuala Lumpur`,
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    allServices: "All Services",
    services: "Services",
    getQuote: "Get a Quote",
    whatsapp: "WhatsApp Us",
    trustSignalsLabel: "Service trust signals",
    trustSignals: [
      { label: "KL & Selangor", text: "Local service area" },
      { label: "Site review", text: "Appointment available" },
      { label: "Scope first", text: "Quotation after details" },
    ],
    overview: "Overview",
    suitableFor: "Suitable For",
    offer: "What We Offer",
    commonProjects: "Common Renovation Needs",
    process: "Our Process",
    processDescription: "Each step should resolve a clear decision, from the real site and work scope to quotation, coordination, and handover.",
    faq: "Frequently Asked Questions",
    relatedServices: "Related Services",
    viewService: "View Service",
    resourceTitle: (title: string) => `Plan your ${title} enquiry`,
    resourceDescription: "Continue with relevant service areas, project references, practical guides, and material options. Project pages retain their published completion or concept classification.",
    resourceAction: "Open resource",
    materialLibrary: "Material Library",
    faqLink: "FAQ",
    facts: [
      { label: "Service area", value: "Kuala Lumpur / Selangor / Klang Valley" },
      { label: "Consultation", value: "Site review by appointment" },
      { label: "Planning basis", value: "Real site and confirmed scope" },
      { label: "Delivery", value: "Design and trade coordination" },
    ],
    interested: (title: string) => `Interested in ${title}?`,
    ctaText: "Contact us for a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    freeQuote: "Get a Free Quote",
    whatsappMessage: (title: string) =>
      `Hi FLASH CAST, I'd like to ask about ${title}. Project location: __. Property type: __. Current condition or main issue: __. Approximate area: __. I can share site photos or a floor plan.`,
  },
  zh: {
    notFound: "服务不存在",
    notFoundDescription: "这个服务页面暂时不存在，请返回服务列表查看已发布装修服务。",
    loadingTitle: "正在准备服务内容",
    loadingDescription: "服务图片和介绍正在载入，马上就好。",
    viewAll: "查看全部服务",
    metaSuffix: "FLASH CAST 装修服务",
    metaTitleFallback: (title: string, suffix: string) => `${title} Kuala Lumpur | ${suffix}`,
    metaKeywords: (title: string) => `${title} 吉隆坡, ${title} 马来西亚, 吉隆坡装修服务`,
    breadcrumbHome: "首页",
    breadcrumbServices: "服务项目",
    allServices: "全部服务",
    services: "服务项目",
    getQuote: "获取报价",
    whatsapp: "WhatsApp 联系",
    trustSignalsLabel: "服务信任提示",
    trustSignals: [
      { label: "吉隆坡与雪兰莪", text: "本地服务范围" },
      { label: "可预约现场", text: "先看空间再建议" },
      { label: "先确认范围", text: "再整理报价方向" },
    ],
    overview: "服务概览",
    suitableFor: "适合空间",
    offer: "我们提供",
    commonProjects: "常见装修需求",
    process: "服务流程",
    processDescription: "每一步都应解决一个明确问题，从真实现场和工程范围，到报价、施工协调与交付。",
    faq: "常见问题",
    relatedServices: "相关服务",
    viewService: "查看服务",
    resourceTitle: (title: string) => `继续规划${title}`,
    resourceDescription: "继续查看相关服务地区、项目参考、实用指南和材料选择。项目页会保留已发布的完工或概念内容分类。",
    resourceAction: "查看内容",
    materialLibrary: "材料库",
    faqLink: "常见问题",
    facts: [
      { label: "服务地区", value: "吉隆坡 / 雪兰莪 / 巴生谷" },
      { label: "咨询方式", value: "可预约现场评估" },
      { label: "规划依据", value: "真实现场与确认范围" },
      { label: "项目衔接", value: "设计与工种协调" },
    ],
    interested: (title: string) => `想了解 ${title}？`,
    ctaText: "联系我们获取免费咨询与报价。我们服务吉隆坡、雪兰莪与周边地区。",
    freeQuote: "获取免费报价",
    whatsappMessage: (title: string) =>
      `你好 FLASH CAST，我想咨询${title}。项目地点：__。房产类型：__。目前屋况或主要问题：__。大约面积：__。我可以提供现场照片或平面图。`,
  },

  ms: {
    notFound: "Perkhidmatan Tidak Ditemui",
    notFoundDescription: "Halaman perkhidmatan ini tidak tersedia. Sila kembali ke senarai perkhidmatan.",
    loadingTitle: "Perkhidmatan memuatkan",
    loadingDescription: "Butiran perkhidmatan sedang dimuatkan.",
    viewAll: "Lihat Semua Perkhidmatan",
    metaSuffix: "Perkhidmatan Pengubahsuaian FLASH CAST",
    metaTitleFallback: (title: string, suffix: string) => `${title} Kuala Lumpur | ${suffix}`,
    metaKeywords: (title: string) => `${title} KL, ${title} Malaysia, renovation Kuala Lumpur`,
    breadcrumbHome: "Rumah",
    breadcrumbServices: "Perkhidmatan",
    allServices: "Semua Perkhidmatan",
    services: "Perkhidmatan",
    getQuote: "Dapatkan Sebut Harga",
    whatsapp: "WhatsApp Kami",
    trustSignalsLabel: "Isyarat amanah perkhidmatan",
    trustSignals: [
      { label: "KL & Selangor", text: "Kawasan perkhidmatan tempatan" },
      { label: "Semakan tapak", text: "Temu janji tersedia" },
      { label: "Skop dahulu", text: "Sebutharga demi butiran" },
    ],
    overview: "Gambaran keseluruhan",
    suitableFor: "Sesuai Untuk",
    offer: "Apa yang Kami Tawarkan",
    commonProjects: "Keperluan Pengubahsuaian Biasa",
    process: "Proses Kami",
    processDescription: "Setiap langkah harus menyelesaikan keputusan yang jelas, daripada tapak sebenar dan skop kerja kepada sebut harga, penyelarasan dan penyerahan.",
    faq: "Soalan Lazim",
    relatedServices: "Perkhidmatan Berkaitan",
    viewService: "Lihat Perkhidmatan",
    resourceTitle: (title: string) => `Rancang pertanyaan ${title} anda`,
    resourceDescription: "Teruskan dengan bidang perkhidmatan yang berkaitan, rujukan projek, panduan praktikal dan pilihan bahan. Halaman projek mengekalkan penyiapan yang diterbitkan atau klasifikasi konsep.",
    resourceAction: "Sumber terbuka",
    materialLibrary: "Perpustakaan Bahan",
    faqLink: "FAQ",
    facts: [
      { label: "Kawasan perkhidmatan", value: "Kuala Lumpur / Selangor / Lembah Klang" },
      { label: "Perundingan", value: "Semakan tapak mengikut janji temu" },
      { label: "Asas perancangan", value: "Tapak sebenar dan skop yang disahkan" },
      { label: "Penghantaran", value: "Reka bentuk dan penyelarasan perdagangan" },
    ],
    interested: (title: string) => `Berminat dengan ${title}?`,
    ctaText: "Hubungi kami untuk konsultasi dan sebutharga percuma. Kami melayani kawasan Kuala Lumpur, Selangor, dan sekitarnya.",
    freeQuote: "Dapatkan Sebut Harga Percuma",
    whatsappMessage: (title: string) =>
      `Hai FLASH CAST, saya ingin bertanya tentang ${title}. Lokasi projek: __. Jenis harta: __. Keadaan semasa atau isu utama: __. Anggaran kawasan: __. Saya boleh berkongsi foto tapak atau pelan lantai.`,
  },
} as const;

export type ServiceProjectGuidanceBlock = Readonly<{
  id: string;
  slug: string;
  language: "zh" | "en";
  heading: string;
  body: string;
}>;

// Original owner-approved shop/office copy. No fallback into Malay or other services.
const serviceProjectGuidance: readonly ServiceProjectGuidanceBlock[] = [
  {
    "id": "SH-ZH-STAGES",
    "slug": "shop-renovation",
    "language": "zh",
    "heading": "资料怎样从咨询交接到开业？",
    "body": "现有五步流程保留；进入下一阶段前，可用一份资料清单逐次确认：\n1. 首次咨询：店主或承租方提供地点、店型、照片、平面图、设备/展示清单及目标开业日，并指定需求确认人。\n2. 现场量度：由双方确认的量度与规划人员核对尺寸、保留设备、出入口和管理限制；店主核对营业需求，管理要求以实际管理方书面资料为准。\n3. 范围确认：项目双方核对同一版布局、材料和设备尺寸、报价包含/排除项及提交责任，明确谁可以确认变更。\n4. 施工或安装前：按实际负责方核对进场、供货、设备接口和已确认图纸；变更先记录影响和确认人，再调整安排。\n5. 交付与开业准备：双方按书面范围记录已完成项、未完问题、实际适用的测试/设备资料及跟进人；专业测试由实际负责的合格人员完成。将目标开业日与供货、管理手续、施工及检查节点倒排核对，不能把目标日当作保证。"
  },
  {
    "id": "SH-EN-STAGES",
    "slug": "shop-renovation",
    "language": "en",
    "heading": "Which information is confirmed from enquiry to opening?",
    "body": "Keep the existing planning steps and carry one information list into the later stages:\n1. Enquiry: the operator or tenant shares the location, shop type, photos, plan, equipment/display list and intended opening date, and identifies the person who confirms the brief.\n2. Measurement: the measurement and planning parties agreed for the project check dimensions, retained equipment, access and site constraints. The operator confirms operational needs; management requirements come from the actual management documents.\n3. Scope confirmation: both parties check the same layout version, material and equipment dimensions, inclusions, exclusions and submission responsibilities, and identify who may approve changes.\n4. Before work or installation: the actual responsible parties check access, deliveries, equipment interfaces and confirmed drawings. Record the effect of a change and its approver before revising arrangements.\n5. Handover and opening readiness: use the written scope to record completed items, outstanding issues, applicable test/equipment records and follow-up owners. Relevant qualified parties perform any professional tests. Work back from the intended opening date through delivery, management, work and checking milestones; the target date is not a guarantee."
  },
  {
    "id": "OF-ZH-STAGES",
    "slug": "office-renovation",
    "language": "zh",
    "heading": "办公室各阶段资料由谁核对？",
    "body": "将下列问项交给项目双方指定的实际负责人核对；这些角色说明不代表任何专业提交或测试自动包含在装修报价内。\n1. 咨询：业主/承租方指定需求确认人，提交人数、工作方式、平面图和保留项目。小型办公室列明工位和收纳优先项；共享或服务型办公室另列团队分区、共用会议/接待、访客与门禁需求。\n2. 量度与方案：由约定的量度/规划人员核对现场尺寸、门窗、隔间、家具和设备接口；使用方确认布局。前台补充访客和柜台设备，茶水间补充电器尺寸与现有水电位置，隔断补充拟分区、门位、开合和既有天花/机电限制。\n3. 报价与图纸确认：双方核对布局版本、材料方向、数量、保留/新增项目、供应安装边界、排除项和管理资料责任；专业要求交实际负责的合格人员确认。\n4. 施工/安装前：实际执行方与使用方核对确认图纸、供货、进出场、设备接驳及工种先后；将变更、影响和确认人写入记录。\n5. 交付：双方按书面范围核对完成项、未完问题及跟进人；适用的测试记录、标签、设备说明和竣工资料由对应实际责任方提供。规划问项与完工检查分别记录，可沿用本页已有的办公室检查、机电/IT和交付清单。"
  },
  {
    "id": "OF-EN-STAGES",
    "slug": "office-renovation",
    "language": "en",
    "heading": "Who checks information at each office fit-out stage?",
    "body": "Agree the actual project contacts for each check; these prompts do not make professional submissions or tests an automatic part of the quotation.\n1. Enquiry: the owner or tenant identifies the brief approver and supplies headcount, working patterns, plans and retained items.\n2. Measurement and layout: the agreed measurement and planning parties check site dimensions, doors, partitions, furniture and equipment interfaces; the user confirms the layout. For partitions, record the intended zones, door positions and operation, and existing ceiling and services constraints.\n3. Scope confirmation: both parties check the drawing version, materials, quantities, retained and new work, supply/installation boundaries, exclusions and management-document responsibilities. Actual qualified parties confirm professional requirements.\n4. Before work or installation: the responsible parties check drawings, deliveries, access, equipment connections and trade sequence, recording changes and their approvers.\n5. Handover: check completion and outstanding issues against the written scope, assign follow-up owners and obtain the applicable test, label, equipment and as-built records from the actual responsible parties. Keep planning checks separate from completion checks and reuse the existing linked checklists."
  },
  {
    "id": "OF-EN-OCCUPIED",
    "slug": "office-renovation",
    "language": "en",
    "heading": "Can the office remain open during work?",
    "body": "Before deciding whether trading or office work can continue, the occupier should identify occupied zones, critical activities and times when interruption is unacceptable. Discuss separable work areas, staff and visitor routes, access, deliveries, noise or dust impacts, and any proposed service interruption with the actual work parties and building management. Record the agreed sequence, restrictions and who confirms each change. If the necessary separation or operating conditions cannot be confirmed, review temporary relocation or a different work schedule. Continuing normal operations is not guaranteed."
  }
];

export const getServiceProjectGuidance = (slug: string, language: Language): readonly ServiceProjectGuidanceBlock[] =>
  serviceProjectGuidance.filter((block) => block.slug === slug && block.language === language);
