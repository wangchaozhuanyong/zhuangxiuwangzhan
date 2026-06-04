export const adminCmsBuilderText = {
  pathWarningLanguagePrefix: {
    en: "Do not enter /zh or /en here. The system creates the Chinese and English URLs automatically.",
    zh: "这里不用写 /zh 或 /en，系统会自动生成中文和英文访问地址。",
  },
  pathWarningHome: {
    en: "Only the homepage should use /. For a new page, use its own path, for example /company-profile.",
    zh: "只有首页应该使用 /，新页面请换成自己的路径，例如 /company-profile。",
  },
  pathWarningStatic: {
    en: "This path is already handled by a fixed page. For a custom page, use another path, for example /company-profile.",
    zh: "这个路径会被已有固定页面接管。新建自由页面建议换一个路径，例如 /company-profile。",
  },
  newPageMessage: {
    en: "A new page draft has been created. Confirm the path, title, and status before saving.",
    zh: "已创建新页面草稿。确认页面路径、标题和状态后保存。",
  },
  sectionNeedsPageMessage: {
    en: "Save or choose a page first, then add a section.",
    zh: "请先保存或选择一个页面，再添加模块。",
  },
  pageKeyRequiredError: { en: "Page key is required.", zh: "页面标识不能为空。" },
  pageKeyFormatError: {
    en: "Page key can only use lowercase letters, numbers, underscores, or hyphens.",
    zh: "页面标识只能使用小写英文、数字、下划线或短横线。",
  },
  pathNoLanguagePrefixError: {
    en: "Do not include /zh or /en in the frontend path. After saving /company-profile, the system creates /zh/company-profile and /en/company-profile.",
    zh: "前台路径不要写 /zh 或 /en。保存 /company-profile 后，系统会生成 /zh/company-profile 和 /en/company-profile。",
  },
  homepagePathError: {
    en: "Only the homepage can use /. For a new page, use its own path.",
    zh: "只有首页可以使用 /，新页面请换成自己的路径。",
  },
  pageSavedMessage: { en: "Page saved.", zh: "页面已保存。" },
  sectionKeyRequiredError: { en: "Section key is required.", zh: "模块标识不能为空。" },
  sectionTypeRequiredError: { en: "Section type is required.", zh: "模块类型不能为空。" },
  zhContentJsonLabel: { en: "Chinese content JSON", zh: "中文内容 JSON" },
  enContentJsonLabel: { en: "English content JSON", zh: "英文内容 JSON" },
  settingsJsonLabel: { en: "Section settings JSON", zh: "模块设置 JSON" },
  sectionSavedMessage: { en: "Section saved.", zh: "模块已保存。" },
  sectionOrderSaved: {
    en: "Section order saved. The public page will read the new order.",
    zh: "模块顺序已保存，前台会按新顺序读取。",
  },
  sectionOrderUnchanged: { en: "Section order did not change.", zh: "模块顺序没有变化。" },
  archivePageDialogTitle: { en: "Archive this page?", zh: "确认归档这个页面？" },
  archivePageDialogDescription: {
    en: "After archiving, it will no longer appear on the live frontend. Confirm that customers no longer need to access this page.",
    zh: "归档后正式前台将不再显示它。请确认这个页面不是当前客户需要访问的页面。",
  },
  archivePageDialogConfirm: { en: "Archive page", zh: "归档页面" },
  pageArchivedMessage: { en: "Page archived.", zh: "页面已归档。" },
  archiveSectionDialogTitle: { en: "Archive this section?", zh: "确认归档这个模块？" },
  archiveSectionDialogDescription: {
    en: "After archiving, this page section will no longer appear on the live frontend. Confirm that the frontend no longer needs it.",
    zh: "归档后正式前台将不再显示这个页面模块。请确认前台不再需要它。",
  },
  archiveSectionDialogConfirm: { en: "Archive section", zh: "归档模块" },
  sectionArchivedMessage: { en: "Section archived.", zh: "模块已归档。" },
  restoreDialogTitle: { en: "Restore this version?", zh: "确认恢复这个版本？" },
  restoreDialogDescription: {
    en: "Current content will be replaced by this historical version. Confirm the version time and content before restoring.",
    zh: "当前内容会被这个历史版本覆盖。建议确认版本时间和内容后再恢复。",
  },
  restoreDialogConfirm: { en: "Restore version", zh: "恢复版本" },
  revisionRestoredMessage: { en: "Version restored.", zh: "版本已恢复。" },
  supabaseMissingTitle: { en: "Supabase is not configured", zh: "Supabase 未配置" },
  supabaseMissingDescription: {
    en: "After configuration is complete, the general CMS page builder can be used.",
    zh: "配置完成后，才能使用通用 CMS 页面搭建器。",
  },
  dbMissingTitle: { en: "CMS tables have not been created", zh: "CMS 数据表还没创建" },
  dbMissingDescription: {
    en: "Run the migration supabase/migrations/202605300001_professional_admin_foundation.sql first.",
    zh: "请先执行迁移 supabase/migrations/202605300001_professional_admin_foundation.sql。",
  },
  pageListTitle: { en: "Page list", zh: "页面列表" },
  pageListDescription: {
    en: "Choose an existing page, or create a custom page draft.",
    zh: "选择已有页面，或新建一个自由页面草稿。",
  },
  newPageButton: { en: "New page", zh: "新页面" },
  newPageDraftFallback: { en: "New page draft", zh: "新页面草稿" },
  noPages: {
    en: "No CMS pages yet. Run the default content sync first, or create one manually.",
    zh: "暂无 CMS 页面。可以先执行默认内容同步，或手动新建。",
  },
  builderTitle: { en: "General page builder", zh: "通用页面搭建器" },
  builderDescription: {
    en: "Manage reusable pages, sections, drafts, publishing, and version recovery. After a custom page is published, it can be visited through the Chinese and English sites.",
    zh: "用于管理可复用页面、模块、草稿、发布和版本恢复。新建自由页面发布后，通过中文站和英文站访问。",
  },
  zhPreviewBadgeLabel: { en: "Chinese:", zh: "中文：" },
  enPreviewBadgeLabel: { en: "English:", zh: "English：" },
  builderHelpText: {
    en: "This is for custom pages that do not occupy fixed routes. The backend path is saved as /company-profile, and the real frontend URLs are /zh/company-profile and /en/company-profile.",
    zh: "这里适合新增不占用固定路由的自由页面。后台 path 保存为 /company-profile，前台实际访问 /zh/company-profile 和 /en/company-profile。",
  },
  previewZhButton: { en: "Preview Chinese", zh: "预览中文" },
  previewEnButton: { en: "Preview English", zh: "Preview EN" },
  infoTitle: {
    en: "This feature can create pages, but do not visit /xxx directly.",
    zh: "这个功能可以新增页面，但路径不要直接访问 `/xxx`。",
  },
  infoDescription: {
    en: "The backend path is saved without a language prefix. The live frontend will use `{zhPreviewPath}` and `{enPreviewPath}`.",
    zh: "后台保存的 path 是不带语言前缀的基础路径；正式前台会使用 `{zhPreviewPath}` 和 `{enPreviewPath}`。",
  },
  pageBasicsTitle: { en: "Page basics", zh: "页面基础信息" },
  pageBasicsDescription: {
    en: "Control page path, title, SEO, status, and sort order.",
    zh: "控制页面路径、标题、SEO、状态和排序。",
  },
  pageBasicsHelp: {
    en: "Save the page before adding sections. Published pages are read by the live frontend; draft is only for backend preview.",
    zh: "保存页面后，才能给它添加模块。published 会给正式前台读取；draft 只适合后台预览。",
  },
  pageKeyLabel: { en: "Page key page_key", zh: "页面标识 page_key" },
  pageKeyHelp: {
    en: "Use only lowercase letters, numbers, underscores, or hyphens. Do not change it casually after saving.",
    zh: "只用小写英文、数字、下划线或短横线。保存后不要随便改。",
  },
  pathLabel: { en: "Frontend path", zh: "前台路径 path" },
  pathHelp: {
    en: "Save the base path without a language prefix, for example /company-profile. Live URLs automatically add /zh or /en.",
    zh: "保存不带语言前缀的基础路径，例如 /company-profile。正式访问地址会自动加 /zh 或 /en。",
  },
  zhAddressLabel: { en: "Chinese URL", zh: "中文地址" },
  enAddressLabel: { en: "English URL", zh: "英文地址" },
  zhTitleLabel: { en: "Chinese title", zh: "中文标题" },
  zhTitleHelp: { en: "Title read by the public Chinese page.", zh: "前台中文页面可读取的标题。" },
  enTitleLabel: { en: "English title", zh: "英文标题" },
  enTitleHelp: { en: "Title read by the public English page.", zh: "前台英文页面可读取的标题。" },
  statusLabel: { en: "Status", zh: "状态" },
  statusHelp: {
    en: "published is live, draft is draft, archived is archived.",
    zh: "published 正式显示，draft 草稿，archived 归档。",
  },
  sortLabel: { en: "Sort order", zh: "排序" },
  sortHelp: { en: "Smaller numbers appear earlier.", zh: "数字越小越靠前。" },
  zhSeoDescriptionLabel: { en: "Chinese SEO description", zh: "中文 SEO 描述" },
  zhSeoDescriptionHelp: {
    en: "Commonly used for search results and sharing cards.",
    zh: "搜索结果和分享卡片常用描述。",
  },
  saving: { en: "Saving...", zh: "保存中..." },
  savePageButton: { en: "Save page", zh: "保存页面" },
  previewZhPageButton: { en: "Preview Chinese page", zh: "预览中文页" },
  previewEnPageButton: { en: "Preview English page", zh: "预览英文页" },
  archivePageButton: { en: "Archive page", zh: "归档页面" },
  sectionsTitle: { en: "Page sections", zh: "页面模块" },
  sectionsDescription: {
    en: "A page can be made of multiple sections. Section order affects the public display order.",
    zh: "一个页面可以由多个模块组成，模块排序会影响前台显示顺序。",
  },
  sectionsHelp: {
    en: "The section type determines the frontend rendering style. Section content is saved as JSON, so it can be reused across company websites.",
    zh: "模块类型决定前台渲染方式；模块内容用 JSON 保存，适合不同公司官网复用。",
  },
  newSectionButton: { en: "New section", zh: "新模块" },
  dragSectionTitle: {
    en: "Hold and drag to adjust section order",
    zh: "按住拖动可以调整模块顺序",
  },
  dragSectionAria: { en: "Drag to adjust section order", zh: "拖拽调整模块顺序" },
  sectionSortInlineLabel: { en: "Sort", zh: "排序" },
  moveSectionUpAria: { en: "Move section up", zh: "模块上移" },
  moveSectionDownAria: { en: "Move section down", zh: "模块下移" },
  noSections: { en: "This page has no sections yet.", zh: "这个页面还没有模块。" },
  reordering: { en: "Saving section order...", zh: "正在保存模块顺序..." },
  sectionKeyLabel: { en: "Section key", zh: "模块标识" },
  sectionKeyHelp: {
    en: "Must be unique within the same page, for example hero, intro, faq.",
    zh: "同一个页面里必须唯一，例如 hero、intro、faq。",
  },
  sectionTypeLabel: { en: "Section type", zh: "模块类型" },
  sectionTypeHelp: {
    en: "Choose the frontend rendering style, for example hero, rich_text, faq.",
    zh: "选择前台渲染方式，例如 hero、rich_text、faq。",
  },
  zhSectionTitleLabel: { en: "Chinese section title", zh: "中文模块标题" },
  zhSectionTitleHelp: {
    en: "Can be displayed in the public section title position.",
    zh: "可显示在前台模块标题位置。",
  },
  enSectionTitleLabel: { en: "English section title", zh: "英文模块标题" },
  enSectionTitleHelp: { en: "Readable by the English frontend.", zh: "英文前台可读取。" },
  settingsLabel: { en: "Section settings JSON", zh: "模块设置 JSON" },
  settingsHelp: {
    en: "Store language-neutral settings such as layout, buttons, and images.",
    zh: "放布局、按钮、图片等不分语言的设置。",
  },
  saveSectionButton: { en: "Save section", zh: "保存模块" },
  archiveSectionButton: { en: "Archive section", zh: "归档模块" },
  sectionEmptyPrompt: {
    en: "Choose a section to edit, or click \"New section\".",
    zh: "选择一个模块编辑，或点击“新模块”。",
  },
  revisionsTitle: { en: "Version history and restore", zh: "版本记录与恢复" },
  revisionsDescription: {
    en: "Shows recent versions of the current page and sections. Confirm content before restoring.",
    zh: "显示当前页面和模块最近版本。恢复前请确认内容。",
  },
  revisionsHelp: {
    en: "Used for rollback after mistaken operations. Restoring writes a new version record.",
    zh: "用于误操作后的回滚。恢复会写入新的版本记录。",
  },
  restoreButton: { en: "Restore", zh: "恢复" },
  noRevisions: { en: "No version records yet.", zh: "暂无版本记录。" },
} as const;

