import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Breadcrumb = { label: string; href?: string };

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((bc, idx) => (
            <span key={`${bc.label}-${idx}`} className="flex items-center gap-1">
              {idx > 0 && <span className="opacity-60">/</span>}
              {bc.href ? (
                <Button asChild variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                  <Link to={bc.href}>{bc.label}</Link>
                </Button>
              ) : (
                <span className={cn(idx === breadcrumbs.length - 1 ? "text-foreground" : "")}>{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-start gap-2">{actions}</div>}
      </div>
    </div>
  );
}

