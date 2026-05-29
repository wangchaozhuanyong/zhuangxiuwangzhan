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
    <section className={cn("rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        {description && <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</div>}
      </div>
      {children}
    </section>
  );
}
