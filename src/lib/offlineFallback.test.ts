import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("navigation compatibility worker", () => {
  it("activates the replacement without intercepting requests or touching visitor data", async () => {
    const listeners = new Map<string, (event: { waitUntil: (work: Promise<unknown>) => void }) => void>();
    const skipWaiting = vi.fn(() => Promise.resolve());
    const claim = vi.fn(() => Promise.resolve());
    const fail = () => { throw new Error("The compatibility worker must not access visitor data or navigate tabs."); };
    runInNewContext(readFileSync("public/sw.js", "utf8"), {
      self: {
        addEventListener: (type: string, listener: (event: { waitUntil: (work: Promise<unknown>) => void }) => void) => listeners.set(type, listener),
        skipWaiting,
        clients: { claim, matchAll: fail, openWindow: fail },
        registration: { unregister: fail },
      },
      caches: new Proxy({}, { get: fail }),
      fetch: fail,
    });
    expect([...listeners.keys()]).toEqual(["install", "activate"]);
    const pending: Promise<unknown>[] = [];
    for (const listener of listeners.values()) listener({ waitUntil: work => pending.push(work) });
    await Promise.all(pending);
    expect(skipWaiting).toHaveBeenCalledOnce();
    expect(claim).toHaveBeenCalledOnce();
    expect(pending).toHaveLength(2);
  });
});
