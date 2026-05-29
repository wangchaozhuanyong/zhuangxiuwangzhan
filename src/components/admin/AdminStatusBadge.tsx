import { Badge } from "@/components/ui/badge";
import { adminStatusLabel } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  status?: string | null;
  className?: string;
  /** 状态所属表，如 leads、quote_requests；内容项用 default */
  context?: string;
};

const mapVariant = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (["published", "active", "done", "won", "closed", "paid", "success", "completed", "converted", "accepted"].includes(s)) {
    return "default";
  }
  if (["draft", "pending", "todo", "new", "queued", "processing", "contacted"].includes(s)) return "secondary";
  if (["failed", "error", "blocked", "lost", "invalid", "rejected", "spam", "archived"].includes(s)) return "destructive";
  return "outline";
};

export default function AdminStatusBadge({ status, className, context = "default" }: AdminStatusBadgeProps) {
  const label = status ? adminStatusLabel(context, status) : "—";
  return (
    <Badge variant={mapVariant(status) as "default" | "secondary" | "destructive" | "outline"} className={cn("whitespace-nowrap", className)}>
      {label}
    </Badge>
  );
}
