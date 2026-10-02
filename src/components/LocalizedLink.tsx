import { forwardRef } from "react";
import { Link, useLinkClickHandler, type LinkProps } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { requestPublicNavigation } from "@/lib/publicNavigation";
import { withLanguagePrefix } from "@/i18n/routes";

const isExternal = (to: LinkProps["to"]) => {
  if (typeof to !== "string") return false;
  return /^(?:https?:\/\/|mailto:|tel:|\/\/)/i.test(to);
};

const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(({ to, onClick, ...props }, ref) => {
  const { language } = useLanguage();
  const localizedTo = typeof to === "string" && to.startsWith("/") && !isExternal(to)
    ? withLanguagePrefix(to, language)
    : to;

  const navigate = useLinkClickHandler(localizedTo, props);
  return <Link ref={ref} to={localizedTo} {...props} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      || props.target && props.target !== "_self" || props.reloadDocument || props.download || isExternal(to)) return;
    const destination = event.currentTarget.href;
    event.preventDefault();
    requestPublicNavigation(destination, () => navigate(event));
  }} />;
});

LocalizedLink.displayName = "LocalizedLink";

export default LocalizedLink;
