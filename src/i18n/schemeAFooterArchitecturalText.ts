export interface FooterLinkItem {
  label: string;
  path: string;
}

export interface FooterAreaChip {
  name: string;
  slug: string;
}

export interface FooterArchitecturalLocale {
  col1Office: string;
  col1Map: string;
  col1Hours: string;
  col2Title: string;
  col2Links: FooterLinkItem[];
  col3Title: string;
  col3Links: FooterLinkItem[];
  col3QuoteBtn: string;
  col4Title: string;
  col4Areas: FooterAreaChip[];
}

export const footerArchitecturalContent: Record<string, FooterArchitecturalLocale> = {
  zh: {
    col1Office: "吉隆坡展厅",
    col1Map: "查看地图",
    col1Hours: "每天 10:00–19:00 · 到访前请预约",
    col2Title: "设计与工程",
    col2Links: [
      { label: "全案室内设计", path: "/services/design" },
      { label: "住宅与公寓装修", path: "/services/renovation" },
      { label: "商业与餐饮空间", path: "/services/office-renovation" },
      { label: "旧屋翻新", path: "/services/old-house" },
      { label: "家具定制与修复", path: "/custom-cabinets" },
      { label: "智能电子锁安装", path: "/services/digital-lock" },
      { label: "选材与工艺样本", path: "/materials" },
    ],
    col3Title: "品牌与案例",
    col3Links: [
      { label: "精选项目", path: "/projects" },
      { label: "改造前后对比", path: "/before-after" },
      { label: "家具搭配", path: "/furniture" },
      { label: "施工流程", path: "/process" },
      { label: "常见问题", path: "/faq" },
      { label: "设计专栏", path: "/blog" },
    ],
    col3QuoteBtn: "获取报价",
    col4Title: "服务地区",
    col4Areas: [
      { name: "吉隆坡", slug: "kuala-lumpur" },
      { name: "八打灵再也", slug: "petaling-jaya" },
      { name: "满家乐", slug: "mont-kiara" },
      { name: "孟沙", slug: "bangsar" },
      { name: "蕉赖", slug: "cheras" },
      { name: "梳邦再也", slug: "subang-jaya" },
      { name: "蒲种", slug: "puchong" },
      { name: "雪兰莪全境", slug: "selangor" },
    ],
  },
  en: {
    col1Office: "Kuala Lumpur showroom",
    col1Map: "View map",
    col1Hours: "Daily 10 am–7 pm · Visits by appointment",
    col2Title: "Design & build",
    col2Links: [
      { label: "Interior design", path: "/services/design" },
      { label: "Residential fit-outs", path: "/services/renovation" },
      { label: "Commercial fit-outs", path: "/services/office-renovation" },
      { label: "Old home renovation", path: "/services/old-house" },
      { label: "Cabinets & restoration", path: "/custom-cabinets" },
      { label: "Smart lock installation", path: "/services/digital-lock" },
      { label: "Materials library", path: "/materials" },
    ],
    col3Title: "Studio & projects",
    col3Links: [
      { label: "Featured projects", path: "/projects" },
      { label: "Before & after", path: "/before-after" },
      { label: "Furniture combinations", path: "/furniture" },
      { label: "Process & standards", path: "/process" },
      { label: "Renovation FAQs", path: "/faq" },
      { label: "Design journal", path: "/blog" },
    ],
    col3QuoteBtn: "Get a quote",
    col4Title: "Service areas",
    col4Areas: [
      { name: "Kuala Lumpur", slug: "kuala-lumpur" },
      { name: "Petaling Jaya", slug: "petaling-jaya" },
      { name: "Mont Kiara", slug: "mont-kiara" },
      { name: "Bangsar", slug: "bangsar" },
      { name: "Cheras", slug: "cheras" },
      { name: "Subang Jaya", slug: "subang-jaya" },
      { name: "Puchong", slug: "puchong" },
      { name: "Selangor", slug: "selangor" },
    ],
  },
  ms: {
    col1Office: "Bilik pameran Kuala Lumpur",
    col1Map: "Lihat peta",
    col1Hours: "Setiap hari 10 pagi–7 malam · Lawatan dengan janji temu",
    col2Title: "Reka bentuk & bina",
    col2Links: [
      { label: "Reka bentuk dalaman", path: "/services/design" },
      { label: "Ubah suai kediaman", path: "/services/renovation" },
      { label: "Ruang komersial", path: "/services/office-renovation" },
      { label: "Ubah suai rumah lama", path: "/services/old-house" },
      { label: "Kabinet & pemulihan", path: "/custom-cabinets" },
      { label: "Pemasangan kunci pintar", path: "/services/digital-lock" },
      { label: "Sampel bahan", path: "/materials" },
    ],
    col3Title: "Studio & projek",
    col3Links: [
      { label: "Projek pilihan", path: "/projects" },
      { label: "Sebelum & selepas", path: "/before-after" },
      { label: "Padanan perabot", path: "/furniture" },
      { label: "Proses & piawaian", path: "/process" },
      { label: "Soalan lazim", path: "/faq" },
      { label: "Jurnal reka bentuk", path: "/blog" },
    ],
    col3QuoteBtn: "Dapatkan sebut harga",
    col4Title: "Kawasan perkhidmatan",
    col4Areas: [
      { name: "Kuala Lumpur", slug: "kuala-lumpur" },
      { name: "Petaling Jaya", slug: "petaling-jaya" },
      { name: "Mont Kiara", slug: "mont-kiara" },
      { name: "Bangsar", slug: "bangsar" },
      { name: "Cheras", slug: "cheras" },
      { name: "Subang Jaya", slug: "subang-jaya" },
      { name: "Puchong", slug: "puchong" },
      { name: "Seluruh Selangor", slug: "selangor" },
    ],
  },
};
