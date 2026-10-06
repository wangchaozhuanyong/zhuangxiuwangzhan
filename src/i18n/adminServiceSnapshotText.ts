export const adminServiceSnapshotText = {
  zh: {
    read: "读取核对快照", reading: "正在读取…", copy: "复制核对快照", copying: "正在复制…",
    description: "读取服务器上的当前内容，仅用于核对。内容保存和发布仍按原审核流程执行。",
    ready: "已取得当前内容，请复制用于核对。", copied: "核对快照已复制。",
    readFailed: "无法取得核对快照，请稍后重试。", copyFailed: "复制失败，请允许剪贴板访问后重试。",
  },
  en: {
    read: "Read verification snapshot", reading: "Reading…", copy: "Copy verification snapshot", copying: "Copying…",
    description: "Read current server content for verification. Saving and publishing still follow the existing approval process.",
    ready: "Current content is ready to copy for verification.", copied: "Verification snapshot copied.",
    readFailed: "The verification snapshot is unavailable. Please try again later.", copyFailed: "Copy failed. Allow clipboard access and try again.",
  },
} as const;
