import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";
const sessionSearch = new Map<string, string>();
/** Filters and page are shareable; search text stays only in this tab's memory. */
export function useAdminListingState() {
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const [search, setSearchState] = useState(() => sessionSearch.get(pathname) || "");
  const [deferredSearch, setDeferredSearch] = useState(search);
  const paramsRef = useRef(params); paramsRef.current = params;
  const update = useCallback((patch: Record<string, string | number>) => {
    const next = new URLSearchParams(paramsRef.current);
    for (const [key, value] of Object.entries(patch)) {
      if (value === "all" || value === "" || key === "page" && value === 0) next.delete(key);
      else next.set(key, String(value));
    }
    paramsRef.current = next;
    setParams(next, { replace: true });
  }, [setParams]);
  useEffect(() => {
    const value = sessionSearch.get(pathname) || "";
    setSearchState(value); setDeferredSearch(value);
  }, [pathname]);
  useEffect(() => {
    if (search === deferredSearch) return;
    const timer = setTimeout(() => { setDeferredSearch(search); update({ page: 0 }); }, INTERACTION_POLICY.searchDelay);
    return () => clearTimeout(timer);
  }, [search, deferredSearch, update]);
  const setSearch = (value: string) => { sessionSearch.set(pathname, value); setSearchState(value); };
  const rawPage = Number(params.get("page") || 0);
  const page = Number.isFinite(rawPage) ? Math.max(0, Math.floor(rawPage)) : 0;
  const setPage = (value: number) => update({ page: value });
  const filter = (key: string) => params.get(key) || "all";
  const setFilter = (key: string, value: string) => update({ [key]: value, page: 0 });
  return { search, setSearch, deferredSearch, page, setPage, filter, setFilter, update };
}
