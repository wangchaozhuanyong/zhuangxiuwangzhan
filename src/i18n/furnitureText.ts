import type { Language } from "@/i18n/routes";
import furnitureTaxonomyLabels from "@/i18n/furnitureTaxonomyLabels.json";

const categoryNames = furnitureTaxonomyLabels.categories;
const subcategoryNames: Record<string, { zh: string; en: string }> = furnitureTaxonomyLabels.subcategories;

export const furnitureCategoryName = (key: string, language: Language) =>
  categoryNames[key as keyof typeof categoryNames]?.[language] || key;

export const furnitureSubcategoryName = (key: string, language: Language, fallback: string) =>
  subcategoryNames[key]?.[language] || fallback;

export const furnitureText = {
  zh: {
    title: furnitureTaxonomyLabels.meta.zh.title,
    heroImageAlt: "家具展示中的米色休闲椅",
    intro: "按空间与品类查看家具。选择喜欢的商品，查看规格，并通过 WhatsApp 咨询或前往商城购买。",
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
    floating: "家具展示",
    enquiryMessage: "你好，我想咨询家具：{name}",
  },
  en: {
    title: furnitureTaxonomyLabels.meta.en.title,
    heroImageAlt: "Cream lounge chair from the furniture collection",
    intro: "Explore furniture by room and type. View product details, ask us on WhatsApp, or visit our shop to buy.",
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
    floating: "Furniture",
    enquiryMessage: "Hi, I would like to ask about this furniture item: {name}",
  },
} as const;
