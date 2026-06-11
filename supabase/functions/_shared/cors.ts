const DEFAULT_ALLOWED_ORIGINS = [
  "https://flashcast.com.my",
  "https://www.flashcast.com.my",
  "https://flashcast-website.pages.dev",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:4191",
  "http://127.0.0.1:4191",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const normalizeOrigin = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
};

const envOrigins = () => {
  const raw = Deno.env.get("CORS_ALLOWED_ORIGINS") || Deno.env.get("ALLOWED_ORIGINS") || "";
  return raw
    .split(",")
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));
};

const configuredOrigins = () => [
  normalizeOrigin(Deno.env.get("SITE_URL")),
  normalizeOrigin(Deno.env.get("VITE_SITE_URL")),
  ...envOrigins(),
  ...DEFAULT_ALLOWED_ORIGINS,
];

const allowedOrigins = () => Array.from(new Set(configuredOrigins().filter((origin): origin is string => Boolean(origin))));

export type CorsOptions = {
  headers?: string;
  methods?: string;
};

export const isAllowedCorsOrigin = (req: Request) => {
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (!origin) return true;
  return allowedOrigins().includes(origin);
};

export const corsHeadersFor = (req: Request, options: CorsOptions = {}) => {
  const origins = allowedOrigins();
  const requestOrigin = normalizeOrigin(req.headers.get("origin"));
  const allowOrigin = requestOrigin && origins.includes(requestOrigin) ? requestOrigin : origins[0] || "https://flashcast.com.my";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": options.headers || "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": options.methods || "GET, POST, OPTIONS",
    Vary: "Origin",
  };
};

export const handleCorsPreflight = (req: Request, options: CorsOptions = {}) => {
  const headers = corsHeadersFor(req, options);
  if (!isAllowedCorsOrigin(req)) return new Response("Forbidden", { status: 403, headers });
  return new Response("ok", { headers });
};
