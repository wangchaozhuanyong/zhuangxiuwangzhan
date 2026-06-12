import { build } from "esbuild";

let materialDataPromise;

const slugToTitle = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => (part.toUpperCase() === part ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const categoryZhLabels = {
  "kitchen cabinets": "厨房橱柜",
  "whole house custom": "全屋定制",
  furniture: "家具",
  bathroom: "浴室",
  "countertops & stone surfaces": "台面与石材表面",
  flooring: "地板",
  "doors & windows": "门窗",
  "wall & panels": "墙面与饰板",
  "art paint": "艺术涂料",
};

const subcategoryZhLabels = {
  "melamine cabinets": "美耐板橱柜",
  "acrylic cabinets": "亚克力橱柜",
  "solid wood cabinets": "实木橱柜",
  "kitchen cabinets": "厨房橱柜",
  wardrobes: "衣柜",
  "tv cabinets": "电视柜",
  "shoe cabinets": "鞋柜",
  "storage cabinets": "收纳柜",
  "walk-in wardrobe": "步入式衣帽间",
  "study desk": "书桌",
  sofa: "沙发",
  bed: "床",
  "coffee table": "茶几",
  "dining table": "餐桌",
  chairs: "椅子",
  "side table": "边几",
  bathtub: "浴缸",
  basin: "洗手盆",
  toilet: "马桶",
  "shower system": "淋浴系统",
  "bathroom cabinet": "浴室柜",
  "quartz countertops": "石英石台面",
  "sintered stone": "岩板",
  "solid surface": "人造石",
  "porcelain slab": "大板瓷砖",
  "spc vinyl": "SPC 地板",
  laminate: "复合材料",
  "engineered wood": "工程木地板",
  "vinyl plank": "PVC 地板",
  "solid timber door": "实木门",
  "laminate door": "复合门",
  "barn door": "谷仓门",
  "aluminium sliding door": "铝合金推拉门",
  "frameless glass door": "无框玻璃门",
  "fluted panel": "格栅饰板",
  "timber cladding": "木饰面",
  "feature wall tile": "背景墙砖",
  "wall panel": "墙板",
  "venetian plaster": "威尼斯灰泥",
  microcement: "微水泥",
  "metallic paint": "金属漆",
  "texture paint": "纹理漆",
  "lime wash": "石灰洗墙漆",
};

const zhLabel = (map, value) => map[normalizeKey(value)] || value;

const loadMaterialsData = async () => {
  if (!materialDataPromise) {
    materialDataPromise = build({
      entryPoints: ["src/data/materials.ts"],
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      logLevel: "silent",
    }).then(async (result) => {
      const code = result.outputFiles[0]?.text || "";
      const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
      const module = await import(moduleUrl);
      return Array.isArray(module.materialsData) ? module.materialsData : [];
    });
  }
  return materialDataPromise;
};

export const loadMaterialSeoCategories = async () => {
  const categories = await loadMaterialsData();
  return categories.map((category) => {
    const nameEn = category.name || slugToTitle(category.slug);
    const nameZh = zhLabel(categoryZhLabels, nameEn);
    return {
      slug: category.slug,
      title_en: `${nameEn} Materials`,
      title_zh: `${nameZh}材料`,
      description_en:
        category.description ||
        `${nameEn} material options for renovation projects in Kuala Lumpur and Selangor.`,
      description_zh: `${nameZh}材料选项，适合吉隆坡与雪兰莪装修项目参考。`,
      subcategories: (category.subcategories || []).map((subcategory) => {
        const subNameEn = subcategory.name || slugToTitle(subcategory.slug);
        const subNameZh = zhLabel(subcategoryZhLabels, subNameEn);
        return {
          slug: subcategory.slug,
          title_en: `${subNameEn} | ${nameEn}`,
          title_zh: `${subNameZh} | ${nameZh}`,
          description_en:
            subcategory.description ||
            `${subNameEn} options under ${nameEn} materials for renovation projects in Kuala Lumpur.`,
          description_zh: `${subNameZh}属于${nameZh}材料分类，可用于吉隆坡装修项目的材料选择参考。`,
        };
      }),
    };
  });
};

export const loadMaterialSeoPaths = async () => {
  const categories = await loadMaterialSeoCategories();
  return categories.flatMap((category) => [
    `/materials/category/${category.slug}`,
    ...category.subcategories.map((subcategory) => `/materials/category/${category.slug}/${subcategory.slug}`),
  ]);
};
