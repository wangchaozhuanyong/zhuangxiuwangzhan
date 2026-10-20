import { useState } from "react";
import { Armchair, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { furnitureShopText } from "@/i18n/furnitureShopText";
import { furnitureShopUrlForLanguage } from "@/lib/furnitureCatalogConfig";

/** The original shop control loads only inside the furniture area. */
export default function FurnitureShopEntry() {
  const { language } = useLanguage();
  const text = furnitureShopText[language];
  const shopLanguage = contactEntryText[language].shopLanguage;
  const [pressed, setPressed] = useState(false);
  return <a className="fc-furniture-floating" lang={language}
    href={furnitureShopUrlForLanguage(language)} target="_blank" rel="noopener noreferrer"
    aria-label={[text.floatingShop, shopLanguage].filter(Boolean).join(" · ")}
    data-pressed={pressed || undefined}
    onPointerDown={(event) => { if (event.isPrimary && event.button === 0) setPressed(true); }}
    onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)}
    onPointerLeave={() => setPressed(false)} onBlur={() => setPressed(false)}>
    <span className="fc-furniture-floating__icon" aria-hidden="true"><Armchair strokeWidth={1.8} /></span>
    <span className="fc-furniture-floating__copy">
      <span className="fc-furniture-floating__label fc-furniture-floating__label--desktop">{text.floating}</span>
      <span className="fc-furniture-floating__label fc-furniture-floating__label--mobile">{text.floatingMobile}</span>
      <span className="fc-furniture-floating__hint" aria-hidden="true">{shopLanguage || text.openShopHomepage}</span>
    </span>
    <span className="fc-furniture-floating__action" aria-hidden="true"><ArrowUpRight className="fc-furniture-floating__arrow" strokeWidth={1.8} /></span>
  </a>;
}
