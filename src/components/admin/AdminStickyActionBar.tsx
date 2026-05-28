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
    <div className={cn("sticky top-[64px] z-30 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
        <div className="flex flex-wrap items-center gap-2">{right}</div>
      </div>
    </div>
  );
}

