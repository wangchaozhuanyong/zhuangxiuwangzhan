export const contactEntryText = {
  zh: {
    trigger: "联系我们", title: "先聊聊你的空间", close: "关闭联系面板", loading: "正在打开联系选项…", loadError: "打开失败，请重试",
    description: "可以先简单说说需求，照片、尺寸和项目资料之后再补充。",
    photoCta: "WhatsApp咨询", photoCtaCompact: "WhatsApp咨询", whatsapp: "通过 WhatsApp 咨询", phone: "电话联系", quote: "获取报价",
    furniture: "查看我们的家具", shopLanguage: "",
    genericService: "装修与定制柜体服务",
    message: (service: string) => `你好 FLASH CAST，我想咨询${service}。项目地点：__。我可以提供现场照片或平面图，想先聊聊需求。`,
  },
  en: {
    trigger: "Contact us", title: "Tell us about your space", close: "Close contact panel", loading: "Opening contact options…", loadError: "Could not open. Try again",
    description: "Tell us briefly what you need. Photos, measurements and project details can come later.",
    photoCta: "Chat on WhatsApp", photoCtaCompact: "Chat on WhatsApp", whatsapp: "Enquire on WhatsApp", phone: "Call us", quote: "Get a quote",
    furniture: "Explore our furniture", shopLanguage: "",
    genericService: "renovation and custom cabinetry",
    message: (service: string) => `Hi FLASH CAST, I'd like to discuss ${service}. Project location: __. I can share site photos or a floor plan to explain what I need.`,
  },
  ms: {
    trigger: "Hubungi kami", title: "Ceritakan tentang ruang anda", close: "Tutup panel hubungan", loading: "Membuka pilihan hubungan…", loadError: "Gagal dibuka. Cuba lagi",
    description: "Ceritakan secara ringkas keperluan anda. Foto, ukuran dan butiran projek boleh dikongsi kemudian.",
    photoCta: "Hubungi melalui WhatsApp", photoCtaCompact: "Hubungi melalui WhatsApp", whatsapp: "Bertanya melalui WhatsApp", phone: "Hubungi melalui telefon", quote: "Dapatkan sebut harga",
    furniture: "Lihat perabot kami", shopLanguage: "Kedai dalam bahasa Inggeris",
    genericService: "pengubahsuaian dan kabinet tempahan khas",
    message: (service: string) => `Hai FLASH CAST, saya ingin berbincang tentang ${service}. Lokasi projek: __. Saya boleh berkongsi foto tapak atau pelan lantai untuk menerangkan keperluan saya.`,
  },
} as const;
