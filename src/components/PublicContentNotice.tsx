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
    <section className="fc-public-content-notice border-b border-[#cfc5b2] bg-[#e4ded1] px-4 py-2 text-[#352d24]">
      <div className="container-narrow flex items-start justify-between gap-2.5 sm:items-center">
        <div className="flex min-w-0 gap-2">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5ead0] text-[#8d6c35]">
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-5">{copy.title}</p>
            <p className="text-xs leading-[1.45] text-[#655747] sm:text-[13px]">{copy.description}</p>
          </div>
        </div>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-auto shrink-0 border-[#b9aa8d] bg-[#f3ecdd] px-2 text-xs text-[#352d24] hover:bg-[#faf5e9] sm:px-3"
            onClick={onRetry}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {copy.action}
          </Button>
        ) : null}
      </div>
    </section>
  );
};

export default PublicContentNotice;
