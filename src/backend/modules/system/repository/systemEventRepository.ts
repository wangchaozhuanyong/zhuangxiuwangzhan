import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type InsertSystemEventLogInput = {
  event_type: string;
  severity: "debug" | "info" | "warn" | "error" | "critical";
  source: string;
  message: string;
  metadata: Record<string, unknown>;
};

export async function fetchSystemEventLogs(limit = 100) {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("system_event_logs")
    .select("id,event_type,severity,source,message,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function insertSystemEventLog(input: InsertSystemEventLogInput) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("system_event_logs").insert({
    event_type: input.event_type,
    severity: input.severity,
    source: input.source,
    message: input.message,
    metadata: input.metadata as any,
    actor_id: userData.user?.id || null,
  });

  return true;
}
