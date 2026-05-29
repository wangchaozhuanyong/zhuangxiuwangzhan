import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AdminHelpTipProps = {
  text?: string | null;
  className?: string;
};

export default function AdminHelpTip({ text, className }: AdminHelpTipProps) {
  if (!text) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label="使用说明"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs leading-5">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminFieldLabel({
  label,
  help,
  className,
}: {
  label: string;
  help?: string | null;
  className?: string;
}) {
  return (
    <label className={cn("mb-1 flex items-center gap-1.5 text-sm font-medium", className)}>
      <span>{label}</span>
      <AdminHelpTip text={help} />
    </label>
  );
}
