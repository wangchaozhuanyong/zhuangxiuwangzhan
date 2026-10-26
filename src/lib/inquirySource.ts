// First-party browser reference only. Never a verified ad conversion or customer identity.
export const INQUIRY_CHANNELS = ["google_paid", "chatgpt_paid", "google_organic", "chatgpt_referral", "other_referral", "unknown"] as const;
export type InquiryChannel = typeof INQUIRY_CHANNELS[number];
export type InquirySources = { first: InquiryChannel; last: InquiryChannel };
type Session = InquirySources & { version: 1; seenAt: number };
export const INQUIRY_SESSION_KEY = "flashcast:inquiry-source:v1";
export const INQUIRY_SESSION_MS = 30 * 60 * 1000;
const unknown = (): InquirySources => ({ first: "unknown", last: "unknown" });
const isChannel = (v: unknown): v is InquiryChannel => INQUIRY_CHANNELS.includes(v as InquiryChannel);
let memory: Session | null = null;

export function classifyInquirySource(href: string, referrer = "", allowReferrer = true): InquiryChannel {
  let url: URL;
  try { url = new URL(href); } catch { return "unknown"; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return "unknown";
  const p = url.searchParams;
  const names = ["utm_source", "utm_medium", "gclid", "gbraid", "wbraid"];
  if (names.some(k => p.getAll(k).length > 1)) return "unknown";
  const source = (p.get("utm_source") || "").toLowerCase();
  const medium = (p.get("utm_medium") || "").toLowerCase();
  const clicks = ["gclid", "gbraid", "wbraid"].filter(k => p.has(k));
  // Conservative local syntax guard, not Google validation or proof of an authentic click.
  const validClick = clicks.length > 0 && clicks.every(k => /^[A-Za-z0-9_-]{20,200}$/.test(p.get(k) || ""));
  if (clicks.length && !validClick) return "unknown";
  if (validClick && source && source !== "google") return "unknown";
  if (validClick && medium && !/^(cpc|ppc|paid|paidsearch|paid_search)$/.test(medium)) return "unknown";
  if (validClick) return "google_paid";
  if (/^(cpc|ppc|paid|paidsearch|paid_search)$/.test(medium)) {
    return source === "google" ? "google_paid" : source === "chatgpt" ? "chatgpt_paid" : "unknown";
  }
  if (source === "google" && medium === "organic") return "google_organic";
  if (source === "chatgpt" && /^(organic|referral)$/.test(medium)) return "chatgpt_referral";
  // A source name alone is not evidence of either paid or organic traffic.
  if (source || medium || !allowReferrer || !referrer) return "unknown";
  try {
    const ref = new URL(referrer);
    if (!/^https?:$/.test(ref.protocol) || ref.username || ref.password || ref.port || ref.hostname === url.hostname
      || /^(www\.)?flashcast\.com\.my$/.test(ref.hostname)) return "unknown";
    if (/^(?:www\.)?google\.(?:com|com\.my|co\.uk|com\.sg|com\.au|co\.in)$/.test(ref.hostname)) return "google_organic";
    if (/^(?:www\.)?(?:chatgpt\.com|chat\.openai\.com)$/.test(ref.hostname)) return "chatgpt_referral";
    return "other_referral";
  } catch { return "unknown"; }
}

function validSession(value: unknown, now: number): value is Session {
  if (!value || typeof value !== "object") return false;
  const v = value as Session;
  return v.version === 1 && isChannel(v.first) && isChannel(v.last) && Number.isFinite(v.seenAt)
    && now >= v.seenAt && now - v.seenAt < INQUIRY_SESSION_MS;
}
function restored(now: number): Session | null {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(INQUIRY_SESSION_KEY) || "null");
    if (validSession(stored, now)) return { version: 1, first: stored.first, last: stored.last, seenAt: stored.seenAt };
  } catch { /* Optional storage: same-document memory remains usable. */ }
  return validSession(memory, now) ? memory : null;
}
export function mergeInquirySources(previous: InquirySources | null, channel: InquiryChannel): InquirySources {
  return previous ? { first: previous.first, last: channel === "unknown" ? previous.last : channel } : { first: channel, last: channel };
}
export function currentInquirySources(): InquirySources {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return unknown();
  return mergeInquirySources(restored(Date.now()), classifyInquirySource(window.location.href, "", false));
}
export function captureInquirySources(entry = false) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
  const now = Date.now();
  const navigation = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  const allowReferrer = entry && (!navigation || navigation.type === "navigate");
  const channel = classifyInquirySource(window.location.href, allowReferrer ? document.referrer : "", allowReferrer);
  memory = { version: 1, ...mergeInquirySources(restored(now), channel), seenAt: now };
  try { window.sessionStorage.setItem(INQUIRY_SESSION_KEY, JSON.stringify(memory)); } catch { /* Do not block an enquiry. */ }
}
