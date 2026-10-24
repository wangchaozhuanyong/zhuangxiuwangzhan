import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "../../supabase/functions/_shared/turnstile";

const unavailable = { ok: false, status: 503, error: "Bot verification temporarily unavailable" };
const rejected = { ok: false, status: 400, error: "Bot verification failed" };
const transport = vi.fn<typeof fetch>();
let configured = true;

beforeEach(() => {
  configured = true;
  transport.mockReset();
  vi.stubGlobal("Deno", { env: { get: () => configured ? "synthetic-server-fixture" : undefined } });
  vi.stubGlobal("fetch", transport);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("server-side Turnstile provider boundary", () => {
  it("keeps the existing unconfigured behavior without contacting the provider", async () => {
    configured = false;
    expect(await verifyTurnstileToken(undefined, null)).toEqual({ ok: true, enforced: false });
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 12, "", "  "])("rejects missing token %j before contacting the provider", async token => {
    expect(await verifyTurnstileToken(token, null)).toEqual(rejected);
    expect(transport).not.toHaveBeenCalled();
  });

  it("requires affirmative provider verification and clears its deadline after success", async () => {
    vi.useFakeTimers();
    transport.mockResolvedValue(Response.json({ success: true }));
    expect(await verifyTurnstileToken(" synthetic-response ", "198.18.201.1")).toEqual({ ok: true, enforced: true });
    expect(transport).toHaveBeenCalledOnce();
    const [url, init] = transport.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect((init?.body as FormData).get("response")).toBe("synthetic-response");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["invalid-input-response", "timeout-or-duplicate"])("retains a JSON-compatible rejection for %s", async code => {
    transport.mockResolvedValue(Response.json({ success: false, "error-codes": [code] }));
    expect(await verifyTurnstileToken("synthetic-response", null)).toEqual(rejected);
  });

  it("returns a safe retryable failure when the provider connection rejects", async () => {
    vi.useFakeTimers();
    transport.mockRejectedValue(new TypeError("Synthetic internal transport detail"));
    expect(await verifyTurnstileToken("synthetic-response", null)).toEqual(unavailable);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    () => new Response("upstream unavailable", { status: 502 }),
    () => new Response("invalid upstream JSON"),
    () => Response.json({}),
    () => Response.json({ success: "true" }),
  ])("does not accept an unavailable or malformed provider response", async response => {
    transport.mockResolvedValue(response());
    expect(await verifyTurnstileToken("synthetic-response", null)).toEqual(unavailable);
  });

  it("aborts one stalled verification after eight seconds without retrying or accepting it", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    transport.mockImplementation((_input, init) => {
      signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new DOMException("Synthetic stall", "AbortError")), { once: true });
      });
    });
    let outcome: unknown = "pending";
    void verifyTurnstileToken("synthetic-response", null).then(value => { outcome = value; });
    await vi.advanceTimersByTimeAsync(7_999);
    expect(outcome).toBe("pending");
    await vi.advanceTimersByTimeAsync(1);
    expect(signal?.aborted).toBe(true);
    expect(outcome).toEqual(unavailable);
    expect(transport).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
