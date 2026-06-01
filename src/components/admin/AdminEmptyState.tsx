import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm", className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2 [&_button]:min-h-10 [&_a]:min-h-10">{action}</div>}
    </div>
  );
}
