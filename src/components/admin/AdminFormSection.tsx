import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AdminFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}

