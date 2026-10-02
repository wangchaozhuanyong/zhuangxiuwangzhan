import { ArrowUpRight } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const copy = furnitureText[language];

  return (
    <a className="fc-furniture-floating" lang={language} href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.floatingShop}>
      <SmartImage
        className="fc-furniture-floating__photo"
        src="/images/heroes/v20260930/furniture-showcase.webp"
        alt=""
        width={360}
        height={240}
        sizes="80px"
        candidateWidths={[360]}
        loading="eager"
        fetchPriority="low"
      />
      <span className="fc-furniture-floating__label">{copy.floating}</span>
      <ArrowUpRight className="fc-furniture-floating__arrow" size={15} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}
