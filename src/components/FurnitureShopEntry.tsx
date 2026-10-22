import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { furnitureShopText } from "@/i18n/furnitureShopText";
import { furnitureShopUrlForLanguage } from "@/lib/furnitureCatalogConfig";

function ColorfulArmchairIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="13" width="28" height="21" rx="6" fill="url(#fcArmchairGrad)" stroke="#B87B38" strokeWidth="1.6" />
      <rect x="6" y="17" width="6.5" height="15.5" rx="3.2" fill="#D48A45" stroke="#9A561C" strokeWidth="1.4" />
      <rect x="35.5" y="17" width="6.5" height="15.5" rx="3.2" fill="#D48A45" stroke="#9A561C" strokeWidth="1.4" />
      <path d="M13 34L11 42" stroke="#5A3A1C" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M35 34L37 42" stroke="#5A3A1C" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="12.5" y="24" width="23" height="8.5" rx="3.5" fill="#FCEFD8" />
      <circle cx="19" cy="18" r="1.2" fill="#B87B38" />
      <circle cx="29" cy="18" r="1.2" fill="#B87B38" />
      <defs>
        <linearGradient id="fcArmchairGrad" x1="24" y1="13" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5A962" />
          <stop offset="1" stopColor="#E07A2B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
    <span className="fc-furniture-floating__icon" aria-hidden="true"><ColorfulArmchairIcon /></span>
    <span className="fc-furniture-floating__copy">
      <span className="fc-furniture-floating__label fc-furniture-floating__label--desktop">{text.floating}</span>
      <span className="fc-furniture-floating__label fc-furniture-floating__label--mobile">{text.floatingMobile}</span>
      <span className="fc-furniture-floating__hint" aria-hidden="true">{shopLanguage || text.openShopHomepage}</span>
    </span>
    <span className="fc-furniture-floating__action" aria-hidden="true"><ArrowUpRight className="fc-furniture-floating__arrow" strokeWidth={1.8} /></span>
  </a>;
}

