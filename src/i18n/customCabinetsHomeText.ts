import type { Language } from "@/i18n/routes";

export const customCabinetsHomeText = {
  zh: {
    eyebrow: "全屋定制 · 空间与收纳", title: "喜欢的款式，整套预算一起看。",
    description: "看厨房、卧室与客厅怎么搭成一套，再比较套餐包含的柜体、尺寸与总价。",
    design: "看款式与套餐", browse: "自由搭配", imageAlt: "奶油色与浅橡木搭配的客厅定制柜",
    priceLabel: "整套套餐价", draftPrice: "建议套餐价 · 待核价", pendingPrice: "售价确认中",
    packages: ["奶油简约 · 厨衣", "自然原木 · 全屋", "暖灰现代 · 全屋", "胡桃中古 · 全屋"],
    packageDescriptions: ["橱柜、衣柜", "橱柜、衣柜、电视柜、鞋柜", "橱柜、衣柜、电视柜、鞋柜", "橱柜、衣柜、电视柜、鞋柜"],
  },
  en: {
    eyebrow: "Whole-home cabinetry · Made for your space", title: "Your look. Your whole-package budget.",
    description: "See your kitchen, bedroom and living room together, then compare included cabinets, dimensions and package totals.",
    design: "Explore designs & packages", browse: "Create my own", imageAlt: "Living room cabinetry with cream fronts and light oak accents",
    priceLabel: "Total package price", draftPrice: "Proposed package price · Costing pending", pendingPrice: "Price to be confirmed",
    packages: ["Cream · Kitchen & wardrobe", "Natural oak · Whole home", "Warm grey · Whole home", "Classic walnut · Whole home"],
    packageDescriptions: ["Kitchen cabinets & wardrobe", "Kitchen, wardrobe, TV unit & shoe cabinet", "Kitchen, wardrobe, TV unit & shoe cabinet", "Kitchen, wardrobe, TV unit & shoe cabinet"],
  },
  ms: {
    eyebrow: "Kabinet seluruh rumah · Mengikut ruang anda", title: "Gaya pilihan. Bajet satu pakej.",
    description: "Lihat padanan dapur, bilik tidur dan ruang tamu, kemudian bandingkan kabinet, ukuran dan jumlah harga pakej.",
    design: "Lihat reka bentuk & pakej", browse: "Buat gabungan sendiri", imageAlt: "Kabinet ruang tamu berwarna krim dengan aksen oak cerah",
    priceLabel: "Jumlah harga pakej", draftPrice: "Cadangan harga pakej · Kos belum disahkan", pendingPrice: "Harga belum disahkan",
    packages: ["Krim · Dapur & almari", "Oak semula jadi · Seluruh rumah", "Kelabu hangat · Seluruh rumah", "Walnut klasik · Seluruh rumah"],
    packageDescriptions: ["Kabinet dapur & almari pakaian", "Dapur, almari, kabinet TV & kasut", "Dapur, almari, kabinet TV & kasut", "Dapur, almari, kabinet TV & kasut"],
  },
} satisfies Record<Language, { eyebrow: string; title: string; description: string; design: string; browse: string; imageAlt: string; priceLabel: string; draftPrice: string; pendingPrice: string; packages: string[]; packageDescriptions: string[] }>;
