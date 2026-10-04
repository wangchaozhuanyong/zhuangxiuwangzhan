import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSitemapXml } from "./service.ts";

const getServiceRoleKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async () => {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return new Response("Service role key is not configured", { status: 500 });
  }

  const client = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  try {
    const xml = await buildSitemapXml(client);
    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  } catch {
    // An incomplete source must never be exposed as a successful complete snapshot.
    return new Response("Sitemap is temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
});
