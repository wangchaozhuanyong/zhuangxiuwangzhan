export type AdminCmsLocalizedText = { en: string; zh: string };

export type AdminCmsLocalizedSimpleSectionField = {
  key: string;
  label: AdminCmsLocalizedText;
  type: "text" | "textarea" | "url" | "image";
  help: AdminCmsLocalizedText;
  placeholder?: AdminCmsLocalizedText;
  rows?: number;
};

export type AdminCmsLocalizedItemsSectionField = {
  key: string;
  label: AdminCmsLocalizedText;
  type: "items";
  help: AdminCmsLocalizedText;
  addLabel: AdminCmsLocalizedText;
  itemLabel: AdminCmsLocalizedText;
  itemFields: readonly AdminCmsLocalizedSimpleSectionField[];
};

export type AdminCmsLocalizedSectionField = AdminCmsLocalizedSimpleSectionField | AdminCmsLocalizedItemsSectionField;

export type AdminCmsLocalizedSectionSchema = {
  label: AdminCmsLocalizedText;
  description: AdminCmsLocalizedText;
  fields: readonly AdminCmsLocalizedSectionField[];
};

const baseCardFields = [
  {
    key: "title",
    label: { en: "Title", zh: "标题" },
    type: "text",
    help: { en: "Title for the card or list item.", zh: "卡片或列表项的标题。" },
  },
  {
    key: "description",
    label: { en: "Description", zh: "说明" },
    type: "textarea",
    rows: 3,
    help: { en: "Description text for the card or list item.", zh: "卡片或列表项的说明文字。" },
  },
  {
    key: "image_url",
    label: { en: "Image", zh: "图片" },
    type: "image",
    help: { en: "Optional. Used for card images or gallery images.", zh: "可选。用于卡片图片或图库图片。" },
  },
  {
    key: "url",
    label: { en: "Link URL", zh: "跳转链接" },
    type: "url",
    help: { en: "Optional. Where the item should link after a click.", zh: "可选。点击后跳转到哪个页面。" },
  },
] as const satisfies readonly AdminCmsLocalizedSimpleSectionField[];

