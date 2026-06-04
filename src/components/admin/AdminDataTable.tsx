import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

export type AdminDataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
};

export default function AdminDataTable<T>({
  columns,
  rows,
  empty,
  className,
  rowKey,
}: {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  className?: string;
}) {
  const text = adminSharedText[getAdminLang()];
  const emptyText = text.noData;
  const mobileColumns = columns.filter((col) => !col.mobileHidden);

  return (
    <Card
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border-border bg-card shadow-sm sm:rounded-xl [&_a]:rounded-md [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring max-md:[&_a]:inline-flex max-md:[&_a]:min-h-10 max-md:[&_a]:items-center max-md:[&_button]:w-full max-md:[&_button]:justify-center",
        className,
      )}
    >
      <div className="divide-y divide-border md:hidden" role="list">
        {rows.map((row) => (
          <article key={rowKey(row)} className="min-w-0 bg-card p-3 transition-colors hover:bg-muted/35 sm:p-4" role="listitem">
            {mobileColumns.map((col, index) => (
              <div
                key={col.key}
                className={cn(
                  "min-w-0",
                  index === 0 ? "mb-3" : "grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)] gap-3 py-2 text-sm",
                )}
              >
                {index === 0 ? (
                  <div className="min-w-0">{col.cell(row)}</div>
                ) : (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{col.header}</div>
                    <div className="min-w-0 break-words text-right text-sm leading-6 [overflow-wrap:anywhere] sm:text-left">{col.cell(row)}</div>
                  </>
                )}
              </div>
            ))}
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
