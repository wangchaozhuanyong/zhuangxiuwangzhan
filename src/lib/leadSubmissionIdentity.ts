import { isLeadTestPage } from "@/lib/leadTest";

type LeadType = "quote" | "contact";
type SubmissionIdentity = { submissionId: string; fingerprint: string; createdAt: number };
const retryWindowMs = 30 * 60 * 1000;
const identities = new Map<LeadType, SubmissionIdentity>();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const storageKey = (type: LeadType) => `flashcast:lead-submission:${type}`;

// Only opaque identity, a payload digest and time are persisted, never form values.
export async function getLeadSubmissionId(type: LeadType, sourcePath: string, fields: Record<string, string | undefined>) {
  if (typeof window === "undefined" || sourcePath.split("?")[0] !== `/en/${type}` || isLeadTestPage(sourcePath)) return undefined;
  const canonical = JSON.stringify([type, sourcePath, Object.keys(fields).sort().map((key) => [key, fields[key] || ""])]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  let previous = identities.get(type);
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey(type)) || "null") as SubmissionIdentity | null;
    if (stored && uuidPattern.test(stored.submissionId) && /^[0-9a-f]{64}$/.test(stored.fingerprint) && Number.isFinite(stored.createdAt)) previous = stored;
  } catch { /* In-memory retries remain available when browser storage is blocked. */ }
  const now = Date.now();
  if (previous?.fingerprint === fingerprint && now >= previous.createdAt && now - previous.createdAt < retryWindowMs) {
    identities.set(type, previous);
    return previous.submissionId;
  }
  const next = { submissionId: crypto.randomUUID(), fingerprint, createdAt: now };
  identities.set(type, next);
  try { window.sessionStorage.setItem(storageKey(type), JSON.stringify(next)); } catch { /* Storage is optional. */ }
  return next.submissionId;
}

export function resetLeadSubmissionIdentity(type: LeadType) {
  identities.delete(type);
  try { window.sessionStorage.removeItem(storageKey(type)); } catch { /* Storage is optional. */ }
}
