export const appErrorBoundaryText = {
  en: {
    label: "Page load failed",
    title: "The page encountered a problem. Please refresh and try again.",
    body: "The system has recorded this error. If you are editing content in the admin panel, refresh first to confirm the latest data so you do not overwrite someone else's recent save.",
    chunkTitle: "Page files could not load. Please refresh and try again.",
    chunkBody:
      "Some page files could not load. Select Refresh page to try again. If it still fails, try again later.",
    refresh: "Refresh page",
  },
  zh: {
    label: "页面加载失败",
    title: "页面遇到问题，请刷新后再试",
    body: "系统已经记录这个错误。后台页面如果正在编辑内容，请先刷新确认最新数据，避免覆盖别人刚保存的内容。",
    chunkTitle: "页面加载失败，请刷新重试",
    chunkBody: "页面所需文件未能加载。请点击“刷新页面”重试；如果仍然失败，请稍后再试。",
    refresh: "刷新页面",
  },
} as const;
