import type { ComponentProps, ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth, type AdminRole } from "@/pages/admin/AdminAuthProvider";
import { getAdminAllowedRoleText, getAdminRoleLabel } from "@/lib/adminRoleAccess";
import { cn } from "@/lib/utils";

export type AdminAction =
  | "content.write"
  | "content.publish"
  | "content.archive"
  | "content.restore"
  | "content.reorder"
  | "lead.write"
  | "media.upload"
  | "settings.write"
  | "users.manage";

const actionLabels: Record<AdminAction, string> = {
  "content.write": "保存内容",
  "content.publish": "发布内容",
  "content.archive": "归档内容",
  "content.restore": "恢复版本",
  "content.reorder": "调整排序",
  "lead.write": "处理客户线索",
  "media.upload": "上传媒体",
  "settings.write": "修改系统设置",
  "users.manage": "管理后台账号",
};

const actionAllowedRoles: Record<AdminAction, AdminRole[]> = {
  "content.write": ["super_admin", "content_editor"],
  "content.publish": ["super_admin", "content_editor"],
  "content.archive": ["super_admin", "content_editor"],
  "content.restore": ["super_admin", "content_editor"],
  "content.reorder": ["super_admin", "content_editor"],
  "lead.write": ["super_admin", "lead_manager"],
  "media.upload": ["super_admin", "content_editor"],
  "settings.write": ["super_admin"],
  "users.manage": ["super_admin"],
};

export const getAdminActionInfo = (action: AdminAction, role: AdminRole | null) => {
  const allowedRoles = actionAllowedRoles[action];
  const allowed = Boolean(role && allowedRoles.includes(role));
  const allowedRoleText = getAdminAllowedRoleText(allowedRoles);
  return {
    allowed,
    actionLabel: actionLabels[action],
    allowedRoleText,
    roleLabel: getAdminRoleLabel(role),
    reason: allowed
      ? `当前角色可以${actionLabels[action]}。`
      : `当前角色不能${actionLabels[action]}。需要角色：${allowedRoleText}。`,
  };
};

export const useAdminPermission = (action: AdminAction) => {
  const { role } = useAdminAuth();
  return getAdminActionInfo(action, role);
};

export function AdminPermissionHint({
  action,
  className,
}: {
  action: AdminAction;
  className?: string;
}) {
  const info = useAdminPermission(action);
  return (
    <div className={cn("flex min-w-0 items-start gap-1.5 text-xs sm:items-center", info.allowed ? "text-muted-foreground" : "text-destructive", className)}>
      {!info.allowed && <LockKeyhole className="h-3.5 w-3.5 shrink-0" />}
      <span className="min-w-0 break-words">{info.reason}</span>
    </div>
  );
}

export function AdminActionButton({
  action,
  children,
  disabled,
  showDeniedHint = true,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  action: AdminAction;
  children: ReactNode;
  showDeniedHint?: boolean;
}) {
  const info = useAdminPermission(action);
  const isDisabled = disabled || !info.allowed;

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", typeof className === "string" && className.includes("w-full") && "w-full")} title={info.reason}>
      <Button {...props} className={className} disabled={isDisabled}>
        {!info.allowed && <LockKeyhole className="mr-2 h-4 w-4" />}
        {children}
      </Button>
      {!info.allowed && showDeniedHint && <span className="max-w-[220px] break-words text-xs leading-5 text-destructive">{info.reason}</span>}
    </span>
  );
}
