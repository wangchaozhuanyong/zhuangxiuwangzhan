import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { cn } from "@/lib/utils";

type Breadcrumb = { label: string; href?: string };

export default function AdminPageHeader({
  title,
  description,
  helpText,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: ReactNode;
  helpText?: string | null;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-5 min-w-0 overflow-hidden rounded-lg border border-border bg-card px-4 py-4 shadow-sm sm:mb-6 sm:rounded-xl sm:px-6 sm:py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-transparent" aria-hidden="true" />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="relative mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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

      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex min-w-0 items-start gap-2 text-xl font-semibold leading-tight tracking-normal text-foreground sm:items-center sm:text-3xl">
            <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
            <AdminHelpTip text={helpText} />
          </h1>
          {description && <div className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
        </div>
        {actions && (
          <div
            data-admin-mobile-actions
            className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end [&_a]:min-h-10 [&_button]:min-h-10"
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
