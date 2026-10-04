import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminAlertTone = "info" | "success" | "warning" | "error";

const toneClassName: Record<AdminAlertTone, string> = {
  info: "admin-tone-info",
  success: "admin-tone-success",
  warning: "admin-tone-warning",
  error: "admin-tone-error",
};

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export default function AdminAlert({
  tone = "info",
  children,
  className,
}: {
  tone?: AdminAlertTone;
  children: ReactNode;
  className?: string;
}) {
  const Icon = toneIcon[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn("flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-6", toneClassName[tone], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
