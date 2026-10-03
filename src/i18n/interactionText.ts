export const interactionText = {
  zh: {
    savedWhileEditing: "上次提交已成功，当前新增修改尚未提交。", loading: "正在加载内容", loadingFailed: "内容加载失败，请重试。", refreshing: "正在更新", slow: "加载需要较长时间，可以重试。",
    offline: "网络已断开，已有内容仍可查看。", retry: "重试", refresh: "刷新数据",
    leaveTitle: "还有未保存的内容", leaveBody: "离开后会丢失尚未保存的修改。正在提交的操作请等待完成。",
    stay: "继续编辑", leave: "放弃修改并离开", updateTitle: "网站已有新版本", updateBody: "可以在完成当前操作后更新页面。",
    update: "更新页面", later: "稍后", savedSyncPending: "内容已保存，网页同步尚未完成", retrySync: "重试网页同步",
    syncDone: "网页同步完成", syncFailed: "网页同步暂未完成，请稍后重试。", refreshFailed: "更新未完成，已保留上次取得的内容。",
  },
  en: {
    savedWhileEditing: "Your previous submission succeeded. Your new edits have not been submitted.", loading: "Loading content", loadingFailed: "Content could not be loaded. Please retry.", refreshing: "Updating", slow: "Loading is taking longer than expected. You can retry.",
    offline: "You are offline. Previously loaded content is still available.", retry: "Retry", refresh: "Refresh data",
    leaveTitle: "You have unsaved changes", leaveBody: "Leaving will discard unsaved changes. Wait for any submission to finish.",
    stay: "Keep editing", leave: "Discard changes and leave", updateTitle: "A new site version is available", updateBody: "Update the page after finishing your current work.",
    update: "Update page", later: "Later", savedSyncPending: "Content saved; website update is pending", retrySync: "Retry website update",
    syncDone: "Website update completed", syncFailed: "Website update is still pending. Please try again later.", refreshFailed: "Update failed. Previously loaded content has been kept.",
  },
} as const;
