import { useEffect } from "react";
import { registerNavigationProtection, shouldWarnBeforeUnload } from "@/lib/navigationProtection";

const DEFAULT_MESSAGE = "页面里还有没保存的内容，离开后这些修改会丢失。";

export function useUnsavedChangesWarning(enabled: boolean, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!enabled) return;
    const unregister = registerNavigationProtection();

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeUnload()) return;
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => { unregister(); window.removeEventListener("beforeunload", onBeforeUnload); };
  }, [enabled, message]);
}
