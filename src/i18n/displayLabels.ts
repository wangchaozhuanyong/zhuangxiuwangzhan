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
  builtin: { en: "Built-In", zh: "定制内嵌家具" },
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
  "whole-house-custom": { en: "Whole House Custom", zh: "全屋定制" },
  furniture: { en: "Furniture", zh: "家具" },
  bathroom: { en: "Bathroom", zh: "浴室" },
  flooring: { en: "Flooring", zh: "地板" },
  "countertops & stone surfaces": { en: "Countertops & Stone Surfaces", zh: "台面与石材表面" },
  "countertops stone surfaces": { en: "Countertops & Stone Surfaces", zh: "台面与石材表面" },
  "doors & windows": { en: "Doors & Windows", zh: "门窗" },
  "glass & partitions": { en: "Glass & Partitions", zh: "玻璃与隔断" },
  "glass partitions": { en: "Glass & Partitions", zh: "玻璃与隔断" },
  "wall & panels": { en: "Wall & Panels", zh: "墙面与饰板" },
  "wall panels": { en: "Wall Panels", zh: "墙面饰板" },
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
  laminate: { en: "Laminate", zh: "复合材料" },
  "engineered wood": { en: "Engineered Wood", zh: "工程木地板" },
  "vinyl plank": { en: "Vinyl Plank", zh: "PVC 地板" },
  "solid timber door": { en: "Solid Timber Door", zh: "实木门" },
  "laminate door": { en: "Laminate Door", zh: "复合门" },
  "barn door": { en: "Barn Door", zh: "谷仓门" },
  "aluminium sliding door": { en: "Aluminium Sliding Door", zh: "铝合金推拉门" },
  "frameless glass door": { en: "Frameless Glass Door", zh: "无框玻璃门" },
  "frameless glass": { en: "Frameless Glass", zh: "无框玻璃" },
  "glass partition": { en: "Glass Partition", zh: "玻璃隔断" },
  "shower screen": { en: "Shower Screen", zh: "浴室玻璃隔断" },
  "glass door": { en: "Glass Door", zh: "玻璃门" },
  "fluted panel": { en: "Fluted Panel", zh: "格栅饰板" },
  "timber cladding": { en: "Timber Cladding", zh: "木饰面" },
  "feature wall tile": { en: "Feature Wall Tile", zh: "背景墙砖" },
  "wall panel": { en: "Wall Panel", zh: "墙板" },
  "venetian plaster": { en: "Venetian Plaster", zh: "威尼斯灰泥" },
  microcement: { en: "Microcement", zh: "微水泥" },
  "metallic paint": { en: "Metallic Paint", zh: "金属漆" },
  "texture paint": { en: "Texture Paint", zh: "纹理漆" },
  "lime wash": { en: "Lime Wash", zh: "石灰洗墙漆" },
};

const materialTypeLabels: Record<string, LabelPair> = {
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
  "sliding barn": { en: "Sliding Barn", zh: "谷仓推拉门" },
  sliding: { en: "Sliding", zh: "推拉" },
  swing: { en: "Swing", zh: "平开" },
  quartz: { en: "Quartz", zh: "石英石" },
  "sintered stone": { en: "Sintered Stone", zh: "岩板" },
  "solid surface": { en: "Solid Surface", zh: "人造石" },
  "mdf fluted": { en: "MDF Fluted", zh: "MDF 格栅板" },
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
  "main entrance": { en: "Main Entrance", zh: "入户门厅" },
  "store room": { en: "Store Room", zh: "储物间" },
  balcony: { en: "Balcony", zh: "阳台" },
  patio: { en: "Patio", zh: "庭院" },
  shower: { en: "Shower", zh: "淋浴间" },
  "office partition": { en: "Office Partition", zh: "办公室隔断" },
  "shop entrance": { en: "Shop Entrance", zh: "店面入口" },
  "feature wall": { en: "Feature Wall", zh: "背景墙" },
  "tv background": { en: "TV Background", zh: "电视背景墙" },
  staircase: { en: "Staircase", zh: "楼梯" },
  ceiling: { en: "Ceiling", zh: "天花" },
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
  estimated_budget: { en: "Estimated Budget", zh: "预算估计" },
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
  "bandar-sri-damansara": { en: "Bandar Sri Damansara", zh: "斯里白沙罗" },
  damansara: { en: "Damansara", zh: "白沙罗" },
  "jalan-cheras": { en: "Jalan Cheras", zh: "蕉赖路" },
  "kl-sentral": { en: "KL Sentral", zh: "吉隆坡中环" },
};

