import { useLayoutEffect, useState, type RefObject } from "react";
import { observeContentFloatingEntry, observeFixedFloatingEntry } from "@/lib/floatingOcclusion";

export function useFloatingOcclusion(ref: RefObject<HTMLElement>, routeKey: string, placement: boolean | "fixed" = false, enabled = true) {
  const [obstructed, setObstructed] = useState(false);
  useLayoutEffect(() => {
    const entry = ref.current;
    if (!enabled || !entry) return;
    return placement === "fixed"
      ? observeFixedFloatingEntry(entry, setObstructed)
      : observeContentFloatingEntry(entry, placement, setObstructed);
  }, [ref, routeKey, placement, enabled]);
  return enabled && obstructed;
}
