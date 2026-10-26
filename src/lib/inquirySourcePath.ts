import { currentInquirySources, INQUIRY_CHANNELS, type InquiryChannel, type InquirySources } from "./inquirySource";

const unknown = (): InquirySources => ({ first: "unknown", last: "unknown" });
const isChannel = (v: unknown): v is InquiryChannel => INQUIRY_CHANNELS.includes(v as InquiryChannel);

export function readInquirySources(sourcePath?: string | null): InquirySources {
  try {
    const p = new URL(sourcePath || "/", "https://flashcast.invalid").searchParams;
    const first = p.get("inq_first"), last = p.get("inq_last");
    return isChannel(first) && isChannel(last) ? { first, last } : unknown();
  } catch { return unknown(); }
}

const contextSources = /^(service|services|project|projects|material|materials|product|products|location|locations|floating|general|contact|quote|landing|home|blog)$/;
function safeContext(value: string) {
  if (/[@?=]|:\/\/|token|password|secret|bearer|\+?\d(?:[\s()-]*\d){6,}/i.test(value)) return "";
  const text = Array.from(value).filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join("").trim();
  return Array.from(text).slice(0, 100).join("");
}
/** Whole encoded parameters only; channels and TEST guards take priority over optional context. */
export function buildInquirySourcePath(input: string, sources = currentInquirySources()): string {
  let url: URL;
  try { url = new URL(input, "https://flashcast.invalid"); } catch { url = new URL("/", "https://flashcast.invalid"); }
  const internalTest = /^\/__internal_test__\/[A-Za-z0-9_/-]{1,180}$/.test(url.pathname);
  if (internalTest) return url.pathname; // The existing server rejects client-supplied stored TEST paths.
  const pathname = /^\/(?:zh|en|ms)\/(?:contact|quote|landing\/[a-z0-9-]{1,80})\/?$/i.test(url.pathname) ? url.pathname : "/";
  const p = new URLSearchParams();
  p.set("inq_first", isChannel(sources.first) ? sources.first : "unknown");
  p.set("inq_last", isChannel(sources.last) ? sources.last : "unknown");
  const tests = url.searchParams.getAll("fc_test");
  for (const value of tests.slice(0, 2)) p.append("fc_test", /^fc_paid_20261008_T0[12]$/.test(value) ? value : "invalid");
  const compose = () => `${pathname}?${p.toString()}`;
  const source = url.searchParams.get("source") || "";
  const hasSiteContext = contextSources.test(source);
  if (hasSiteContext) p.set("source", source);
  for (const key of hasSiteContext ? ["title", "context", "projectType"] : []) {
    let value = safeContext(url.searchParams.get(key) || "");
    while (value) {
      p.set(key, value);
      if (compose().length <= 300) break;
      value = Array.from(value).slice(0, -1).join("");
    }
    if (!value) p.delete(key);
  }
  return compose();
}
