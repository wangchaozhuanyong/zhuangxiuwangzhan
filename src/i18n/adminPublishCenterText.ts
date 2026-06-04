export const adminPublishCenterText = {
  title: { en: "Publish Center", zh: "发布中心" },
  description: {
    en: "See which content is draft, published, archived, and whether anything is missing English, SEO, or images before publishing.",
    zh: "这里集中看哪些内容是草稿、哪些已发布、哪些归档，以及发布前还有没有缺英文、缺 SEO、缺图片。",
  },
  helpText: {
    en: "This page provides a publishing overview and risk reminders. To change content, click Edit and save or publish in the corresponding editor.",
    zh: "这个页面先做发布总览和风险提醒。真正修改内容请点“编辑”，进入对应编辑器保存或发布。",
  },
  refreshing: { en: "Refreshing...", zh: "刷新中..." },
  refreshStatus: { en: "Refresh publish status", zh: "刷新发布状态" },
  totalContent: { en: "All content", zh: "全部内容" },
  totalContentHelp: { en: "Total content visible in the publish center.", zh: "发布中心可看到的内容总数。" },
  drafts: { en: "Drafts", zh: "草稿" },
  draftsHelp: { en: "Content that has not been officially published to the frontend.", zh: "还没有正式发布到前台的内容。" },
  published: { en: "Published", zh: "已发布" },
  publishedHelp: { en: "Content that the frontend should theoretically be able to read.", zh: "理论上前台可以读取到的内容。" },
  archived: { en: "Archived", zh: "已归档" },
  archivedHelp: { en: "Content removed from the normal display flow.", zh: "已从正常展示流程移出的内容。" },
  publishRisk: { en: "Publishing risks", zh: "发布风险" },
  publishRiskHelp: {
    en: "Only missing items in draft and published content are counted. Archived content does not count as publishing risk.",
    zh: "只统计草稿和已发布内容的缺失项，已归档内容不算发布风险。",
  },
  updatedAt: { en: "Last updated: {time}", zh: "最近更新：{time}" },
  issuesBeforePublish: { en: "Fix before publishing: {issues}", zh: "发布前建议修复：{issues}" },
  edit: { en: "Edit", zh: "编辑" },
  viewFrontend: { en: "View frontend", zh: "看前台" },
  empty: { en: "No publish content matches the selected condition.", zh: "没有符合条件的发布内容。" },
} as const;

export const adminPublishCenterStatusFilters = {
  all: { en: "All", zh: "全部" },
  draft: { en: "Draft", zh: "草稿" },
  published: { en: "Published", zh: "已发布" },
  archived: { en: "Archived", zh: "已归档" },
  issues: { en: "Issues before publishing", zh: "发布前有问题" },
} as const;