export const adminCmsBuilderSectionTemplates = [
  {
    template_key: "hero",
    label: { en: "Hero section", zh: "Hero 首屏" },
    description: {
      en: "The large title, description, buttons, and main image at the top of the page.",
      zh: "页面顶部的大标题、说明、按钮和主图。",
    },
  },
  {
    template_key: "rich_text",
    label: { en: "Rich text content", zh: "富文本内容" },
    description: {
      en: "Company introduction, service explanation, or long-form body copy.",
      zh: "公司介绍、服务说明或长段落正文。",
    },
  },
  {
    template_key: "service_grid",
    label: { en: "Service cards", zh: "服务卡片" },
    description: { en: "Show multiple service items.", zh: "展示多个服务项目。" },
  },
  {
    template_key: "testimonials",
    label: { en: "Testimonials", zh: "客户评价" },
    description: { en: "Show a list of customer testimonials.", zh: "展示客户评价列表。" },
  },
  {
    template_key: "faq",
    label: { en: "FAQ", zh: "常见问题" },
    description: { en: "Maintain a question and answer list.", zh: "维护问答列表。" },
  },
  {
    template_key: "cta",
    label: { en: "CTA block", zh: "行动引导 CTA" },
    description: {
      en: "Conversion area for contact, quote, booking, and similar actions.",
      zh: "联系、报价、预约等转化区域。",
    },
  },
] as const;
