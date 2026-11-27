import { languageSelectorText } from "@/i18n/languageSelectorText";
import { getLanguageFromPath, isLanguage, rememberLanguage, type Language } from "@/i18n/routes";

declare global {
  interface Window {
    showroom?: { lang: Language; setOfflineLanguage?: (language: Language) => void };
  }
}

export function initializeShowroomLanguageSelector() {
  const menu = document.querySelector<HTMLDetailsElement>("details.lang-switch");
  const trigger = menu?.querySelector<HTMLElement>("[data-lang-trigger]");
  if (!menu || !trigger) return;
  const links = menu.querySelectorAll<HTMLAnchorElement>("a[data-lang]");
  const pageLanguage = getLanguageFromPath();
  if (pageLanguage) rememberLanguage(pageLanguage);

  function updateDestinations() {
    const current = new URL(location.href);
    if (current.searchParams.has("lang")) current.searchParams.delete("lang");
    // The home document accepts the main-site return address only via a fragment.
    const returnPath = history.state?.showroomReturn;
    if (typeof returnPath === "string") {
      const fragment = new URLSearchParams({ "fc-return": returnPath });
      if (current.hash) fragment.set("section", current.hash.slice(1));
      current.hash = fragment.toString();
    }
    for (const link of links) {
      const destination = new URL(link.href);
      destination.search = current.search;
      destination.hash = current.hash;
      if (current.protocol === "file:") {
        destination.pathname = current.pathname.replace(/\/(zh|en|ms)\/((?:lock\/.*\/)?index\.html)$/, `/${link.dataset.lang}/$2`);
        if (window.showroom?.setOfflineLanguage) destination.searchParams.set("lang", link.dataset.lang);
      }
      link.href = destination.pathname + destination.search + destination.hash;
    }
  }

  // The downloadable single-file catalogue has no other language document to visit.
  function updateOfflineMenu(language: Language) {
    const text = languageSelectorText[language];
    trigger.setAttribute("aria-label", `${text.trigger}: ${text.names[language]}`);
    trigger.querySelector(".lang-current-label").textContent = text.shortNames[language];
    menu.querySelector("nav").setAttribute("aria-label", text.title);
    for (const link of links) {
      const code = link.dataset.lang;
      if (!isLanguage(code)) continue;
      if (code === language) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      link.querySelector(".lang-code").textContent = text.shortNames[code];
      link.querySelector(".lang-name").textContent = text.names[code];
    }
  }

  updateDestinations();
  if (window.showroom?.setOfflineLanguage) updateOfflineMenu(window.showroom.lang);
  menu.addEventListener("toggle", () => { if (menu.open) updateDestinations(); });
  window.addEventListener("hashchange", updateDestinations);
  window.addEventListener("popstate", updateDestinations);
  window.addEventListener("pagehide", () => { menu.open = false; });
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    if (pageLanguage) rememberLanguage(pageLanguage);
    menu.open = false;
    updateDestinations();
  });
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element) || !menu.contains(event.target)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-lang]");
    if (!link) return;
    updateDestinations();
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    menu.open = false;
    const code = link.dataset.lang;
    if (!isLanguage(code)) return;
    if (window.showroom?.setOfflineLanguage) {
      event.preventDefault();
      window.showroom.setOfflineLanguage(code);
      rememberLanguage(code);
      updateOfflineMenu(code);
    } else if (link.hasAttribute("aria-current")) {
      event.preventDefault();
    }
    if (event.defaultPrevented) trigger.focus({ preventScroll: true });
  });
  menu.addEventListener("focusout", event => {
    if (event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) menu.open = false;
  });
}
