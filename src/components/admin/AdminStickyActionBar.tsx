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
    <div className={cn("sticky top-[72px] z-30 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8", className)}>
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
        <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-10 [&_a]:min-h-10">{right}</div>
      </div>
    </div>
  );
}
