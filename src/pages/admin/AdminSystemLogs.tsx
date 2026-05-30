import { useQuery } from "@tanstack/react-query";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { getFriendlySystemMessage } from "@/lib/chunkLoadRecovery";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type SystemLogRow = {
  id: string;
  event_type: string;
  severity: string;
  source: string;
  message: string;
  created_at: string;
};

const severityLabels: Record<string, string> = {
  debug: "调试",
  info: "信息",
  warn: "警告",
  error: "错误",
  critical: "严重",
};

const sourceLabels: Record<string, string> = {
  admin: "后台",
  frontend: "前台",
};

const eventTypeLabels: Record<string, string> = {
  react_render_error: "页面渲染错误",
};

const getDisplayMessage = (row: SystemLogRow) => getFriendlySystemMessage(row.message, row.event_type);

const AdminSystemLogs = () => {
  const { data = [], isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "system_event_logs"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("system_event_logs")
        .select("id,event_type,severity,source,message,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as SystemLogRow[];
    },
  });

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置 Supabase 后才能查看系统日志。" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="系统日志"
        description="这里记录后台和前台关键错误，方便排查问题。只显示最近 100 条。"
        helpText="这里是排错区，不是日常编辑区。发现页面报错、接口异常时先来这里看。"
        actions={
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "刷新中..." : "刷新"}
          </button>
        }
      />
      {error ? (
        <AdminEmptyState title="日志加载失败" description={error instanceof Error ? error.message : String(error)} />
      ) : data.length === 0 ? (
        <AdminEmptyState title="暂无系统日志" description="没有错误日志是好事。后续页面错误会自动记录到这里。" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">级别</th>
                <th className="px-4 py-3">来源</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">信息</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.severity === "error" || row.severity === "critical" ? "destructive" : "secondary"}>
                      {severityLabels[row.severity] || row.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{sourceLabels[row.source] || row.source}</td>
                  <td className="px-4 py-3">{eventTypeLabels[row.event_type] || row.event_type}</td>
                  <td className="px-4 py-3">{getDisplayMessage(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSystemLogs;
