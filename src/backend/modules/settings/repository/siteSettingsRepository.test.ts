import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackSiteSettings, fetchSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";

type ReadResult = { data: Partial<SiteSettings> | null; error: Error | null };
const { read, from, abortSignal } = vi.hoisted(() => ({ read: vi.fn(), from: vi.fn(), abortSignal: vi.fn() }));
vi.mock("@/lib/supabaseConfig", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase", () => ({ supabase: { from } }));

function readBuilder() {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => builder,
    abortSignal: (signal: AbortSignal) => { abortSignal(signal); return builder; },
    then: <TResult1 = ReadResult, TResult2 = never>(
      fulfilled?: ((value: ReadResult) => TResult1 | PromiseLike<TResult1>) | null,
      rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(read() as ReadResult).then(fulfilled, rejected),
  };
  return builder;
}
const options = { queryKey: ["site-settings"], queryFn: ({ signal }: { signal: AbortSignal }) => fetchSiteSettings(signal) };
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

describe("site settings real repository read semantics", () => {
  beforeEach(() => { read.mockReset(); from.mockReset().mockImplementation(readBuilder); abortSignal.mockReset(); });

  it("keeps a failed first transport read out of the successful settings cache", async () => {
    const error = new Error("Settings unavailable");
    read.mockReturnValue({ data: null, error });
    const client = makeClient();
    try {
      await expect(client.fetchQuery(options)).rejects.toBe(error);
      expect(client.getQueryState(options.queryKey)?.status).toBe("error");
      expect(client.getQueryData(options.queryKey)).toBeUndefined();
    } finally { client.clear(); }
  });

  it("retains confirmed settings on a failed refresh and accepts a later successful retry", async () => {
    read.mockReturnValue({ data: { brand_name: "Confirmed brand" }, error: null });
    const client = makeClient();
    try {
      const confirmed = await client.fetchQuery(options);
      read.mockReturnValue({ data: null, error: new Error("Refresh unavailable") });
      await expect(client.fetchQuery(options)).rejects.toThrow("Refresh unavailable");
      expect(client.getQueryData(options.queryKey)).toBe(confirmed);
      expect(client.getQueryState(options.queryKey)?.status).toBe("error");
      read.mockReturnValue({ data: { brand_name: "Updated brand" }, error: null });
      await expect(client.fetchQuery(options)).resolves.toMatchObject({ brand_name: "Updated brand" });
      expect(client.getQueryState(options.queryKey)?.status).toBe("success");
    } finally { client.clear(); }
  });

  it("keeps the existing fallback only for a successful missing record", async () => {
    read.mockReturnValue({ data: null, error: null });
    await expect(fetchSiteSettings()).resolves.toBe(fallbackSiteSettings);
  });

  it("passes query cancellation to the actual settings transport", async () => {
    read.mockReturnValue({ data: { brand_name: "Confirmed brand" }, error: null });
    const controller = new AbortController();
    await fetchSiteSettings(controller.signal);
    expect(from).toHaveBeenCalledWith("site_settings");
    expect(abortSignal).toHaveBeenCalledExactlyOnceWith(controller.signal);
  });
});
