import { PublicLoadingBar } from "@/components/PublicLoadingBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";

/** Fallback for the first document only when the HTML boot screen is absent. */
export function PublicInitialLoader({ busy, onRetry, onContinue }: {
  busy: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const { language } = useLanguage();
  const copy = publicContentStatusText[language];
  return <div className="scheme-a-page-loader scheme-a-page-loader--overlay"
    role="status" aria-live="polite" aria-busy={busy} data-route-loader="initial" data-feedback-scope="page">
    <div className="scheme-a-page-loader__brand">
      <p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span>
      {busy && <PublicLoadingBar complete={false} />}
    </div>
    {!busy && <div className="public-route-feedback__recovery">
      <p>{copy.loaderTimeout}</p>
      <div className="scheme-a-page-loader__actions">
        <button type="button" onClick={onRetry}>{copy.loaderRetry}</button>
        <button type="button" onClick={onContinue}>{copy.loaderContinue}</button>
      </div>
    </div>}
  </div>;
}
