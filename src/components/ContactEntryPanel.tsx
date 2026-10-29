import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight, Check, ChevronDown, Copy, Download, FileText, MessagesSquare, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { contactEntryText } from "@/i18n/contactEntryText";
import { wechatContactText } from "@/i18n/wechatContactText";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { trackCtaClick } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import SmartImage from "@/components/SmartImage";

export type ContactEntryPanelProps = {
  message: string;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  initialContact?: "wechat";
};

/** Bundled with the public contact entry; shown only when requested. */
export default function ContactEntryPanel({ message, onClose, onCloseAutoFocus, initialContact }: ContactEntryPanelProps) {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const text = { ...contactEntryText[language], ...wechatContactText[language] };
  const wechatId = siteConfig.wechatId.trim();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const copying = useRef(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const [qrOpen, setQrOpen] = useState(initialContact === "wechat");
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "sharing" | "failed">("idle");
  const saving = useRef(false);
  useEffect(() => {
    if (!wechatId || !navigator.share || !navigator.canShare || !window.matchMedia("(any-pointer: coarse)").matches) return;
    const controller = new AbortController();
    // Prepare before the click so opening the system sheet retains user activation.
    void (async () => {
      try {
        const response = await fetch(siteConfig.wechatQrDownloadUrl, { signal: controller.signal });
        if (!response.ok) return;
        const blob = await response.blob();
        if (controller.signal.aborted || blob.type !== "image/png" || !blob.size) return;
        const file = new File([blob], "FLASH-CAST-WeChat.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) setShareFile(file);
      } catch {
        // The direct download and original image remain available without file sharing.
      }
    })();
    return () => controller.abort();
  }, [wechatId]);
  const saveQr = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (saving.current) { event.preventDefault(); return; }
    if (!shareFile) { setSaveStatus("idle"); return; }
    event.preventDefault();
    saving.current = true;
    setSaveStatus("sharing");
    try {
      await navigator.share({ files: [shareFile] });
      setSaveStatus("idle");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setSaveStatus("idle");
      } else {
        setShareFile(null);
        setSaveStatus("failed");
      }
    } finally {
      saving.current = false;
    }
  };
  const copyWechat = async () => {
    if (copying.current || !wechatId) return;
    copying.current = true;
    setCopyStatus("copying");
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopyStatus("copied");
      trackCtaClick("wechat_copy", "contact_panel", { destination: "wechat" });
    } catch {
      setCopyStatus("failed");
    } finally {
      copying.current = false;
    }
  };
  return <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent className="fc-contact-panel" overlayClassName="fc-contact-overlay" closeLabel={text.close}
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenAutoFocus={event => {
        if (initialContact === "wechat") { event.preventDefault(); copyButtonRef.current?.focus(); }
      }}>
      <div className="fc-contact-panel__header">
        <DialogTitle className="fc-contact-panel__title">{text.title}</DialogTitle>
        <DialogDescription className="fc-contact-panel__description">{text.description}</DialogDescription>
      </div>
      <div className="fc-contact-panel__body">
        <a className="fc-contact-panel__primary" href={settings.whatsapp_url(message)} target="_blank" rel="noopener noreferrer"
          onClick={() => trackCtaClick("whatsapp", "contact_panel", { destination: "whatsapp" })}>
          <WhatsAppIcon aria-hidden="true" /><span className="fc-contact-panel__label">{text.whatsapp}</span><ArrowUpRight aria-hidden="true" />
        </a>
        {wechatId && <div className="fc-contact-panel__wechat-group">
          <div className="fc-contact-panel__wechat">
            <MessagesSquare aria-hidden="true" />
            <span className="fc-contact-panel__label">{text.wechat}<small className="fc-contact-panel__wechat-id">{wechatId}</small></span>
            <button ref={copyButtonRef} type="button" className="fc-contact-panel__copy" aria-label={copyStatus === "copied" ? text.copied : text.copyWechat} aria-live="polite"
              disabled={copyStatus === "copying"} aria-busy={copyStatus === "copying" || undefined}
              onClick={() => void copyWechat()}>
              {copyStatus === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copyStatus === "copying" ? text.copying : copyStatus === "copied" ? text.copied : text.copy}
            </button>
          </div>
          <p className="fc-contact-panel__note fc-contact-panel__copy-status" role="status" aria-live="polite">
            {copyStatus === "failed" ? text.wechatCopyFailed : ""}
          </p>
          <details className="fc-contact-panel__qr" open={qrOpen} onToggle={event => {
            const nextOpen = event.currentTarget.open;
            if (nextOpen && !qrOpen) trackCtaClick("wechat_qr_open", "contact_panel", { destination: "wechat" });
            setQrOpen(nextOpen);
          }}>
            <summary>{text.showWechatQr}<ChevronDown aria-hidden="true" /></summary>
            <figure>
              <SmartImage src={siteConfig.wechatQrUrl} alt={text.wechatQrAlt} width={668} height={668}
                className="fc-contact-panel__qr-image" loading="eager" decoding="async" showFailureFallback />
              <figcaption>{text.wechatQrHint}</figcaption>
            </figure>
            <div className="fc-contact-panel__qr-actions">
              <a className="fc-contact-panel__qr-save" href={siteConfig.wechatQrDownloadUrl} download="FLASH-CAST-WeChat.png"
                aria-disabled={saveStatus === "sharing" || undefined} aria-busy={saveStatus === "sharing" || undefined}
                onClick={event => void saveQr(event)}>
                <Download aria-hidden="true" />{saveStatus === "sharing" ? text.savingQr : text.saveQr}
              </a>
              <a className="fc-contact-panel__qr-original" href={siteConfig.wechatQrDownloadUrl} target="_blank" rel="noopener noreferrer">
                {text.openQr}<ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <p className="fc-contact-panel__note fc-contact-panel__save-status" role="status" aria-live="polite">
              {saveStatus === "failed" ? text.qrSaveFailed : ""}
            </p>
          </details>
        </div>}
        <a className="fc-contact-panel__row" href={settings.phone_href}
          onClick={() => trackCtaClick("phone", "contact_panel", { destination: "phone" })}>
          <Phone aria-hidden="true" /><span className="fc-contact-panel__label">{text.phone}<small>{settings.phone_display}</small></span><ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div className="fc-contact-panel__footer">
        <LocalizedLink className="fc-contact-panel__quote" to="/quote#quote-form"
          onClick={() => trackCtaClick("quote", "contact_panel", { destination: "quote" })}>
          <FileText aria-hidden="true" /><span className="fc-contact-panel__label">{text.quote}</span><ArrowUpRight aria-hidden="true" />
        </LocalizedLink>
      </div>
    </DialogContent>
  </Dialog>;
}
