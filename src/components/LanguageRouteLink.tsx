import { forwardRef, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix, type Language } from "@/i18n/routes";
import { prefetchPublishedRouteContent } from "@/lib/publicRoutePrefetch";

type LanguageRouteLinkProps = Omit<LinkProps, "to"> & {
  prefetchOnReady?: boolean;
  targetLanguage: Language;
  to: string;
};

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const LanguageRouteLink = forwardRef<HTMLAnchorElement, LanguageRouteLinkProps>(({
  targetLanguage,
  to,
  prefetchOnReady = false,
  onClick,
  onFocus,
  onPointerEnter,
  onTouchStart,
  children,
  ...props
}, ref) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const [isSwitching, setIsSwitching] = useState(false);
  const prefetchRef = useRef<Promise<void> | null>(null);

  const prefetch = useCallback(() => {
    if (!prefetchRef.current) {
      prefetchRef.current = prefetchPublishedRouteContent(queryClient, location.pathname, targetLanguage);
    }
    return prefetchRef.current;
  }, [location.pathname, queryClient, targetLanguage]);

  useEffect(() => {
    prefetchRef.current = null;
    if (!prefetchOnReady) return;

    const warmTargetLanguage = () => void prefetch();

    if (document.readyState === "complete") {
      warmTargetLanguage();
    } else {
      window.addEventListener("load", warmTargetLanguage, { once: true });
    }

    return () => {
      window.removeEventListener("load", warmTargetLanguage);
    };
  }, [prefetch, prefetchOnReady, to]);

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event) || props.target === "_blank") return;

    event.preventDefault();
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      const targetContent = prefetch();
      if (stripLanguagePrefix(location.pathname) !== "/") await targetContent;
      setLanguage(targetLanguage);
      navigate(to);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Link
      {...props}
      ref={ref}
      to={to}
      onClick={handleClick}
      onFocus={(event) => {
        void prefetch();
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        void prefetch();
        onPointerEnter?.(event);
      }}
      onTouchStart={(event) => {
        void prefetch();
        onTouchStart?.(event);
      }}
      aria-busy={isSwitching || undefined}
      data-language-switching={isSwitching ? "true" : undefined}
    >
      {children}
    </Link>
  );
});

LanguageRouteLink.displayName = "LanguageRouteLink";

export default LanguageRouteLink;
