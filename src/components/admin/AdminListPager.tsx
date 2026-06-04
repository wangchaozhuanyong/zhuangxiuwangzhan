import { Button } from "@/components/ui/button";
import { adminSharedText, formatAdminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";

type AdminListPagerProps = {
  page: number;
  pageSize: number;
  total: number;
  isFetching?: boolean;
  itemLabel?: string;
  onPageChange: (page: number) => void;
};

export default function AdminListPager({
  page,
  pageSize,
  total,
  isFetching,
  itemLabel,
  onPageChange,
}: AdminListPagerProps) {
  const text = adminSharedText[getAdminLang()];
  const effectiveItemLabel = itemLabel || text.itemUnit;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);
  const summary = formatAdminSharedText(text.pagerSummary, {
    from,
    to,
    total,
    itemLabel: effectiveItemLabel,
  });

  return (
    <nav
      className="mt-4 flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:px-4"
      aria-label={text.paginationAria}
    >
      <div className="min-w-0" aria-live="polite">
        {isFetching ? text.loading : summary}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-2 sm:flex">
        <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" disabled={safePage <= 0 || isFetching} onClick={() => onPageChange(safePage - 1)}>
          {text.previousPage}
        </Button>
        <span className="min-w-16 text-center text-xs font-semibold">
          {safePage + 1} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 w-full sm:w-auto"
          disabled={safePage >= pageCount - 1 || isFetching}
          onClick={() => onPageChange(safePage + 1)}
        >
          {text.nextPage}
        </Button>
      </div>
    </nav>
  );
}
