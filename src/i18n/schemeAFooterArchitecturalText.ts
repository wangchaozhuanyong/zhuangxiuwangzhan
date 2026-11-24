export interface FooterLinkItem {
  label: string;
  path: string;
}

export interface FooterAreaChip {
  name: string;
  slug: string;
}

export interface FooterArchitecturalLocale {
  kicker: string;
  subBrand: string;
  col1Title: string;
  col1Office: string;
  col1Map: string;
  col1PhoneSub: string;
  col1Hours: string;
  col1HoursNote: string;
  col2Title: string;
  col2Links: FooterLinkItem[];
  col3Title: string;
  col3Links: FooterLinkItem[];
  col3QuoteBtn: string;
  col4Title: string;
  col4Intro: string;
  col4Areas: FooterAreaChip[];
  col4Footnote: string;
}

export const footerArchitecturalContent: Record<string, FooterArchitecturalLocale> = {
  zh: {
    kicker: "INTERIOR DESIGN & RENOVATION STUDIO",
    subBrand: "闪铸装饰 FLASH CAST · 吉隆坡与雪兰莪全案高端精装",
    col1Title: "联系工作室 / STUDIO",
    col1Office: "吉隆坡展厅与办公室",
    col1Map: "在 Google 地图查看",
    col1PhoneSub: "支持电话与 WhatsApp 直联",
    col1Hours: "营业时间：每天 10:00 – 19:00",
    col1HoursNote: "为保障接待与方案品质，到访前请提前联络预约。",
    col2Title: "设计与工程 / SCOPE",
    col2Links: [
      { label: "全案室内设计 (Interior Design)", path: "/services/design" },
      { label: "住宅与公寓装修 (Residential Fit-out)", path: "/services/renovation" },
      { label: "商业与餐饮空间 (Commercial Fit-out)", path: "/services/office-renovation" },
      { label: "旧屋全面翻新 (House Refurbishment)", path: "/services/old-house" },
      { label: "家具定制与家装修复 (Cabinet & Restoration)", path: "/custom-cabinets" },
      { label: "智能电子锁安装 (Smart Digital Locks)", path: "/services/digital-lock" },
      { label: "选材库与工艺样本 (Materials Library)", path: "/materials" },
    ],
    col3Title: "品牌与案例 / EXPLORE",
    col3Links: [
      { label: "精选项目案例 (Projects)", path: "/projects" },
      { label: "空间改造前后对比 (Before & After)", path: "/before-after" },
      { label: "家具自由搭配 (Mix & Match)", path: "/furniture" },
      { label: "透明施工流程 (Process & Standards)", path: "/process" },
      { label: "常见装修问答 (FAQ)", path: "/faq" },
      { label: "设计博客专栏 (Design Journal)", path: "/blog" },
    ],
    col3QuoteBtn: "获取专属报价 →",
    col4Title: "服务地区 / COVERAGE",
    col4Intro: "立足吉隆坡，全面覆盖巴生谷及雪兰莪重点社区：",
    col4Areas: [
      { name: "吉隆坡 KL", slug: "kuala-lumpur" },
      { name: "八打灵再也 PJ", slug: "petaling-jaya" },
      { name: "满家乐 Mont Kiara", slug: "mont-kiara" },
      { name: "孟沙 Bangsar", slug: "bangsar" },
      { name: "蕉赖 Cheras", slug: "cheras" },
      { name: "梳邦再也 Subang", slug: "subang-jaya" },
      { name: "蒲种 Puchong", slug: "puchong" },
      { name: "雪兰莪全境", slug: "selangor" },
    ],
    col4Footnote: "亦承接其他跨区域特定别墅及商业全案项目。",
  },
  en: {
    kicker: "INTERIOR DESIGN & RENOVATION STUDIO",
    subBrand: "FLASH CAST SDN. BHD. · Premium Interior Design & Build in KL & Selangor",
    col1Title: "CONTACT STUDIO / STUDIO",
    col1Office: "KL Showroom & Studio Office",
    col1Map: "View on Google Maps",
    col1PhoneSub: "Phone & WhatsApp Support",
    col1Hours: "Daily 10:00 AM – 7:00 PM (MYT)",
    col1HoursNote: "Visits and consultations by prior arrangement.",
    col2Title: "DESIGN & BUILD / SCOPE",
    col2Links: [
      { label: "Interior Design Services", path: "/services/design" },
      { label: "Residential & Condo Fit-out", path: "/services/renovation" },
      { label: "Commercial & Retail Spaces", path: "/services/office-renovation" },
      { label: "Old House Refurbishment", path: "/services/old-house" },
      { label: "Custom Cabinets & Restoration", path: "/custom-cabinets" },
      { label: "Smart Digital Lock Installation", path: "/services/digital-lock" },
      { label: "Materials Library & Samples", path: "/materials" },
    ],
    col3Title: "STUDIO & WORKS / EXPLORE",
    col3Links: [
      { label: "Featured Projects", path: "/projects" },
      { label: "Before & After Transformations", path: "/before-after" },
      { label: "Mix & Match Furniture", path: "/furniture" },
      { label: "Transparent Process & Standards", path: "/process" },
      { label: "Renovation FAQs", path: "/faq" },
      { label: "Design Journal & Editorial", path: "/blog" },
    ],
    col3QuoteBtn: "Get Tailored Quote →",
    col4Title: "SERVICE AREAS / COVERAGE",
    col4Intro: "Based in Kuala Lumpur, covering the Klang Valley and key Selangor hubs:",
    col4Areas: [
      { name: "Kuala Lumpur KL", slug: "kuala-lumpur" },
      { name: "Petaling Jaya PJ", slug: "petaling-jaya" },
      { name: "Mont Kiara", slug: "mont-kiara" },
      { name: "Bangsar", slug: "bangsar" },
      { name: "Cheras", slug: "cheras" },
      { name: "Subang Jaya", slug: "subang-jaya" },
      { name: "Puchong", slug: "puchong" },
      { name: "Selangor Region", slug: "selangor" },
    ],
    col4Footnote: "We also accept select bespoke residential and commercial projects across other regions.",
  },
  ms: {
    kicker: "STUDIO REKA BENTUK & UBAHSUAI DALAMAN",
    subBrand: "FLASH CAST SDN. BHD. · Rekaan & Pembinaan Dalaman Premium di KL & Selangor",
    col1Title: "HUBUNGI STUDIO / STUDIO",
    col1Office: "Bilik Pameran & Pejabat KL",
    col1Map: "Lihat di Google Maps",
    col1PhoneSub: "Sokongan Telefon & WhatsApp",
    col1Hours: "Waktu Operasi: Setiap Hari 10:00 – 19:00",
    col1HoursNote: "Lawatan dan perundingan dengan temu janji awal.",
    col2Title: "REKA & BINA / SCOPE",
    col2Links: [
      { label: "Reka Bentuk Dalaman Penuh", path: "/services/design" },
      { label: "Ubahsuai Kediaman & Kondominium", path: "/services/renovation" },
      { label: "Ruang Komersial & Restoran", path: "/services/office-renovation" },
      { label: "Pembaikan Menyeluruh Rumah Lama", path: "/services/old-house" },
      { label: "Kabinet Tersuai & Pemulihan", path: "/custom-cabinets" },
      { label: "Pemasangan Kunci Digital Pintar", path: "/services/digital-lock" },
      { label: "Perpustakaan Bahan & Sampel", path: "/materials" },
    ],
    col3Title: "STUDIO & PROJEK / EXPLORE",
    col3Links: [
      { label: "Projek Pilihan Kami", path: "/projects" },
      { label: "Transformasi Sebelum & Selepas", path: "/before-after" },
      { label: "Katalog Suai Padan Perabot", path: "/furniture" },
      { label: "Proses & Piawaian Telus", path: "/process" },
      { label: "Soalan Lazim Ubahsuai", path: "/faq" },
      { label: "Jurnal & Catatan Reka Bentuk", path: "/blog" },
    ],
    col3QuoteBtn: "Dapatkan Sebut Harga →",
    col4Title: "KAWASAN LIPUTAN / COVERAGE",
    col4Intro: "Berpangkalan di Kuala Lumpur, merangkumi Lembah Klang dan Selangor:",
    col4Areas: [
      { name: "Kuala Lumpur KL", slug: "kuala-lumpur" },
      { name: "Petaling Jaya PJ", slug: "petaling-jaya" },
      { name: "Mont Kiara", slug: "mont-kiara" },
      { name: "Bangsar", slug: "bangsar" },
      { name: "Cheras", slug: "cheras" },
      { name: "Subang Jaya", slug: "subang-jaya" },
      { name: "Puchong", slug: "puchong" },
      { name: "Seluruh Selangor", slug: "selangor" },
    ],
    col4Footnote: "Kami juga menerima projek vila dan komersial terpilih di wilayah lain.",
  },
};
