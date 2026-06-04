export const adminServiceListText = {
  serviceHeader: { en: "Service", zh: "服务" },
  statusHeader: { en: "Status", zh: "状态" },
  sortHeader: { en: "Sort", zh: "排序" },
  updatedHeader: { en: "Updated", zh: "更新" },
  title: { en: "Services", zh: "服务项目" },
  description: {
    en: "Manage the service list and service detail content. The frontend service list and detail pages update after saving.",
    zh: "管理服务列表与服务详情内容。保存后前台服务列表与详情会同步更新。",
  },
  helpText: {
    en: "This page mainly manages service title, order, publishing status, and frontend display.",
    zh: "这里主要管服务项目的标题、排序、发布状态和前台展示。",
  },
  refreshing: { en: "Refreshing...", zh: "刷新中..." },
  refresh: { en: "Refresh", zh: "刷新" },
  newService: { en: "New service", zh: "新建服务" },
  searchPlaceholder: { en: "Search title or slug...", zh: "搜索标题或链接标识..." },
  allStatuses: { en: "All statuses", zh: "全部状态" },
  emptyTitle: { en: "No services yet", zh: "暂无服务" },
  emptyDescription: {
    en: "Create a service first. It will appear on the frontend service page after publishing.",
    zh: "先新建一个服务项目，发布后前台服务页会显示。",
  },
  itemLabel: { en: "services", zh: "个服务" },
} as const;
