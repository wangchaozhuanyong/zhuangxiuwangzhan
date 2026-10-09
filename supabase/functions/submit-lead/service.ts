import {
  consumeSubmissionAttempt,
  createContactLead,
  createQuoteRequest,
  findSubmittedLead,
  findSubmittedTest,
  notifySubmittedLead,
  recordNotificationDispatchUnknown,
} from "./repository.ts";
import type { SubmittedLeadIdentity, SubmitBody, SubmitLeadClient, SubmitLeadResult } from "./types.ts";
import { requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { acceptanceSourcePath, isEnglishAcceptancePage, readLeadTest, SUBMISSION_UUID_PATTERN } from "../_shared/lead-test-contract.ts";

const MIN_SUBMIT_MS = 3000;
const NOTIFICATION_WAIT_TIMEOUT_MS = 2_500;

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
  const outcome = await consumeSubmissionAttempt(client, formType, ipHash, phoneHash);
  if (outcome === "ip_limit") {
    return { ok: false as const, message: "Too many submissions. Please try again later." };
  }
  if (outcome === "phone_limit") {
    return { ok: false as const, message: "This phone number has reached the daily submission limit." };
  }
  return { ok: true as const };
};

const errorResult = (error: string, status = 400): SubmitLeadResult => ({ status, body: { error } });
const saveFailedError = "Submission could not be saved. Please try again later.";
const identityConflictError = "Submission identity does not match the saved request.";
const submissionUuid = new RegExp(`^${SUBMISSION_UUID_PATTERN}$`, "i");

// A decoded subject is only a hint to verify the existing session, never proof of internal status.
const hasUserSessionSubject = (req: Request) => {
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const encoded = token.split(".")[1];
    if (!encoded) return false;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return typeof claims.sub === "string" && claims.sub.length > 0;
  } catch { return false; }
};

const stableSubmissionId = async (type: SubmitBody["type"], nonce: string, internalUserId: string | null) => {
  const digest = await hashText(`flashcast:lead-submission:v1:${type}:${nonce.toLowerCase()}:${internalUserId ?? "public"}`);
  // Custom version-8 UUID; domain separation prevents sharing a nonce across forms or trusted actors.
  const variant = ((Number.parseInt(digest[16], 16) & 3) | 8).toString(16);
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-8${digest.slice(13, 16)}-${variant}${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
};

const matchesIdentity = (stored: SubmittedLeadIdentity, expected: SubmittedLeadIdentity) =>
  Object.entries(expected).every(([field, value]) => String(stored[field as keyof SubmittedLeadIdentity] ?? "") === String(value ?? ""));

const waitForNotificationAttempt = async (attempt: Promise<unknown>) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const result = await Promise.race([
    attempt.then(() => "ok" as const).catch(() => "error" as const),
    new Promise<"timeout">((resolve) => {
      timeoutId = setTimeout(() => resolve("timeout"), NOTIFICATION_WAIT_TIMEOUT_MS);
    }),
  ]);

  clearTimeout(timeoutId);
  return result;
};

