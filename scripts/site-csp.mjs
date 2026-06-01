/** Shared CSP for Vite dev/preview; keep in sync with public/_headers */
export const SITE_CSP_POLICY =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https:; media-src 'self' blob: https:; " +
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.telegram.org https://cloudflareinsights.com https://static.cloudflareinsights.com; " +
  "frame-src https://www.google.com; form-action 'self'; upgrade-insecure-requests";

export const LOCAL_SITE_CSP_POLICY = SITE_CSP_POLICY.replace(/;\s*upgrade-insecure-requests$/, "");
