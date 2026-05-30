import { ReactNode } from "react";
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
      <details open={defaultOpen} className={cn("rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal">
                <span>{title}</span>
                <AdminHelpTip text={helpText} />
              </h2>
              {description && <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
            </div>
            <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">展开/收起</span>
          </div>
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal">
          <span>{title}</span>
          <AdminHelpTip text={helpText} />
        </h2>
        {description && <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}
