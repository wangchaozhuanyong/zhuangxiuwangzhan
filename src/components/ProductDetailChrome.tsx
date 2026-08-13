import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { withLanguagePrefix } from "@/i18n/routes";
import { trackCtaClick } from "@/lib/analytics";

interface ProductDetailChromeProps {
  productName: string;
  description: string;
  backLabel: string;
  shareLabel: string;
  copiedLabel: string;
  shareFailedLabel: string;
  navigationLabel: string;
}

const copyShareUrl = async (url: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("copy_failed");
};

const ProductDetailChrome = ({
  productName,
  description,
  backLabel,
  shareLabel,
  copiedLabel,
  shareFailedLabel,
  navigationLabel,
}: ProductDetailChromeProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const statusTimerRef = useRef<number>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => () => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsScrolled(!entry?.isIntersecting);
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  const handleBack = () => {
    navigate(withLanguagePrefix("/products", language));
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: productName, text: description, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        trackCtaClick("share", "product_detail", { method: "native" });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyShareUrl(url);
      trackCtaClick("share", "product_detail", { method: "copy_link" });
      setStatus({ message: copiedLabel, tone: "success" });
    } catch {
      setStatus({ message: shareFailedLabel, tone: "error" });
    }

    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 2400);
  };

  return (
    <>
      <span ref={sentinelRef} className="product-detail-chrome__sentinel" aria-hidden="true" />
      {createPortal(
        <nav
          className="product-detail-chrome"
          data-scrolled={isScrolled ? "true" : "false"}
          aria-label={navigationLabel}
        >
          <button
            type="button"
            className="product-detail-chrome__action"
            aria-label={backLabel}
            title={backLabel}
            onClick={handleBack}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="product-detail-chrome__action"
            aria-label={shareLabel}
            title={shareLabel}
            onClick={() => void handleShare()}
          >
            <Share2 aria-hidden="true" />
          </button>
          {status ? (
            <span className="product-detail-chrome__status" data-tone={status.tone} role="status" aria-live="polite">
              {status.message}
            </span>
          ) : null}
        </nav>,
        document.body,
      )}
    </>
  );
};

export default ProductDetailChrome;
