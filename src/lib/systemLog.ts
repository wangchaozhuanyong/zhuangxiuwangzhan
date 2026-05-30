import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type SystemEvent = {
  event_type: string;
  severity?: "debug" | "info" | "warn" | "error" | "critical";
  source?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

const truncate = (value: unknown, max = 2000) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const safeMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) return {};
  const text = JSON.stringify(metadata);
  if (text.length > 4000) return { truncated: truncate(text, 4000) };
  return JSON.parse(text);
};

export async function logSystemEvent(event: SystemEvent) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("system_event_logs").insert({
      event_type: event.event_type,
      severity: event.severity || "info",
      source: event.source || "frontend",
      message: truncate(event.message, 1000),
      metadata: safeMetadata(event.metadata),
      actor_id: userData.user?.id || null,
    });
  } catch {
    // Logging must never break the user-facing page.
  }
}
