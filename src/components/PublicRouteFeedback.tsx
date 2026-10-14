import { PublicLoadingBar } from "@/components/PublicLoadingBar";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";

/** Navigation feedback has no document-entry presentation or ownership. */
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
  return <div className="public-route-feedback" role="status" aria-live="polite" aria-busy={busy}
    data-route-loader="navigation" data-feedback-scope={scope}>
    {!timedOut && <PublicLoadingBar complete={!busy} onFinished={onFinished} />}
    <span className="sr-only">{copy.loaderRoutePending}</span>
    {scope === "page" && busy && <div className="public-route-feedback__skeleton" aria-hidden="true">
      <span className="public-route-feedback__skeleton-title" />
      <span className="public-route-feedback__skeleton-copy" />
      <span className="public-route-feedback__skeleton-media" />
      <span /><span /><span />
    </div>}
    {timedOut && <div className="public-route-feedback__recovery">
      <p>{copy.loaderTimeout}</p>
      <div className="public-route-feedback__actions">
        <button type="button" onClick={onRetry}>{copy.loaderRetry}</button>
        <button type="button" onClick={onCancel}>{copy.loaderCancel}</button>
      </div>
    </div>}
  </div>;
}
