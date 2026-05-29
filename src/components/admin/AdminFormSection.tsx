import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AdminHelpTip from "@/components/admin/AdminHelpTip";

export default function AdminFormSection({
  title,
  description,
  helpText,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  helpText?: string | null;
  children: ReactNode;
  className?: string;
}) {
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
