import type { Language } from "@/i18n/routes";

export const materialCategoryPageText = {
  en: {
    notFound: "Category Not Found",
    loadingTitle: "Loading material category",
    loadingDescription: "Material category content is loading.",
    viewAll: "View All Materials",
    breadcrumbHome: "Home",
    breadcrumbMaterials: "Materials",
    metaTitle: (name: string, section: string) => `${name} | ${section} | FLASH CAST`,
    metaDescription: (description: string, name: string) => `${description} Browse ${name.toLowerCase()} options for your renovation project in Kuala Lumpur and Selangor.`,
    metaKeywords: (name: string) => `${name} KL, ${name.toLowerCase()} renovation Malaysia`,
    allMaterials: "All Materials",
    browseSubcategories: "Browse Subcategories",
    allProducts: (name: string) => `All ${name} Products`,
    view: "View",
    color: "Color:",
    suitable: "Suitable:",
    interested: (name: string) => `Interested in ${name}?`,
    ctaText: "Contact us to request samples, check availability, or get a quotation for your project.",
    quote: "Request a Quote",
    whatsapp: "WhatsApp Us",
  },
  zh: {
    notFound: "分类不存在",
    loadingTitle: "正在准备材料分类",
    loadingDescription: "材料分类正在载入，马上就好。",
    viewAll: "查看全部材料",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    metaTitle: (name: string, section: string) => `${name} | ${section} | FLASH CAST`,
    metaDescription: (description: string, name: string) => `${description} 浏览 ${name} 材料选项，适用于吉隆坡与雪兰莪装修项目。`,
    metaKeywords: (name: string) => `${name} 吉隆坡, ${name} 装修材料, 马来西亚装修`,
    allMaterials: "全部材料",
    browseSubcategories: "浏览子分类",
    allProducts: (name: string) => `全部 ${name} 产品`,
    view: "查看",
    color: "颜色：",
    suitable: "适合：",
    interested: (name: string) => `对 ${name} 感兴趣？`,
    ctaText: "联系我们索取样板、确认供应情况，或获取项目报价。",
    quote: "索取报价",
    whatsapp: "WhatsApp 联系",
  },

  ms: {
    notFound: "Kategori Tidak Ditemui",
    loadingTitle: "Memuatkan kategori bahan",
    loadingDescription: "Kandungan kategori bahan sedang dimuatkan.",
    viewAll: "Lihat Semua Bahan",
    breadcrumbHome: "Rumah",
    breadcrumbMaterials: "Bahan",
    metaTitle: (name: string, section: string) => `${name} | ${section} | FLASH CAST`,
    metaDescription: (description: string, name: string) => `${description} Semak imbas pilihan ${name.toLowerCase()} untuk projek pengubahsuaian anda di Kuala Lumpur dan Selangor.`,
    metaKeywords: (name: string) => `${name} KL, ${name.toLowerCase()} pengubahsuaian Malaysia`,
    allMaterials: "Semua Bahan",
    browseSubcategories: "Semak imbas Subkategori",
    allProducts: (name: string) => `Semua Produk ${name}`,
    view: "Lihat",
    color: "warna:",
    suitable: "sesuai:",
    interested: (name: string) => `Berminat dengan ${name}?`,
    ctaText: "Hubungi kami untuk meminta sampel, menyemak ketersediaan, atau mendapatkan sebut harga untuk projek anda.",
    quote: "Minta Sebut Harga",
    whatsapp: "WhatsApp Kami",
  },
} as const;

