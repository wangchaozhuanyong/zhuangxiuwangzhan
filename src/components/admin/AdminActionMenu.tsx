import { useId, useState, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { adminMobileText } from "@/i18n/adminMobileText";
import { getAdminLang } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

export default function AdminActionMenu({ children, label, className, compact = false }: { children: ReactNode; label?: string; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const text = adminMobileText[getAdminLang()];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button id={triggerId} type="button" variant="outline" aria-label={label || text.more} className={cn("min-h-11 gap-2", compact && "h-11 w-11 shrink-0 px-0", className)}>
          <Ellipsis className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!compact && (label || text.more)}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel={text.close} data-admin-mobile-sheet data-admin-confirm-focus-return={triggerId} className="mx-auto max-h-[85dvh] max-w-lg rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetTitle className="pr-12">{label || text.more}</SheetTitle>
        <SheetDescription className="mt-1">{text.chooseAction}</SheetDescription>
        <div className="mt-4 grid gap-3 [&_button]:min-h-11 [&_button]:w-full [&_button]:whitespace-normal [&_a]:min-h-11 [&_a]:w-full [&_a]:whitespace-normal" onClick={(event) => {
          const action = (event.target as HTMLElement).closest("button, a");
          if (action && !action.matches(":disabled, [aria-disabled='true']")) setOpen(false);
        }}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
