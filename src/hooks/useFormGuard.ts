import { useMemo } from "react";
import { emptyFormGuard } from "@/lib/formGuard";

/** Stable anti-spam token for the lifetime of the form mount. */
export function useFormGuard() {
  return useMemo(() => emptyFormGuard(), []);
}
