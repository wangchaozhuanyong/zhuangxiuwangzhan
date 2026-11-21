import type { Language } from "../i18n/languageDetection";
import { publicUpdateNoticeText } from "../i18n/publicUpdateNoticeText";
import styles from "../styles/components/public-update-notice.css?raw";
import { reloadDocumentSafely } from "./navigationProtection";
import { hasNewPublicVersion, type PublicVersion } from "./publicVersion";
import { subscribePublicVersion } from "./publicVersionChecks";

interface UpdateNoticeOptions {
  baseline: PublicVersion;
  language: Language;
  surface?: "public" | "admin";
  onContentChange?: () => Promise<unknown> | void;
  blocked?: boolean;
}

/** One release notification for both the React shell and standalone public documents. */
export function mountPublicUpdateNotice(host: HTMLElement, options: UpdateNoticeOptions) {
  const doc = host.ownerDocument;
  const notice = doc.createElement("aside");
  notice.className = options.surface === "admin"
    ? "fc-update-notice fc-update-notice--admin"
    : "fc-update-notice public-update-notice";
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");

  const copy = doc.createElement("div");
  copy.className = "fc-update-notice__copy";
  const title = doc.createElement("p");
  title.className = "fc-update-notice__title";
  const description = doc.createElement("p");
  description.className = "fc-update-notice__description";
  copy.append(title, description);

  const actions = doc.createElement("div");
  actions.className = "fc-update-notice__actions";
  const refresh = doc.createElement("button");
  refresh.type = "button";
  refresh.setAttribute("data-update-refresh", "");
  const dismiss = doc.createElement("button");
  dismiss.type = "button";
  dismiss.setAttribute("data-update-dismiss", "");
  actions.append(refresh, dismiss);
  notice.append(copy, actions);

  const stylesheet = doc.createElement("style");
  stylesheet.textContent = styles;
  let { baseline, language, blocked } = options;
  let pending: PublicVersion | null = null;
  let disposed = false;

  function render() {
    if (disposed || !pending || blocked) {
      notice.remove();
      return;
    }

    const text = publicUpdateNoticeText[language];
    title.textContent = text.title;
    description.textContent = text.description;
    refresh.textContent = text.refresh;
    dismiss.textContent = text.dismiss;
    if (!stylesheet.isConnected) doc.head.append(stylesheet);
    if (!notice.parentNode) host.append(notice);
  }

  refresh.onclick = async () => {
    refresh.disabled = true;
    try {
      await reloadDocumentSafely();
    } finally {
      refresh.disabled = false;
    }
  };
  dismiss.onclick = () => {
    if (pending) baseline = pending;
    pending = null;
    render();
  };

  const unsubscribe = subscribePublicVersion(async latest => {
    const observed = {
      deploymentVersion: latest.deploymentVersion || baseline.deploymentVersion,
      contentVersion: latest.contentVersion || baseline.contentVersion,
    };
    if (baseline.contentVersion && observed.contentVersion !== baseline.contentVersion) {
      await options.onContentChange?.();
      if (disposed) return;
    }

    if (hasNewPublicVersion(baseline, { ...observed, contentVersion: baseline.contentVersion })) {
      pending = observed;
      render();
    } else {
      baseline = observed;
    }
  }, () => pending !== null);

  return {
    setLanguage(value: Language) {
      if (value === language) return;
      language = value;
      render();
    },
    setBlocked(value: boolean) {
      if (value === blocked) return;
      blocked = value;
      render();
    },
    dispose() {
      disposed = true;
      unsubscribe();
      notice.remove();
      stylesheet.remove();
      refresh.onclick = null;
      dismiss.onclick = null;
    },
  };
}
