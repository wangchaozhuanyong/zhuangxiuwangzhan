import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  confirmVariant?: ButtonProps["variant"];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

const AdminConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  confirmVariant = "destructive",
  onOpenChange,
  onConfirm,
}: AdminConfirmDialogProps) => {
  const text = adminSharedText[getAdminLang()];

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="leading-6">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="min-h-10" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel || text.cancelDefault}
          </Button>
          <Button type="button" variant={confirmVariant} className="min-h-10" onClick={() => void onConfirm()} disabled={loading} aria-busy={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? text.processing : confirmLabel || text.confirmDefault}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminConfirmDialog;
