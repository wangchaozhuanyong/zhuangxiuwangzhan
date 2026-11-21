import { detectLanguageFromTags } from "../i18n/languageDetection";
import { mountPublicUpdateNotice } from "./mountPublicUpdateNotice";
import { isPublicVersionEndpointAvailable } from "./publicVersion";

/** Bind the shared notice to an edge-stamped static document, without starting the showroom loader. */
export function initializeShowroomUpdates() {
  const version = document.querySelector<HTMLMetaElement>('meta[name="flashcast-deployment-version"]')?.content;
  if (!version || !isPublicVersionEndpointAvailable(location.hostname)) return;

  const currentLanguage = () => detectLanguageFromTags([document.documentElement.lang]);
  const hasOpenLayer = () => !!document.querySelector('dialog[open], #quick-contact [aria-expanded="true"]');
  let language = currentLanguage();
  let blocked = hasOpenLayer();
  const host = document.createElement("div");
  document.body.append(host);
  const notice = mountPublicUpdateNotice(host, {
    baseline: { deploymentVersion: decodeURIComponent(version), contentVersion: "" },
    language,
    blocked,
  });

  const observer = new MutationObserver(() => {
    const nextLanguage = currentLanguage();
    if (language !== nextLanguage) {
      language = nextLanguage;
      notice.setLanguage(language);
    }
    const nextBlocked = hasOpenLayer();
    if (blocked !== nextBlocked) {
      blocked = nextBlocked;
      notice.setBlocked(blocked);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "aria-expanded"] });
  return () => {
    observer.disconnect();
    notice.dispose();
    host.remove();
  };
}
