import { useEffect, useRef, useState } from "react";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import type { ButtonProps } from "@/components/ui/button";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";

const ADMIN_CONFIRM_EVENT = "flashcast-admin-confirm";

type AdminConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
};

type AdminConfirmRequest = AdminConfirmOptions & {
  resolve: (confirmed: boolean) => void;
  focusReturnTarget: HTMLElement | null;
};

declare global {
  interface Window {
    __FLASHCAST_ADMIN_CONFIRM_READY__?: boolean;
  }
}

export const adminConfirm = (options: string | AdminConfirmOptions) => {
  const normalized: AdminConfirmOptions =
    typeof options === "string" ? { description: options } : options;

  if (typeof window === "undefined") return Promise.resolve(false);
  if (!window.__FLASHCAST_ADMIN_CONFIRM_READY__) {
    return Promise.resolve(window.confirm(normalized.description));
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // Action menus close after a click, so their child button cannot receive focus later.
  const returnId = activeElement?.closest<HTMLElement>("[data-admin-confirm-focus-return]")?.dataset.adminConfirmFocusReturn;
  const focusReturnTarget = (returnId ? document.getElementById(returnId) : null) || activeElement;

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<AdminConfirmRequest>(ADMIN_CONFIRM_EVENT, {
        detail: { ...normalized, resolve, focusReturnTarget },
      }),
    );
  });
};

const AdminConfirmProvider = () => {
  const [request, setRequest] = useState<AdminConfirmRequest | null>(null);
  const focusReturnTarget = useRef<HTMLElement | null>(null);
  const text = adminSharedText[getAdminLang()];

  useEffect(() => {
    window.__FLASHCAST_ADMIN_CONFIRM_READY__ = true;
    const onConfirm = (event: Event) => {
      const nextRequest = (event as CustomEvent<AdminConfirmRequest>).detail;
      focusReturnTarget.current = nextRequest.focusReturnTarget;
      setRequest(nextRequest);
    };
    window.addEventListener(ADMIN_CONFIRM_EVENT, onConfirm);
    return () => {
      window.__FLASHCAST_ADMIN_CONFIRM_READY__ = false;
      window.removeEventListener(ADMIN_CONFIRM_EVENT, onConfirm);
    };
  }, []);

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  return (
    <AdminConfirmDialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) close(false);
      }}
      title={request?.title || text.confirmTitle}
      description={request?.description || ""}
      confirmLabel={request?.confirmLabel || text.confirmDefault}
      cancelLabel={request?.cancelLabel || text.cancelDefault}
      confirmVariant={request?.confirmVariant || "destructive"}
      onConfirm={() => close(true)}
      onCloseAutoFocus={(event) => {
        const target = focusReturnTarget.current;
        focusReturnTarget.current = null;
        if (!target?.isConnected || target.matches(":disabled, [aria-disabled='true']")) return;
        event.preventDefault();
        target.focus({ preventScroll: true });
      }}
    />
  );
};

export default AdminConfirmProvider;
