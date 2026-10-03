const PRODUCTION_SCRIPT_SRC = [
  "'self'",
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
  "https://www.googletagmanager.com",
  "https://googleads.g.doubleclick.net",
];

const LOCAL_SCRIPT_SRC = [...PRODUCTION_SCRIPT_SRC, "'unsafe-inline'", "'unsafe-eval'"];

const directives = (scriptSrc, localOrigins = []) => [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["object-src", "'none'"],
  ["frame-ancestors", "'none'"],
  ["script-src", ...scriptSrc],
  ["style-src", "'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  ["font-src", "'self'", "https://fonts.gstatic.com", "data:"],
  ["img-src", "'self'", "data:", "blob:", "https:", ...localOrigins],
  ["media-src", "'self'", "blob:", "https:", ...localOrigins],
  [
    "connect-src",
    "'self'",
    ...localOrigins,
    ...localOrigins.map((origin) => origin.replace(/^http/, "ws")),
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.telegram.org",
    "https://nominatim.openstreetmap.org",
    "https://cloudflareinsights.com",
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googleadservices.com",
    "https://www.google.com",
    "https://ad.doubleclick.net",
    "https://googleads.g.doubleclick.net",
    "https://stats.g.doubleclick.net",
    "https://region1.google-analytics.com",
  ],
  ["frame-src", "https://www.google.com", "https://maps.google.com", "https://challenges.cloudflare.com"],
  ["form-action", "'self'"],
];

const serializeCsp = (items) => items.map(([name, ...values]) => `${name} ${values.join(" ")}`).join("; ");

export const buildSiteCspPolicy = (scriptSrcExtra = []) =>
  `${serializeCsp(directives([...PRODUCTION_SCRIPT_SRC, ...scriptSrcExtra]))}; upgrade-insecure-requests`;

export const SITE_CSP_POLICY = buildSiteCspPolicy();

export const LOCAL_SITE_CSP_POLICY = serializeCsp(directives(LOCAL_SCRIPT_SRC));

// Add only the configured loopback API origin; production policy is unchanged.
export const buildLocalSiteCspPolicy = (supabaseUrl) => {
  let localOrigins = [];
  try {
    const url = new URL(supabaseUrl);
    if (
      ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      !url.username && !url.password && !url.search && !url.hash
    ) localOrigins = [url.origin];
  } catch {
    // Invalid configuration is reported by the existing environment gate.
  }
  return serializeCsp(directives(LOCAL_SCRIPT_SRC, localOrigins));
};
