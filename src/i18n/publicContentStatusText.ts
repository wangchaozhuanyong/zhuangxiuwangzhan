export const publicContentStatusText = {
  en: {
    remoteErrorTitle: "Showing local fallback content",
    remoteErrorDescription: "The public content service is not responding right now. The page is using local fallback content.",
    remoteErrorAction: "Retry",
    fallbackTitle: "Showing fallback content",
    fallbackDescription: "No published backend content was available, so the page is using local fallback content.",
    fallbackAction: "Reload",
  },
  zh: {
    remoteErrorTitle: "内容正在使用本地兜底",
    remoteErrorDescription: "后台内容接口暂时没有连上，页面先显示本地备用内容。你可以稍后重试刷新。",
    remoteErrorAction: "重试加载",
    fallbackTitle: "正在显示备用内容",
    fallbackDescription: "当前没有读取到后台发布内容，页面先显示本地备用内容。",
    fallbackAction: "重新加载",
  },
} as const;
