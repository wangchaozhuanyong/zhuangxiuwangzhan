import type { RefObject } from "react";
import { useLocation } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Content, Description, Overlay, Portal, Root, Title, Close } from "@radix-ui/react-dialog";
import LanguageRouteLink from "@/components/LanguageRouteLink";
import { usePublicDialogLayer } from "@/contexts/PublicChromeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageOptions, languageSelectorText } from "@/i18n/languageSelectorText";
import { languageTag } from "@/i18n/languageDetection";
import { switchLanguagePath } from "@/i18n/routes";

function LanguageDrawerContents({ close }: { close: () => void }) {
  usePublicDialogLayer();
  const { language } = useLanguage();
  const location = useLocation();
  const text = languageSelectorText[language];

  return (
    <>
      <div className="language-drawer__handle" aria-hidden="true" />
      <div className="language-drawer__heading">
        <svg className="language-drawer__mark" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
          <path d="M17 8h27a9 9 0 0 1 9 9v20a9 9 0 0 1-9 9H29L17 55v-9a9 9 0 0 1-9-9V17a9 9 0 0 1 9-9Z" fill="var(--luxury-champagne, #c9a66a)" />
          <path d="M28 17v5m-10 1h22m-17 1c2 7 7 12 15 15m-3-15c-2 7-7 12-15 15" stroke="var(--luxury-paper, #fbf7ee)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 29h23a9 9 0 0 1 9 9v20a9 9 0 0 1-9 9v9L53 67H42a9 9 0 0 1-9-9V38a9 9 0 0 1 9-9Z" fill="#3E7779" stroke="var(--public-surface-base, #f7f6f2)" strokeWidth="3" strokeLinejoin="round" />
          <path d="m45 57 8-18 8 18m-13-6h10" stroke="var(--luxury-paper, #fbf7ee)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="language-drawer__copy">
          <Title>{text.title}</Title>
          <Description>{text.description}</Description>
        </div>
      </div>
      <div className="language-drawer__options">
        {languageOptions.map((option) => {
          const selected = language === option.code;
          return (
            <LanguageRouteLink
              key={option.code}
              className="language-drawer__option"
              targetLanguage={option.code}
              to={switchLanguagePath(location.pathname, option.code, location.search, location.hash)}
              hrefLang={option.tag}
              aria-current={selected ? "true" : undefined}
              onClick={(event) => {
                if (selected) event.preventDefault();
                if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) close();
              }}
            >
              <span className="language-drawer__code" aria-hidden="true">{text.shortNames[option.code]}</span>
              <span className="language-drawer__name">
                <strong lang={languageTag(language)}>{text.names[option.code]}</strong>
              </span>
              {selected && <span className="language-drawer__selected"><span>{text.selected}</span><Check aria-hidden="true" /></span>}
            </LanguageRouteLink>
          );
        })}
      </div>
      <Close className="language-drawer__close" aria-label={text.close}><X aria-hidden="true" /></Close>
    </>
  );
}


export default function LanguageDrawer({ close, triggerRef }: { close: () => void; triggerRef: RefObject<HTMLButtonElement> }) {
  return <Root open onOpenChange={(next) => { if (!next) close(); }}>
    <Portal>
      <Overlay className="language-drawer__overlay" />
      <Content className="language-drawer"
        onKeyDownCapture={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault(); event.stopPropagation(); close();
        }}
        onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus(); }}>
        <LanguageDrawerContents close={close} />
      </Content>
    </Portal>
  </Root>;
}
