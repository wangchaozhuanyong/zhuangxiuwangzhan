import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type AdminPageSkeletonMode = "dashboard" | "table" | "form" | "media" | "settings";

const FieldBlock = () => (
  <div className="rounded-lg border border-border bg-card p-4">
    <Skeleton className="mb-4 h-5 w-40 max-w-full" />
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={cn("space-y-2", index === 2 && "md:col-span-2")}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className={cn("h-10 w-full", index === 2 && "h-24")} />
        </div>
      ))}
    </div>
  </div>
);

const TableBlock = () => (
  <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.6fr] gap-4 border-b border-border bg-muted/35 p-4 max-md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.6fr] gap-4 border-b border-border/70 p-4 last:border-b-0 max-md:grid-cols-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-8/12" />
        <Skeleton className="h-8 w-20 justify-self-end max-md:justify-self-start" />
      </div>
    ))}
  </div>
);

const CardGrid = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-28 max-w-full" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const MediaGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export default function AdminPageSkeleton({
  mode = "table",
  label,
  className,
}: {
  mode?: AdminPageSkeletonMode;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn("space-y-5", className)}>
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {mode === "dashboard" && (
        <>
          <CardGrid />
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <TableBlock />
            <FieldBlock />
          </div>
        </>
      )}

      {mode === "table" && (
        <>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-10 w-full md:w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
          <TableBlock />
        </>
      )}

      {mode === "form" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <FieldBlock />
            <FieldBlock />
          </div>
          <div className="space-y-4">
            <CardGrid count={1} />
            <FieldBlock />
          </div>
        </div>
      )}

      {mode === "media" && (
        <>
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <MediaGrid />
        </>
      )}

      {mode === "settings" && (
        <>
          <CardGrid count={3} />
          <div className="grid gap-5 xl:grid-cols-2">
            <FieldBlock />
            <TableBlock />
          </div>
        </>
      )}
    </div>
  );
}