const chineseMaterialCategoryGuidance = new Map<string, { title: string; paragraphs: readonly string[] }>([
  ["kitchen-cabinets", {
    title: "橱柜怎么选才符合做饭习惯",
    paragraphs: [
      "先从水槽、灶具、冰箱和备餐台的位置画出动线。经常下厨的家庭可以把锅具、调味品和餐具分开放在常用位置，再确认转角柜、抽屉及柜门打开后会不会挡到通道。",
      "比较美耐板、亚克力或实木饰面时，把门板、柜体和台面分开看。请分别核对板材、封边和铰链滑轨，并拿样板到厨房的自然光和灯光下看颜色。水槽下方还要留出管道检修空间。",
      "请准备墙宽、层高和电器型号。核对报价时，把上柜、下柜、台面、五金、拆除及安装是否包含逐项写清，方便比较同范围的报价。",
    ],
  }],
  ["whole-house-custom", {
    title: "全屋定制先定收纳分区",
    paragraphs: [
      "按使用位置列出要收纳的物件。玄关鞋柜要留出换鞋和开门的空间，卧室衣柜先分出需要挂放和叠放的衣物，电视柜则要留意插座、线缆和设备的通风位置。",
      "量尺时记录梁柱、墙角、踢脚线与插座。定顶柜或转角柜前核对柜门、抽屉和房门能否同时打开。儿童常取用的物件适合放在触手可及的位置，季节用品可安排在较高处。",
      "看柜体和门板样板时，顺便核对同一空间里的地板、墙面和灯光。要求图纸与报价分列各柜的外尺寸、内部分隔、门型、五金及收口，现场复尺后再确认制作尺寸。",
    ],
  }],
  ["furniture", {
    title: "家具到货前先量使用和搬运空间",
    paragraphs: [
      "选沙发、床或餐桌前，把家具外尺寸画到平面图上。沙发要留出过道和转角模块的空间，餐桌要算入拉开椅子的距离，有储物抽屉的床架也要量床侧的净空。",
      "入户门、电梯门和走廊转角应分别测量。向商家确认最大包装件的长、宽、高，家具是否分件搬运、是否需要现场组装。选择床架时另外核对适配床垫尺寸。",
      "如果同一型号有多种布料、门板颜色或左右方向，按实物样板和所选款式确认。配送、上楼与组装安排可在下单前一起写进订单。",
    ],
  }],
  ["bathroom", {
    title: "浴室材料按干区和湿区选",
    paragraphs: [
      "先画出淋浴、洗手盆和马桶的位置，标出排水点和门的开启方向。选择湿区地砖时核对供应商标明的防滑用途，也要看现有地面能否配合找坡和地漏位置。",
      "浴室柜和洗手盆要与给排水位置配合。台上盆、台下盆或壁挂款会影响台面高度和预留尺寸。选淋浴隔断时，在量尺图上核对门扇打开的空间、取用毛巾的位置和清洁角落。",
      "请备好现有浴室的照片、墙地尺寸与管道位置。新旧材料交接处的防水、填缝和收口应随施工方案确认，选材时可一并核对拆除、安装和配件的范围。",
    ],
  }],
  ["countertops-stone-surfaces", {
    title: "台面要按用途核对板材和加工",
    paragraphs: [
      "厨房台面、中岛、浴室柜和商业柜台的使用方式各不相同。先标出水槽、灶具和用电位置，再比较石英石、岩板、人造实体面材和瓷质大板的颜色、纹理与维护要求。",
      "看样板时请同时核对大板纹路、厚度、边型和接缝。中岛或有悬空的台面要确认下方支撑，水槽和灶具开孔则应以实际设备尺寸为准。台面与防溅挡板的交界也要预留收口。",
      "报价前提供平面尺寸、开孔数量和边型要求，问清是否包含量尺、运输与安装。耐热、清洁和修补条件应按所选产品的说明核对，样板相近的板材也可能有不同要求。",
    ],
  }],
  ["flooring", {
    title: "用房间条件缩小地板选择",
    paragraphs: [
      "先分清卧室、客厅、走廊等空间的日常用法。常有水渍或需要频繁清洁的地方，要核对石塑、强化复合、实木复合或乙烯基地板的适用场景与维护说明。",
      "量房时记录原地面平整度、门底空隙和各房间的高差。和原瓷砖、楼梯口或阳台交接的位置要先确定收边方式。若打算在原地面上铺设，应让施工方确认地面状态与选用产品的安装要求。",
      "比较样板时把同一款放在窗边和夜间灯光下查看纹路及颜色。报价时问清面积怎样量，损耗、地面找平、拆除、踢脚线和门口过渡件是否分别列项。",
    ],
  }],
  ["doors-windows", {
    title: "门窗选型先核对洞口和开向",
    paragraphs: [
      "实木门、复合饰面门、吊轨门、铝框推拉门与无框玻璃门适用的位置不同。选型前先标出门洞宽高、墙厚和开启方向，再看门扇和把手会不会碰到墙角、家具或相邻门扇。",
      "推拉门要留出轨道和滑动空间，玻璃隔断要兼顾采光、私密与清洁。外侧门窗或浴室用门另向供应商说明雨水、日晒及通风情况，按安装位置核对型材、玻璃和配件。",
      "如要保留旧门框或更换锁具，把原门的照片、门厚和五金孔位一并提供。选样及报价时确认门扇、门框、玻璃、锁具、拆除和安装各自是否包含。",
    ],
  }],
  ["wall-panels", {
    title: "墙板和饰板要一起确认收口",
    paragraphs: [
      "电视墙、玄关和走廊的观看距离与光线不同。凹凸格栅可以突出线条，木饰面比较适合连贯的墙面搭配。先用实物样板比较墙板颜色是否和地板、柜门及照明协调。",
      "现场量尺时标注插座、开关、灯带、挂架和检修位置。拼缝、阴阳角、踢脚线及和柜体相接的边缘要在下单前画清楚。有潮痕或基层松动的墙面，应先查明原因并确认施工条件。",
      "按饰面类型核对板材厚度、安装方式和建议清洁方法。如果用途涉及吸声或防火，把所需等级与检测资料单独列在材料要求里。",
    ],
  }],
  ["art-paint", {
    title: "肌理涂料先看小样和实际灯光",
    paragraphs: [
      "威尼斯灰泥、微水泥、金属漆、纹理漆与石灰洗墙漆的表面和光泽不同。先确定要做整面墙还是局部重点区域，再选择希望的细腻度和颜色层次。",
      "拿小样到使用房间对比白天和夜晚的灯光。侧光会让纹理、批刮方向与接缝更明显，较小的色卡也难以反映一整面墙的效果。需要比对时可先做样板墙再确认施工方向。",
      "问清基层处理、底涂和面层各自是否包括，旧墙有裂缝、油污或潮痕时要先查明原因。容易碰触、沾水或频繁擦洗的位置，按具体产品说明确认面层保护和清洁方式。",
    ],
  }],
]);

export function getMaterialCategoryGuidance(categorySlug: string, language: Language) {
  return language === "zh" ? chineseMaterialCategoryGuidance.get(categorySlug) : undefined;
}
