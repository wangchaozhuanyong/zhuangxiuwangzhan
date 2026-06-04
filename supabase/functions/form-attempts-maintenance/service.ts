import { DEFAULT_RETENTION_DAYS, MAX_RETENTION_DAYS, MIN_RETENTION_DAYS } from "./config.ts";
import {
  countFormSubmissionAttempts,
  deleteFormSubmissionAttemptsBefore,
  logFormAttemptsCleanup,
} from "./repository.ts";
import type { FormAttemptsCleanupInput, FormAttemptsCleanupResult, FormAttemptsClient } from "./types.ts";

const normalizeRetentionDays = (value: unknown) => {
  const parsed = Number(value ?? DEFAULT_RETENTION_DAYS);
  if (!Number.isFinite(parsed)) return DEFAULT_RETENTION_DAYS;
  return Math.min(MAX_RETENTION_DAYS, Math.max(MIN_RETENTION_DAYS, Math.floor(parsed)));
};

export async function cleanupFormSubmissionAttempts(
  input: FormAttemptsCleanupInput,
  client: FormAttemptsClient,
): Promise<FormAttemptsCleanupResult> {
  const retentionDays = normalizeRetentionDays(input.retentionDays);
  const cutoffAt = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const totalCount = await countFormSubmissionAttempts(client);
  const eligibleCount = await countFormSubmissionAttempts(client, cutoffAt);
  const recentProtectedCount = Math.max(0, totalCount - eligibleCount);
  const dryRun = Boolean(input.dryRun);

  if (dryRun) {
    return {
      body: {
        ok: true,
        dry_run: true,
        retention_days: retentionDays,
        cutoff_at: cutoffAt,
        total_count: totalCount,
        eligible_count: eligibleCount,
        recent_protected_count: recentProtectedCount,
      },
    };
  }

  const deletedCount = await deleteFormSubmissionAttemptsBefore(client, cutoffAt);

  await logFormAttemptsCleanup(client, {
    retention_days: retentionDays,
    cutoff_at: cutoffAt,
    total_count_before_cleanup: totalCount,
    eligible_count: eligibleCount,
    deleted_count: deletedCount,
    recent_protected_count: recentProtectedCount,
    mode: input.mode,
  });

  return {
    body: {
      ok: true,
      dry_run: false,
      retention_days: retentionDays,
      cutoff_at: cutoffAt,
      total_count: totalCount,
      eligible_count: eligibleCount,
      deleted_count: deletedCount,
      recent_protected_count: recentProtectedCount,
    },
  };
}
