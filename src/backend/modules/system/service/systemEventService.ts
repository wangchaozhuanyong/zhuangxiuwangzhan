import { fetchSystemEventLogs, insertSystemEventLog } from "@/backend/modules/system/repository/systemEventRepository";
import { getFriendlySystemMessage, getSystemEventCategory, isChunkLoadError } from "@/lib/chunkLoadRecovery";

export type SystemEvent = {
  event_type: string;
  severity?: "debug" | "info" | "warn" | "error" | "critical";
  source?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type SystemLogRow = {
  id: string;
  event_type: string;
  severity: string;
  source: string;
  message: string;
  metadata?: Record<string, unknown> & {
    category?: string;
    categoryLabel?: string;
  } | null;
  created_at: string;
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

export async function logFrontendSystemEvent(event: SystemEvent) {
  try {
    const rawMessage = truncate(event.message, 1000);
    const friendlyMessage = getFriendlySystemMessage(rawMessage, event.event_type);
    const category = getSystemEventCategory(rawMessage, event.event_type);
    const metadata =
      friendlyMessage === rawMessage
        ? {
            ...event.metadata,
            category: event.metadata?.category ?? category.key,
            categoryLabel: event.metadata?.categoryLabel ?? category.label,
          }
        : {
            ...event.metadata,
            originalMessage: event.metadata?.originalMessage ?? rawMessage,
            isChunkLoadError: event.metadata?.isChunkLoadError ?? isChunkLoadError(rawMessage),
            category: event.metadata?.category ?? category.key,
            categoryLabel: event.metadata?.categoryLabel ?? category.label,
          };

    await insertSystemEventLog({
      event_type: event.event_type,
      severity: event.severity || "info",
      source: event.source || "frontend",
      message: friendlyMessage,
      metadata: safeMetadata(metadata),
    });
  } catch {
    // Logging must never break the user-facing page.
  }
}

export async function loadAdminSystemEventLogs(limit = 100) {
  return (await fetchSystemEventLogs(limit)) as SystemLogRow[];
}
