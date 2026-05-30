import { ReactNode } from "react";
import { Link } from "react-router-dom";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminStatCard({
  label,
  value,
  href,
  icon,
  helpText,
  className,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  icon?: ReactNode;
  helpText?: string | null;
  className?: string;
}) {
  const card = (
    <Card className={cn("hover-lift", className)}>
      <CardContent className="p-5 pr-12">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold leading-none">{value}</p>
          </div>
          {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative">
      {href ? (
        <Link to={href} className="block">
          {card}
        </Link>
      ) : (
        card
      )}
      <div className="absolute right-3 top-3">
        <AdminHelpTip text={helpText} />
      </div>
    </div>
  );
}
