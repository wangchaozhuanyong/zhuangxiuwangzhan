import { useAdminDefaultContentSeed } from "@/lib/adminDefaultContent";

type AdminDefaultContentSeedStatusProps = {
  formatError: (message: string) => string;
};

export default function AdminDefaultContentSeedStatus({ formatError }: AdminDefaultContentSeedStatusProps) {
  const seedSummary = useAdminDefaultContentSeed({ enabled: true });

  if (seedSummary.status !== "error") return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {formatError(seedSummary.error || "Unknown error")}
    </div>
  );
}