export const adminCmsSectionContentEditorSchemas = {
  hero: {
    label: { en: "Hero section", zh: "Hero 首屏" },
    description: {
      en: "Best for the large title, description, buttons, and main image at the top of the page.",
      zh: "适合页面最上方的大标题、说明、按钮和主图。",
    },
    fields: [
      {
        key: "eyebrow",
        label: { en: "Eyebrow", zh: "小标题" },
        type: "text",
        help: {
          en: "Short copy above the main title, such as an industry or service tag.",
          zh: "显示在主标题上方的短文案，例如行业或服务标签。",
        },
      },
      {
        key: "title",
        label: { en: "Main title", zh: "主标题" },
        type: "textarea",
        rows: 2,
        help: { en: "The most important sentence on the page.", zh: "页面最重要的一句话。" },
      },
      {
        key: "subtitle",
        label: { en: "Subtitle", zh: "副标题" },
        type: "textarea",
        rows: 2,
        help: { en: "Supporting text below the main title.", zh: "主标题下面的补充说明。" },
      },
      {
        key: "description",
        label: { en: "Detailed description", zh: "详细说明" },
        type: "textarea",
        rows: 4,
        help: { en: "A fuller introduction. It can be left empty.", zh: "更完整的介绍文字，可留空。" },
      },
      {
        key: "primary_label",
        label: { en: "Primary button text", zh: "主按钮文字" },
        type: "text",
        help: { en: "For example, \"Get a quote\" or \"Contact us\".", zh: "例如“获取报价”或“联系我们”。" },
      },
      {
        key: "primary_url",
        label: { en: "Primary button link", zh: "主按钮链接" },
        type: "url",
        help: { en: "For example, /quote or /contact.", zh: "例如 /quote 或 /contact。" },
      },
      {
        key: "secondary_label",
        label: { en: "Secondary button text", zh: "副按钮文字" },
        type: "text",
        help: { en: "Second button text. It can be left empty.", zh: "第二个按钮文字，可留空。" },
      },
      {
        key: "secondary_url",
        label: { en: "Secondary button link", zh: "副按钮链接" },
        type: "url",
        help: { en: "Second button target URL. It can be left empty.", zh: "第二个按钮跳转地址，可留空。" },
      },
      {
        key: "image_url",
        label: { en: "Hero image", zh: "首屏图片" },
        type: "image",
        help: { en: "Main image for the page hero.", zh: "页面首屏主图。" },
      },
      {
        key: "alt",
        label: { en: "Image description", zh: "图片说明" },
        type: "text",
        help: { en: "Used by search engines and accessibility readers.", zh: "给搜索引擎和无障碍阅读使用。" },
      },
    ],
  },
  rich_text: {
    label: { en: "Rich text content", zh: "富文本内容" },
    description: {
      en: "Best for company introductions, service explanations, and long-form body copy.",
      zh: "适合公司介绍、服务说明、长段落正文。",
    },
    fields: [
      { key: "title", label: { en: "Title", zh: "标题" }, type: "text", help: { en: "Title for the body section.", zh: "正文模块标题。" } },
      {
        key: "summary",
        label: { en: "Summary", zh: "摘要" },
        type: "textarea",
        rows: 3,
        help: { en: "Short summary before the body copy. It can be left empty.", zh: "正文前的简短总结，可留空。" },
      },
      {
        key: "content",
        label: { en: "Body copy", zh: "正文" },
        type: "textarea",
        rows: 8,
        help: { en: "Main body content.", zh: "主要正文内容。" },
      },
      {
        key: "image_url",
        label: { en: "Supporting image", zh: "配图" },
        type: "image",
        help: { en: "Image beside or above the body copy. It can be left empty.", zh: "正文旁边或上方的配图，可留空。" },
      },
      {
        key: "alt",
        label: { en: "Image description", zh: "图片说明" },
        type: "text",
        help: { en: "Text description for the image.", zh: "图片的文字说明。" },
      },
    ],
  },
  cta: {
    label: { en: "CTA block", zh: "行动引导 CTA" },
    description: {
      en: "Best for contact, quote, booking, and other conversion areas near the bottom of a page.",
      zh: "适合页面底部的联系、报价、预约等转化区。",
    },
    fields: [
      { key: "title", label: { en: "Title", zh: "标题" }, type: "text", help: { en: "Main title for the CTA.", zh: "行动引导的主标题。" } },
      {
        key: "description",
        label: { en: "Description", zh: "说明" },
        type: "textarea",
        rows: 3,
        help: { en: "Tell customers why they should click the button.", zh: "告诉客户为什么要点击按钮。" },
      },
      {
        key: "primary_label",
        label: { en: "Primary button text", zh: "主按钮文字" },
        type: "text",
        help: { en: "For example, \"Ask now\".", zh: "例如“马上咨询”。" },
      },
      {
        key: "primary_url",
        label: { en: "Primary button link", zh: "主按钮链接" },
        type: "url",
        help: { en: "For example, /quote.", zh: "例如 /quote。" },
      },
      { key: "secondary_label", label: { en: "Secondary button text", zh: "副按钮文字" }, type: "text", help: { en: "Optional.", zh: "可选。" } },
      { key: "secondary_url", label: { en: "Secondary button link", zh: "副按钮链接" }, type: "url", help: { en: "Optional.", zh: "可选。" } },
      {
        key: "image_url",
        label: { en: "Background or image", zh: "背景或配图" },
        type: "image",
        help: { en: "Optional. Used to strengthen the visual effect.", zh: "可选。用于增强视觉效果。" },
      },
    ],
  },
  faq: {
    label: { en: "FAQ", zh: "常见问题" },
    description: { en: "Best for maintaining a question and answer list.", zh: "适合维护问答列表。" },
    fields: [
      {
        key: "items",
        label: { en: "Question list", zh: "问题列表" },
        type: "items",
        help: { en: "Fill one question and answer per item.", zh: "每条填写一个问题和答案。" },
        addLabel: { en: "Add question", zh: "添加问题" },
        itemLabel: { en: "Question", zh: "问题" },
        itemFields: [
          {
            key: "question",
            label: { en: "Question", zh: "问题" },
            type: "textarea",
            rows: 2,
            help: { en: "A question customers often ask.", zh: "客户常问的问题。" },
          },
          {
            key: "answer",
            label: { en: "Answer", zh: "答案" },
            type: "textarea",
            rows: 4,
            help: { en: "The matching answer.", zh: "对应的回答。" },
          },
        ],
      },
    ],
  },
  service_grid: {
    label: { en: "Service cards", zh: "服务卡片" },
    description: { en: "Best for showing multiple service items.", zh: "适合展示多个服务项目。" },
    fields: [
      {
        key: "items",
        label: { en: "Service list", zh: "服务列表" },
        type: "items",
        help: { en: "Each item is one service card.", zh: "每条是一张服务卡片。" },
        addLabel: { en: "Add service", zh: "添加服务" },
        itemLabel: { en: "Service", zh: "服务" },
        itemFields: baseCardFields,
      },
    ],
  },
  project_grid: {
    label: { en: "Project cards", zh: "案例卡片" },
    description: { en: "Best for showing cases, work, or customer projects.", zh: "适合展示案例、作品或客户项目。" },
    fields: [
      {
        key: "items",
        label: { en: "Project list", zh: "案例列表" },
        type: "items",
        help: { en: "Each item is one project card.", zh: "每条是一张案例卡片。" },
        addLabel: { en: "Add project", zh: "添加案例" },
        itemLabel: { en: "Project", zh: "案例" },
        itemFields: baseCardFields,
      },
    ],
  },
  gallery: {
    label: { en: "Image gallery", zh: "图片图库" },
    description: { en: "Best for showing multiple images.", zh: "适合展示多张图片。" },
    fields: [
      {
        key: "items",
        label: { en: "Image list", zh: "图片列表" },
        type: "items",
        help: { en: "Each item is one gallery image.", zh: "每条是一张图库图片。" },
        addLabel: { en: "Add image", zh: "添加图片" },
        itemLabel: { en: "Image", zh: "图片" },
        itemFields: baseCardFields,
      },
    ],
  },
  team: {
    label: { en: "Team members", zh: "团队成员" },
    description: { en: "Best for showing teams, specialists, or responsible people.", zh: "适合展示团队、专家或负责人。" },
    fields: [
      {
        key: "items",
        label: { en: "Member list", zh: "成员列表" },
        type: "items",
        help: { en: "Each item is one team member.", zh: "每条是一个团队成员。" },
        addLabel: { en: "Add member", zh: "添加成员" },
        itemLabel: { en: "Member", zh: "成员" },
        itemFields: baseCardFields,
      },
    ],
  },
  testimonials: {
    label: { en: "Testimonials", zh: "客户评价" },
    description: { en: "Best for showing customer testimonials.", zh: "适合展示客户评价。" },
    fields: [
      {
        key: "items",
        label: { en: "Testimonial list", zh: "评价列表" },
        type: "items",
        help: { en: "Each item is one customer testimonial.", zh: "每条是一条客户评价。" },
        addLabel: { en: "Add testimonial", zh: "添加评价" },
        itemLabel: { en: "Testimonial", zh: "评价" },
        itemFields: [
          {
            key: "name",
            label: { en: "Customer name", zh: "客户名称" },
            type: "text",
            help: { en: "Displayed customer name or company name.", zh: "显示的客户名或公司名。" },
          },
          {
            key: "role",
            label: { en: "Customer role", zh: "客户身份" },
            type: "text",
            help: { en: "For example, Homeowner or Founder. It can be left empty.", zh: "例如 Homeowner、Founder，可留空。" },
          },
          {
            key: "quote",
            label: { en: "Testimonial content", zh: "评价内容" },
            type: "textarea",
            rows: 4,
            help: { en: "Customer testimonial body copy.", zh: "客户评价正文。" },
          },
          {
            key: "image_url",
            label: { en: "Avatar or image", zh: "头像或图片" },
            type: "image",
            help: { en: "Optional.", zh: "可选。" },
          },
        ],
      },
    ],
  },
} as const satisfies Record<string, AdminCmsLocalizedSectionSchema>;

