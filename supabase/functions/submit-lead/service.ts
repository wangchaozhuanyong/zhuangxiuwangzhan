import {
  countRecentAttemptsByIp,
  countRecentAttemptsByPhone,
  createContactLead,
  createQuoteRequest,
  notifySubmittedLead,
  recordSubmissionAttempt,
} from "./repository.ts";
import type { SubmitBody, SubmitLeadClient, SubmitLeadResult } from "./types.ts";

const MIN_SUBMIT_MS = 3000;
const MAX_PER_IP_HOUR = 8;
const MAX_PER_PHONE_DAY = 5;

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

const phoneOk = (phone: string) => /^(?=.{7,20}$)[+]?\d[\d\s-]*$/.test(phone);
const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashText = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const getClientIp = (req: Request) => {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
};

const checkRateLimit = async (
  client: SubmitLeadClient,
  formType: SubmitBody["type"],
  ipHash: string,
  phoneHash: string | null,
) => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const ipCount = await countRecentAttemptsByIp(client, ipHash, hourAgo);
  if (ipCount >= MAX_PER_IP_HOUR) {
    return { ok: false as const, message: "Too many submissions. Please try again later." };
  }

  if (phoneHash) {
    const phoneCount = await countRecentAttemptsByPhone(client, phoneHash, dayAgo);
    if (phoneCount >= MAX_PER_PHONE_DAY) {
      return { ok: false as const, message: "This phone number has reached the daily submission limit." };
    }
  }

  await recordSubmissionAttempt(client, formType, ipHash, phoneHash);
  return { ok: true as const };
};

const errorResult = (error: string, status = 400): SubmitLeadResult => ({ status, body: { error } });
const saveFailedError = "Submission could not be saved. Please try again later.";

export async function submitLead(req: Request, body: SubmitBody, client: SubmitLeadClient): Promise<SubmitLeadResult> {
  if (clean(body.website)) {
    return errorResult("Submission rejected");
  }

  const startedAt = Number(body.startedAt || 0);
  const elapsedMs = Number(body.elapsedMs || 0);
  const serverAgeMs = startedAt ? Date.now() - startedAt : 0;
  const isTooFast = elapsedMs > 0 ? elapsedMs < MIN_SUBMIT_MS : !startedAt || serverAgeMs < MIN_SUBMIT_MS;
  if (isTooFast) {
    return errorResult("Please wait a moment before submitting.");
  }

  if (body.type !== "contact" && body.type !== "quote") {
    return errorResult("Unknown form type");
  }

  const ipHash = await hashText(getClientIp(req));
  const phone = clean(body.phone, 40);
  if (!phoneOk(phone)) return errorResult("Invalid phone number");
  const phoneHash = await hashText(phone);
  const email = clean(body.email, 200);
  if (email && !emailOk(email)) return errorResult("Invalid email");

  const rate = await checkRateLimit(client, body.type, ipHash, phoneHash);
  if (!rate.ok) return errorResult(rate.message, 429);

  if (body.type === "contact") {
    const name = clean(body.name, 120);
    const message = clean(body.message, 4000);
    if (!name || message.length < 10) return errorResult("Invalid form data");

    const id = crypto.randomUUID();
    try {
      await createContactLead(client, {
        id,
        name,
        phone,
        email,
        projectType: clean(body.projectType, 120),
        location: clean(body.location, 200),
        message,
        sourcePath: clean(body.sourcePath, 300),
      });
    } catch {
      return errorResult(saveFailedError, 500);
    }

    try {
      await notifySubmittedLead(client, "contact", id);
    } catch {
      // Submission is already saved; notification failure must not reject the user.
    }

    return { body: { ok: true, id } };
  }

  if (body.type === "quote") {
    const name = clean(body.name, 120);
    const projectType = clean(body.projectType, 120);
    const location = clean(body.location, 200);
    if (!name || !projectType || !location) return errorResult("Invalid form data");

    const id = crypto.randomUUID();
    try {
      await createQuoteRequest(client, {
        id,
        name,
        phone,
        email,
        projectType,
        location,
        propertySize: clean(body.propertySize, 80),
        budget: clean(body.budget, 80),
        details: clean(body.details, 4000),
        sourcePath: clean(body.sourcePath, 300),
      });
    } catch {
      return errorResult(saveFailedError, 500);
    }

    try {
      await notifySubmittedLead(client, "quote", id);
    } catch {
      // Submission is already saved; notification failure must not reject the user.
    }

    return { body: { ok: true, id } };
  }

  return errorResult("Unknown form type");
}
