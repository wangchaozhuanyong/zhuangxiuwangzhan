export type LeadTouch = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  landingPage: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
};

export type LeadAttributionPayload = {
  firstTouch: LeadTouch;
  lastTouch: LeadTouch;
  landingPage: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
};

const FIRST_TOUCH_COOKIE = "flashcast_first_touch";
const LAST_TOUCH_COOKIE = "flashcast_last_touch";
const FIRST_TOUCH_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
const MAX_VALUE_LENGTH = 240;

const clean = (value: unknown, max = MAX_VALUE_LENGTH) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const emptyTouch = (): LeadTouch => ({
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
  landingPage: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
});

const normalizeTouch = (value: unknown): LeadTouch => {
  const row = value && typeof value === "object" ? (value as Partial<LeadTouch>) : {};
  return {
    source: clean(row.source, 120),
    medium: clean(row.medium, 120),
    campaign: clean(row.campaign),
    term: clean(row.term),
    content: clean(row.content),
    landingPage: clean(row.landingPage, 400),
    gclid: clean(row.gclid, 300),
    gbraid: clean(row.gbraid, 300),
    wbraid: clean(row.wbraid, 300),
  };
};

const getCookie = (name: string) => {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const row = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : "";
};

const setCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${FIRST_TOUCH_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

const readStoredTouch = (cookieName: string): LeadTouch | null => {
  const raw = getCookie(cookieName);
  if (!raw) return null;
  try {
    return normalizeTouch(JSON.parse(raw));
  } catch {
    return null;
  }
};

const externalReferrerHost = () => {
  if (typeof document === "undefined" || typeof window === "undefined" || !document.referrer) return "";
  try {
    const referrer = new URL(document.referrer);
    return referrer.host !== window.location.host ? referrer.hostname : "";
  } catch {
    return "";
  }
};

const touchFromUrl = (urlLike: string): LeadTouch => {
  if (typeof window === "undefined") return emptyTouch();
  const url = new URL(urlLike, window.location.origin);
  const params = url.searchParams;
  const gclid = clean(params.get("gclid"), 300);
  const gbraid = clean(params.get("gbraid"), 300);
  const wbraid = clean(params.get("wbraid"), 300);
  const hasGoogleClickId = Boolean(gclid || gbraid || wbraid);
  const referrerHost = externalReferrerHost();
  const source = clean(params.get("utm_source"), 120) || (hasGoogleClickId ? "google" : referrerHost || "direct");
  const medium = clean(params.get("utm_medium"), 120) || (hasGoogleClickId ? "cpc" : referrerHost ? "referral" : "(none)");

  return {
    source,
    medium,
    campaign: clean(params.get("utm_campaign")),
    term: clean(params.get("utm_term")),
    content: clean(params.get("utm_content")),
    landingPage: clean(url.pathname, 400),
    gclid,
    gbraid,
    wbraid,
  };
};

const hasCampaignEvidence = (touch: LeadTouch) =>
  Boolean(
    touch.campaign ||
      touch.term ||
      touch.content ||
      touch.gclid ||
      touch.gbraid ||
      touch.wbraid ||
      (touch.source && touch.source !== "direct"),
  );

export const captureLeadAttribution = (path?: string): LeadTouch => {
  if (typeof window === "undefined") return emptyTouch();
  const current = touchFromUrl(path || `${window.location.pathname}${window.location.search}`);
  const existing = readStoredTouch(FIRST_TOUCH_COOKIE);
  if (!existing) setCookie(FIRST_TOUCH_COOKIE, JSON.stringify(current));
  if (hasCampaignEvidence(current) || !readStoredTouch(LAST_TOUCH_COOKIE)) {
    setCookie(LAST_TOUCH_COOKIE, JSON.stringify(current));
  }
  return existing || current;
};

export const getLeadAttribution = (): LeadAttributionPayload => {
  if (typeof window === "undefined") {
    const touch = emptyTouch();
    return { firstTouch: touch, lastTouch: touch, landingPage: "", gclid: "", gbraid: "", wbraid: "" };
  }

  const firstTouch = captureLeadAttribution();
  const current = touchFromUrl(`${window.location.pathname}${window.location.search}`);
  const lastTouch = hasCampaignEvidence(current)
    ? current
    : readStoredTouch(LAST_TOUCH_COOKIE) || firstTouch;

  return {
    firstTouch,
    lastTouch,
    landingPage: firstTouch.landingPage || current.landingPage,
    gclid: current.gclid || firstTouch.gclid,
    gbraid: current.gbraid || firstTouch.gbraid,
    wbraid: current.wbraid || firstTouch.wbraid,
  };
};
