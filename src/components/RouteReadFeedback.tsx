import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { notifyManager, useIsFetching, useQueryClient, type Query } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { interactionText } from "@/i18n/interactionText";
import { useAdminLang } from "@/lib/adminPreferences";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

export default function RouteReadFeedback({ surface }: { surface: "public" | "admin" }) {
  const client = useQueryClient();
  const { language } = useLanguage();
  const adminLanguage = useAdminLang();
  const location = useLocation();
  const text = interactionText[surface === "admin" ? adminLanguage : language];
  const prefix = surface === "admin" ? "admin" : "published";
  const active = useCallback((query: Query) => (query.queryKey[0] === prefix || query.queryKey[0] === "site-settings") && query.getObserversCount() > 0, [prefix]);
  const count = useIsFetching({ predicate: active });
  const pending = count > 0;
  const [visible, setVisible] = useState(false);
  const [slow, setSlow] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  // Queries can be created during a sibling's render. Follow TanStack's
  // external-store subscription pattern instead of synchronously setting state.
  const subscribe = useCallback((onStoreChange: () => void) =>
    client.getQueryCache().subscribe(notifyManager.batchCalls(onStoreChange)), [client]);
  const readFailure = useCallback(() => client.getQueryCache().findAll({ predicate: active })
    .reduce((state, query) => query.state.status !== "error" ? state
      : Math.max(state, query.state.data === undefined ? 2 : 1), 0), [client, active]);
  const failure = useSyncExternalStore(subscribe, readFailure, readFailure);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  useEffect(() => {
    setVisible(false); setSlow(false);
    if (!pending) return;
    const feedback = window.setTimeout(() => setVisible(true), INTERACTION_POLICY.feedbackDelay);
    const recovery = window.setTimeout(() => setSlow(true), INTERACTION_POLICY.recoveryDelay);
    return () => { window.clearTimeout(feedback); window.clearTimeout(recovery); };
  }, [pending, location.pathname]);
  const failedRefresh = failure > 0;
  const initialFailure = failure === 2;
  // Public reads keep their page/list loading state and aria-busy feedback.
  // A routine background request must not add a floating notice over navigation.
  // Failures and offline recovery still use this shared feedback on both surfaces.
  if (online && !failedRefresh && (surface === "public" || !pending || !visible)) return null;
  // Initial public loading has its own single owner, including its recovery UI.
  if (surface === "public" && document.documentElement.dataset.publicBoot) return null;
  const retry = () => void client.refetchQueries({ predicate: (query) => active(query) && query.state.fetchStatus !== "fetching" });
  return <aside data-interaction-feedback={surface} role="status" aria-live="polite"
    className={`${surface === "public" ? "bottom-[calc(82px+env(safe-area-inset-bottom))] md:bottom-5" : "bottom-5"} pointer-events-none fixed left-1/2 z-[125] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-lg`}>
    <span>{!online ? text.offline : initialFailure ? text.loadingFailed : failedRefresh ? text.refreshFailed : slow ? text.slow : text.refreshing}</span>
    {(slow || failedRefresh) && online && <button data-ui="button" type="button" className="pointer-events-auto shrink-0 underline" onClick={retry} disabled={pending}>{text.retry}</button>}
  </aside>;
}
