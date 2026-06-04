export const chunkLoadRecoveryText = {
  en: {
    loadMessage:
      "Frontend version files failed to load: the browser or cache layer may still be keeping the old app entry, which referenced frontend scripts already replaced by the new deployment. The system will refresh once and request the latest entry again.",
    deployCacheMismatch: "Frontend deployment cache mismatch",
    reactRenderError: "Page render error",
    systemEvent: "System event",
  },
  zh: {
    loadMessage:
      "前端版本文件加载失败：浏览器或缓存层可能还保留着旧入口文件，旧入口引用了已经被新部署替换的前端脚本。系统会自动刷新一次并重新拉取最新入口。",
    deployCacheMismatch: "前端生产部署缓存不一致",
    reactRenderError: "页面渲染错误",
    systemEvent: "系统事件",
  },
} as const;
