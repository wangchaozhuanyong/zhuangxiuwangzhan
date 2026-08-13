import { BadgePercent, Home, Images, Mail, PackageSearch } from "lucide-react";
import { useLocation } from "react-router-dom";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { forestUiText } from "@/i18n/forestUiText";
import { stripLanguagePrefix } from "@/i18n/routes";

const items = [
  { path: "/", labelKey: "home", icon: Home },
  { path: "/projects", labelKey: "projects", icon: Images },
  { path: "/products", labelKey: "products", icon: PackageSearch },
  { path: "/promotions", labelKey: "promotions", icon: BadgePercent },
  { path: "/contact", labelKey: "contact", icon: Mail },
] as const;

const isActive = (pathname: string, path: string) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

const ForestBottomNav = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const text = forestUiText[language];
  const pathname = stripLanguagePrefix(location.pathname);

  return (
    <nav className="forest-bottom-nav" aria-label={text.mobileNavLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.path);
        return (
          <LocalizedLink key={item.path} to={item.path} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" />
            <span>{text.bottomNav[item.labelKey]}</span>
          </LocalizedLink>
        );
      })}
    </nav>
  );
};

export default ForestBottomNav;
