import type { Language } from "@/i18n/routes";

type LabelPair = { en: string; zh: string };

const normalizeKey = (value: string) => value.trim().toLowerCase();

const humanize = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const projectTypeLabels: Record<string, LabelPair> = {
  residential: { en: "Residential", zh: "住宅" },
  commercial: { en: "Commercial", zh: "商业" },
  "built-in": { en: "Built-In", zh: "定制内嵌家具" },
  warehouse: { en: "Warehouse", zh: "仓库" },
  exterior: { en: "Exterior", zh: "外墙" },
  office: { en: "Office", zh: "办公室" },
  kitchen: { en: "Kitchen", zh: "厨房" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  retail: { en: "Retail", zh: "零售" },
};

const materialCategoryLabels: Record<string, LabelPair> = {
  "kitchen cabinet": { en: "Kitchen Cabinet", zh: "厨房橱柜" },
  "kitchen cabinets": { en: "Kitchen Cabinets", zh: "厨房橱柜" },
  "whole house custom": { en: "Whole House Custom", zh: "全屋定制" },
  furniture: { en: "Furniture", zh: "家具" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  flooring: { en: "Flooring", zh: "地板" },
  "countertops & stone surfaces": { en: "Countertops & Stone Surfaces", zh: "台面与石材表面" },
  "countertops stone surfaces": { en: "Countertops & Stone Surfaces", zh: "台面与石材表面" },
  "doors & windows": { en: "Doors & Windows", zh: "门窗" },
  "glass & partitions": { en: "Glass & Partitions", zh: "\u73bb\u7483\u4e0e\u9694\u65ad" },
  "glass partitions": { en: "Glass & Partitions", zh: "\u73bb\u7483\u4e0e\u9694\u65ad" },
  "wall & panels": { en: "Wall & Panels", zh: "墙面与饰板" },
  "art paint": { en: "Art Paint", zh: "艺术涂料" },
  materials: { en: "Materials", zh: "材料" },
};

const materialSubcategoryLabels: Record<string, LabelPair> = {
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
  "quartz countertops": { en: "Quartz Countertops", zh: "石英石台面" },
  "sintered stone": { en: "Sintered Stone", zh: "岩板" },
  "solid surface": { en: "Solid Surface", zh: "人造石" },
  "porcelain slab": { en: "Porcelain Slab", zh: "大板瓷砖" },
  "spc vinyl": { en: "SPC Vinyl", zh: "SPC 地板" },
  laminate: { en: "Laminate", zh: "复合板" },
  "engineered wood": { en: "Engineered Wood", zh: "工程木地板" },
  "vinyl plank": { en: "Vinyl Plank", zh: "PVC 地板" },
  "solid timber door": { en: "Solid Timber Door", zh: "实木门" },
  "laminate door": { en: "Laminate Door", zh: "复合门" },
  "barn door": { en: "Barn Door", zh: "谷仓门" },
  "aluminium sliding door": { en: "Aluminium Sliding Door", zh: "铝合金推拉门" },
  "frameless glass door": { en: "Frameless Glass Door", zh: "无框玻璃门" },
  "frameless glass": { en: "Frameless Glass", zh: "\u65e0\u6846\u73bb\u7483" },
  "glass partition": { en: "Glass Partition", zh: "\u73bb\u7483\u9694\u65ad" },
  "shower screen": { en: "Shower Screen", zh: "\u6d74\u5ba4\u73bb\u7483\u9694\u65ad" },
  "glass door": { en: "Glass Door", zh: "\u73bb\u7483\u95e8" },
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

const materialTypeLabels: Record<string, LabelPair> = {
  melamine: { en: "Melamine", zh: "美耐板" },
  acrylic: { en: "Acrylic", zh: "亚克力" },
  "solid wood": { en: "Solid Wood", zh: "实木" },
  porcelain: { en: "Porcelain", zh: "瓷砖" },
  ceramic: { en: "Ceramic", zh: "陶瓷" },
  "spc vinyl": { en: "SPC Vinyl", zh: "SPC 地板" },
  laminate: { en: "Laminate", zh: "复合材质" },
  "engineered wood": { en: "Engineered Wood", zh: "工程木" },
  "vinyl plank": { en: "Vinyl Plank", zh: "PVC 地板" },
  "solid timber": { en: "Solid Timber", zh: "实木" },
  "sliding barn": { en: "Sliding Barn", zh: "谷仓推拉门" },
  sliding: { en: "Sliding", zh: "推拉" },
  swing: { en: "Swing", zh: "平开" },
  quartz: { en: "Quartz", zh: "石英石" },
  "sintered stone": { en: "Sintered Stone", zh: "岩板" },
  "solid surface": { en: "Solid Surface", zh: "人造石" },
  "mdf fluted": { en: "MDF Fluted", zh: "MDF 凹槽板" },
  timber: { en: "Timber", zh: "木材" },
};

const spaceLabels: Record<string, LabelPair> = {
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
  "main entrance": { en: "Main Entrance", zh: "入户处" },
  "store room": { en: "Store Room", zh: "储物间" },
  balcony: { en: "Balcony", zh: "阳台" },
  patio: { en: "Patio", zh: "庭院" },
  shower: { en: "Shower", zh: "淋浴间" },
  "office partition": { en: "Office Partition", zh: "办公室隔间" },
  "shop entrance": { en: "Shop Entrance", zh: "店面入口" },
  "feature wall": { en: "Feature Wall", zh: "背景墙" },
  "tv background": { en: "TV Background", zh: "电视背景墙" },
  staircase: { en: "Staircase", zh: "楼梯" },
  ceiling: { en: "Ceiling", zh: "天花板" },
  entryway: { en: "Entryway", zh: "玄关" },
};

const blogCategoryLabels: Record<string, LabelPair> = {
  guides: { en: "Guides", zh: "指南" },
  materials: { en: "Materials", zh: "材料" },
  inspiration: { en: "Inspiration", zh: "灵感" },
};

const fieldLabels: Record<string, LabelPair> = {
  title: { en: "Title", zh: "标题" },
  excerpt: { en: "Excerpt", zh: "摘要" },
  content: { en: "Content", zh: "内容" },
  seo_title: { en: "SEO Title", zh: "SEO 标题" },
  seo_description: { en: "SEO Description", zh: "SEO 描述" },
  alt: { en: "Alt Text", zh: "图片说明" },
  button_label: { en: "Button Label", zh: "按钮文案" },
  button_url: { en: "Button URL", zh: "按钮链接" },
  slug: { en: "Slug", zh: "链接标识" },
  image_url: { en: "Image URL", zh: "图片地址" },
  cover_image_url: { en: "Cover Image URL", zh: "封面图地址" },
  hero_image_url: { en: "Hero Image URL", zh: "主视觉图片地址" },
  status: { en: "Status", zh: "状态" },
  sort_order: { en: "Sort Order", zh: "排序" },
  step_number: { en: "Step Number", zh: "步骤编号" },
  icon_key: { en: "Icon Key", zh: "图标代号" },
  suitable_for: { en: "Suitable For", zh: "适用场景" },
  common_projects: { en: "Common Projects", zh: "常见项目" },
  scope_items: { en: "Scope Items", zh: "范围项目" },
  faqs: { en: "FAQs", zh: "常见问题" },
  client_need: { en: "Client Need", zh: "客户需求" },
  highlights: { en: "Highlights", zh: "亮点" },
  location: { en: "Location", zh: "地点" },
  area: { en: "Area", zh: "区域" },
  duration: { en: "Duration", zh: "工期" },
  budget: { en: "Budget", zh: "预算" },
  project_type: { en: "Project Type", zh: "项目类型" },
  materials: { en: "Materials", zh: "材料" },
  scope: { en: "Scope", zh: "范围" },
  suitable_spaces: { en: "Suitable Spaces", zh: "适用空间" },
  pros: { en: "Pros", zh: "优点" },
  cons: { en: "Cons", zh: "缺点" },
  recommended_pairing: { en: "Recommended Pairing", zh: "推荐搭配" },
  note: { en: "Note", zh: "备注" },
  category: { en: "Category", zh: "分类" },
  subcategory: { en: "Subcategory", zh: "子分类" },
  material_type: { en: "Material Type", zh: "材料类型" },
  color: { en: "Color", zh: "颜色" },
  texture: { en: "Texture", zh: "纹理" },
  reference_price: { en: "Reference Price", zh: "参考价格" },
  customer_name: { en: "Customer Name", zh: "客户姓名" },
  customer_phone: { en: "Customer Phone", zh: "客户电话" },
  customer_email: { en: "Customer Email", zh: "客户邮箱" },
  phone: { en: "Phone", zh: "电话" },
  email: { en: "Email", zh: "邮箱" },
  name: { en: "Name", zh: "名称" },
  message: { en: "Message", zh: "留言" },
  source: { en: "Source", zh: "来源" },
  source_path: { en: "Source Path", zh: "来源路径" },
  notes: { en: "Notes", zh: "备注" },
  area_name: { en: "Area Name", zh: "地区名称" },
  construction_notes: { en: "Construction Notes", zh: "施工说明" },
  property_types: { en: "Property Types", zh: "房产类型" },
  common_needs: { en: "Common Needs", zh: "常见需求" },
  benefits: { en: "Benefits", zh: "优势" },
  related_projects: { en: "Related Projects", zh: "相关项目" },
  published_at: { en: "Published At", zh: "发布时间" },
  tags: { en: "Tags", zh: "标签" },
  rating: { en: "Rating", zh: "评分" },
  project_id: { en: "Project ID", zh: "项目 ID" },
  table_name: { en: "Table Name", zh: "表名" },
  record_id: { en: "Record ID", zh: "记录 ID" },
  error_message: { en: "Error Message", zh: "错误信息" },
  regenerated_at: { en: "Regenerated At", zh: "重新生成时间" },
  property_size: { en: "Property Size", zh: "面积/户型" },
  estimated_budget: { en: "Estimated Budget", zh: "预算预估" },
  quoted_amount: { en: "Quoted Amount", zh: "报价金额" },
  valid_until: { en: "Valid Until", zh: "有效期" },
  project_details: { en: "Project Details", zh: "项目详情" },
  attachments: { en: "Attachments", zh: "附件" },
};

const statusLabels: Record<string, Record<string, LabelPair>> = {
  default: {
    draft: { en: "Draft", zh: "草稿" },
    published: { en: "Published", zh: "已发布" },
    archived: { en: "Archived", zh: "已归档" },
  },
  leads: {
    new: { en: "New", zh: "新咨询" },
    contacted: { en: "Contacted", zh: "已联系" },
    site_visit_scheduled: { en: "Site Visit Scheduled", zh: "已安排上门" },
    quoted: { en: "Quoted", zh: "已报价" },
    converted: { en: "Converted", zh: "已成交" },
    closed: { en: "Closed", zh: "已关闭" },
    spam: { en: "Spam", zh: "垃圾咨询" },
  },
  quote_requests: {
    pending: { en: "Pending", zh: "待处理" },
    contacted: { en: "Contacted", zh: "已联系" },
    site_visit_scheduled: { en: "Site Visit Scheduled", zh: "已安排上门" },
    quoted: { en: "Quoted", zh: "已报价" },
    accepted: { en: "Accepted", zh: "已接受" },
    rejected: { en: "Rejected", zh: "已拒绝" },
    closed: { en: "Closed", zh: "已关闭" },
  },
  translation_jobs: {
    queued: { en: "Queued", zh: "排队中" },
    processing: { en: "Processing", zh: "处理中" },
    completed: { en: "Completed", zh: "已完成" },
    failed: { en: "Failed", zh: "失败" },
  },
};

const locationLabels: Record<string, LabelPair> = {
  "kuala-lumpur": { en: "Kuala Lumpur", zh: "吉隆坡" },
  selangor: { en: "Selangor", zh: "雪兰莪" },
  "petaling-jaya": { en: "Petaling Jaya", zh: "八打灵再也" },
  cheras: { en: "Cheras", zh: "蕉赖" },
  "mont-kiara": { en: "Mont Kiara", zh: "满家乐" },
  bangsar: { en: "Bangsar", zh: "孟沙" },
  "subang-jaya": { en: "Subang Jaya", zh: "梳邦再也" },
  puchong: { en: "Puchong", zh: "蒲种" },
  "shah-alam": { en: "Shah Alam", zh: "莎阿南" },
  "setia-alam": { en: "Setia Alam", zh: "实达阿南" },
  "bandar-sri-damansara": { en: "Bandar Sri Damansara", zh: "斯里达迈城" },
  damansara: { en: "Damansara", zh: "白沙罗" },
  "jalan-cheras": { en: "Jalan Cheras", zh: "蕉赖路" },
  "kl-sentral": { en: "KL Sentral", zh: "吉隆坡中环" },
};

const keywordLabels: Record<string, LabelPair> = {
  renovation: { en: "Renovation", zh: "装修" },
  kitchen: { en: "Kitchen", zh: "厨房" },
  "kitchen cabinet": { en: "Kitchen Cabinet", zh: "厨房橱柜" },
  "kitchen cabinets": { en: "Kitchen Cabinets", zh: "厨房橱柜" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  office: { en: "Office", zh: "办公室" },
  residential: { en: "Residential", zh: "住宅" },
  commercial: { en: "Commercial", zh: "商业" },
  "built-in": { en: "Built-In", zh: "定制内嵌家具" },
  materials: { en: "Materials", zh: "材料" },
  guides: { en: "Guides", zh: "指南" },
  inspiration: { en: "Inspiration", zh: "灵感" },
  faq: { en: "FAQ", zh: "常见问题" },
  "home office": { en: "Home Office", zh: "家庭办公室" },
  warehouse: { en: "Warehouse", zh: "仓库" },
  "warehouse racking": { en: "Warehouse Racking", zh: "仓库货架" },
  "office renovation": { en: "Office Renovation", zh: "办公室装修" },
  "kitchen renovation": { en: "Kitchen Renovation", zh: "厨房装修" },
  "bathroom renovation": { en: "Bathroom Renovation", zh: "浴室装修" },
  "shoplot renovation": { en: "Shoplot Renovation", zh: "店铺装修" },
  "old house renovation": { en: "Old House Renovation", zh: "旧屋翻新" },
  "condo renovation": { en: "Condo Renovation", zh: "公寓装修" },
  "office fit-out": { en: "Office Fit-Out", zh: "办公室装潢" },
  "shop renovation": { en: "Shop Renovation", zh: "店铺装修" },
};

const readLabel = (map: Record<string, LabelPair>, value: string, language: Language) => {
  const key = normalizeKey(value);
  const hyphenKey = key.replace(/[\s_]+/g, "-");
  const spaceKey = key.replace(/[-_]+/g, " ");
  return map[key]?.[language] || map[hyphenKey]?.[language] || map[spaceKey]?.[language] || value;
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

export const translateLocationLabel = (value: string, language: Language) =>
  readLabel(locationLabels, value, language);

export const translateKeywordLabel = (value: string, language: Language) =>
  readLabel(keywordLabels, value, language);

export const translateStatusLabel = (table: string, value: string, language: Language) => {
  const tableMap = statusLabels[table] || statusLabels.default;
  return tableMap[value]?.[language] || value;
};

export const translateFieldLabel = (field: string, language: Language) => {
  const isZhField = field.endsWith("_zh");
  const isEnField = field.endsWith("_en");
  const baseField = field.replace(/_(zh|en)$/, "");
  const label = fieldLabels[baseField] || { en: humanize(baseField), zh: humanize(baseField) };
  const suffix =
    isZhField ? (language === "zh" ? "（中文）" : " (Chinese)") : isEnField ? (language === "zh" ? "（英文）" : " (English)") : "";
  return `${label[language]}${suffix}`;
};

const displayTextReplacements = Object.entries({
  ...keywordLabels,
  ...locationLabels,
  ...spaceLabels,
  ...materialCategoryLabels,
  ...materialSubcategoryLabels,
  ...materialTypeLabels,
  ...blogCategoryLabels,
  ...projectTypeLabels,
})
  .sort((a, b) => b[0].length - a[0].length)
  .map(([key, value]) => ({ key, value }));

export const translateDisplayText = (value: string, language: Language) => {
  if (language !== "zh" || !value) return value;

  return displayTextReplacements.reduce((text, entry) => {
    const replacement = entry.value.zh;
    return text.replace(new RegExp(entry.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement);
  }, value);
};
