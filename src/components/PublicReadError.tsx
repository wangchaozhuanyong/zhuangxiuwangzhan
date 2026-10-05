import { useLanguage } from "@/i18n/LanguageContext";
import { interactionText } from "@/i18n/interactionText";
import { SchemeAContentState } from "@/components/scheme-a/SchemeARoutePrimitives";

export default function PublicReadError({ onRetry }: { onRetry: () => void }) {
  const { language } = useLanguage();
  const text = interactionText[language];
  return <main className="fc-route-page fc-route-error">
    <SchemeAContentState variant="error" action={<button type="button" onClick={onRetry}>{text.retry}</button>}>
      <h1>{text.loadingFailed}</h1>
    </SchemeAContentState>
  </main>;
}
