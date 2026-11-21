import { useEffect, useLayoutEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminLang } from "@/lib/adminPreferences";
import { mountPublicUpdateNotice } from "@/lib/mountPublicUpdateNotice";
import { createCurrentPublicVersion, isPublicVersionEndpointAvailable } from "@/lib/publicVersion";

const PublicUpdateNotice = ({ surface = "public" }: { surface?: "public" | "admin" }) => {
  const queryClient = useQueryClient();
  const adminLanguage = useAdminLang();
  const { language: publicLanguage } = useLanguage();
  const { menuOpen, hasOpenDialog } = usePublicChrome();
  const language = surface === "admin" ? adminLanguage : publicLanguage;
  const blocked = menuOpen || hasOpenDialog;
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<ReturnType<typeof mountPublicUpdateNotice> | null>(null);
  const presentation = useRef({ language, blocked });

  useLayoutEffect(() => {
    presentation.current = { language, blocked };
    instance.current?.setBlocked(blocked);
    instance.current?.setLanguage(language);
  }, [language, blocked]);

  useEffect(() => {
    if (!host.current || !isPublicVersionEndpointAvailable(window.location.hostname)) return;
    const notice = mountPublicUpdateNotice(host.current, {
      ...presentation.current,
      baseline: createCurrentPublicVersion(),
      surface,
      onContentChange: () => Promise.all([
        queryClient.invalidateQueries({ queryKey: ["published"] }),
        queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
      ]),
    });
    instance.current = notice;
    return () => {
      instance.current = null;
      notice.dispose();
    };
  }, [queryClient, surface]);

  return <div ref={host} style={{ display: "contents" }} />;
};

export default PublicUpdateNotice;
