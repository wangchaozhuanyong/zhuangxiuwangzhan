export const adminQuoteListText = {
  title: { en: "Quote Requests", zh: "报价请求" },
  description: {
    en: "View quote requests. Start with project type, location, and budget, then arrange quote replies.",
    zh: "查看报价请求，适合先看项目类型、地区和预算，再安排报价回复。",
  },
  helpText: {
    en: "These are quote forms submitted by users. They include more complete information than contact enquiries, making budget assessment easier.",
    zh: "这里收的是用户主动提交的报价表单，信息比咨询页更完整，方便直接做预算判断。",
  },
  search: { en: "Search customer, phone, project, location...", zh: "搜索客户、电话、项目、地区..." },
  status: { en: "Status", zh: "状态" },
  statusAll: { en: "All statuses", zh: "全部状态" },
  exportCsv: { en: "Export CSV", zh: "导出 CSV" },
  exportCurrentTitle: {
    en: "Export {rows} item(s) on the current page, not all {total} item(s).",
    zh: "导出当前页 {rows} 条，不是全部 {total} 条。",
  },
  exportCurrentButton: { en: "Export current page CSV ({rows}/{total})", zh: "导出当前页 CSV（{rows}/{total}）" },
  exportSuccess: { en: "Current page CSV exported", zh: "已导出当前页 CSV" },
  exportSuccessDescription: {
    en: "Exported {rows} item(s) this time. Current filtered result has {total} item(s).",
    zh: "本次导出 {rows} 条，当前筛选结果共 {total} 条。",
  },
  empty: { en: "No quote requests found.", zh: "暂无报价请求。" },
  whatsapp: { en: "WhatsApp", zh: "WhatsApp 联系" },
  call: { en: "Call", zh: "拨打电话" },
  itemLabel: { en: "quotes", zh: "条报价" },
} as const;
