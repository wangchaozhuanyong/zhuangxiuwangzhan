import { afterEach, describe, expect, it, vi } from "vitest";
import { INTERACTION_POLICY, runReadQuery } from "./interactionPolicy";
afterEach(() => vi.useRealTimers());
describe("read deadlines and cancellation", () => {
  it("cancels the transport when the query owner aborts", async () => {
    const owner = new AbortController(); let signal: AbortSignal;
    const read = runReadQuery(owner.signal, (next) => { signal = next; return new Promise(() => {}); });
    const assertion = expect(read).rejects.toMatchObject({ name: "AbortError" });
    owner.abort(); await assertion; expect(signal!.aborted).toBe(true);
  });
  it("rejects stalled composite reads at the shared deadline", async () => {
    vi.useFakeTimers(); let signal: AbortSignal;
    const read = runReadQuery(undefined, (next) => { signal = next; return new Promise(() => {}); });
    const assertion = expect(read).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(INTERACTION_POLICY.readTimeout); await assertion; expect(signal!.aborted).toBe(true);
  });
  it("never invokes a read after upstream cancellation", async () => {
    const owner = new AbortController(); owner.abort(); const fetch = vi.fn();
    await expect(runReadQuery(owner.signal, fetch)).rejects.toMatchObject({ name: "AbortError" }); expect(fetch).not.toHaveBeenCalled();
  });
});
