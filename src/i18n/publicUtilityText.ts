export const googleMapText = {
  en: { loading: "Loading map...", openMaps: "Open in Google Maps", preview: "Office location" },
  zh: { loading: "地图加载中...", openMaps: "在 Google 地图中打开", preview: "办公室地址" },
  ms: { loading: "Memuatkan peta...", openMaps: "Buka dalam Google Maps", preview: "Lokasi pejabat" },
};

export const cmsDynamicPageText = {
  en: { loading: "Loading page...", loadingTitle: "Loading content", loadingDescription: "Please wait while the page content is loaded.", errorTitle: "Page content failed to load", errorDescription: "The content service did not respond correctly. You can retry or return to the main site.", retry: "Retry", quote: "Get a Free Quote", fallbackDescription: "Company information and service details." },
  zh: { loading: "页面加载中...", loadingTitle: "正在加载页面内容", loadingDescription: "请稍等，系统正在读取这页的内容。", errorTitle: "页面内容加载失败", errorDescription: "内容服务暂时没有正确返回结果，可以重试一次，或先返回其它页面。", retry: "重新加载", quote: "获取免费报价", fallbackDescription: "公司介绍和服务内容。" },
  ms: { loading: "Memuatkan halaman...", loadingTitle: "Memuatkan kandungan", loadingDescription: "Sila tunggu sementara kandungan halaman dimuatkan.", errorTitle: "Kandungan halaman gagal dimuatkan", errorDescription: "Perkhidmatan kandungan tidak memberikan respons. Sila cuba lagi atau kembali ke laman utama.", retry: "Cuba lagi", quote: "Dapatkan sebut harga percuma", fallbackDescription: "Maklumat syarikat dan perkhidmatan." },
};

export const projectCategoryLabels = {
  en: { All: "All", Residential: "Residential", Commercial: "Commercial", "Built-In": "Built-In", Warehouse: "Warehouse", Exterior: "Exterior", Office: "Office" },
  zh: { All: "全部", Residential: "住宅装修", Commercial: "商业装修", "Built-In": "定制家具", Warehouse: "仓储工程", Exterior: "外墙工程", Office: "办公室" },
  ms: { All: "Semua", Residential: "Kediaman", Commercial: "Komersial", "Built-In": "Perabot bina dalam", Warehouse: "Gudang", Exterior: "Luaran", Office: "Pejabat" },
} as const;

export const landingProjectTypes = [
  { value: "Residential Renovation", en: "Residential renovation", zh: "住宅装修", ms: "Pengubahsuaian kediaman" },
  { value: "Commercial / Office Fit-Out", en: "Commercial or office", zh: "商业或办公室装修", ms: "Komersial atau pejabat" },
  { value: "Custom Built-In Furniture", en: "Custom furniture", zh: "定制家具", ms: "Perabot tersuai" },
  { value: "Other", en: "Other", zh: "其他", ms: "Lain-lain" },
] as const;