export const adminCmsSectionContentEditorText = {
  customSectionLabel: { en: "Custom section", zh: "自定义模块" },
  customSectionDescription: {
    en: "This section type does not have a dedicated form yet. Use advanced JSON editing for now.",
    zh: "这个模块类型还没有专用表单，可以先用高级 JSON 编辑。",
  },
  genericTitleLabel: { en: "Title", zh: "标题" },
  genericTitleHelp: { en: "Generic title field.", zh: "通用标题字段。" },
  genericDescriptionLabel: { en: "Description", zh: "说明" },
  genericDescriptionHelp: { en: "Generic description field.", zh: "通用说明字段。" },
  genericImageLabel: { en: "Image", zh: "图片" },
  genericImageHelp: { en: "Generic image field.", zh: "通用图片字段。" },
  visualEditorSuffix: { en: "Visual editor ·", zh: "可视化编辑 ·" },
  moveUpAria: { en: "Move up", zh: "上移" },
  moveDownAria: { en: "Move down", zh: "下移" },
  deleteAria: { en: "Delete", zh: "删除" },
  advancedJsonSummary: { en: "Advanced JSON editing", zh: "高级 JSON 编辑" },
  advancedJsonDescription: {
    en: "The form syncs to JSON automatically. Edit here only when special fields are needed.",
    zh: "表单会自动同步到 JSON。只有需要特殊字段时才需要直接改这里。",
  },
} as const;
