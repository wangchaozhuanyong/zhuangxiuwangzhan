import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";
import { adminMobileText } from "@/i18n/adminMobileText";

export type AdminDataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
  mobileRole?: "title" | "badge" | "summary" | "detail" | "actions";
};

export default function AdminDataTable<T>({
  columns,
  rows,
  empty,
  className,
  rowKey,
  busy = false,
}: {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  className?: string;
  busy?: boolean;
}) {
  const text = adminSharedText[getAdminLang()];
  const emptyText = text.noData;
  const mobileColumns = columns.filter((col) => !col.mobileHidden);
  const mobileText = adminMobileText[getAdminLang()];
  const titleColumn = mobileColumns.find((col) => col.mobileRole === "title") ?? mobileColumns[0];
  const badgeColumns = mobileColumns.filter((col) => col !== titleColumn && col.mobileRole === "badge");
  const summaryColumns = mobileColumns.filter((col) => col !== titleColumn && col.mobileRole !== "badge" && col.mobileRole !== "detail");
  const detailColumns = mobileColumns.filter((col) => col !== titleColumn && col.mobileRole === "detail");

  return (
    <Card ref={(node) => node?.toggleAttribute("inert", busy)} aria-busy={busy}
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border-border bg-card shadow-sm sm:rounded-xl [&_a]:rounded-md [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring max-md:[&_a]:inline-flex max-md:[&_a]:min-h-11 max-md:[&_a]:items-center",
        className,
      )}
    >
      <div className="divide-y divide-border md:hidden" role="list">
        {rows.map((row) => (
          <article key={rowKey(row)} className="min-w-0 bg-card p-4 transition-colors hover:bg-muted/35" role="listitem">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{titleColumn?.cell(row)}</div>
              {badgeColumns.length > 0 && <div className="flex max-w-[40%] shrink-0 flex-wrap justify-end gap-1">
                {badgeColumns.map((col) => <div key={col.key} aria-label={typeof col.header === "string" ? col.header : undefined}>{col.cell(row)}</div>)}
              </div>}
            </div>
            {summaryColumns.map((col) => (
              <div key={col.key} className="mt-2 grid min-w-0 grid-cols-[minmax(0,5rem)_minmax(0,1fr)] items-start gap-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">{col.header}</div>
                <div className="min-w-0 break-words text-sm leading-5 [overflow-wrap:anywhere]">{col.cell(row)}</div>
              </div>
            ))}
            {detailColumns.length > 0 && <details className="mt-2 min-w-0">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{mobileText.details}</summary>
              <dl className="space-y-2 pb-1">
                {detailColumns.map((col) => <div key={col.key} className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] gap-3 text-sm"><dt className="text-xs text-muted-foreground">{col.header}</dt><dd className="min-w-0 break-words">{col.cell(row)}</dd></div>)}
              </dl>
            </details>}
          </article>
        ))}
        {rows.length === 0 && <div className="p-5">{empty ?? <div className="text-sm text-muted-foreground">{emptyText}</div>}</div>}
      </div>

      <div className="hidden min-w-0 overflow-x-auto md:block" role="region" aria-label={text.dataTableAria}>
        <Table className="min-w-[720px] md:min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("h-11 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em]", col.className)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)} className="transition-colors hover:bg-muted/45">
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn("min-w-0 align-top [overflow-wrap:anywhere]", col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-6">
                  {empty ?? <div className="text-sm text-muted-foreground">{emptyText}</div>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
