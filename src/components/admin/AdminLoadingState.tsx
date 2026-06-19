import { Loader2 } from "lucide-react";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminLoadingState({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const text = adminSharedText[getAdminLang()];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("overflow-hidden rounded-lg border border-border bg-card text-sm text-muted-foreground shadow-sm", className)}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/25 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        </span>
        <span className="font-medium text-foreground">{label || text.loading}</span>
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
