import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AdminRouteTransition({
  routeKey,
  busy,
  children,
}: {
  routeKey: string;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      key={routeKey}
      data-admin-route-frame
      data-busy={busy ? "true" : undefined}
      aria-busy={busy ? true : undefined}
      className={cn("min-w-0 overflow-x-clip [overflow-wrap:anywhere]", busy && "cursor-progress")}
    >
      {children}
    </div>
  );
}
