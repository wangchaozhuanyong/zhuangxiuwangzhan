import { PublicLoadingBar } from "@/components/PublicLoadingBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";

/** Shared brand presentation; the document boot or route gate owns readiness. */
export function PublicLoadingBrand({ busy }: { busy: boolean }) {
  const { language } = useLanguage();
  const copy = publicContentStatusText[language];
  return <div className="scheme-a-page-loader__brand">
    <p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span>
    {busy && <PublicLoadingBar complete={false} />}
  </div>;
}
