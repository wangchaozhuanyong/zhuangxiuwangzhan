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
    <div className="mb-6 rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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
          <h1 className="text-2xl font-semibold leading-tight tracking-normal">{title}</h1>
          {description && <div className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">{actions}</div>}
      </div>
    </div>
  );
}
