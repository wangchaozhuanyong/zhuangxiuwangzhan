import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const path = stripLanguagePrefix(useLocation().pathname);
  if (path === "/furniture" || path.startsWith("/furniture/")) return null;
  return (
    <a className="fc-furniture-floating" href={furnitureShopUrl} target="_blank" rel="noopener noreferrer">
      {furnitureText[language].floating} <span aria-hidden="true">↗</span>
    </a>
  );
}
