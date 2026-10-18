export const languageOptions = [
  { code: "zh", tag: "zh-CN" },
  { code: "en", tag: "en" },
  { code: "ms", tag: "ms-MY" },
] as const;

export const languageSelectorText = {
  zh: {
    skipToContent: "跳到主要内容",
    title: "选择语言", description: "选择你习惯的语言，继续浏览当前页面。",
    trigger: "切换语言", selected: "当前语言", close: "关闭语言选择",
    names: { zh: "简体中文", en: "英语", ms: "马来语" },
    shortNames: { zh: "中文", en: "EN", ms: "BM" },
    fallback: "部分内容暂以英文显示。",
  },
  en: {
    skipToContent: "Skip to main content",
    title: "Choose your language", description: "Choose a language to continue on this page.",
    trigger: "Change language", selected: "Selected", close: "Close language selection",
    names: { zh: "Simplified Chinese", en: "English", ms: "Malay" },
    shortNames: { zh: "ZH", en: "EN", ms: "BM" },
    fallback: "Some content is currently available in English.",
  },
  ms: {
    skipToContent: "Langkau ke kandungan utama",
    title: "Pilih bahasa", description: "Pilih bahasa untuk terus melayari halaman ini.",
    trigger: "Tukar bahasa", selected: "Dipilih", close: "Tutup pilihan bahasa",
    names: { zh: "Bahasa Cina Ringkas", en: "Bahasa Inggeris", ms: "Bahasa Melayu" },
    shortNames: { zh: "ZH", en: "EN", ms: "BM" },
    fallback: "Sesetengah kandungan dipaparkan dalam Bahasa Inggeris buat sementara waktu.",
  },
} as const;