const dispatchSavedLeadNotification = async (client: SubmitLeadClient, type: SubmitBody["type"], id: string) => {
  const result = await waitForNotificationAttempt(notifySubmittedLead(client, type, id));
  if (result === "ok") return;
  try {
    await recordNotificationDispatchUnknown(client, type, id, result === "timeout" ? "dispatch_timeout" : "dispatch_error");
  } catch { /* Saved data remains acknowledged; never retry notification or expose raw errors. */ }
};

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
  if (body.submissionId !== undefined && (typeof body.submissionId !== "string" || !submissionUuid.test(body.submissionId))) {
    return errorResult("Invalid submission identity");
  }

  let test: ReturnType<typeof readLeadTest>["test"] = null;
  const rawSourcePath = String(body.sourcePath ?? "");
  // Reject overlong test markers before truncation, so they cannot become ordinary submissions.
  if (rawSourcePath.length > 300 && /fc_test|__internal_test__/.test(rawSourcePath)) {
    return errorResult("Invalid test submission");
  }
  try {
    const classified = readLeadTest(rawSourcePath || "/", body.type);
    if (!classified.valid) return errorResult("Invalid test submission");
    test = classified.test;
  } catch {
    return errorResult("Invalid form data");
  }
  if (!test && /^\[TEST\]/i.test(clean(body.name, 120))) return errorResult("Invalid test submission");
  if (test) {
    // No cron/service-role bypass: reuse existing active administrator + AAL2 + super-admin checks.
    const authClient = client as unknown as Parameters<typeof requireAdminAccess>[1];
    const access = requireSuperAdminAccess(await requireAdminAccess(req, authClient));
    if (!access.ok) return errorResult("Test submission requires an authorized administrator", access.status);
    const notes = body.type === "contact" ? body.message : body.details;
    if (!/^\[TEST\]/.test(clean(body.name, 120)) || !clean(notes, 4000).includes("非客户咨询") ||
      clean(body.phone, 40).replace(/[+\s-]/g, "") !== "601128853888") {
      return errorResult("Invalid test submission");
    }
    try {
      const existing = await findSubmittedTest(client, body.type, test.id);
      if (existing) return existing.source_path === test.sourcePath
        ? { body: { ok: true, id: existing.id, deduplicated: true } }
        : errorResult(saveFailedError, 500);
    } catch {
      return errorResult(saveFailedError, 500);
    }
  }

  const phone = clean(body.phone, 40);
  if (!phoneOk(phone)) return errorResult("Invalid phone number");
  const phoneHash = await hashText(phone.replace(/[+\s-]/g, ""));
  const email = clean(body.email, 200);
  if (email && !emailOk(email)) return errorResult("Invalid email");

  const name = clean(body.name, 120);
  const projectType = clean(body.projectType, 120);
  const location = clean(body.location, 200);
  const message = body.type === "contact" ? clean(body.message, 4000) : undefined;
  if (!name || (body.type === "contact" ? message!.length < 10 : !projectType || !location)) return errorResult("Invalid form data");

  let internalUserId: string | null = null;
  if (!test && isEnglishAcceptancePage(rawSourcePath, body.type) && hasUserSessionSubject(req)) {
    try {
      const authClient = client as unknown as Parameters<typeof requireAdminAccess>[1];
      const access = requireSuperAdminAccess(await requireAdminAccess(req, authClient));
      if (access.status === 401 || access.status >= 500) return errorResult("Submission identity could not be verified", access.status);
      // Verified ordinary users retain public submission semantics. Only the existing trusted role is internal.
      if (access.ok && access.userId) internalUserId = access.userId;
    } catch { return errorResult(saveFailedError, 500); }
  }
  const id = test?.id ?? (body.submissionId ? await stableSubmissionId(body.type, body.submissionId, internalUserId) : crypto.randomUUID());
  const internal = internalUserId !== null;
  const sourcePath = test?.sourcePath ?? (internal ? acceptanceSourcePath(body.type, id) : clean(body.sourcePath, 300));
  const identity: SubmittedLeadIdentity = {
    id, sourcePath, name, phone, email, projectType, location,
    ...(body.type === "contact" ? { message } : {
      propertySize: clean(body.propertySize, 80), budget: clean(body.budget, 80), details: clean(body.details, 4000),
    }),
  };
  const successResult = (deduplicated = false): SubmitLeadResult => ({
    body: { ok: true, id, ...(deduplicated ? { deduplicated: true as const } : {}), ...(internal ? { internal: true as const } : {}) },
  });
  if (!test && body.submissionId) {
    try {
      const existing = await findSubmittedLead(client, body.type, id);
      if (existing) return matchesIdentity(existing, identity) ? successResult(true) : errorResult(identityConflictError, 409);
    } catch { return errorResult(saveFailedError, 500); }
  }
  const recoverConcurrentSubmission = async (error: unknown): Promise<SubmitLeadResult | null> => {
    if ((!test && !body.submissionId) || !error || typeof error !== "object" || !("code" in error) || error.code !== "23505") return null;
    try {
      if (test) {
        const existing = await findSubmittedTest(client, body.type, id);
        if (existing?.source_path === test.sourcePath) return successResult(true);
      } else {
        const existing = await findSubmittedLead(client, body.type, id);
        if (existing) return matchesIdentity(existing, identity) ? successResult(true) : errorResult(identityConflictError, 409);
      }
    } catch { /* A failed verification must not acknowledge an unproven save. */ }
    return null;
  };

  const ipHash = await hashText(getClientIp(req));

  try {
    const rate = await checkRateLimit(client, body.type, ipHash, phoneHash);
    if (!rate.ok) return errorResult(rate.message, 429);
  } catch {
    return errorResult(saveFailedError, 500);
  }

  if (body.type === "contact") {
    try {
      await createContactLead(client, {
        id,
        name,
        phone,
        email,
        projectType: clean(body.projectType, 120),
        location: clean(body.location, 200),
        message: message!,
        sourcePath,
      });
    } catch (error) {
      return await recoverConcurrentSubmission(error) ?? errorResult(saveFailedError, 500);
    }

    await dispatchSavedLeadNotification(client, "contact", id);

    return successResult();
  }

  if (body.type === "quote") {
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
        sourcePath,
      });
    } catch (error) {
      return await recoverConcurrentSubmission(error) ?? errorResult(saveFailedError, 500);
    }

    await dispatchSavedLeadNotification(client, "quote", id);

    return successResult();
  }

  return errorResult("Unknown form type");
}
