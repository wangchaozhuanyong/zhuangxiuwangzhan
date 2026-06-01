import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import {
  canAdminRoleAccess,
  getAdminAllowedRoleText,
  getAdminRoleLabel,
  type AdminAllowedRoles,
} from "@/lib/adminRoleAccess";

export default function AdminRoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: AdminAllowedRoles;
  children: ReactNode;
}) {
  const { role } = useAdminAuth();

  if (canAdminRoleAccess(role, allowedRoles)) return <>{children}</>;

  return (
    <AdminEmptyState
      className="mx-auto max-w-3xl"
      title="当前角色无权访问此页面"
      description={
        <div className="space-y-2">
          <p>
            你的当前角色是：<span className="font-semibold text-foreground">{getAdminRoleLabel(role)}</span>。
          </p>
          <p>
            这个页面需要：<span className="font-semibold text-foreground">{getAdminAllowedRoleText(allowedRoles)}</span>。
          </p>
          <p>为了避免误操作，系统不会展示这里的编辑入口。可以返回总览或打开自己角色可用的菜单。</p>
        </div>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-lg">
            <Link to="/admin/dashboard">返回总览</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/admin">返回登录页</Link>
          </Button>
        </div>
      }
    />
  );
}

export function AdminReadOnlyNotice({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>当前账号是只读角色，可以查看内容，但不能保存、删除、更新状态或新增跟进。</span>
      </div>
    </div>
  );
}
