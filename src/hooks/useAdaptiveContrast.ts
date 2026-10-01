import { useLayoutEffect, type RefObject } from "react";
import { observeAdaptiveContrast } from "@/lib/adaptiveContrast";

export const useAdaptiveContrast = (root: RefObject<HTMLElement>) => {
  useLayoutEffect(() => root.current ? observeAdaptiveContrast(root.current) : undefined, [root]);
};
