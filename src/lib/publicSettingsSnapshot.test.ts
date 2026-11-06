import { describe, expect, it, vi } from "vitest";
import { createPublicSettingsReader } from "../../functions/publicSettingsSnapshot";

const revision = "revision-a";
const snapshotRequest = new Request("https://flashcast.com.my/__snapshot?source=fixture&deploy=a");
const memoryCache = () => {
  const values = new Map<string, Response>();
  return {
    match: vi.fn(async (request: Request) => values.get(request.url)?.clone()),
    put: vi.fn(async (request: Request, response: Response) => { values.set(request.url, response.clone()); }),
  };
};

describe("five-second public settings snapshots", () => {
  it("shares a hard-deadline revision across isolates without reading full settings", async () => {
    let now = 1000;
    const cache = memoryCache();
    const full = vi.fn(async () => ({ updated_at: revision, company_name: "Fixture" }));
    const first = createPublicSettingsReader({ now: () => now });
    const options = { key: "source-deploy-a", cache, snapshotRequest, readFull: full, readRevision: vi.fn(async () => revision) };
    expect(await first.revision(options)).toBe(revision);
    now = 4000;
    const second = createPublicSettingsReader({ now: () => now });
    expect(await second.revision(options)).toBe(revision);
    expect(full).toHaveBeenCalledOnce();
    expect(options.readRevision).not.toHaveBeenCalled();
    expect(first.peek("source-deploy-a")?.expiresAt).toBe(6000);
  });

  it("counts the five seconds from the source read start and never renews a failed revision", async () => {
    let now = 1000;
    const reader = createPublicSettingsReader({ now: () => now });
    const cache = memoryCache();
    const options = { key: "hard-deadline", cache, snapshotRequest,
      readFull: vi.fn(async () => { now = 4000; return { updated_at: revision }; }),
      readRevision: vi.fn(async () => null) };
    await reader.revision(options);
    expect(reader.peek(options.key)?.expiresAt).toBe(6000);
    now = 6001;
    expect(await reader.revision(options)).toBeNull();
    expect(options.readRevision).toHaveBeenCalledOnce();
    expect(cache.put).toHaveBeenCalledOnce();
  });

  it("coalesces full reads and uses revision-only reads after a known version expires", async () => {
    let now = 1000;
    let finish!: (value: { updated_at: string }) => void;
    const reader = createPublicSettingsReader({ now: () => now });
    const options = { key: "shared", readFull: vi.fn(() => new Promise<{ updated_at: string }>(resolve => { finish = resolve; })),
      readRevision: vi.fn(async () => "revision-b") };
    const a = reader.full(options); const b = reader.full(options);
    expect(options.readFull).toHaveBeenCalledOnce();
    finish({ updated_at: revision });
    expect(await a).toEqual(await b);
    now = 6001;
    expect(await reader.revision(options)).toBe("revision-b");
    expect(options.readFull).toHaveBeenCalledOnce();
    expect(options.readRevision).toHaveBeenCalledOnce();
  });

  it.each(["future", "extended", "malformed"])("rejects a %s snapshot", async kind => {
    const now = 10_000;
    const cache = memoryCache();
    const bad = kind === "future" ? { revision, startedAt: now + 1, expiresAt: now + 5001 }
      : kind === "extended" ? { revision, startedAt: now - 1, expiresAt: now + 5000 }
      : { revision, startedAt: "1000", expiresAt: "6000" };
    await cache.put(snapshotRequest, Response.json(bad));
    const full = vi.fn(async () => null);
    const reader = createPublicSettingsReader({ now: () => now });
    expect(await reader.revision({ key: kind, cache, snapshotRequest, readFull: full, readRevision: async () => null })).toBeNull();
    expect(full).toHaveBeenCalledOnce();
  });

  it("does not publish an already expired slow source observation", async () => {
    let now = 1000;
    const cache = memoryCache();
    const reader = createPublicSettingsReader({ now: () => now });
    const result = await reader.revision({ key: "slow", cache, snapshotRequest,
      readFull: async () => { now = 6001; return { updated_at: revision }; }, readRevision: async () => null });
    expect(result).toBeNull(); expect(cache.put).not.toHaveBeenCalled();
  });

  it("keeps source reads usable when the snapshot write fails synchronously", async () => {
    const reader = createPublicSettingsReader();
    expect(await reader.revision({ key: "broken-cache", snapshotRequest,
      cache: { match: async () => undefined, put: () => { throw new Error("cache unavailable"); } },
      readFull: async () => ({ updated_at: revision }), readRevision: async () => null })).toBe(revision);
  });

  it("does not share a snapshot across source or deployment keys", async () => {
    const reader = createPublicSettingsReader();
    const full = vi.fn(async () => ({ updated_at: revision }));
    for (const key of ["source-a:deployment-a", "source-b:deployment-a", "source-a:deployment-b"]) {
      await reader.revision({ key, readFull: full, readRevision: async () => null });
    }
    expect(full).toHaveBeenCalledTimes(3);
  });
});
