import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  getPublicContentStatusLabel,
  isPublicContentDegraded,
  type PublicContentResult,
} from "@/lib/publicContentStatus";

type PublicContentNoticeProps = {
  result: PublicContentResult<unknown> | null | undefined;
  onRetry?: () => void;
};

const PublicContentNotice = ({ result, onRetry }: PublicContentNoticeProps) => {
  const { language } = useLanguage();
  const copy = getPublicContentStatusLabel(result, language);

  if (!copy || !isPublicContentDegraded(result)) return null;

  return (
    <section className="border-b border-amber-200/70 bg-amber-50/85 px-4 py-3 text-amber-950">
      <div className="container-narrow flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{copy.title}</p>
            <p className="text-sm leading-relaxed text-amber-900/80">{copy.description}</p>
          </div>
        </div>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 border-amber-300 bg-white/70 text-amber-950 hover:bg-white sm:w-auto"
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.action}
          </Button>
        ) : null}
      </div>
    </section>
  );
};

export default PublicContentNotice;
