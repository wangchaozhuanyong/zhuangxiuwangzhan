import "./showroomMenu";
import markup from "./components/publicBootTemplate.html?raw";
import styles from "./styles/components/public-boot.css?raw";
import { getDefaultLanguage, rememberLanguage } from "./i18n/routes";
import { languageTag } from "./i18n/languageDetection";
import { contactEntryTriggerText } from "./i18n/contactEntryText";
import { observeFixedFloatingEntry } from "./lib/floatingOcclusion";
import { reloadDocumentSafely } from "./lib/navigationProtection";
import { initializePublicBoot } from "./lib/publicBoot";

declare global {
  interface Window {
    showroomPolicy: {
      getDefaultLanguage: typeof getDefaultLanguage;
      rememberLanguage: typeof rememberLanguage;
      languageTag: typeof languageTag;
      contactEntryTriggerText: typeof contactEntryTriggerText;
      observeFixedFloatingEntry: typeof observeFixedFloatingEntry;
    };
    showroomInteractive?: boolean;
  }
}

window.showroomPolicy = { getDefaultLanguage, rememberLanguage, languageTag, contactEntryTriggerText, observeFixedFloatingEntry };

function startDocumentBoot() {
  // A delayed script may arrive after the static document has already become interactive.
  if (window.showroomInteractive) return;
  const criticalStyle = document.createElement("style");
  criticalStyle.textContent = styles;
  const template = document.createElement("template");
  template.id = "flashcast-public-boot-template";
  template.innerHTML = markup;
  document.head.append(criticalStyle, template);
  const initialScrollMode = history.scrollRestoration;
  const controller = initializePublicBoot();
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === "back_forward") history.scrollRestoration = initialScrollMode;
  return controller;
}

const boot = startDocumentBoot();
const fallbackElements: Element[] = [];
function showStaticCatalog() {
  if (window.showroomInteractive) return;
  // These are the same site-owned language links and 17 product sheets rendered without JS.
  for (const fallback of document.querySelectorAll("body noscript")) {
    const content = document.createElement("template");
    content.innerHTML = fallback.textContent ?? "";
    fallbackElements.push(...content.content.children);
    fallback.replaceWith(content.content);
  }
}

function restoreInteractiveCatalog() {
  if (!window.showroomInteractive || !fallbackElements.length) return;
  const catalog = document.querySelector(".static-catalog");
  const bounds = catalog?.getBoundingClientRect();
  // Keep the current sheet in place while someone is reading it. An explicit
  // visit to the catalogue also lets them switch straight back to model selection.
  if (bounds && bounds.top <= innerHeight / 3 && bounds.bottom > innerHeight / 3) {
    window.addEventListener("scroll", restoreInteractiveCatalog, { passive: true });
    document.addEventListener("click", handleCatalogLink);
    return;
  }
  const reading = bounds && bounds.bottom <= innerHeight / 3
    ? document.elementFromPoint(innerWidth / 2, innerHeight / 3)?.closest("section,footer") : null;
  const top = reading?.getBoundingClientRect().top;
  removeStaticCatalog();
  // Replacing the long specification list above the viewport can move the
  // installation/contact section, even in browsers with scroll anchoring.
  if (reading && top !== undefined) {
    const shift = reading.getBoundingClientRect().top - top;
    if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: "instant" });
  }
}

function handleCatalogLink(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('a[href="#collection"]')) removeStaticCatalog();
}

function removeStaticCatalog() {
  window.removeEventListener("scroll", restoreInteractiveCatalog);
  document.removeEventListener("click", handleCatalogLink);
  for (const element of fallbackElements.splice(0)) element.remove();
}

let continued = false;
function continueReading() {
  continued = true;
  showStaticCatalog();
  if (!window.showroomInteractive) window.addEventListener("showroom:ready", restoreInteractiveCatalog, { once: true });
  window.removeEventListener("showroom:ready", handOff);
  window.removeEventListener("public-assets-change", handOff);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showStaticCatalog, { once: true });
  void boot?.complete(true);
}

boot?.claim({ retry: reloadDocumentSafely, continue: continueReading, timeout: () => {} });

async function handOff() {
  if (continued || !window.showroomInteractive || !boot?.stylesReady) return;
  // WebKit exposes link.sheet before switching its print-media stylesheet into the
  // screen layout. Wait for that switch before measuring which photos are visible.
  if (document.querySelector('link[data-public-style]:not([media="all"])')) return;
  window.removeEventListener("showroom:ready", handOff);
  window.removeEventListener("public-assets-change", handOff);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  if (continued) return;
  const images = Array.from(document.querySelectorAll<HTMLImageElement>(".hero-board img[fetchpriority=high]"))
    .filter(image => image.getClientRects().length && image.getBoundingClientRect().top < innerHeight);
  const results = await Promise.allSettled(images.map(image => image.decode()));
  if (!continued) await boot.complete(results.some(result => result.status === "rejected"));
}

window.addEventListener("showroom:ready", handOff);
window.addEventListener("public-assets-change", handOff);
void handOff();
