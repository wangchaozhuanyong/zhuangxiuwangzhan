import { furnitureShopText } from "@/i18n/furnitureShopText";
import type { Language } from "@/i18n/routes";
import furnitureTaxonomyLabels from "@/i18n/furnitureTaxonomyLabels.json";

const categoryNames = furnitureTaxonomyLabels.categories;
const subcategoryNames: Record<string, { zh: string; en: string; ms: string }> = furnitureTaxonomyLabels.subcategories;

export const furnitureCategoryName = (key: string, language: Language) =>
  categoryNames[key as keyof typeof categoryNames]?.[language] || key;

// Only the approved bedroom landing receives dedicated copy; menus/subcategories stay unchanged.
export const furnitureCategoryPageCopy = (key: string | undefined, language: Language, subcategoryKey?: string) =>
  key === "bedroom" && !subcategoryKey ? furnitureTaxonomyLabels.categoryPages.bedroom[language] : undefined;

export const furnitureSubcategoryName = (key: string, language: Language, fallback: string) =>
  subcategoryNames[key]?.[language] || fallback;

export const furnitureText = {
  zh: {
    ...furnitureShopText.zh,
    title: furnitureTaxonomyLabels.meta.zh.title,
    heroImageAlt: "米色休闲椅与暖色阅读角设计效果图",
    intro: "马来西亚现货为主；部分商品需预订或定制，请逐件确认库存。",
    metaDescription: furnitureTaxonomyLabels.meta.zh.description,
    allProducts: "全部商品",
    products: "件商品",
    viewDetails: "查看详情",
    enquire: "WhatsApp 咨询",
    buyNow: "立即购买",
    priceOnRequest: "价格请咨询",
    description: "商品描述与规格",
    gallery: "商品图片",
    specifications: "商品资料",
    sku: "商品型号",
    noSku: "以详情咨询为准",
    listingDescriptionUnavailable: "来源商品暂未提供描述。",
    descriptionUnavailable: "来源商品未提供描述，请通过 WhatsApp 咨询具体规格。",
    home: "首页",
    backToCatalog: "返回家具展示",
    notFound: "找不到这件商品",
    noProducts: "这个分类目前没有商品。",
    loadingManagedProducts: "正在读取后台发布的家具商品…",
    managedLoadFailed: "后台发布的家具商品暂时无法读取。",
    retry: "重试",
    previous: "上一页",
    next: "下一页",
    page: "第 {page} / {total} 页",
    note: "价格、规格和供货情况请在购买或咨询前确认。",
    shopLabel: "前往 FLASH CAST 商城",
    detailMeta: "查看 {name} 的图片、描述与规格，可通过 WhatsApp 咨询或前往商城。",
    enquiryMessage: "你好，我想咨询家具：{name}",
  },
  en: {
    ...furnitureShopText.en,
    title: furnitureTaxonomyLabels.meta.en.title,
    heroImageAlt: "Design rendering of a cream lounge chair in a warm reading corner",
    intro: "Mostly stocked in Malaysia; some items require pre-order or customization. Confirm availability per item.",
    metaDescription: furnitureTaxonomyLabels.meta.en.description,
    allProducts: "All products",
    products: "products",
    viewDetails: "View details",
    enquire: "Ask on WhatsApp",
    buyNow: "Buy now",
    priceOnRequest: "Ask for price",
    description: "Description & specifications",
    gallery: "Product images",
    specifications: "Product information",
    sku: "SKU",
    noSku: "Please enquire",
    listingDescriptionUnavailable: "No description is available in the source listing.",
    descriptionUnavailable: "The source listing does not include a description. Ask us on WhatsApp for specifications.",
    home: "Home",
    backToCatalog: "Back to furniture",
    notFound: "Product not found",
    noProducts: "There are no products in this category yet.",
    loadingManagedProducts: "Loading published furniture products…",
    managedLoadFailed: "Published furniture products are temporarily unavailable.",
    retry: "Retry",
    previous: "Previous",
    next: "Next",
    page: "Page {page} of {total}",
    note: "Please confirm price, specifications and availability before buying or enquiring.",
    shopLabel: "Visit FLASH CAST Shop",
    detailMeta: "View images, description and specifications for {name}. Ask on WhatsApp or visit our shop.",
    enquiryMessage: "Hi, I would like to ask about this furniture item: {name}",
  },

  ms: {
    ...furnitureShopText.ms,
    title: furnitureTaxonomyLabels.meta.ms.title,
    heroImageAlt: "Reka bentuk rendering kerusi santai krim di sudut bacaan yang hangat",
    intro: "Kebanyakannya disimpan di Malaysia; sesetengah item memerlukan prapesanan atau penyesuaian. Sahkan ketersediaan setiap item.",
    metaDescription: furnitureTaxonomyLabels.meta.ms.description,
    allProducts: "Semua produk",
    products: "produk",
    viewDetails: "Lihat butiran",
    enquire: "Tanya pada WhatsApp",
    buyNow: "Beli sekarang",
    priceOnRequest: "Tanya harga",
    description: "Penerangan & spesifikasi",
    gallery: "Imej produk",
    specifications: "Maklumat produk",
    sku: "SKU",
    noSku: "Sila tanya",
    listingDescriptionUnavailable: "Tiada penerangan tersedia dalam penyenaraian sumber.",
    descriptionUnavailable: "Penyenaraian sumber tidak termasuk penerangan. Tanya kami di WhatsApp untuk spesifikasi.",
    home: "Rumah",
    backToCatalog: "Kembali ke perabot",
    notFound: "Produk tidak ditemui",
    noProducts: "Belum ada produk dalam kategori ini.",
    loadingManagedProducts: "Memuatkan produk perabot yang diterbitkan…",
    managedLoadFailed: "Produk perabot yang diterbitkan tidak tersedia buat sementara waktu.",
    retry: "Cuba semula",
    previous: "Sebelumnya",
    next: "Seterusnya",
    page: "Halaman {page} daripada {total}",
    note: "Sila sahkan harga, spesifikasi dan ketersediaan sebelum membeli atau bertanya.",
    shopLabel: "Lawati Kedai FLASH CAST",
    detailMeta: "Lihat imej, penerangan dan spesifikasi untuk {name}. Tanya pada WhatsApp atau lawati kedai kami.",
    enquiryMessage: "Hai, saya ingin bertanya tentang item perabot ini: {name}",
  },
} as const;

export function formatFurnitureEnquiryMessage(name: string, sku: string, language: Language) {
  const displaySku = language === "en" && /[\u3400-\u9fff]/.test(sku)
    ? sku.match(/^[A-Za-z0-9-]+/)?.[0] || ""
    : sku;
  return furnitureText[language].enquiryMessage.replace("{name}", name)
    + (displaySku && displaySku !== "N/A" ? ` (${displaySku})` : "");
}
