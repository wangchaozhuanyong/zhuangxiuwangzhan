import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminHelpTip from "@/components/admin/AdminHelpTip";

export default function AdminFormSection({
  title,
  description,
  helpText,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  description?: ReactNode;
  helpText?: string | null;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsible) {
    return (
      <details open={defaultOpen} className={cn("group rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
        <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal">
                <span>{title}</span>
                <AdminHelpTip text={helpText} />
              </h2>
              {description && <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    );
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal text-foreground">
          <span>{title}</span>
          <AdminHelpTip text={helpText} />
        </h2>
        {description && <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}
