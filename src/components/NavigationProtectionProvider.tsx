import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useBlocker, useLocation } from "react-router-dom";
import { interactionText } from "@/i18n/interactionText";
import { getLanguageFromPath, stripLanguagePrefix } from "@/i18n/routes";
import { useAdminLang } from "@/lib/adminPreferences";
import { approveDocumentNavigation, hasProtectedChanges, NAVIGATION_CONFIRM_EVENT, shouldBlockProtectedNavigation, shouldWarnBeforeUnload, subscribeNavigationProtection, type NavigationConfirmRequest } from "@/lib/navigationProtection";
import NavigationProtectionDialog from "@/components/NavigationProtectionDialog";

export default function NavigationProtectionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const adminLanguage = useAdminLang();
  const text = interactionText[location.pathname.startsWith("/admin") ? adminLanguage : getLanguageFromPath(location.pathname) || "en"];
  const protectedChanges = useSyncExternalStore(subscribeNavigationProtection, hasProtectedChanges, () => false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => protectedChanges && shouldBlockProtectedNavigation() &&
    stripLanguagePrefix(currentLocation.pathname) !== stripLanguagePrefix(nextLocation.pathname));
  const [request, setRequest] = useState<NavigationConfirmRequest | null>(null);
  const requestRef = useRef<NavigationConfirmRequest | null>(null);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeUnload()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirm = (event: Event) => {
      // Only one decision may own the dialog; a second action cannot supersede it.
      const next = (event as CustomEvent<NavigationConfirmRequest>).detail;
      if (requestRef.current || blocker.state === "blocked") { next.resolve(false); return; }
      requestRef.current = next;
      setRequest(next);
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener(NAVIGATION_CONFIRM_EVENT, confirm);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener(NAVIGATION_CONFIRM_EVENT, confirm);
    };
  }, [blocker.state]);
  useEffect(() => () => { requestRef.current?.resolve(false); }, []);

  const finish = (approved: boolean) => {
    window.dispatchEvent(new CustomEvent("flashcast-navigation-decision", { detail: { approved } }));
    if (request) { request.resolve(approved); requestRef.current = null; setRequest(null); }
    else if (blocker.state === "blocked") { if (approved) { if (location.pathname.startsWith("/admin") !== blocker.location.pathname.startsWith("/admin")) approveDocumentNavigation(); blocker.proceed(); } else blocker.reset(); }
  };
  return <>
    {children}
    {Boolean(request) || blocker.state === "blocked" ? <NavigationProtectionDialog text={text} finish={finish} /> : null}
  </>;
}
