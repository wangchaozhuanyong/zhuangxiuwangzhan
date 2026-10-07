import { useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MobileActionBar from "@/components/MobileActionBar";
import { SchemeAMobileDock } from "@/components/scheme-a/SchemeAPublicChrome";
import { usePublicChrome } from "@/contexts/PublicChromeContext";

type MobileDockMode = "navigation" | "actions" | "hidden";

const isEditableTarget = (target: EventTarget | null) => {
  if (target instanceof HTMLInputElement) {
    return !target.disabled && !target.readOnly
      && ["text", "search", "email", "tel", "url", "password", "number"].includes(target.type);
  }
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  if (!(target instanceof HTMLElement)) return false;
  const editable = target.closest("[contenteditable]");
  return editable !== null && editable.getAttribute("contenteditable") !== "false";
};

/** 保持两个底栏同时挂载，通过滚动方向在同一高度内互斥切换。 */
const MobileBottomDock = () => {
  const { key: routeKey } = useLocation();
  const { menuOpen, showMobileActionBar } = usePublicChrome();
  const [formControlFocused, setFormControlFocused] = useState(false);
  const mode: MobileDockMode = menuOpen || formControlFocused
    ? "hidden"
    : showMobileActionBar
      ? "actions"
      : "navigation";

  useLayoutEffect(() => {
    let focusFrame = 0;
    const syncFocusedControl = () => {
      focusFrame = 0;
      setFormControlFocused(isEditableTarget(document.activeElement));
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
      setFormControlFocused(isEditableTarget(event.target));
    };
    const handleFocusOut = () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(syncFocusedControl);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    // A route can remove the focused field without emitting focusout.
    syncFocusedControl();

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, [routeKey]);

  const navigationActive = mode === "navigation";
  const actionsActive = mode === "actions";

  return (
    <div className="scheme-a-mobile-switcher" data-mode={mode} data-testid="mobile-bottom-dock">
      <div
        className="scheme-a-mobile-switcher__panel scheme-a-mobile-switcher__panel--navigation"
        data-active={navigationActive ? "true" : "false"}
        aria-hidden={!navigationActive}
        {...(!navigationActive ? { inert: "" } : {})}
      >
        <SchemeAMobileDock />
      </div>
      <div
        className="scheme-a-mobile-switcher__panel scheme-a-mobile-switcher__panel--actions"
        data-active={actionsActive ? "true" : "false"}
        aria-hidden={!actionsActive}
        {...(!actionsActive ? { inert: "" } : {})}
      >
        <MobileActionBar />
      </div>
    </div>
  );
};

export default MobileBottomDock;
