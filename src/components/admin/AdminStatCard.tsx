import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminStatCard({
  label,
  value,
  href,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const content = (
    <Card className={cn("hover-lift", className)}>
      <CardContent className="p-5">
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

  if (href) return <Link to={href}>{content}</Link>;
  return content;
}

