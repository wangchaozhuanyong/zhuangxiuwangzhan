import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { adminDefaultContentSeedText } from "@/i18n/adminDefaultContentSeedText";
import { getAdminLang } from "@/lib/adminLocale";
import { useAdminDefaultContentSeed } from "@/lib/adminDefaultContent";

type AdminDefaultContentSeedStatusProps = {
  formatError: (message: string) => string;
};

export default function AdminDefaultContentSeedStatus({ formatError }: AdminDefaultContentSeedStatusProps) {
  const seedSummary = useAdminDefaultContentSeed();
  const copy = adminDefaultContentSeedText[getAdminLang()].sync;
  const resultText =
    seedSummary.status === "done"
      ? seedSummary.inserted || seedSummary.updated
        ? copy.completed
            .replace("{inserted}", String(seedSummary.inserted))
            .replace("{updated}", String(seedSummary.updated))
        : copy.noChanges
      : "";

  const runSync = async () => {
    const confirmed = await adminConfirm({
      title: copy.confirmTitle,
      description: copy.confirmDescription,
      confirmLabel: copy.confirmLabel,
    });
    if (confirmed) await seedSummary.run();
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        <p
          className={seedSummary.status === "error" ? "mt-2 text-sm text-destructive" : "mt-2 text-sm text-muted-foreground"}
          aria-live="polite"
        >
          {seedSummary.status === "error" ? formatError(seedSummary.error || "Unknown error") : resultText}
        </p>
      </div>
      <Button type="button" variant="outline" className="shrink-0" disabled={seedSummary.status === "running"} onClick={() => void runSync()}>
        {seedSummary.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
        {seedSummary.status === "running" ? copy.running : copy.action}
      </Button>
    </div>
  );
}
