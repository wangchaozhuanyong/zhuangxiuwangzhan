import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminLang } from "@/lib/adminPreferences";
import { reloadDocumentSafely } from "@/lib/navigationProtection";
import { subscribePublicVersion } from "@/lib/publicVersionChecks";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicUpdateNoticeText } from "@/i18n/publicUpdateNoticeText";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import {
  createCurrentPublicVersion,
  hasNewPublicVersion,
  isPublicVersionEndpointAvailable,
  type PublicVersion,
} from "@/lib/publicVersion";

const PublicUpdateNotice = ({ surface = "public" }: { surface?: "public" | "admin" }) => {
  const queryClient = useQueryClient();
  const adminLanguage = useAdminLang();
  const { language } = useLanguage();
  const { menuOpen, hasOpenDialog } = usePublicChrome();
  const text = publicUpdateNoticeText[surface === "admin" ? adminLanguage : language];
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const baselineRef = useRef<PublicVersion | null>(null);
  const pendingRef = useRef<PublicVersion | null>(null);
  const updateAvailableRef = useRef(false);

  useEffect(() => {
    if (!isPublicVersionEndpointAvailable(window.location.hostname)) return;

    updateAvailableRef.current = false;
    pendingRef.current = null;
    setUpdateAvailable(false);
    baselineRef.current = createCurrentPublicVersion();

    return subscribePublicVersion(async latest => {
      const baseline = baselineRef.current;
      if (!baseline) {
        baselineRef.current = latest;
        return;
      }

      if (baseline.contentVersion && latest.contentVersion && baseline.contentVersion !== latest.contentVersion) {
        await Promise.all([queryClient.invalidateQueries({ queryKey: ["published"] }), queryClient.invalidateQueries({ queryKey: ["site-settings"] })]);
      }
      if (hasNewPublicVersion(baseline, { ...latest, contentVersion: baseline.contentVersion })) {
        pendingRef.current = latest;
        updateAvailableRef.current = true;
        setUpdateAvailable(true);
        return;
      }

      baselineRef.current = latest;
    }, () => updateAvailableRef.current);
  }, [queryClient]);

  if (!updateAvailable || menuOpen || hasOpenDialog) return null;

  const dismiss = () => {
    if (pendingRef.current) baselineRef.current = pendingRef.current;
    pendingRef.current = null;
    updateAvailableRef.current = false;
    setUpdateAvailable(false);
  };

  return (
    <aside
      className={`${surface === "admin" ? "bottom-4" : "public-update-notice"} fixed inset-x-4 z-[115] mx-auto max-w-xl rounded-2xl border border-white/15 bg-[#111411]/95 p-4 text-white shadow-2xl backdrop-blur-md md:flex md:items-center md:gap-5 md:px-5`}
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
          onClick={() => void reloadDocumentSafely()}
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
