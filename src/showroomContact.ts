import { mountContactActions } from "./components/contactPanelActions";
import wechatContact from "./config/wechatContact.json";
import { contactEntryText } from "./i18n/contactEntryText";
import { showroomContactText } from "./i18n/wechatContactText";
import { detectLanguageFromTags } from "./i18n/languageDetection";
import { observeFixedFloatingEntry } from "./lib/floatingOcclusion";

declare global {
  interface Window {
    lockContact?: { whatsapp: () => string; tel: string };
    quickContact?: { refresh: () => void };
  }
}

function initialize() {
  const host = document.getElementById("root") ?? document.body;
  const homeContact = document.getElementById("contact");
  const actions = document.querySelector<HTMLElement>(".model-actions, .hero-actions");
  const contextLink = actions?.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]');
  if (!homeContact && !contextLink) return;

  const stack = document.getElementById("quick-contact") ?? document.createElement("div");
  stack.id = "quick-contact";
  stack.className = "fc-contact-stack";
  stack.innerHTML = '<button class="fc-contact-entry" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="qc-options"><span class="fc-contact-entry__icon" aria-hidden="true"></span><span class="fc-contact-entry__label"></span></button>';
  const trigger = stack.querySelector("button")!;
  const panel = document.createElement("dialog");
  panel.id = "qc-options";
  panel.className = "fc-contact-panel";
  panel.setAttribute("aria-labelledby", "qc-heading");
  panel.innerHTML = '<div class="fc-contact-panel__header"><h2 class="fc-contact-panel__title" id="qc-heading"></h2><button class="fc-contact-panel__close" type="button"><span aria-hidden="true">×</span></button></div><div class="fc-contact-panel__body"></div><div class="fc-contact-panel__footer"><a class="fc-contact-panel__quote" data-qc="visit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span class="fc-contact-panel__label"></span><span aria-hidden="true">→</span></a></div>';
  const body = panel.querySelector<HTMLElement>(".fc-contact-panel__body")!;
  const closeButton = panel.querySelector("button")!;
  const address = panel.querySelector<HTMLAnchorElement>('[data-qc="visit"]')!;
  if (!stack.isConnected) host.append(stack);
  stack.after(panel);
  let cleanup: (() => void) | undefined;
  let pendingBack = false;
  let returnFocus: HTMLElement = trigger;
  const key = "quick-contact";
  const stateKey = "showroomContactOpen";
  function language() { return window.showroom?.lang ?? detectLanguageFromTags([document.documentElement.lang]); }
  function renderActions(showWechat = false) {
    const whatsapp = window.lockContact?.whatsapp() ?? contextLink!.href;
    const telephone = window.lockContact?.tel ?? "tel:+" + new URL(whatsapp).pathname.slice(1);
    cleanup?.();
    cleanup = mountContactActions(body, {
      language: language(), whatsapp, telephone, contact: wechatContact, showWechat,
      phoneDisplay: document.querySelector("[data-contact-number]")?.textContent ?? telephone.slice(4),
      onAction: action => { if (action === "whatsapp" || action === "phone") setTimeout(() => close(), 0); },
    });
  }
  function refresh() {
    const lang = language();
    const text = contactEntryText[lang];
    stack.hidden = Boolean(homeContact && !window.showroom?.lang);
    trigger.querySelector(".fc-contact-entry__label")!.textContent = text.trigger;
    panel.querySelector("h2")!.textContent = showroomContactText[lang].lockTitle;
    closeButton.setAttribute("aria-label", text.close);
    address.querySelector(".fc-contact-panel__label")!.textContent = showroomContactText[lang].visit;
    address.href = homeContact ? "#contact" : "/" + lang + "/#contact";
    if (panel.open) renderActions(Boolean(body.querySelector("details[open]")));
  }
  function open(fromHistory = false, opener: HTMLElement = trigger): boolean {
    if (panel.open) return true;
    if (pendingBack || stack.hidden || document.querySelector("dialog[open]") || (opener === trigger && stack.hasAttribute("data-obstructed"))) return false;
    returnFocus = opener;
    const showWechat = opener !== trigger;
    renderActions(showWechat);
    panel.showModal();
    panel.scrollTop = 0;
    trigger.setAttribute("aria-expanded", "true");
    body.querySelector<HTMLElement>(showWechat ? "[data-copy-wechat]" : '[data-qc="wa"]')?.focus({ preventScroll: true });
    if (!fromHistory) {
      if (window.showroom?.layers) window.showroom.layers.enter(key, () => close(true), () => open(true, opener));
      else history.pushState({ ...history.state, [stateKey]: true }, "");
    }
    return true;
  }
  function close(fromHistory = false) {
    if (!panel.open) return;
    panel.close();
    trigger.setAttribute("aria-expanded", "false");
    cleanup?.();
    cleanup = undefined;
    if (!fromHistory) {
      if (window.showroom?.layers) window.showroom.layers.leave(key);
      else if (history.state?.[stateKey]) { pendingBack = true; history.back(); }
    }
    stack.removeAttribute("data-obstructed");
    returnFocus.focus({ preventScroll: true });
  }
  const wechatLink = homeContact?.querySelector<HTMLElement>(".ct-wechat summary");
  if (wechatLink) {
    wechatLink.setAttribute("aria-haspopup", "dialog");
    wechatLink.addEventListener("click", event => { if (open(false, wechatLink)) event.preventDefault(); });
  }
  closeButton.onclick = () => close();
  trigger.onclick = () => open();
  panel.addEventListener("cancel", event => { event.preventDefault(); close(); });
  panel.addEventListener("click", event => {
    if (event.target !== panel) return;
    const { left, right, top, bottom } = panel.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) close();
  });
  address.onclick = event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // Pop the modal entry before following the link so Back returns to the actual page.
    window.addEventListener("popstate", () => requestAnimationFrame(() => {
      if (!homeContact) { location.assign(address.href); return; }
      if (location.hash !== address.hash) location.hash = address.hash;
      const heading = homeContact.querySelector("h2") ?? homeContact;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      homeContact.scrollIntoView({ block: "start", behavior: "instant" });
    }), { once: true });
    close();
  };
  if (!homeContact) {
    window.addEventListener("popstate", () => {
      pendingBack = false;
      if (history.state?.[stateKey]) open(true);
      else close(true);
    });
    if (history.state?.[stateKey]) open(true);
  }
  window.quickContact = { refresh };
  refresh();
  observeFixedFloatingEntry(stack, obstructed => {
    if (obstructed) stack.dataset.obstructed = "true";
    else stack.removeAttribute("data-obstructed");
  }, actions);
}

initialize();
