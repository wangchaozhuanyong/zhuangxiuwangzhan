import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { purgePublicHtmlCache } from "./cache-invalidation.ts";

// Content is already committed. This operation only advances public delivery state.
export async function syncPublicContent(client: SupabaseClient, options: {
  advanceRevision?: boolean;
  revision?: string | null;
  apiToken?: string | null;
  zoneId?: string | null;
} = {}) {
  let revision = options.revision || null;
  let revisionError: string | null = null;
  if (options.advanceRevision !== false) {
    try {
      const { data, error } = await client.from("site_settings")
        .update({ updated_at: new Date().toISOString() }).eq("id", "default")
        .select("updated_at").maybeSingle();
      revision = typeof data?.updated_at === "string" ? data.updated_at : null;
      revisionError = error?.message || null;
    } catch {
      revisionError = "Public synchronization is unavailable";
    }
  }
  const edgePurge = await purgePublicHtmlCache(options);
  const warnings: string[] = [];
  if (revisionError || !revision) warnings.push("Content was saved; public content synchronization needs retry.");
  if (!edgePurge.ok) warnings.push("Content was saved; public cache delivery needs retry.");
  return {
    cache_invalidation: {
      ok: !revisionError && revision !== null,
      strategy: "content-revision" as const,
      revision: revisionError ? null : revision,
      edge_purge_requested: edgePurge,
    },
    ...(warnings.length ? { warnings } : {}),
  };
}
