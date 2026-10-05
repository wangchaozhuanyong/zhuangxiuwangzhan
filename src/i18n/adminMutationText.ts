export const adminMutationText = {
  zh: {
    missingSave: "保存失败：这条数据已经不存在，请刷新列表。",
    missingRemove: "删除失败：这条数据已经不存在，请刷新列表。",
    staleSave: "保存失败：这条内容已经被别人修改，请先刷新页面再保存。",
    staleRemove: "删除失败：这条内容已经被别人修改，请先刷新页面再操作。",
    privacy: "保存失败：办公室落地页案例只能使用匿名标题和吉隆坡、雪兰莪或巴生谷等大区域。请检查：{fields}。",
    duplicate: "保存失败：唯一字段已经存在，请换一个。",
    permission: "保存失败：当前账号没有这个操作权限。",
    invalidStatus: "保存失败：状态值不合法，请选择后台提供的状态。",
  },
  en: {
    missingSave: "Save failed: this record no longer exists. Refresh the list.",
    missingRemove: "Delete failed: this record no longer exists. Refresh the list.",
    staleSave: "Save failed: someone changed this content. Refresh the page before saving.",
    staleRemove: "Delete failed: someone changed this content. Refresh the page before continuing.",
    privacy: "Save failed: office landing page projects require anonymous titles and broad Kuala Lumpur, Selangor or Klang Valley locations. Check: {fields}.",
    duplicate: "Save failed: this unique value already exists. Choose another value.",
    permission: "Save failed: your account does not have permission for this action.",
    invalidStatus: "Save failed: choose one of the available status options.",
  },
} as const;
