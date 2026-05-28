import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  status?: string | null;
  className?: string;
};

const mapVariant = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (["published", "active", "done", "won", "closed", "paid", "success"].includes(s)) return "default";
  if (["draft", "pending", "todo", "new"].includes(s)) return "secondary";
  if (["failed", "error", "blocked", "lost", "invalid", "rejected"].includes(s)) return "destructive";
  return "outline";
};

const mapLabel = (status?: string | null) => {
  if (!status) return "—";
  return status;
};

export default function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  return (
    <Badge variant={mapVariant(status) as any} className={cn("whitespace-nowrap", className)}>
      {mapLabel(status)}
    </Badge>
  );
}

