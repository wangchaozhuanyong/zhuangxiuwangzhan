export const appErrorBoundaryText = {
  en: {
    label: "Page load failed",
    title: "The page encountered a problem. Please refresh and try again.",
    body: "The system has recorded this error. If you are editing content in the admin panel, refresh first to confirm the latest data so you do not overwrite someone else's recent save.",
    chunkTitle: "The website version has been updated. Please refresh the page.",
    chunkBody:
      "The browser may still be keeping old version files. The system has already tried to refresh once. If you still see this page, please refresh manually.",
    refresh: "Refresh page",
  },
  zh: {
    label: "页面加载失败",
    title: "页面遇到问题，请刷新后再试",
    body: "系统已经记录这个错误。后台页面如果正在编辑内容，请先刷新确认最新数据，避免覆盖别人刚保存的内容。",
    chunkTitle: "网站版本已更新，请刷新页面",
    chunkBody: "浏览器可能还保留着旧版本文件。系统已尝试自动刷新一次，如果还看到这个页面，请手动点击刷新。",
    refresh: "刷新页面",
  },
} as const;
