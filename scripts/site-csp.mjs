const PRODUCTION_SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  "https://static.cloudflareinsights.com",
  "https://www.googletagmanager.com",
];

const LOCAL_SCRIPT_SRC = [...PRODUCTION_SCRIPT_SRC, "'unsafe-eval'"];

const directives = (scriptSrc) => [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["object-src", "'none'"],
  ["frame-ancestors", "'none'"],
  ["script-src", ...scriptSrc],
  ["style-src", "'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  ["font-src", "'self'", "https://fonts.gstatic.com", "data:"],
  ["img-src", "'self'", "data:", "blob:", "https:"],
  ["media-src", "'self'", "blob:", "https:"],
  [
    "connect-src",
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.telegram.org",
    "https://nominatim.openstreetmap.org",
    "https://cloudflareinsights.com",
    "https://static.cloudflareinsights.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://stats.g.doubleclick.net",
    "https://region1.google-analytics.com",
  ],
  ["frame-src", "https://www.google.com", "https://maps.google.com"],
  ["form-action", "'self'"],
];

const serializeCsp = (items) => items.map(([name, ...values]) => `${name} ${values.join(" ")}`).join("; ");

export const SITE_CSP_POLICY = `${serializeCsp(directives(PRODUCTION_SCRIPT_SRC))}; upgrade-insecure-requests`;

export const LOCAL_SITE_CSP_POLICY = serializeCsp(directives(LOCAL_SCRIPT_SRC));
