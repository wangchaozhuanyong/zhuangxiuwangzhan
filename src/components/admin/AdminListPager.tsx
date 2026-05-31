import { Button } from "@/components/ui/button";

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
  itemLabel = "条",
  onPageChange,
}: AdminListPagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div>
        {isFetching ? "正在加载..." : `显示 ${from}-${to} / ${total} ${itemLabel}`}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={safePage <= 0 || isFetching} onClick={() => onPageChange(safePage - 1)}>
          上一页
        </Button>
        <span className="min-w-16 text-center text-xs font-semibold">
          {safePage + 1} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= pageCount - 1 || isFetching}
          onClick={() => onPageChange(safePage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
