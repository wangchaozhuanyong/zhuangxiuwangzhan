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
  const valueLabel = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const card = (
    <Card
      className={cn(
        "group min-h-[8.25rem] overflow-hidden rounded-xl border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="relative p-5 pr-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/70 via-accent/20 to-transparent opacity-70" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{value}</p>
          </div>
          {icon && (
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition-colors group-hover:border-accent/35 group-hover:text-accent">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative">
      {href ? (
        <Link
          to={href}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={valueLabel ? `${label}: ${valueLabel}` : label}
        >
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
