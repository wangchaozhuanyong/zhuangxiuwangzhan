import { Loader2 } from "lucide-react";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";
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
      className={cn("rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm", className)}
    >
      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-accent" aria-hidden="true" />
      <span>{label || text.loading}</span>
    </div>
  );
}
