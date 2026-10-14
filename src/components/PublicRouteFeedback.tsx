import { PublicLoadingBar } from "@/components/PublicLoadingBar";
import { PublicLoadingBrand } from "@/components/PublicLoadingBrand";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";

/** Real page waits reuse the brand; local updates never restart document boot. */
export function PublicRouteFeedback({ scope, busy, timedOut, onFinished, onRetry, onCancel }: {
  scope: "page" | "region";
  busy: boolean;
  timedOut: boolean;
  onFinished: () => void;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const { language } = useLanguage();
  const copy = publicContentStatusText[language];
  const pageWait = scope === "page" && busy && !timedOut;
  return <div className={pageWait
    ? "public-route-feedback scheme-a-page-loader scheme-a-page-loader--overlay scheme-a-page-loader--navigation"
    : "public-route-feedback"} role="status" aria-live="polite" aria-busy={busy}
    data-route-loader="navigation" data-feedback-scope={scope}>
    {pageWait && <PublicLoadingBrand busy={busy} />}
    {!pageWait && !timedOut && <PublicLoadingBar complete={!busy} onFinished={onFinished} />}
    {!pageWait && <span className="sr-only">{copy.loaderRoutePending}</span>}
    {timedOut && <div className="public-route-feedback__recovery">
      <p>{copy.loaderTimeout}</p>
      <div className="public-route-feedback__actions">
        <button type="button" onClick={onRetry}>{copy.loaderRetry}</button>
        <button type="button" onClick={onCancel}>{copy.loaderCancel}</button>
      </div>
    </div>}
  </div>;
}
