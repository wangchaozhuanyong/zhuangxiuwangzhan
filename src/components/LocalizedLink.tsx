import { forwardRef } from "react";
import { Link, LinkProps } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { withLanguagePrefix } from "@/i18n/routes";

const isExternal = (to: LinkProps["to"]) => {
  if (typeof to !== "string") return false;
  return to.startsWith("http") || to.startsWith("mailto:") || to.startsWith("tel:");
};

const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => {
  const { language } = useLanguage();
  const localizedTo = typeof to === "string" && to.startsWith("/") && !isExternal(to)
    ? withLanguagePrefix(to, language)
    : to;

  return <Link ref={ref} to={localizedTo} {...props} />;
});

LocalizedLink.displayName = "LocalizedLink";

export default LocalizedLink;
