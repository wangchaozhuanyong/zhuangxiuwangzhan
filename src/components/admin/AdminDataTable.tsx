import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminLang } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

export type AdminDataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
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
  const emptyText = getAdminLang() === "zh" ? "暂无数据" : "No data";

  return (
    <Card className={cn("overflow-hidden rounded-lg border-border bg-card shadow-sm", className)}>
      <Table className="min-w-[760px]">
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
            <TableRow key={rowKey(row)} className="hover:bg-muted/45">
              {columns.map((col) => (
                <TableCell key={col.key} className={cn("min-w-0", col.className)}>
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
    </Card>
  );
}
