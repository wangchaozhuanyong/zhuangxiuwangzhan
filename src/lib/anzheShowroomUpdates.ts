import { detectLanguageFromTags } from "../i18n/languageDetection";
import { publicUpdateNoticeText } from "../i18n/publicUpdateNoticeText";
import { reloadDocumentSafely } from "./navigationProtection";
import { hasNewPublicVersion, type PublicVersion } from "./publicVersion";
import { subscribePublicVersion } from "./publicVersionChecks";

/** Called once after the standalone document is parsed. Static previews have no deployment identity. */
export function initializeShowroomUpdates() {
  const version = document.querySelector<HTMLMetaElement>('meta[name="flashcast-deployment-version"]')?.content;
  const notice = document.querySelector<HTMLElement>("#showroom-update");
  if (!version || !notice) return;
  const title = notice.querySelector("strong");
  const refresh = notice.querySelector<HTMLButtonElement>("[data-update-refresh]");
  const dismiss = notice.querySelector<HTMLButtonElement>("[data-update-dismiss]");
  if (!title || !refresh || !dismiss) return;

  let baseline: PublicVersion = { deploymentVersion: decodeURIComponent(version), contentVersion: "" };
  let pending: PublicVersion | null = null;
  const render = () => {
    if (!pending) return;
    const copy = publicUpdateNoticeText[detectLanguageFromTags([document.documentElement.lang])];
    title.textContent = copy.title;
    refresh.textContent = copy.refresh;
    dismiss.textContent = copy.dismiss;
  };
  const translation = new MutationObserver(render);
  const stop = subscribePublicVersion(latest => {
    if (!hasNewPublicVersion(baseline, latest)) return;
    pending = latest;
    render();
    notice.hidden = false;
  }, () => pending !== null);

  const accept = () => void reloadDocumentSafely();
  const postpone = () => {
    if (pending) baseline = pending;
    pending = null;
    notice.hidden = true;
  };
  translation.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  refresh.addEventListener("click", accept);
  dismiss.addEventListener("click", postpone);
  return () => {
    stop();
    translation.disconnect();
    refresh.removeEventListener("click", accept);
    dismiss.removeEventListener("click", postpone);
  };
}
