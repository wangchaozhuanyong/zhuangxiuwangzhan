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
  totalContentHelp: { en: "Confirmed content records, including archived records. Unread sources are not content records.", zh: "发布中心已确认的内容记录数，含归档记录；读取失败的来源不计为内容。" },
  drafts: { en: "Drafts", zh: "草稿" },
  draftsHelp: { en: "Content that has not been officially published to the frontend.", zh: "还没有正式发布到前台的内容。" },
  published: { en: "Published", zh: "已发布" },
  publishedHelp: { en: "Content that the frontend should theoretically be able to read.", zh: "理论上前台可以读取到的内容。" },
  archived: { en: "Archived", zh: "已归档" },
  archivedHelp: { en: "Content removed from the normal display flow.", zh: "已从正常展示流程移出的内容。" },
  publishRisk: { en: "Publishing risks", zh: "发布风险" },
  publishRiskHelp: {
    en: "Unarchived records with at least one missing field. Archived records are excluded, and unread sources leave this count unconfirmed.",
    zh: "未归档记录中至少存在一个缺项的记录数；归档不算在用风险，来源读取失败时统计待确认。",
  },
  incompleteSources: { en: "Statistics are unconfirmed because these sources could not be read: {sources}. Confirmed records remain below; refresh to retry.", zh: "统计尚未确认，以下来源读取失败：{sources}。下方保留已确认记录，请刷新重试。" },
  loadFailed: { en: "Publish records could not be read. Refresh to confirm the statistics.", zh: "发布记录读取失败，请刷新后确认统计。" },
  refreshFailed: { en: "The refresh failed. Previously confirmed records remain visible; retry for current results.", zh: "本次刷新失败，保留上次已确认记录，请重试以获取最新结果。" },
  incompleteEmpty: { en: "No confirmed records in this view. Some sources could not be read, so this does not confirm an empty or risk-free result.", zh: "当前没有已确认记录，部分来源未能读取，暂不能判断没有内容或没有风险。" },
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
