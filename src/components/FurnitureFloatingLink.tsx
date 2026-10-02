import { Armchair, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const copy = furnitureText[language];

  return (
    <a className="fc-furniture-floating" lang={language} href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.floatingShop}>
      <span className="fc-furniture-floating__icon" aria-hidden="true"><Armchair strokeWidth={1.8} /></span>
      <span className="fc-furniture-floating__copy">
        <span className="fc-furniture-floating__label">{copy.floating}</span>
        <span className="fc-furniture-floating__hint" aria-hidden="true">{copy.openShopHomepage}</span>
      </span>
      <ArrowUpRight className="fc-furniture-floating__arrow" strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}
