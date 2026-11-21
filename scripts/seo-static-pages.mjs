/** Static route SEO (mirrors in-app PageMeta copy; does not change visible UI). */
import { readFileSync } from "node:fs";
const serviceAreaCopy = JSON.parse(readFileSync(new URL("../src/components/services/serviceAreaPageText.json", import.meta.url), "utf8"));
const cabinetText = JSON.parse(readFileSync(new URL("../src/i18n/customCabinetsText.json", import.meta.url), "utf8"));
const beforeAfterSeo = JSON.parse(readFileSync(new URL("../src/i18n/beforeAfterPageSeo.json", import.meta.url), "utf8"));
export const SITE_URL = (process.env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
export const OG_IMAGE = `${SITE_URL}/og-image.webp`;
// Title suffix only. The registered name stays in schema and llms.txt; using the
// full legal name here pushed dozens of titles past the 60-character display limit.
export const COMPANY = "FLASH CAST";

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

const klDigitalLockPath = "/locations/kuala-lumpur/digital-lock";

const staticDefs = [
  // Batch 2: exact approved English and Chinese copy; Malay awaits translation.
  {
    "lang": "en",
    "path": "/locations/kuala-lumpur/condo-renovation",
    "title": "Condo Renovation Kuala Lumpur | FLASH CAST",
    "description": "Condo renovation in Kuala Lumpur for units from the 1990s to current buildings. Layout, storage, electrical and air-conditioning works planned around management rules and structural limits.",
    "keywords": "condo renovation kuala lumpur, apartment renovation kl, condo interior works",
    "schemaType": "Service",
    "entityName": "Condo Renovation Kuala Lumpur"
  },
  {
    "lang": "zh",
    "path": "/locations/kuala-lumpur/condo-renovation",
    "title": "吉隆坡公寓装修｜管理处审批｜FLASH CAST",
    "description": "吉隆坡公寓装修，覆盖 1990 年代到近年的单位。格局、收纳、电气与空调工程，按管理处规定与结构限制规划。",
    "keywords": "吉隆坡公寓装修, 公寓翻新, 公寓管理处审批",
    "schemaType": "Service",
    "entityName": "吉隆坡公寓装修"
  },
  {
    "lang": "en",
    "path": "/locations/petaling-jaya/kitchen-renovation",
    "title": "Kitchen Renovation Petaling Jaya | FLASH CAST",
    "description": "Kitchen renovation in Petaling Jaya for older apartments and terraces. Drainage stack and electrical capacity checked first, then cabinets, worktop and appliance planning.",
    "keywords": "kitchen renovation petaling jaya, kitchen cabinet pj, kitchen renovation contractor pj",
    "schemaType": "Service",
    "entityName": "Kitchen Renovation Petaling Jaya"
  },
  {
    "lang": "zh",
    "path": "/locations/petaling-jaya/kitchen-renovation",
    "title": "八打灵再也厨房装修｜定制橱柜｜FLASH CAST",
    "description": "八打灵再也老公寓与排屋的厨房装修。先核对排水立管与电容量，再规划橱柜、台面与电器。",
    "keywords": "八打灵再也厨房装修, 厨房橱柜定制, 厨房翻新",
    "schemaType": "Service",
    "entityName": "八打灵再也厨房装修"
  },
  {
    "lang": "en",
    "path": "/locations/cheras/condo-renovation",
    "title": "Condo Renovation Cheras | FLASH CAST",
    "description": "Condo renovation in Cheras for older blocks around Taman Maluri and newer units towards Sungai Besi. Services review for old blocks, layout and storage within management rules for new ones.",
    "keywords": "condo renovation cheras, apartment renovation cheras, condo renovation contractor cheras",
    "schemaType": "Service",
    "entityName": "Condo Renovation Cheras"
  },
  {
    "lang": "zh",
    "path": "/locations/cheras/condo-renovation",
    "title": "蕉赖公寓装修｜新旧楼差异｜FLASH CAST",
    "description": "蕉赖公寓装修，覆盖 Taman Maluri 旧楼与 Sungai Besi 方向新楼。旧楼先查机电，新楼在管理规则内做格局与收纳。",
    "keywords": "蕉赖公寓装修, 蕉赖公寓翻新, 公寓管理处审批",
    "schemaType": "Service",
    "entityName": "蕉赖公寓装修"
  },
  {
    "lang": "en",
    "path": "/locations/subang-jaya/landed-house-renovation",
    "title": "Landed House Renovation Subang Jaya | FLASH CAST",
    "description": "Landed house renovation in Subang Jaya: terrace and semi-detached extensions, rewiring, re-piping, roof work and full-house refurbishment with MBSJ submission guidance.",
    "keywords": "landed house renovation subang jaya, terrace extension subang jaya, house renovation usj",
    "schemaType": "Service",
    "entityName": "Landed House Renovation Subang Jaya"
  },
  {
    "lang": "zh",
    "path": "/locations/subang-jaya/landed-house-renovation",
    "title": "梳邦再有地住宅装修｜排屋扩建｜FLASH CAST",
    "description": "梳邦再有地住宅装修：排屋与半独立式扩建、重新拉电、换管、屋顶工程与全屋翻新，含 MBSJ 送审指引。",
    "keywords": "梳邦再有地住宅装修, 排屋扩建, USJ 房屋翻新",
    "schemaType": "Service",
    "entityName": "梳邦再有地住宅装修"
  },
  ...Object.entries(serviceAreaCopy[klDigitalLockPath]).map(([lang, copy]) =>
    page(lang, klDigitalLockPath, copy.title, copy.description, copy.keywords, {
      schemaType: "Service", entityName: copy.entityName,
    }),
  ),
  {
    "lang": "en",
    "path": "/locations/selangor/office-renovation",
    "title": "Office Renovation Selangor | Fit-Out | FLASH CAST",
    "description": "Office renovation and fit-out across Selangor, including shoplot offices, industrial buildings and purpose-built towers. Authority submission, fire requirements and zoning planned up front.",
    "keywords": "office renovation selangor, office fit out selangor, shoplot office renovation",
    "schemaType": "Service",
    "entityName": "Office Renovation Selangor"
  },
  {
    "lang": "zh",
    "path": "/locations/selangor/office-renovation",
    "title": "雪兰莪办公室装修｜办公室精装｜FLASH CAST",
    "description": "雪兰莪办公室装修与精装，覆盖店屋办公室、工业建筑与专门写字楼。送审、消防要求与分区在前期一并规划。",
    "keywords": "雪兰莪办公室装修, 办公室精装, 店屋办公室装修",
    "schemaType": "Service",
    "entityName": "雪兰莪办公室装修"
  },
  {
    "lang": "en",
    "path": "/locations/petaling-jaya/landed-house-renovation",
    "title": "Landed House Renovation Petaling Jaya | FLASH CAST",
    "description": "Landed house renovation in Petaling Jaya for terraces and semi-detached homes from the 1960s to 1980s. Existing alterations, structure and services reviewed before design.",
    "keywords": "landed house renovation petaling jaya, terrace house renovation pj, house renovation ss",
    "schemaType": "Service",
    "entityName": "Landed House Renovation Petaling Jaya"
  },
  {
    "lang": "zh",
    "path": "/locations/petaling-jaya/landed-house-renovation",
    "title": "八打灵再有地住宅装修｜排屋翻新｜FLASH CAST",
    "description": "八打灵再也 1960 至 1980 年代排屋与半独立式的翻新。设计之前先查既有改动、结构与水电状况。",
    "keywords": "八打灵再有地住宅装修, 排屋翻新, 老屋改造 PJ",
    "schemaType": "Service",
    "entityName": "八打灵再有地住宅装修"
  },
  // Five service-area combinations, each with its own English, Chinese and Malay metadata.
  {
    lang: "en",
    path: "/locations/kuala-lumpur/kitchen-renovation",
    title: "Kitchen Renovation Kuala Lumpur | FLASH CAST",
    description: "Kitchen renovation in Kuala Lumpur for condos and landed homes. Custom cabinets, wet and dry kitchen layout, quartz tops, plumbing and electrical coordination. Site visit and itemised quotation.",
    keywords: "kitchen renovation kuala lumpur, kitchen cabinet kl, custom kitchen cabinet malaysia, wet kitchen dry kitchen",
    schemaType: "Service",
    entityName: "Kitchen Renovation Kuala Lumpur",
  },
  {
    lang: "zh",
    path: "/locations/kuala-lumpur/kitchen-renovation",
    title: "吉隆坡厨房装修｜定制橱柜｜FLASH CAST",
    description: "吉隆坡公寓与有地住宅厨房装修。定制橱柜、干湿厨房布局、石英石台面、水电协调，含现场测量与分项报价。",
    keywords: "吉隆坡厨房装修, 厨房橱柜定制, 干湿厨房, 全屋定制",
    schemaType: "Service",
    entityName: "吉隆坡厨房装修",
  },
  {
    lang: "ms",
    path: "/locations/kuala-lumpur/kitchen-renovation",
    title: "Pengubahsuaian Dapur Kuala Lumpur | FLASH CAST",
    description: "Pengubahsuaian dapur di Kuala Lumpur untuk kondominium dan rumah teres. Kabinet custom, susun atur dapur basah dan kering, permukaan kuarza, kerja paip dan elektrik. Lawatan tapak dan sebut harga terperinci.",
    keywords: "pengubahsuaian dapur kuala lumpur, kabinet dapur kl, kabinet dapur custom malaysia",
    schemaType: "Service",
    entityName: "Pengubahsuaian Dapur Kuala Lumpur",
  },
  {
    lang: "en",
    path: "/locations/kuala-lumpur/office-renovation",
    title: "Office Renovation Kuala Lumpur | Fit-Out | FLASH CAST",
    description: "Office renovation and fit-out in Kuala Lumpur for shoplot offices, corporate suites and co-working spaces. Partition, ceiling, electrical, networking, air-conditioning and handover documentation.",
    keywords: "office renovation kl, office fit out kuala lumpur, office interior design kl",
    schemaType: "Service",
    entityName: "Office Renovation Kuala Lumpur",
  },
  {
    lang: "zh",
    path: "/locations/kuala-lumpur/office-renovation",
    title: "吉隆坡办公室装修｜办公室精装｜FLASH CAST",
    description: "吉隆坡店铺办公室、企业办公室与共享空间的装修与精装。隔墙、天花、电气、网络、空调与交付文件。",
    keywords: "吉隆坡办公室装修, 办公室设计装修, 商业空间装修",
    schemaType: "Service",
    entityName: "吉隆坡办公室装修",
  },
  {
    lang: "ms",
    path: "/locations/kuala-lumpur/office-renovation",
    title: "Pengubahsuaian Pejabat KL | Fit-Out | FLASH CAST",
    description: "Pengubahsuaian dan fit-out pejabat di Kuala Lumpur untuk pejabat shoplot, suite korporat dan ruang kerja bersama. Partition, siling, elektrik, rangkaian, penghawa dingin dan dokumentasi serahan.",
    keywords: "pengubahsuaian pejabat kl, fit out pejabat kuala lumpur, pengubahsuaian komersial kl",
    schemaType: "Service",
    entityName: "Pengubahsuaian Pejabat Kuala Lumpur",
  },
  {
    lang: "en",
    path: "/locations/kuala-lumpur/bathroom-renovation",
    title: "Bathroom Renovation Kuala Lumpur | FLASH CAST",
    description: "Bathroom and toilet renovation in Kuala Lumpur. Waterproofing, re-tiling, sanitary ware, shower screen, ventilation and concealed plumbing replacement with ponding test records.",
    keywords: "bathroom renovation kl, toilet renovation kuala lumpur, waterproofing malaysia",
    schemaType: "Service",
    entityName: "Bathroom Renovation Kuala Lumpur",
  },
  {
    lang: "zh",
    path: "/locations/kuala-lumpur/bathroom-renovation",
    title: "吉隆坡浴室装修｜防水与暗管更换｜FLASH CAST",
    description: "吉隆坡浴室与厕所翻新。防水、重铺砖、洁具、淋浴隔断、通风与暗管更换，含闭水测试记录。",
    keywords: "吉隆坡浴室装修, 厕所翻新, 防水工程",
    schemaType: "Service",
    entityName: "吉隆坡浴室装修",
  },
  {
    lang: "ms",
    path: "/locations/kuala-lumpur/bathroom-renovation",
    title: "Pengubahsuaian Bilik Air KL | FLASH CAST",
    description: "Pengubahsuaian bilik air dan tandas di Kuala Lumpur. Kalis air, jubin baharu, saniteri, skrin mandi, pengudaraan dan penggantian paip tersembunyi dengan rekod ujian takungan air.",
    keywords: "pengubahsuaian bilik air kl, pengubahsuaian tandas kuala lumpur, kalis air malaysia",
    schemaType: "Service",
    entityName: "Pengubahsuaian Bilik Air Kuala Lumpur",
  },
  {
    lang: "en",
    path: "/locations/petaling-jaya/condo-renovation",
    title: "Condo Renovation Petaling Jaya | FLASH CAST",
    description: "Condo and apartment renovation in Petaling Jaya. Layout changes, carpentry, flooring, electrical, air-conditioning and JMB or MC management approval coordination for PJ condos.",
    keywords: "condo renovation petaling jaya, apartment renovation pj, renovation contractor petaling jaya",
    schemaType: "Service",
    entityName: "Condo Renovation Petaling Jaya",
  },
  {
    lang: "zh",
    path: "/locations/petaling-jaya/condo-renovation",
    title: "八打灵再也公寓装修｜管理处审批｜FLASH CAST",
    description: "八打灵再也公寓与共管公寓装修。格局改动、木作、地面、电气、空调，以及 JMB 或 MC 管理处审批协调。",
    keywords: "八打灵再也公寓装修, 公寓翻新 pj, 八打灵再也装修公司",
    schemaType: "Service",
    entityName: "八打灵再也公寓装修",
  },
  {
    lang: "ms",
    path: "/locations/petaling-jaya/condo-renovation",
    title: "Pengubahsuaian Kondominium PJ | FLASH CAST",
    description: "Pengubahsuaian kondominium dan apartmen di Petaling Jaya. Ubah susun atur, kerja kayu, lantai, elektrik, penghawa dingin dan penyelarasan kelulusan JMB atau MC.",
    keywords: "pengubahsuaian kondominium pj, pengubahsuaian apartment petaling jaya, kontraktor pengubahsuaian petaling jaya",
    schemaType: "Service",
    entityName: "Pengubahsuaian Kondominium Petaling Jaya",
  },
  {
    lang: "en",
    path: "/locations/selangor/landed-house-renovation",
    title: "Landed House Renovation Selangor | FLASH CAST",
    description: "Landed house renovation across Selangor: terrace, semi-D and bungalow. Extension, layout reconfiguration, full house wiring and plumbing, wet works and local council approval guidance.",
    keywords: "landed house renovation selangor, terrace house renovation selangor, bungalow renovation kl",
    schemaType: "Service",
    entityName: "Landed House Renovation Selangor",
  },
  {
    lang: "zh",
    path: "/locations/selangor/landed-house-renovation",
    title: "雪兰莪有地住宅装修｜排屋与洋房｜FLASH CAST",
    description: "雪兰莪排屋、半独立式与独立洋房装修。扩建、格局重划、全屋水电、泥水工程与地方政府图测审批指引。",
    keywords: "雪兰莪有地住宅装修, 排屋装修 雪兰莪, 洋房装修",
    schemaType: "Service",
    entityName: "雪兰莪有地住宅装修",
  },
  {
    lang: "ms",
    path: "/locations/selangor/landed-house-renovation",
    title: "Pengubahsuaian Rumah Teres Selangor | FLASH CAST",
    description: "Pengubahsuaian rumah teres di Selangor: teres, semi-D dan banglo. Sambungan, ubah susun atur, pendawaian dan paip seluruh rumah, kerja basah dan panduan kelulusan pihak berkuasa tempatan.",
    keywords: "pengubahsuaian rumah teres selangor, pengubahsuaian banglo kl, pengubahsuaian semi-d selangor",
    schemaType: "Service",
    entityName: "Pengubahsuaian Rumah Teres Selangor",
  },
  ...Object.entries(cabinetText).map(([lang, copy]) => page(lang, "/custom-cabinets", copy.metaTitle, copy.metaDescription, "", {
    ogImage: "/images/custom-cabinets/v2/modern-1-kitchen.webp", faqs: copy.faqs, schemaType: "Service", entityName: copy.eyebrow,
  })),
  page("en", "/services/surface-repair", "Home Surface Repair in Kuala Lumpur | Furniture, Tiles & Worktops | FLASH CAST", "Send photos of chipped doors, scratched furniture, damaged cabinetry, tiles or worktops. Discuss local surface repairs in Kuala Lumpur, Selangor and Klang Valley, subject to material and site assessment.", "", {"ogImage": "/images/services/surface-repair/hero.webp"}),
  page("zh", "/services/surface-repair", "吉隆坡家居表面修复｜木门、家具、瓷砖与台面修补 | FLASH CAST", "木门掉漆、家具划痕、柜体崩边与瓷砖台面缺口，可先发送照片咨询局部修复。服务吉隆坡、雪兰莪与巴生谷，按材质、损伤及现场条件确认处理范围。", "", {"ogImage": "/images/services/surface-repair/hero.webp"}),
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
  page("en", "/promotions", "Renovation Promotions Kuala Lumpur | FLASH CAST", "Review current FLASH CAST renovation promotion enquiries and the conditions that apply before quotation confirmation."),
  page("zh", "/promotions", "吉隆坡装修优惠活动 | FLASH CAST", "查看 FLASH CAST 当前装修优惠咨询方向与报价确认前的适用条件。"),
  page("en", "/locations", "Renovation Service Areas KL & Selangor | FLASH CAST", "Explore FLASH CAST renovation service areas across Kuala Lumpur, Selangor, and Klang Valley."),
  page("zh", "/locations", "吉隆坡与雪兰莪装修服务地区 | FLASH CAST", "查看 FLASH CAST 在吉隆坡、雪兰莪与巴生谷的装修服务覆盖地区。"),
  page("en", "/projects", "Renovation Projects Portfolio | Kuala Lumpur | FLASH CAST", "Browse FLASH CAST renovation project references and clearly labelled planning concepts for homes and commercial spaces in Kuala Lumpur and Selangor."),
  page("zh", "/projects", "装修案例 | 吉隆坡 | FLASH CAST", "浏览 FLASH CAST 在吉隆坡与雪兰莪发布的装修项目参考和清楚标注的效果图概念。"),
  page("en", "/before-after", beforeAfterSeo.en.metaTitle, beforeAfterSeo.en.metaDescription),
  page("zh", "/before-after", beforeAfterSeo.zh.metaTitle, beforeAfterSeo.zh.metaDescription),
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
    const areaCopy = serviceAreaCopy[def.path]?.[def.lang];
    const faqs = areaCopy ? areaCopy.faqs ?? [{ question: areaCopy.question, answer: areaCopy.answer }] : def.faqs;
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
        ...(def.path === "/custom-cabinets" ? { ms: `${SITE_URL}/ms/custom-cabinets` } : {}),
        xDefault: `${SITE_URL}${enPath}`,
      },
      ogImage: def.ogImage ? new URL(def.ogImage, SITE_URL).href : OG_IMAGE,
      ...(faqs ? { faqs } : {}),
      ...(def.path.startsWith("/services/") ? { schemaType: "Service" } : {}),
      ...(def.schemaType ? { schemaType: def.schemaType, entityName: def.entityName } : {}),
    };
  }
  return manifest;
}