const keywordLabels: Record<string, LabelPair> = {
  renovation: { en: "Renovation", zh: "装修" },
  "full renovation": { en: "Full Renovation", zh: "全屋装修" },
  "complete renovation": { en: "Complete Renovation", zh: "完整装修" },
  "modern condo full renovation": { en: "Modern Condo Full Renovation", zh: "现代公寓全屋装修" },
  kitchen: { en: "Kitchen", zh: "厨房" },
  "kitchen cabinet": { en: "Kitchen Cabinet", zh: "厨房橱柜" },
  "kitchen cabinets": { en: "Kitchen Cabinets", zh: "厨房橱柜" },
  kitchens: { en: "Kitchens", zh: "厨房" },
  "custom cabinets": { en: "Custom Cabinets", zh: "定制柜" },
  cabinetry: { en: "Cabinetry", zh: "柜体" },
  "custom wardrobes": { en: "Custom Wardrobes", zh: "定制衣柜" },
  "tv feature wall": { en: "TV Feature Wall", zh: "电视背景墙" },
  "feature wall": { en: "Feature Wall", zh: "背景墙" },
  "spc vinyl flooring": { en: "SPC Vinyl Flooring", zh: "SPC 地板" },
  "ceiling & lighting": { en: "Ceiling & Lighting", zh: "天花与灯光" },
  "electrical rewiring": { en: "Electrical Rewiring", zh: "电线重拉" },
  painting: { en: "Painting", zh: "油漆" },
  modern: { en: "Modern", zh: "现代" },
  furniture: { en: "Furniture", zh: "家具" },
  "bathroom fittings": { en: "Bathroom Fittings", zh: "浴室配件" },
  doors: { en: "Doors", zh: "门" },
  windows: { en: "Windows", zh: "窗" },
  "wall panels": { en: "Wall Panels", zh: "墙板" },
  weeks: { en: "Weeks", zh: "周" },
  week: { en: "Week", zh: "周" },
  months: { en: "Months", zh: "个月" },
  month: { en: "Month", zh: "个月" },
  "kuala lumpur": { en: "Kuala Lumpur", zh: "吉隆坡" },
  "mont kiara": { en: "Mont Kiara", zh: "满家乐" },
  "klang valley": { en: "Klang Valley", zh: "巴生谷" },
  "kl & selangor": { en: "KL & Selangor", zh: "吉隆坡与雪兰莪" },
  "kl sentral": { en: "KL Sentral", zh: "吉隆坡中环" },
  "damansara heights": { en: "Damansara Heights", zh: "白沙罗高地" },
  "taman tun dr ismail": { en: "Taman Tun Dr Ismail", zh: "敦依斯迈花园" },
  heights: { en: "Heights", zh: "高地" },
  selangor: { en: "Selangor", zh: "雪兰莪" },
  "petaling jaya": { en: "Petaling Jaya", zh: "八打灵再也" },
  cheras: { en: "Cheras", zh: "蕉赖" },
  bangsar: { en: "Bangsar", zh: "孟沙" },
  puchong: { en: "Puchong", zh: "蒲种" },
  "shah alam": { en: "Shah Alam", zh: "莎阿南" },
  "subang jaya": { en: "Subang Jaya", zh: "梳邦再也" },
  "setia alam": { en: "Setia Alam", zh: "实达阿南" },
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
  "custom kitchen cabinets in kuala lumpur": { en: "Custom Kitchen Cabinets in Kuala Lumpur", zh: "吉隆坡定制厨房橱柜" },
  "made-to-measure kitchen cabinets - design, build & install": { en: "Made-to-Measure Kitchen Cabinets - Design, Build & Install", zh: "量身定制厨房橱柜 - 设计、制作与安装" },
  "modern kitchen in bangsar condo": { en: "Modern Kitchen in Bangsar Condo", zh: "孟沙公寓现代厨房" },
  "open kitchen renovation": { en: "Open Kitchen Renovation", zh: "开放式厨房装修" },
  "office renovation in kuala lumpur": { en: "Office Renovation in Kuala Lumpur", zh: "吉隆坡办公室装修" },
  "shop renovation in kuala lumpur": { en: "Shop Renovation in Kuala Lumpur", zh: "吉隆坡店铺装修" },
  "flooring solutions in kuala lumpur": { en: "Flooring Solutions in Kuala Lumpur", zh: "吉隆坡地板解决方案" },
  "warehouse shelving & racking in malaysia": { en: "Warehouse Shelving & Racking in Malaysia", zh: "马来西亚仓库货架与仓储系统" },
  "how to plan your condo renovation in kl": { en: "How to Plan Your Condo Renovation in KL", zh: "吉隆坡公寓装修规划指南" },
  "how to plan your condo renovation in kuala lumpur": { en: "How to Plan Your Condo Renovation in Kuala Lumpur", zh: "如何规划吉隆坡公寓装修？" },
  "a step-by-step guide to planning a condo renovation in kl — from setting a budget and getting permits to choosing materials and hiring a contractor.": {
    en: "A step-by-step guide to planning a condo renovation in KL — from setting a budget and getting permits to choosing materials and hiring a contractor.",
    zh: "这是一份吉隆坡公寓装修规划指南，涵盖预算、管理处批准、材料选择和装修承包商筛选。",
  },
  "shoplot renovation": { en: "Shoplot Renovation", zh: "店铺装修" },
  "old house renovation": { en: "Old House Renovation", zh: "旧屋翻新" },
  "condo renovation": { en: "Condo Renovation", zh: "公寓装修" },
  "office fit-out": { en: "Office Fit-Out", zh: "办公室装潢" },
  "shop renovation": { en: "Shop Renovation", zh: "店铺装修" },
  contractor: { en: "Contractor", zh: "装修承包商" },
  hiring: { en: "Hiring", zh: "筛选" },
  tips: { en: "Tips", zh: "技巧" },
  rental: { en: "Rental", zh: "出租" },
  malaysia: { en: "Malaysia", zh: "马来西亚" },
  "malaysia renovation": { en: "Malaysia Renovation", zh: "马来西亚装修" },
  waterproofing: { en: "Waterproofing", zh: "防水工程" },
  "retail shop": { en: "Retail Shop", zh: "零售店铺" },
  "shop lot": { en: "Shop Lot", zh: "店铺" },
  "open kitchen": { en: "Open Kitchen", zh: "开放式厨房" },
  "open kitchen concept": { en: "Open Kitchen Concept", zh: "开放式厨房设计" },
  "open-concept kitchen": { en: "Open-concept Kitchen", zh: "开放式厨房" },
  "open-concept": { en: "Open-concept", zh: "开放式" },
  "complete renovation of a 1,500 sqft condo including custom built-in wardrobes, kitchen cabinets, feature wall, new flooring, and full electrical rewiring. the client wanted a modern minimalist design with warm wood tones.": {
    en: "Complete renovation of a 1,500 sqft condo including custom built-in wardrobes, kitchen cabinets, feature wall, new flooring, and full electrical rewiring. The client wanted a modern minimalist design with warm wood tones.",
    zh: "这个约 1,500 平方英尺的公寓完整装修项目，包含定制衣柜、厨房橱柜、电视背景墙、新地板和全屋电线重拉。客户希望打造带有温暖木色的现代极简空间。",
  },
  "the homeowner wanted to transform a dated unit into a modern living space with maximum storage and clean lines.": {
    en: "The homeowner wanted to transform a dated unit into a modern living space with maximum storage and clean lines.",
    zh: "屋主希望把旧公寓改造成收纳充足、线条干净的现代居住空间。",
  },
  "open-concept kitchen with island counter": { en: "Open-concept kitchen with island counter", zh: "开放式厨房搭配岛台" },
  "1,500 sqft": { en: "1,500 sqft", zh: "约 1,500 平方英尺" },
  sqft: { en: "sqft", zh: "平方英尺" },
  "island counter": { en: "Island Counter", zh: "岛台" },
  condo: { en: "Condo", zh: "公寓" },
  custom: { en: "Custom", zh: "定制" },
  "grey oak": { en: "Grey Oak", zh: "灰橡木" },
  grey: { en: "Grey", zh: "灰色" },
  gray: { en: "Gray", zh: "灰色" },
  "wood grain": { en: "Wood Grain", zh: "木纹" },
  "high gloss white": { en: "High Gloss White", zh: "高光白" },
  "natural teak": { en: "Natural Teak", zh: "天然柚木" },
  "melamine cabinet - grey oak": { en: "Melamine Cabinet - Grey Oak", zh: "美耐板橱柜 - 灰橡木" },
  "acrylic cabinet - high gloss white": { en: "Acrylic Cabinet - High Gloss White", zh: "亚克力橱柜 - 高光白" },
  "solid wood cabinet - natural teak": { en: "Solid Wood Cabinet - Natural Teak", zh: "实木橱柜 - 天然柚木" },
  "solid wood cabinet - teak": { en: "Solid Wood Cabinet - Teak", zh: "实木橱柜 - 柚木" },
  "most popular choice for hdb and condo kitchens.": { en: "Most popular choice for HDB and condo kitchens.", zh: "HDB 和公寓厨房最常见的选择。" },
  "white oak": { en: "White Oak", zh: "白橡木" },
  "natural oak": { en: "Natural Oak", zh: "天然橡木" },
  "grey stone": { en: "Grey Stone", zh: "灰石纹" },
  "stone pattern": { en: "Stone Pattern", zh: "石纹" },
  "marble look": { en: "Marble Look", zh: "大理石纹" },
  smooth: { en: "Smooth", zh: "光滑" },
  matte: { en: "Matte", zh: "哑光" },
  "soft-close hinges": { en: "Soft-close Hinges", zh: "缓冲铰链" },
  "with soft-close hinges": { en: "with Soft-close Hinges", zh: "搭配缓冲铰链" },
  "18mm melamine-faced particleboard": { en: "18mm melamine-faced particleboard", zh: "18mm 美耐板颗粒板" },
  "melamine-faced particleboard": { en: "Melamine-faced Particleboard", zh: "美耐板颗粒板" },
  particleboard: { en: "Particleboard", zh: "颗粒板" },
  "pairs well with quartz countertops": { en: "Pairs well with quartz countertops", zh: "适合搭配石英石台面" },
  "pairs well with": { en: "Pairs well with", zh: "适合搭配" },
  "budget-friendly and durable": { en: "Budget-friendly and durable", zh: "价格亲民，耐用度稳定" },
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
  const tableMap = statusLabels[table] || statusLabels.default || {};
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

const extraZhTextReplacements: Record<string, string> = {
  "Frequently Asked Questions": "常见问题",
  "Corporate Office in KL Sentral": "吉隆坡中环企业办公室",
  "Co-Working Space in PJ": "八打灵再也共享办公室",
  "Retail Shop in Bangsar": "孟沙零售店铺",
  "Cafe Renovation in SS2": "SS2 咖啡店装修",
  "Storage System for Logistics Co.": "物流公司仓储系统",
  "Bangsar Condo Kitchen Cabinet": "孟沙公寓厨房橱柜",
  "Subang Jaya Open Kitchen Renovation": "梳邦再也开放式厨房装修",
  "Mont Kiara Condo SPC Flooring": "满家乐公寓 SPC 地板",
  "Petaling Jaya Office Laminate Flooring": "八打灵再也办公室复合地板",
  "KL Sentral Corporate Office Renovation": "吉隆坡中环企业办公室装修",
  "Petaling Jaya Coworking Space Planning": "八打灵再也共享办公空间规划",
  "Bangsar Retail Shopfront Renovation": "孟沙零售店面翻新",
  "SS2 Cafe Renovation": "SS2 咖啡店装修",
  "Shah Alam Warehouse Racking": "莎阿南仓库货架",
  "Puchong Logistics Storage System": "蒲种物流仓储系统",
  "Petaling Jaya Bathroom Waterproofing Upgrade": "八打灵再也浴室防水升级",
  "Condo Bathroom Tile Upgrade": "公寓浴室墙地砖升级",
  "Mont Kiara Modern Condo Renovation": "满家乐现代公寓全屋装修",
  "Kajang Landed House Living Renovation": "加影有地住宅现代客厅翻新",
  "Subang Jaya Dry and Wet Kitchen Cabinet": "梳邦再也干湿厨房柜定制",
  "Kepong TV Feature Wall and Storage": "甲洞电视背景墙与收纳柜",
  "Residential Renovation Reference": "住宅装修参考",
  "Commercial Fit-Out Reference": "商业空间装修参考",
  "fit-out": "装修施工",
  "Fit-Out": "装修施工",
  "opening timeline": "开业时间表",
  "retail fit-out": "零售空间装修",
  "material only": "仅材料参考",
  "Subway": "地铁砖",
  "High-performance": "高性能",
  "heavy-use": "高频使用",
  "surface": "表面材料",
  "counters": "台面",
  "Smooth": "光滑",
  "seamless joining": "无缝拼接",
  "easy repair": "易修补",
  "bathrooms": "浴室",
  "basins": "洗手盆",
  "Integrated cable management system": "整合电线收纳系统",
  "Floor-to-ceiling bookshelf with LED strips": "到顶书架搭配灯带",
  "Window seat with hidden storage": "窗边座位暗藏收纳",
  "Acoustic panel on one wall": "一面墙加入吸音板",
  "Drawer island": "中岛抽屉",
  "Lighting integration": "灯光整合",
  "Glass doors": "玻璃门",
  "Dark walnut veneer": "深胡桃木饰面",
  "Tinted glass": "茶色玻璃",
  "Stone countertop": "石材台面",
  "Brushed metal": "拉丝金属",
  "Bedroom refurbishment": "卧室翻新",
  "Wardrobe entry": "衣柜入口",
  "Wall panels": "墙板",
  "Lighting upgrade": "灯光升级",
  "Upholstered panels": "软包墙板",
  "Timber veneer": "木饰面",
  "Marble side surfaces": "大理石边几台面",
  "Material displays": "材料展示",
  "Consultation table": "洽谈桌",
  "Storage wall": "收纳墙",
  "Gallery lighting": "展厅灯光",
  "Marble slabs": "大理石样板",
  "Metal frames": "金属框架",
  "Glass partitions": "玻璃隔间",
  "Living room renovation": "客厅翻新",
  "Built-in storage": "定制收纳",
  "Lighting coordination": "灯光协调",
  "Sintered stone": "岩板",
  "Walnut veneer": "胡桃木饰面",
  "Matte laminate": "哑光板材",
  "Warm LED lighting": "暖色灯带",
  "Salon reception": "沙龙接待区",
  "Styling zone": "造型区",
  "Display shelving": "展示层板",
  "Lighting design": "灯光设计",
  "Microcement": "微水泥",
  "Terrazzo": "水磨石",
  "Ribbed glass": "长虹玻璃",
  "Champagne metal": "香槟金属",
  "Commercial Kitchen Setup": "商业厨房设置",
  "Dining Area Design": "用餐区设计",
  "Bar Counter": "吧台",
  "Feature Ceiling": "特色天花",
  "Flooring & Tiling": "地板与瓷砖",
  "Electrical & Plumbing": "电工与水喉",
  "Signage": "招牌",
  "Shopfront Glass Works": "店面玻璃工程",
  "3D Signage Fabrication & Installation": "立体招牌制作与安装",
  "Roller Shutter Replacement": "卷闸门更换",
  "Interior Display Counter": "室内展示柜台",
  "Exterior Painting": "外墙油漆",
  "Electrical": "电工",
};

export const translateDisplayText = (value: string, language: Language) => {
  if (language !== "zh" || !value) return value;

  const withExtraReplacements = Object.entries(extraZhTextReplacements).reduce((text, [key, replacement]) => {
    return text.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement);
  }, value);

  const translated = displayTextReplacements.reduce((text, entry) => {
    const replacement = entry.value.zh;
    return text.replace(new RegExp(entry.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement);
  }, withExtraReplacements);

  return translated
    .replace(/\s+([，。！？；：、])/g, "$1")
    .replace(/([（【])\s+/g, "$1")
    .replace(/\s+([）】])/g, "$1")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
};
