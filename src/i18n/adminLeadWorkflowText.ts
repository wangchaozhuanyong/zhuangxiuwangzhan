export const adminLeadWorkflowText = {
  leads: {
    en: {
      all: { label: "All Leads", help: "Show all contact enquiries." },
      today: { label: "Today", help: "Enquiries submitted today." },
      due_followups: { label: "Follow-up Due", help: "Enquiries with a due follow-up time." },
      stale24: { label: "24h Unhandled", help: "New enquiries older than 24 hours." },
      to_quote: { label: "Ready to Quote", help: "Contacted or site-visit leads that may need a quote." },
    },
    zh: {
      all: { label: "全部咨询", help: "查看所有联系咨询。" },
      today: { label: "今日新增", help: "今天提交到后台的咨询。" },
      due_followups: { label: "待跟进", help: "已经到下次跟进时间的咨询。" },
      stale24: { label: "24小时未处理", help: "超过 24 小时仍是新咨询的记录。" },
      to_quote: { label: "可转报价", help: "已联系或已安排上门、可能需要报价的咨询。" },
    },
  },
  quote_requests: {
    en: {
      all: { label: "All Quotes", help: "Show all quote requests." },
      today: { label: "Today", help: "Quote requests submitted today." },
      due_followups: { label: "Follow-up Due", help: "Quote requests with a due follow-up time." },
      stale24: { label: "24h Unhandled", help: "Pending or contacted quote requests older than 24 hours." },
      to_quote: { label: "To Quote", help: "Requests that still need quote preparation or reply." },
    },
    zh: {
      all: { label: "全部报价", help: "查看所有报价请求。" },
      today: { label: "今日新增", help: "今天提交到后台的报价请求。" },
      due_followups: { label: "待跟进", help: "已经到下次跟进时间的报价请求。" },
      stale24: { label: "24小时未处理", help: "超过 24 小时仍待处理的报价请求。" },
      to_quote: { label: "待报价", help: "还需要整理报价或回复客户的请求。" },
    },
  },
} as const;

export const adminLeadWorkflowBadgeText = {
  en: {
    due: "Follow-up due",
    scheduled: "Follow-up scheduled",
    stale: "Unhandled over 24h",
  },
  zh: {
    due: "跟进已到期",
    scheduled: "已安排跟进",
    stale: "超过24小时未处理",
  },
} as const;
