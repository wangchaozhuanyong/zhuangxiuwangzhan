import type { ReactNode } from "react";
import { SchemeAContentState } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { interactionText } from "@/i18n/interactionText";

type ResultsQuery = {
  isLoading: boolean;
  isFetching: boolean;
  isInitialError: boolean;
  refetch: () => unknown;
};

/** Initial errors are distinct from empty results. Refreshes keep successful
 * content; RouteReadFeedback owns the shared refreshing/error announcement. */
export default function PublicResultsBoundary({ query, children, summary, loading, error, empty, isEmpty = false, keepFallback = false }: {
  query: ResultsQuery;
  children: ReactNode;
  summary?: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
  keepFallback?: boolean;
}) {
  const { language } = useLanguage();
  const text = interactionText[language];
  const initial = query.isLoading || query.isInitialError;
  return <div data-public-results aria-busy={query.isFetching || undefined}>
    {!initial ? summary : null}
    {query.isLoading ? <SchemeAContentState variant="loading" compact={keepFallback}>{loading ?? text.loading}</SchemeAContentState> : null}
    {query.isInitialError ? <SchemeAContentState variant="error" compact={keepFallback}
      action={<button data-ui="button" type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>{text.retry}</button>}>
      {error ?? text.loadingFailed}
    </SchemeAContentState> : null}
    {(!initial || keepFallback) && (isEmpty
      ? <SchemeAContentState>{empty}</SchemeAContentState>
      : children)}
  </div>;
}
