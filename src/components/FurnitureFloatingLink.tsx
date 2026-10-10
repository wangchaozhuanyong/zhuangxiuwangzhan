import { useRef, useState } from "react";
import { Armchair, ArrowUpRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFloatingOcclusion } from "@/hooks/useFloatingOcclusion";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const { pathname, search } = useLocation();
  const copy = furnitureText[language];
  const [pressed, setPressed] = useState(false);
  const entryRef = useRef<HTMLAnchorElement>(null);
  const obstructed = useFloatingOcclusion(entryRef, `${pathname}${search}`);

  return (
    <a
      ref={entryRef}
      className="fc-furniture-floating"
      data-obstructed={obstructed || undefined}
      lang={language}
      href={furnitureShopUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.floatingShop}
      data-pressed={pressed || undefined}
      onPointerDown={(event) => { if (event.isPrimary && event.button === 0) setPressed(true); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onBlur={() => setPressed(false)}
    >
      <span className="fc-furniture-floating__icon" aria-hidden="true"><Armchair strokeWidth={1.8} /></span>
      <span className="fc-furniture-floating__copy">
        <span className="fc-furniture-floating__label fc-furniture-floating__label--desktop">{copy.floating}</span>
        <span className="fc-furniture-floating__label fc-furniture-floating__label--mobile">{copy.floatingMobile}</span>
        <span className="fc-furniture-floating__hint" aria-hidden="true">{copy.openShopHomepage}</span>
      </span>
      <span className="fc-furniture-floating__action" aria-hidden="true">
        <ArrowUpRight className="fc-furniture-floating__arrow" strokeWidth={1.8} />
      </span>
    </a>
  );
}
