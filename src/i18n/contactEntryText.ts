export const contactEntryText = {
  zh: {
    trigger: "联系我们", title: "先聊聊你的空间", close: "关闭联系面板", loading: "正在打开联系选项…", loadError: "打开失败，请重试",
    description: "提供地点、现场照片或平面图，就可以开始沟通。单个柜体和局部升级也可讨论。",
    photoCta: "发照片，先聊需求", photoCtaCompact: "发照片，先聊需求", whatsapp: "通过 WhatsApp 咨询", phone: "电话联系", quote: "获取报价",
    furniture: "查看我们的家具", shopLanguage: "",
    genericService: "装修与定制柜体服务",
    message: (service: string) => `你好 FLASH CAST，我想咨询${service}。项目地点：__。我可以提供现场照片或平面图，想先聊聊需求。`,
  },
  en: {
    trigger: "Contact us", title: "Tell us about your space", close: "Close contact panel", loading: "Opening contact options…", loadError: "Could not open. Try again",
    description: "Start with the location, site photos or a floor plan. A single cabinet or a partial upgrade can also be discussed.",
    photoCta: "Share photos, discuss your plans", photoCtaCompact: "Share photos", whatsapp: "Enquire on WhatsApp", phone: "Call us", quote: "Get a quote",
    furniture: "Explore our furniture", shopLanguage: "",
    genericService: "renovation and custom cabinetry",
    message: (service: string) => `Hi FLASH CAST, I'd like to discuss ${service}. Project location: __. I can share site photos or a floor plan to explain what I need.`,
  },
  ms: {
    trigger: "Hubungi kami", title: "Ceritakan tentang ruang anda", close: "Tutup panel hubungan", loading: "Membuka pilihan hubungan…", loadError: "Gagal dibuka. Cuba lagi",
    description: "Mulakan dengan lokasi, foto tapak atau pelan lantai. Kabinet tunggal atau naik taraf sebahagian ruang juga boleh dibincangkan.",
    photoCta: "Kongsi foto, bincang keperluan", photoCtaCompact: "Kongsi foto", whatsapp: "Bertanya melalui WhatsApp", phone: "Hubungi melalui telefon", quote: "Dapatkan sebut harga",
    furniture: "Lihat perabot kami", shopLanguage: "Kedai dalam bahasa Inggeris",
    genericService: "pengubahsuaian dan kabinet tempahan khas",
    message: (service: string) => `Hai FLASH CAST, saya ingin berbincang tentang ${service}. Lokasi projek: __. Saya boleh berkongsi foto tapak atau pelan lantai untuk menerangkan keperluan saya.`,
  },
} as const;
