import type { HealthClient, HealthTableDefinition, SystemEventRow, TableCheck } from "./types.ts";

const eventSelect = "id,event_type,severity,source,message,metadata,created_at";

export async function checkTable(client: HealthClient, item: HealthTableDefinition): Promise<TableCheck> {
  const { count, error } = await client.from(item.table).select(item.selectColumn || "id", { count: "exact", head: true });
  return {
    table: item.table,
    label: item.label,
    category: item.category,
    ok: !error,
    count: count ?? 0,
    message: error?.message || "",
  };
}

export async function getAdminRole(client: HealthClient, token: string) {
  if (!token) return null;
  const { data: userData, error: userError } = await client.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userError || !userId) return null;

  const { data, error } = await client
    .from("admin_users")
    .select("role,active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.active) return null;
  return typeof data.role === "string" ? data.role : null;
}

export async function getStorageBucketCheck(client: HealthClient, bucketName: string) {
  return client.storage.getBucket(bucketName);
}

export async function fetchBackupEvents(client: HealthClient, eventTypes: string[]) {
  const { data, error } = await client
    .from("system_event_logs")
    .select(eventSelect)
    .eq("source", "ops")
    .in("event_type", eventTypes)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as SystemEventRow[];
}

export async function fetchHealthHistory(client: HealthClient) {
  const { data, error } = await client
    .from("system_event_logs")
    .select(eventSelect)
    .eq("source", "health-check")
    .eq("event_type", "system_health_check")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];
  return (data || []) as SystemEventRow[];
}

export async function insertHealthCheckLog(
  client: HealthClient,
  ok: boolean,
  failedTables: string[],
  reminders: string[],
  checkedAt: string,
) {
  await client.from("system_event_logs").insert({
    event_type: "system_health_check",
    severity: ok ? "info" : "warn",
    source: "health-check",
    message: ok ? "System health check passed." : "System health check needs attention.",
    metadata: {
      failed_tables: failedTables,
      reminders,
      checked_at: checkedAt,
    },
  });
}
