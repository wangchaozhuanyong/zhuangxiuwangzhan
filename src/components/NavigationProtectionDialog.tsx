import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { interactionText } from "@/i18n/interactionText";

/** Native modal keeps the guard available before any optional UI chunk arrives. */
export default function NavigationProtectionDialog({ text, finish }: { text: (typeof interactionText)["en"] | (typeof interactionText)["zh"]; finish: (approved: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    if (typeof node.showModal === "function") node.showModal();
    else node.setAttribute("open", "");
    node.querySelector<HTMLButtonElement>("[data-stay]")?.focus();
    return () => { if (typeof node.close === "function") node.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={dialog} role="dialog" aria-modal="true" aria-labelledby="navigation-protection-title" aria-describedby="navigation-protection-description"
    className="fixed inset-0 z-[180] m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/80"
    onCancel={(event) => { event.preventDefault(); finish(false); }}
    onClick={(event) => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) finish(false); }}>
    <h2 id="navigation-protection-title" className="text-lg font-semibold">{text.leaveTitle}</h2>
    <p id="navigation-protection-description" className="mt-2 text-sm text-muted-foreground">{text.leaveBody}</p>
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button data-stay variant="outline" onClick={() => finish(false)}>{text.stay}</Button><Button variant="destructive" onClick={() => finish(true)}>{text.leave}</Button></div>
  </dialog>, document.body);
}
