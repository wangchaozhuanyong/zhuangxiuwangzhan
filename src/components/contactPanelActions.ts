import markup from "./contactPanelActions.html?raw";
import type { Language } from "@/i18n/languageDetection";
import { contactEntryText } from "@/i18n/contactEntryText";
import { wechatContactText } from "@/i18n/wechatContactText";
import type wechatContact from "@/config/wechatContact.json";

export type ContactAction = "whatsapp" | "phone" | "wechat_copy" | "wechat_qr_open";
type PanelOptions = {
  language: Language;
  whatsapp: string;
  telephone: string;
  phoneDisplay: string;
  contact: typeof wechatContact;
  showWechat?: boolean;
  onAction?: (action: ContactAction) => void;
};

/** Both public hosts mount these same actions only when the visitor opens the panel. */
export function mountContactActions(body: HTMLElement, options: PanelOptions) {
  body.innerHTML = markup;
  const find = <T extends HTMLElement>(selector: string) => body.querySelector<T>(selector)!;
  const text = { ...contactEntryText[options.language], ...wechatContactText[options.language] };
  const whatsapp = find<HTMLAnchorElement>('[data-qc="wa"]');
  whatsapp.href = options.whatsapp;
  whatsapp.querySelector(".fc-contact-panel__label")!.textContent = text.whatsapp;
  whatsapp.onclick = () => options.onAction?.("whatsapp");
  const phone = find<HTMLAnchorElement>('[data-qc="call"]');
  phone.href = options.telephone;
  phone.querySelector(".fc-contact-panel__label span")!.textContent = text.phone;
  phone.querySelector("small")!.textContent = options.phoneDisplay;
  phone.onclick = () => options.onAction?.("phone");

  const details = find<HTMLDetailsElement>("details");
  const wechatId = options.contact.wechatId.trim();
  if (!wechatId) {
    details.remove();
    return () => body.replaceChildren();
  }
  const id = find("[data-contact-wechat]");
  const copy = find<HTMLButtonElement>("[data-copy-wechat]");
  const copyStatus = find(".fc-contact-panel__copy-status");
  const img = find<HTMLImageElement>("img");
  const save = find<HTMLAnchorElement>(".fc-contact-panel__qr-save");
  const saveLabel = save.querySelector("span")!;
  const original = find<HTMLAnchorElement>(".fc-contact-panel__qr-original");
  const saveStatus = find(".fc-contact-panel__save-status");
  const controller = new AbortController();
  let file: File | undefined;
  let started = false;
  let pending = false;
  let sharing = false;
  let wasOpen = Boolean(options.showWechat);

  find("summary .fc-contact-panel__label").textContent = text.wechat;
  id.textContent = wechatId;
  copy.textContent = text.copyWechat;
  copy.setAttribute("aria-live", "polite");
  img.alt = text.wechatQrAlt;
  const hint = find("figcaption");
  hint.textContent = text.wechatQrHint;
  save.href = original.href = options.contact.wechatQrDownloadUrl;
  saveLabel.textContent = text.saveQr;
  original.textContent = text.openQr;
  function busy(value: boolean) {
    if (value) {
      save.setAttribute("aria-disabled", "true");
      save.setAttribute("aria-busy", "true");
    } else {
      save.removeAttribute("aria-disabled");
      save.removeAttribute("aria-busy");
    }
    saveLabel.textContent = pending ? text.preparingQr : value ? text.savingQr : text.saveQr;
  }
  async function prepareImage() {
    if (started) return;
    started = true;
    img.src = options.contact.wechatQrUrl;
    if (!navigator.share || !navigator.canShare || !window.matchMedia("(any-pointer: coarse)").matches || /Android/i.test(navigator.userAgent)) return;
    // Prepare a File before the tap so iOS retains activation for its Save Image sheet.
    pending = true;
    busy(true);
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(save.href, { signal: controller.signal });
      if (!response.ok) return;
      const blob = await response.blob();
      if (controller.signal.aborted || blob.type !== "image/png" || !blob.size) return;
      const candidate = new File([blob], save.download, { type: "image/png" });
      if (navigator.canShare({ files: [candidate] })) {
        file = candidate;
        if (/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent)) hint.textContent = text.albumHint;
      }
    } catch { /* The same-origin PNG download remains available. */ }
    finally { clearTimeout(timeout); pending = false; busy(false); }
  }
  find("summary").onclick = () => { if (!details.open) void prepareImage(); };
  details.open = wasOpen;
  if (wasOpen) void prepareImage();
  details.ontoggle = () => {
    if (details.open) {
      void prepareImage();
      if (!wasOpen) options.onAction?.("wechat_qr_open");
    }
    wasOpen = details.open;
  };
  copy.onclick = async () => {
    if (copy.disabled) return;
    copy.disabled = true;
    copy.setAttribute("aria-busy", "true");
    copyStatus.textContent = "";
    copy.textContent = text.copying;
    try {
      await navigator.clipboard.writeText(wechatId);
      copy.textContent = text.copied;
      options.onAction?.("wechat_copy");
    } catch {
      copy.textContent = text.copyWechat;
      if (id.isConnected) {
        const range = document.createRange();
        range.selectNodeContents(id);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      copyStatus.textContent = text.wechatCopyFailed;
    } finally {
      copy.disabled = false;
      copy.removeAttribute("aria-busy");
    }
  };
  save.onclick = async event => {
    if (pending || sharing) { event.preventDefault(); return; }
    saveStatus.textContent = "";
    if (!file) return;
    event.preventDefault();
    sharing = true;
    busy(true);
    try {
      await navigator.share({ files: [file] });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        file = undefined;
        hint.textContent = text.wechatQrHint;
        saveStatus.textContent = text.qrSaveFailed;
      }
    } finally { sharing = false; busy(false); }
  };
  return () => { controller.abort(); body.replaceChildren(); };
}
