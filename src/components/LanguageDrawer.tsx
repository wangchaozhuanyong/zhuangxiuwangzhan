import type { RefObject } from "react";
import { useLocation } from "react-router-dom";
import { Check, Globe2, X } from "lucide-react";
import { Content, Description, Overlay, Portal, Root, Title, Close } from "@radix-ui/react-dialog";
import LanguageRouteLink from "@/components/LanguageRouteLink";
import { usePublicDialogLayer } from "@/contexts/PublicChromeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageOptions, languageSelectorText } from "@/i18n/languageSelectorText";
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
        <Globe2 aria-hidden="true" />
        <Title>{text.title}</Title>
        <Description>{text.description}</Description>
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
              <span className="language-drawer__code" aria-hidden="true">{option.shortName}</span>
              <span className="language-drawer__name">
                <strong lang={option.tag}>{option.name}</strong>
                <small>{text.names[option.code]}</small>
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
      <Content className="language-drawer" onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus(); }}>
        <LanguageDrawerContents close={close} />
      </Content>
    </Portal>
  </Root>;
}
