import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicUpdateNoticeText } from "@/i18n/publicUpdateNoticeText";
import {
  createCurrentPublicVersion,
  fetchPublicVersion,
  hasNewPublicVersion,
  type PublicVersion,
} from "@/lib/publicVersion";

const PUBLIC_VERSION_CHECK_INTERVAL_MS = 30 * 1000;

const PublicUpdateNotice = () => {
  const { language } = useLanguage();
  const text = publicUpdateNoticeText[language];
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const baselineRef = useRef<PublicVersion | null>(null);
  const pendingRef = useRef<PublicVersion | null>(null);
  const updateAvailableRef = useRef(false);

  useEffect(() => {
    let active = true;
    let requestController: AbortController | null = null;
    let requestInFlight = false;

    updateAvailableRef.current = false;
    pendingRef.current = null;
    setUpdateAvailable(false);
    baselineRef.current = createCurrentPublicVersion();

    const checkForUpdate = async (force = false) => {
      if (requestInFlight || updateAvailableRef.current) return;
      if (!force && document.visibilityState === "hidden") return;

      requestInFlight = true;
      requestController = new AbortController();

      try {
        const latest = await fetchPublicVersion(requestController.signal);
        if (!active) return;

        const baseline = baselineRef.current;
        if (!baseline) {
          baselineRef.current = latest;
          return;
        }

        if (hasNewPublicVersion(baseline, latest)) {
          pendingRef.current = latest;
          updateAvailableRef.current = true;
          setUpdateAvailable(true);
          return;
        }

        baselineRef.current = latest;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Version checks are best-effort and must never block the public site.
      } finally {
        requestInFlight = false;
      }
    };

    void checkForUpdate(true);
    const intervalId = window.setInterval(() => void checkForUpdate(), PUBLIC_VERSION_CHECK_INTERVAL_MS);
    const onPageActive = () => void checkForUpdate();
    window.addEventListener("focus", onPageActive);
    document.addEventListener("visibilitychange", onPageActive);

    return () => {
      active = false;
      requestController?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onPageActive);
      document.removeEventListener("visibilitychange", onPageActive);
    };
  }, []);

  if (!updateAvailable) return null;

  const dismiss = () => {
    if (pendingRef.current) baselineRef.current = pendingRef.current;
    pendingRef.current = null;
    updateAvailableRef.current = false;
    setUpdateAvailable(false);
  };

  return (
    <aside
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[120] mx-auto max-w-xl rounded-2xl border border-white/15 bg-[#111411]/95 p-4 text-white shadow-2xl backdrop-blur-md md:bottom-6 md:flex md:items-center md:gap-5 md:px-5"
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-wide">{text.title}</p>
        <p className="mt-1 text-sm leading-6 text-white/70">{text.description}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 md:mt-0 md:shrink-0">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-full bg-[#d5ff3f] px-5 text-sm font-semibold text-[#111411] transition hover:bg-[#e2ff78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:flex-none"
          onClick={() => window.location.reload()}
        >
          {text.refresh}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full px-4 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={dismiss}
        >
          {text.dismiss}
        </button>
      </div>
    </aside>
  );
};

export default PublicUpdateNotice;
