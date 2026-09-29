import { useLocation } from "react-router-dom";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { furnitureText } from "@/i18n/furnitureText";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const path = stripLanguagePrefix(useLocation().pathname);
  if (path === "/furniture" || path.startsWith("/furniture/")) return null;
  return <LocalizedLink className="fc-furniture-floating" to="/furniture">{furnitureText[language].floating} <span aria-hidden="true">↗</span></LocalizedLink>;
}
