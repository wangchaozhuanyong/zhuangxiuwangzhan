import { useEffect } from "react";

const DEFAULT_MESSAGE = "页面里还有没保存的内容，离开后这些修改会丢失。";

export function useUnsavedChangesWarning(enabled: boolean, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, message]);
}
