import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { BodyTooLargeError, readJsonBody } from "../_shared/request-body.ts";
import { purgePublicHtmlCache } from "./cache-invalidation.ts";
import { verifyGithubOidcToken } from "./github-oidc.ts";
import { issueManagedPermit, readManagedPermit, revokeManagedPermit } from "./permit-issuer.ts";
import type { ManagedPermitIssue } from "./permit-issuer.ts";
import { verifyManagedIssuerSecret } from "./permit-auth.ts";
import { publishContent } from "./service.ts";
import type { ContentPublishRequest } from "./types.ts";

// A 5 MiB WebP expands to roughly 6.7 MiB when base64 encoded. The request is
// authenticated before the body is read, and the media service still enforces
// the decoded 5 MiB limit.
const MAX_BODY_BYTES = 7 * 1024 * 1024;
type ManagedControlRequest = ({ controlAction: "issue" } & ManagedPermitIssue)
  | { controlAction: "status" | "revoke"; permitId: string };


const json = (req: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req, { methods: "POST, OPTIONS" }), "Content-Type": "application/json; charset=utf-8" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = getServiceRoleKey();
    if (!supabaseUrl || !serviceRoleKey) {
      return json(req, { error: "Supabase server credentials are not configured" }, 500);
    }

    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const issuerHeader = req.headers.get("x-managed-permit-issuer-secret");
    if (issuerHeader !== null) {
      const issuerSecret = Deno.env.get("MANAGED_CMS_PERMIT_ISSUER_SECRET");
      if (!issuerSecret || issuerSecret.length < 32) return json(req, { error: "Managed permit issuer is not configured" }, 503);
      if (!await verifyManagedIssuerSecret(issuerHeader, issuerSecret)) return json(req, { error: "Managed permit issuer authentication failed" }, 403);
      let control: ManagedControlRequest;
      try {
        control = await readJsonBody<ManagedControlRequest>(req, 32 * 1024);
      } catch {
        return json(req, { error: "Invalid managed permit control body" }, 400);
      }
      if (control.controlAction === "issue" && Deno.env.get("MANAGED_CMS_RELEASE_ENABLED") !== "true") {
        return json(req, { error: "Managed CMS release is disabled" }, 503);
      }
      try {
        const result = control.controlAction === "issue"
          ? await issueManagedPermit(client, control)
          : control.controlAction === "status"
          ? await readManagedPermit(client, control.permitId)
          : control.controlAction === "revoke"
          ? await revokeManagedPermit(client, control.permitId)
          : null;
        if (!result) return json(req, { error: "Unknown permit or control action" }, 404);
        return json(req, { ok: true, ...result });
      } catch (error) {
        return json(req, { error: error instanceof Error ? error.message : "Managed permit control failed" }, 403);
      }
    }
    const adminCheck = await requireAdminAccess(req, client, { cronSecretEnv: "CONTENT_PUBLISH_SECRET" });
    if (!adminCheck.ok) return json(req, { error: adminCheck.error || "Admin access required" }, adminCheck.status);

    let body: ContentPublishRequest;
    try {
      body = await readJsonBody<ContentPublishRequest>(req, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return json(req, { error: "Request body too large" }, 413);
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    let managedIdentity;
    const oidcToken = req.headers.get("x-managed-github-oidc");
    if (oidcToken) {
      if (Deno.env.get("MANAGED_CMS_RELEASE_ENABLED") !== "true") {
        return json(req, { error: "Managed CMS release is disabled" }, 503);
      }
      try {
        managedIdentity = await verifyGithubOidcToken(oidcToken);
      } catch {
        return json(req, { error: "Invalid managed GitHub run identity" }, 403);
      }
    }
    if (body.managedIdentityProbe === true) {
      if (!managedIdentity) return json(req, { error: "Verified managed identity required" }, 403);
      return json(req, { ok: true, dry_run: true, performed_write: false, identity: managedIdentity });
    }

    const result = await publishContent(body, client, {
      adminUserId: adminCheck.userId || null,
      role: adminCheck.mode === "cron" ? "content_editor" : adminCheck.role || null,
      authMode: adminCheck.mode,
      managedIdentity,
    });
    if (result.body.ok === true && result.body.dry_run === false) {
      const revision = new Date().toISOString();
      const { error: revisionError } = await client
        .from("site_settings")
        .update({ updated_at: revision })
        .eq("id", "default");
      const edgePurge = await purgePublicHtmlCache({
        apiToken: Deno.env.get("CLOUDFLARE_API_TOKEN"),
        zoneId: Deno.env.get("CLOUDFLARE_ZONE_ID"),
      });
      result.body.cache_invalidation = {
        ok: !revisionError,
        strategy: "content-revision",
        revision: revisionError ? null : revision,
        edge_purge_requested: edgePurge,
      };
      const warnings = Array.isArray(result.body.warnings)
        ? result.body.warnings.filter((warning): warning is string => typeof warning === "string")
        : [];
      if (revisionError) {
        warnings.push(`Cache revision warning: ${revisionError.message}`);
      }
      if (!edgePurge.ok) {
        warnings.push(`Cloudflare cache purge warning: ${edgePurge.error}`);
      }
      if (warnings.length) {
        result.body.warnings = warnings;
      }
    }
    return json(req, result.body, result.status || 200);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Content publish failed" }, 500);
  }
});
