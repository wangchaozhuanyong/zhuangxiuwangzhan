import { adminMaterialListText } from "@/i18n/adminMaterialListText";

export const adminFurnitureListText = {
  ...adminMaterialListText,
  materialHeader: { zh: "家具商品", en: "Furniture product" },
  title: { zh: "家具展示商品", en: "Furniture showcase products" },
  description: {
    zh: "在这里新增、编辑并发布家具商品。已发布商品会显示在前台家具展示页。",
    en: "Add, edit, and publish furniture products for the public furniture showcase.",
  },
  helpText: {
    zh: "这里管理后台新增的家具商品；现有本地目录商品仍在前台展示。",
    en: "Manage furniture products added in the admin. Existing catalog products remain on the public page.",
  },
  newMaterial: { zh: "新增家具商品", en: "New furniture product" },
  emptyTitle: { zh: "还没有后台新增的家具商品", en: "No admin furniture products yet" },
  emptyDescription: {
    zh: "新增并发布商品后，它会出现在前台家具展示页。",
    en: "Create and publish a product to show it in the public furniture showcase.",
  },
  itemLabel: { zh: "件家具商品", en: "furniture products" },
} as const;

export const adminFurnitureEditorText = {
  retry: { zh: "重试", en: "Retry" },
  productName: { zh: "家具商品名称", en: "Furniture product name" },
  newTitle: { zh: "新增家具商品", en: "New furniture product" },
  editTitle: { zh: "编辑家具商品", en: "Edit furniture product" },
  description: {
    zh: "填写双语商品信息、图片、价格和分类，发布后会出现在家具展示页。",
    en: "Add bilingual product details, images, price, and category. Published products appear in the furniture showcase.",
  },
  roomCategory: { zh: "展示分类", en: "Showcase category" },
  itemCategory: { zh: "商品品类", en: "Product type" },
  chooseCategory: { zh: "请选择展示分类", en: "Choose a showcase category" },
  chooseItemCategory: { zh: "请选择商品品类", en: "Choose a product type" },
  requiredBilingual: { zh: "发布前请填写中文和英文商品名称。", en: "Add both Chinese and English product names before publishing." },
  requiredImage: { zh: "发布前请上传封面图片。", en: "Upload a cover image before publishing." },
  requiredCategory: { zh: "发布前请选择有效的展示分类和商品品类。", en: "Choose a valid showcase category and product type before publishing." },
  requiredPrice: { zh: "选择固定价格或价格范围时，请填写最低价格。", en: "Enter a minimum price for priced products." },
  staticSlugConflict: { zh: "此链接标识已被现有家具商品使用，请换一个。", en: "This URL slug is already used by a catalog product. Choose another." },
  wrongRecord: { zh: "这条记录不属于家具展示。", en: "This record is not a furniture showcase product." },
} as const;
