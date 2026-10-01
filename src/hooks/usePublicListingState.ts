import { useSearchParams } from "react-router-dom";
import { ELEMENT_SCROLL_INTENT } from "@/lib/publicScrollRestoration";

/** URL-backed selection survives detail/back navigation and uses the shared route handoff. */
export function usePublicListingState<T extends string>(filters: readonly T[], defaultFilter: T, pageSize: number) {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("filter") as T;
  const filter = filters.includes(candidate) ? candidate : defaultFilter;
  const count = Number(params.get("shown"));
  const visibleCount = Number.isSafeInteger(count) && count >= pageSize ? count : pageSize;
  const setFilter = (value: T, scrollTarget?: string) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    if (value === defaultFilter) next.delete("filter");
    else next.set("filter", value);
    next.delete("shown");
    return next;
  }, scrollTarget ? { state: { scrollIntent: ELEMENT_SCROLL_INTENT, scrollTarget } } : undefined);
  const setVisibleCount = (update: (count: number) => number) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set("shown", String(update(visibleCount)));
    return next;
  });
  return { filter, setFilter, visibleCount, setVisibleCount };
}
