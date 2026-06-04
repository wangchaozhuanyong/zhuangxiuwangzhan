import type { FormAttemptsClient } from "./types.ts";

export async function countFormSubmissionAttempts(client: FormAttemptsClient, beforeIso?: string) {
  let query = client.from("form_submission_attempts").select("id", { count: "exact", head: true });
  if (beforeIso) query = query.lt("created_at", beforeIso);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function deleteFormSubmissionAttemptsBefore(client: FormAttemptsClient, cutoffAt: string) {
  const { count, error } = await client
    .from("form_submission_attempts")
    .delete({ count: "exact" })
    .lt("created_at", cutoffAt);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function logFormAttemptsCleanup(client: FormAttemptsClient, metadata: Record<string, unknown>) {
  try {
    await client.from("system_event_logs").insert({
      event_type: "form_submission_attempts_cleanup",
      severity: "info",
      source: "form-attempts-maintenance",
      message: "Old form submission anti-spam records were cleaned up.",
      metadata: {
        category: "security",
        categoryLabel: "防刷记录",
        ...metadata,
      },
    });
  } catch {
    // Cleanup should not fail only because audit logging failed.
  }
}
