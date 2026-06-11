import { useQuery } from "@tanstack/react-query";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { adminSystemLogsText } from "@/i18n/adminSystemLogsText";
import { loadAdminSystemEventLogs } from "@/backend/modules/system/service/systemEventService";
import { getAdminLang } from "@/lib/adminLocale";
import { adminQueriesEnabled } from "@/lib/adminQueryCore";
import { formatAdminSystemLogRow } from "@/lib/adminSystemLogDisplay";

const AdminSystemLogs = () => {
  const language = getAdminLang();
  const text = adminSystemLogsText[language];
  const { data = [], isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "system_event_logs"],
    enabled: adminQueriesEnabled,
    queryFn: () => loadAdminSystemEventLogs(100),
  });

  if (!adminQueriesEnabled) {
    return <AdminEmptyState title={text.noSupabaseTitle} description={text.noSupabaseDescription} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={text.title}
        description={text.description}
        helpText={text.helpText}
        actions={
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? text.refreshing : text.refresh}
          </button>
        }
      />
      {error ? (
        <AdminEmptyState title={text.loadFailedTitle} description={text.loadFailedDescription} />
      ) : data.length === 0 ? (
        <AdminEmptyState title={text.emptyTitle} description={text.emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border md:hidden">
            {data.map((row) => {
              const display = formatAdminSystemLogRow(row, language);

              return (
                <article key={row.id} className="space-y-3 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={row.severity === "error" || row.severity === "critical" ? "destructive" : "secondary"}>
                      {display.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <p className="font-medium">{display.category}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{display.source} · {display.eventType}</p>
                  </div>
                  <p className="break-words leading-6 text-muted-foreground">{display.message}</p>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-max min-w-full table-auto text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">{text.timeHeader}</th>
                  <th className="whitespace-nowrap px-4 py-3">{text.levelHeader}</th>
                  <th className="whitespace-nowrap px-4 py-3">{text.sourceHeader}</th>
                  <th className="whitespace-nowrap px-4 py-3">{text.categoryHeader}</th>
                  <th className="whitespace-nowrap px-4 py-3">{text.typeHeader}</th>
                  <th className="whitespace-nowrap px-4 py-3">{text.messageHeader}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const display = formatAdminSystemLogRow(row, language);

                  return (
                    <tr key={row.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          className="whitespace-nowrap"
                          variant={row.severity === "error" || row.severity === "critical" ? "destructive" : "secondary"}
                        >
                          {display.severity}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{display.source}</td>
                      <td className="whitespace-nowrap px-4 py-3">{display.category}</td>
                      <td className="whitespace-nowrap px-4 py-3">{display.eventType}</td>
                      <td className="whitespace-nowrap px-4 py-3">{display.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemLogs;
