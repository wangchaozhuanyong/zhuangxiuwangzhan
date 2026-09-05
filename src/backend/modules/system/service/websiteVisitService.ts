export interface WebsiteVisitEnvironment {
  WEBSITE_VISIT_INGEST_SECRET?: string;
  WEBSITE_VISIT_INGEST_URL?: string;
}

export interface WebsiteVisitPayload {
  eventId: string;
  host: string;
  path: string;
  ip: string;
  occurredAt: string;
}

const productionHosts = new Set(["flashcast.com.my", "www.flashcast.com.my"]);
const receiverUrl =
  "https://54-249-61-238.sslip.io/api/id-business-v2/workspace-website-monitor/visits/ingest";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validVisitPath = (path: unknown): path is string =>
  typeof path === "string" &&
  path.length <= 1024 &&
  /^\/(en|zh)(?:\/[A-Za-z0-9_%-]+)*\/?$/.test(path) &&
  !/%(?![a-f0-9]{2})/i.test(path);

function validIp(ip: string) {
  if (ip.length > 45) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip))
    return ip
      .split(".")
      .every((part) => String(Number(part)) === part && Number(part) <= 255);
  if (!/^[a-f0-9:]+$/i.test(ip) || !ip.includes(":")) return false;
  try {
    return Boolean(new URL(`https://[${ip}]/`).hostname);
  } catch {
    return false;
  }
}

export function createWebsiteVisit(
  request: Request,
  input: unknown,
  now = new Date(),
): WebsiteVisitPayload | null {
  const url = new URL(request.url);
  if (
    !productionHosts.has(url.hostname) ||
    url.protocol !== "https:" ||
    request.headers.get("origin") !== url.origin ||
    request.headers.has("cf-worker")
  )
    return null;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return null;
  if (
    /bot|crawler|spider|slurp|bingpreview/i.test(
      request.headers.get("user-agent") || "",
    )
  )
    return null;
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if (
    Object.keys(body).length !== 2 ||
    typeof body.eventId !== "string" ||
    !uuid.test(body.eventId) ||
    !validVisitPath(body.path)
  )
    return null;
  let ip = request.headers.get("cf-connecting-ip") || "";
  // The IPv6 companion is authoritative only when Cloudflare replaced the IP with a Class E pseudo IPv4.
  if (/^\d+\./.test(ip) && Number(ip.split(".")[0]) >= 240)
    ip = request.headers.get("cf-connecting-ipv6") || "";
  if (!validIp(ip) || ip === "2a06:98c0:3600::103") return null;
  return {
    eventId: body.eventId.toLowerCase(),
    host: url.hostname,
    path: body.path,
    ip,
    occurredAt: now.toISOString(),
  };
}

export function isVisitCollectionConfigured(env: WebsiteVisitEnvironment) {
  return (
    (env.WEBSITE_VISIT_INGEST_SECRET?.trim().length ?? 0) >= 32 &&
    env.WEBSITE_VISIT_INGEST_URL === receiverUrl
  );
}

export async function forwardWebsiteVisit(
  event: WebsiteVisitPayload,
  env: WebsiteVisitEnvironment,
): Promise<boolean> {
  if (!isVisitCollectionConfigured(env)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.WEBSITE_VISIT_INGEST_SECRET!.trim()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = JSON.stringify([
    event.eventId,
    event.host,
    event.path,
    event.ip,
    event.occurredAt,
  ]);
  const signature = Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  const startedAt = Date.now();
  const warn = (
    category: "http" | "invalid_response" | "timeout" | "network",
    status?: number,
  ) =>
    console.warn(
      "[website-visit-forward]",
      JSON.stringify({ category, status, durationMs: Date.now() - startedAt }),
    );
  try {
    const response = await fetch(receiverUrl, {
      method: "POST",
      // Cloudflare Pages throws synchronously for `redirect: "error"`; manual still rejects every 3xx via response.ok.
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-website-visit-signature": signature,
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      warn("http", response.status);
      return false;
    }
    let result: { success?: boolean; data?: { accepted?: boolean } };
    try {
      result = (await response.json()) as typeof result;
    } catch {
      warn("invalid_response", response.status);
      return false;
    }
    if (result.success !== true || result.data?.accepted !== true) {
      warn("invalid_response", response.status);
      return false;
    }
    return true;
  } catch (error) {
    warn(error instanceof Error && error.name === "AbortError" ? "timeout" : "network");
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
