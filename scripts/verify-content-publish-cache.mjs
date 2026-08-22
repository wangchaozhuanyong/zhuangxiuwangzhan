import { loadEnv } from "vite";

const env = loadEnv("production", process.cwd(), "");
const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/+$/, "");
const publishSecret = env.CONTENT_PUBLISH_SECRET || "";

if (!supabaseUrl || !publishSecret) {
  throw new Error("VITE_SUPABASE_URL/SUPABASE_URL and CONTENT_PUBLISH_SECRET are required for cache verification.");
}

const response = await fetch(`${supabaseUrl}/functions/v1/content-publish`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-cron-secret": publishSecret,
  },
  body: JSON.stringify({
    contentType: "cache_invalidation",
    mode: "publish",
    nextStatus: "published",
    ownerApproved: true,
    explicitExecution: true,
    approvalId: `production-cache-verification-${new Date().toISOString()}`,
    source: "production-cache-verification",
    record: { table: "site_settings", action: "cache-verification" },
  }),
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || payload?.ok !== true || payload?.cache_invalidation?.ok !== true) {
  throw new Error(payload?.error || `Cache verification failed with HTTP ${response.status}.`);
}

console.log(JSON.stringify({
  ok: true,
  contentType: payload.content_type,
  revisionAdvanced: Boolean(payload.cache_invalidation.revision),
  edgePurgeAttempted: payload.cache_invalidation.edge_purge_requested?.attempted === true,
  edgePurgeOk: payload.cache_invalidation.edge_purge_requested?.ok === true,
  warnings: payload.warnings || [],
}, null, 2));
