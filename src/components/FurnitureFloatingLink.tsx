import { useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const path = stripLanguagePrefix(useLocation().pathname);
  const isFurniturePage = path === "/furniture" || path.startsWith("/furniture/");
  const copy = furnitureText[language];
  const Arrow = isFurniturePage ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {isFurniturePage ? copy.floatingShop : copy.floating}
      <span aria-hidden="true"><Arrow size={18} strokeWidth={1.8} /></span>
    </>
  );

  return isFurniturePage ? (
    <a className="fc-furniture-floating" href={furnitureShopUrl} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <LocalizedLink className="fc-furniture-floating" to="/furniture">
      {content}
    </LocalizedLink>
  );
}
