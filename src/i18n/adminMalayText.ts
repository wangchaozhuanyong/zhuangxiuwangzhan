export const adminMalayText = {
  zh: {
    title: "马来语内容", description: "马来语页面优先使用这些内容。空白字段暂以英文显示，现有中英文内容会保留。",
    generate: "补齐马来语翻译", saveFirst: "请先保存当前内容，再生成马来语翻译。", generating: "正在翻译…",
    completed: "马来语翻译已保存，请核对内容", failed: "马来语翻译未完成", pending: "翻译已保存，前台同步尚未完成。",
    text: "内容", item: "条目", add: "添加条目", remove: "移除条目", reference: "英文参考",
    imageAlt: "马来语图片说明", save: "保存马来语", migrationRequired: "请先安装马来语数据库字段，再生成翻译。",
    fields: {
      title: "标题", subtitle: "副标题", excerpt: "摘要", description: "说明", content: "正文", alt: "图片说明",
      seo_title: "搜索标题", seo_description: "搜索描述", seo_keywords: "搜索关键词", question: "问题", answer: "回答",
      suitable_for: "适用对象", common_projects: "常见项目", scope_items: "服务范围", process_steps: "服务步骤", faqs: "常见问题",
      highlights: "项目亮点", client_need: "项目需求", suitable_spaces: "适用空间", pros: "优点", cons: "注意事项",
      recommended_pairing: "搭配建议", note: "备注", price_scope: "价格范围说明", price_note: "价格备注",
      primary_label: "主要按钮文字", secondary_label: "次要按钮文字", button_label: "按钮文字", cta_title: "咨询标题", cta_description: "咨询说明", items: "内容条目",
      construction_notes: "施工注意事项", property_types: "物业类型", common_needs: "常见需求", value: "数值", label: "名称", desc: "说明", q: "问题", a: "回答", name: "名称",
    },
  },
  en: {
    title: "Malay content", description: "Malay pages use these translations first. Blank fields temporarily use English. Existing Chinese and English content is preserved.",
    generate: "Fill missing Malay translations", saveFirst: "Save your changes before generating Malay translations.", generating: "Translating…",
    completed: "Malay translations saved. Please review the content.", failed: "Malay translation did not complete", pending: "Translations saved; the public website update is pending.",
    text: "Content", item: "Item", add: "Add item", remove: "Remove item", reference: "English reference",
    imageAlt: "Malay image description", save: "Save Malay", migrationRequired: "Install the Malay database fields before generating translations.",
    fields: {
      title: "Title", subtitle: "Subtitle", excerpt: "Summary", description: "Description", content: "Body", alt: "Image description",
      seo_title: "Search title", seo_description: "Search description", seo_keywords: "Search keywords", question: "Question", answer: "Answer",
      suitable_for: "Suitable for", common_projects: "Common projects", scope_items: "Work scope", process_steps: "Process steps", faqs: "Frequently asked questions",
      highlights: "Highlights", client_need: "Project requirements", suitable_spaces: "Suitable spaces", pros: "Benefits", cons: "Considerations",
      recommended_pairing: "Recommended pairing", note: "Notes", price_scope: "Price scope", price_note: "Price notes",
      primary_label: "Primary button label", secondary_label: "Secondary button label", button_label: "Button label", cta_title: "Enquiry title", cta_description: "Enquiry description", items: "Content items",
      construction_notes: "Construction notes", property_types: "Property types", common_needs: "Common needs", value: "Value", label: "Label", desc: "Description", q: "Question", a: "Answer", name: "Name",
    },
  },
} as const;
