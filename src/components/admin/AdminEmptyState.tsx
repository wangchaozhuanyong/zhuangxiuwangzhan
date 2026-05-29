import { ReactNode } from "react";
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
    <div className={cn("rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-sm", className)}>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
