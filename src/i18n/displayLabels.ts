import type { Language } from "@/i18n/routes";

const projectTypeLabels: Record<string, { en: string; zh: string }> = {
  residential: { en: "Residential", zh: "住宅" },
  commercial: { en: "Commercial", zh: "商业" },
  "built-in": { en: "Built-In", zh: "定制家具" },
  warehouse: { en: "Warehouse", zh: "仓储" },
  exterior: { en: "Exterior", zh: "外墙" },
  office: { en: "Office", zh: "办公室" },
  kitchen: { en: "Kitchen", zh: "厨房" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  retail: { en: "Retail", zh: "零售" },
};

const materialCategoryLabels: Record<string, { en: string; zh: string }> = {
  "kitchen cabinet": { en: "Kitchen Cabinet", zh: "厨房橱柜" },
  "kitchen cabinets": { en: "Kitchen Cabinets", zh: "厨房橱柜" },
  "whole house custom": { en: "Whole House Custom", zh: "全屋定制" },
  furniture: { en: "Furniture", zh: "家具" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  flooring: { en: "Flooring", zh: "地板" },
  "doors & windows": { en: "Doors & Windows", zh: "门窗" },
  "wall & panels": { en: "Wall & Panels", zh: "墙面与饰板" },
  "art paint": { en: "Art Paint", zh: "艺术涂料" },
  materials: { en: "Materials", zh: "材料" },
};

const materialSubcategoryLabels: Record<string, { en: string; zh: string }> = {
  "melamine cabinets": { en: "Melamine Cabinets", zh: "美耐板橱柜" },
  "acrylic cabinets": { en: "Acrylic Cabinets", zh: "亚克力橱柜" },
  "solid wood cabinets": { en: "Solid Wood Cabinets", zh: "实木橱柜" },
  wardrobes: { en: "Wardrobes", zh: "衣柜" },
  "tv cabinets": { en: "TV Cabinets", zh: "电视柜" },
  "shoe cabinets": { en: "Shoe Cabinets", zh: "鞋柜" },
  "storage cabinets": { en: "Storage Cabinets", zh: "收纳柜" },
  "walk-in wardrobe": { en: "Walk-in Wardrobe", zh: "步入式衣帽间" },
  "study desk": { en: "Study Desk", zh: "书桌" },
  sofa: { en: "Sofa", zh: "沙发" },
  bed: { en: "Bed", zh: "床" },
  "coffee table": { en: "Coffee Table", zh: "茶几" },
  "dining table": { en: "Dining Table", zh: "餐桌" },
  chairs: { en: "Chairs", zh: "椅子" },
  "side table": { en: "Side Table", zh: "边几" },
  bathtub: { en: "Bathtub", zh: "浴缸" },
  basin: { en: "Basin", zh: "洗手盆" },
  toilet: { en: "Toilet", zh: "马桶" },
  "shower system": { en: "Shower System", zh: "淋浴系统" },
  "bathroom cabinet": { en: "Bathroom Cabinet", zh: "浴室柜" },
  "spc vinyl": { en: "SPC Vinyl", zh: "SPC 地板" },
  laminate: { en: "Laminate", zh: "复合地板" },
  "engineered wood": { en: "Engineered Wood", zh: "工程木地板" },
  "vinyl plank": { en: "Vinyl Plank", zh: "PVC 片材地板" },
  "solid timber door": { en: "Solid Timber Door", zh: "实木门" },
  "laminate door": { en: "Laminate Door", zh: "复合门" },
  "barn door": { en: "Barn Door", zh: "谷仓门" },
  "aluminium sliding door": { en: "Aluminium Sliding Door", zh: "铝合金推拉门" },
  "frameless glass door": { en: "Frameless Glass Door", zh: "无框玻璃门" },
  "fluted panel": { en: "Fluted Panel", zh: "凹槽饰板" },
  "timber cladding": { en: "Timber Cladding", zh: "木饰面" },
  "feature wall tile": { en: "Feature Wall Tile", zh: "背景墙砖" },
  "wall panel": { en: "Wall Panel", zh: "墙板" },
  "venetian plaster": { en: "Venetian Plaster", zh: "威尼斯灰泥" },
  microcement: { en: "Microcement", zh: "微水泥" },
  "metallic paint": { en: "Metallic Paint", zh: "金属漆" },
  "texture paint": { en: "Texture Paint", zh: "纹理漆" },
  "lime wash": { en: "Lime Wash", zh: "石灰漆" },
};

const materialTypeLabels: Record<string, { en: string; zh: string }> = {
  melamine: { en: "Melamine", zh: "美耐板" },
  acrylic: { en: "Acrylic", zh: "亚克力" },
  "solid wood": { en: "Solid Wood", zh: "实木" },
  porcelain: { en: "Porcelain", zh: "瓷砖" },
  ceramic: { en: "Ceramic", zh: "陶瓷" },
  "spc vinyl": { en: "SPC Vinyl", zh: "SPC 地板" },
  laminate: { en: "Laminate", zh: "复合材料" },
  "engineered wood": { en: "Engineered Wood", zh: "工程木" },
  "vinyl plank": { en: "Vinyl Plank", zh: "PVC 地板" },
  "solid timber": { en: "Solid Timber", zh: "实木" },
  "sliding barn": { en: "Sliding Barn", zh: "谷仓滑门" },
  sliding: { en: "Sliding", zh: "推拉" },
  swing: { en: "Swing", zh: "平开" },
  "mdf fluted": { en: "MDF Fluted", zh: "MDF 凹槽板" },
  timber: { en: "Timber", zh: "木材" },
};

const spaceLabels: Record<string, { en: string; zh: string }> = {
  kitchen: { en: "Kitchen", zh: "厨房" },
  "wet kitchen": { en: "Wet Kitchen", zh: "湿厨房" },
  wardrobe: { en: "Wardrobe", zh: "衣柜" },
  "tv console": { en: "TV Console", zh: "电视柜" },
  "display cabinet": { en: "Display Cabinet", zh: "展示柜" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  study: { en: "Study", zh: "书房" },
  "living room": { en: "Living Room", zh: "客厅" },
  bedroom: { en: "Bedroom", zh: "卧室" },
  office: { en: "Office", zh: "办公室" },
  commercial: { en: "Commercial", zh: "商业空间" },
  "dining room": { en: "Dining Room", zh: "餐厅" },
  "master bedroom": { en: "Master Bedroom", zh: "主卧" },
  "main entrance": { en: "Main Entrance", zh: "主入口" },
  "store room": { en: "Store Room", zh: "储物间" },
  balcony: { en: "Balcony", zh: "阳台" },
  patio: { en: "Patio", zh: "庭院" },
  shower: { en: "Shower", zh: "淋浴间" },
  "office partition": { en: "Office Partition", zh: "办公室隔间" },
  "shop entrance": { en: "Shop Entrance", zh: "店面入口" },
  "feature wall": { en: "Feature Wall", zh: "背景墙" },
  "tv background": { en: "TV Background", zh: "电视背景墙" },
  staircase: { en: "Staircase", zh: "楼梯" },
  ceiling: { en: "Ceiling", zh: "天花" },
  entryway: { en: "Entryway", zh: "玄关" },
};

const blogCategoryLabels: Record<string, { en: string; zh: string }> = {
  guides: { en: "Guides", zh: "指南" },
  materials: { en: "Materials", zh: "材料" },
  inspiration: { en: "Inspiration", zh: "灵感" },
};

const keywordLabels: Record<string, { en: string; zh: string }> = {
  renovation: { en: "Renovation", zh: "装修" },
  kitchen: { en: "Kitchen", zh: "厨房" },
  "kitchen cabinet": { en: "Kitchen Cabinet", zh: "厨房橱柜" },
  "kitchen cabinets": { en: "Kitchen Cabinets", zh: "厨房橱柜" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  office: { en: "Office", zh: "办公室" },
  residential: { en: "Residential", zh: "住宅" },
  commercial: { en: "Commercial", zh: "商业" },
  "built-in": { en: "Built-In", zh: "定制家具" },
  materials: { en: "Materials", zh: "材料" },
  guides: { en: "Guides", zh: "指南" },
  inspiration: { en: "Inspiration", zh: "灵感" },
  faq: { en: "FAQ", zh: "常见问题" },
  "home office": { en: "Home Office", zh: "家庭办公室" },
  warehouse: { en: "Warehouse", zh: "仓储" },
  "warehouse racking": { en: "Warehouse Racking", zh: "仓储货架" },
  "office renovation": { en: "Office Renovation", zh: "办公室装修" },
  "kitchen renovation": { en: "Kitchen Renovation", zh: "厨房装修" },
  "bathroom renovation": { en: "Bathroom Renovation", zh: "浴室装修" },
  "shoplot renovation": { en: "Shoplot Renovation", zh: "店铺装修" },
  "old house renovation": { en: "Old House Renovation", zh: "旧屋翻新" },
};

const readLabel = (map: Record<string, { en: string; zh: string }>, value: string, language: Language) => {
  const key = value.trim().toLowerCase();
  return map[key]?.[language] || value;
};

export const translateProjectType = (value: string, language: Language) =>
  readLabel(projectTypeLabels, value, language);

export const translateMaterialCategory = (value: string, language: Language) =>
  readLabel(materialCategoryLabels, value, language);

export const translateMaterialSubcategory = (value: string, language: Language) =>
  readLabel(materialSubcategoryLabels, value, language);

export const translateMaterialType = (value: string, language: Language) =>
  readLabel(materialTypeLabels, value, language);

export const translateSpaceLabel = (value: string, language: Language) =>
  readLabel(spaceLabels, value, language);

export const translateBlogCategory = (value: string, language: Language) =>
  readLabel(blogCategoryLabels, value, language);

export const translateKeywordLabel = (value: string, language: Language) =>
  readLabel(keywordLabels, value, language);

const displayTextReplacements = Object.entries(keywordLabels)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([key, value]) => ({ key, value }));

export const translateDisplayText = (value: string, language: Language) => {
  if (language !== "zh" || !value) return value;

  return displayTextReplacements.reduce((text, entry) => {
    const replacement = entry.value.zh;
    return text.replace(new RegExp(entry.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement);
  }, value);
};
