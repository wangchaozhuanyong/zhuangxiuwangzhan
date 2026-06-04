import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AdminStickyActionBar({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sticky top-16 z-30 -mx-3 mb-5 border-b border-border bg-background/95 px-3 py-3 shadow-sm backdrop-blur sm:top-[72px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8", className)}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
        <div data-admin-mobile-actions className="flex flex-wrap items-center gap-2 [&_a]:min-h-10 [&_button]:min-h-10">{right}</div>
      </div>
    </div>
  );
}
