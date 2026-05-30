import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
};

const ok = (checks: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: true, checks, checked_at: new Date().toISOString() }), {
    status: 200,
    headers: corsHeaders,
  });

const fail = (status: number, message: string, checks: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: false, message, checks, checked_at: new Date().toISOString() }), {
    status,
    headers: corsHeaders,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  const checks: Record<string, unknown> = { edge_function: true };

  if (!supabaseUrl || !serviceRoleKey) {
    return fail(500, "Supabase server credentials are not configured.", checks);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const cms = await supabase.from("cms_pages").select("id", { count: "exact", head: true });
  checks.cms_pages = cms.error ? { ok: false, message: cms.error.message } : { ok: true, count: cms.count ?? 0 };

  const settings = await supabase.from("site_settings").select("id", { count: "exact", head: true });
  checks.site_settings = settings.error ? { ok: false, message: settings.error.message } : { ok: true, count: settings.count ?? 0 };

  const bucket = await supabase.storage.getBucket("site-images");
  checks.storage_site_images = bucket.error ? { ok: false, message: bucket.error.message } : { ok: true };

  const failed = Object.values(checks).some((value) => typeof value === "object" && value !== null && "ok" in value && (value as { ok: boolean }).ok === false);
  if (failed) return fail(503, "One or more health checks failed.", checks);

  return ok(checks);
});
