export const adminLeadListText = {
  title: { en: "Contact Leads", zh: "客户咨询" },
  description: {
    en: "View customer enquiries submitted from the contact page. Filter by status, then follow up, call, or export directly.",
    zh: "查看联系页提交的客户咨询，筛选状态后可以直接跟进、拨号或导出。",
  },
  helpText: {
    en: "These are messages customers left on the contact page. Use this page to understand needs first, then schedule follow-up.",
    zh: "这里收的是客户自己在联系页留下的信息，适合先沟通需求、再安排跟进。",
  },
  search: { en: "Search name, phone, email...", zh: "搜索姓名、电话、邮箱..." },
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
  empty: { en: "No leads found.", zh: "暂时没有咨询记录。" },
  whatsapp: { en: "WhatsApp", zh: "WhatsApp 联系" },
  call: { en: "Call", zh: "拨打电话" },
  pagerItemLabel: { en: "leads", zh: "条咨询" },
} as const;
