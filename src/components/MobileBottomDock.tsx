import { useEffect, useState } from "react";
import MobileActionBar from "@/components/MobileActionBar";
import { SchemeAMobileDock } from "@/components/scheme-a/SchemeAPublicChrome";
import { usePublicChrome } from "@/contexts/PublicChromeContext";

type MobileDockMode = "navigation" | "actions" | "hidden";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement
  && target.matches("input, textarea, select, [contenteditable='true']");

/** 保持两个底栏同时挂载，通过滚动方向在同一高度内互斥切换。 */
const MobileBottomDock = () => {
  const { menuOpen, showMobileActionBar } = usePublicChrome();
  const [formControlFocused, setFormControlFocused] = useState(false);
  const mode: MobileDockMode = menuOpen || formControlFocused
    ? "hidden"
    : showMobileActionBar
      ? "actions"
      : "navigation";

  useEffect(() => {
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

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, []);

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
