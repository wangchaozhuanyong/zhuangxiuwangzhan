import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { adminSharedText } from "@/i18n/adminSharedText";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import {
  canAdminRoleAccess,
  getAdminAllowedRoleText,
  getAdminRoleLabel,
  type AdminAllowedRoles,
} from "@/lib/adminRoleAccess";
import { getAdminLang } from "@/lib/adminLocale";

export default function AdminRoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: AdminAllowedRoles;
  children: ReactNode;
}) {
  const { role } = useAdminAuth();
  const text = adminSharedText[getAdminLang()];

  if (canAdminRoleAccess(role, allowedRoles)) return <>{children}</>;

  return (
    <AdminEmptyState
      className="mx-auto max-w-3xl"
      title={text.roleGateTitle}
      description={
        <div className="space-y-2">
          <p>
            {text.roleCurrent}<span className="font-semibold text-foreground">{getAdminRoleLabel(role)}</span>{text.roleCurrentSuffix}
          </p>
          <p>
            {text.roleRequired}<span className="font-semibold text-foreground">{getAdminAllowedRoleText(allowedRoles)}</span>{text.roleRequiredSuffix}
          </p>
          <p>{text.roleDescription}</p>
        </div>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-lg">
            <Link to="/admin/dashboard">{text.backDashboard}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/admin">{text.backLogin}</Link>
          </Button>
        </div>
      }
    />
  );
}

export function AdminReadOnlyNotice({ className }: { className?: string }) {
  const text = adminSharedText[getAdminLang()];

  return (
    <div className={className}>
      <div className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-6 admin-tone-warning">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{text.readOnlyNotice}</span>
      </div>
    </div>
  );
}
