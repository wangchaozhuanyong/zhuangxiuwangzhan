import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager, skipToken, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { useInteractionQuery } from "./useInteractionQuery";

const seed = vi.hoisted(() => ({ payload: null as PublicDataPayload | null }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => seed.payload }));
const key = ["admin", "offline-first-read"];
type Options = UseQueryOptions<string, Error, string, QueryKey>;
let root: Root, node: HTMLDivElement, client: QueryClient;
let result: ReturnType<typeof useInteractionQuery<string>>;
let disabledResult: ReturnType<typeof useInteractionQuery<string>>;
const read = vi.fn<NonNullable<Exclude<Options["queryFn"], symbol>>>();
function Probe({ options }: { options: Options }) {
  result = useInteractionQuery<string>(options);
  return <p>{result.isLoading ? "Waiting for confirmed read" : result.data ?? "No content"}</p>;
}
function SharedProbe({ enabled }: { enabled: Options["enabled"] }) {
  result = useInteractionQuery<string>({ queryKey: key, queryFn: read });
  disabledResult = useInteractionQuery<string>({ queryKey: key, queryFn: read, enabled });
  return null;
}
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function render(options: Partial<Options> = {}) {
  await act(async () => root.render(<QueryClientProvider client={client}><Probe options={{ queryKey: key, queryFn: read, ...options }} /></QueryClientProvider>));
  await settle();
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  onlineManager.setOnline(true); seed.payload = null; read.mockReset().mockResolvedValue("Confirmed content");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); client.clear(); node.remove();
  onlineManager.setOnline(true); vi.unstubAllGlobals();
});

describe("first offline read presentation with the real query observer", () => {
  it("waits while the enabled first read is paused and resumes without displaying empty content", async () => {
    onlineManager.setOnline(false); await render();
    expect(result.status).toBe("pending"); expect(result.fetchStatus).toBe("paused");
    expect(result.isLoading).toBe(true); expect(result.isInitialLoading).toBe(true);
    expect(result.isFetching).toBe(false); expect(result.isInitialError).toBe(false);
    expect(node.textContent).toBe("Waiting for confirmed read"); expect(read).not.toHaveBeenCalled();
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(node.textContent).toBe("Confirmed content"); expect(result.isLoading).toBe(false);
    expect(read).toHaveBeenCalledOnce();
  });

  it.each([false, () => false] as const)("does not load an initially disabled observer (%s)", async (enabled) => {
    onlineManager.setOnline(false); await render({ enabled });
    expect(result.isEnabled).toBe(false); expect(result.status).toBe("pending");
    expect(result.fetchStatus).toBe("idle"); expect(result.isLoading).toBe(false); expect(read).not.toHaveBeenCalled();
  });

  it.each([false, () => false] as const)("keeps a disabled observer sharing an enabled paused query available (%s)", async (enabled) => {
    onlineManager.setOnline(false);
    await act(async () => root.render(<QueryClientProvider client={client}><SharedProbe enabled={enabled} /></QueryClientProvider>)); await settle();
    expect(result.isLoading).toBe(true); expect(disabledResult.fetchStatus).toBe("paused");
    expect(disabledResult.isEnabled).toBe(false); expect(disabledResult.isLoading).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it("uses resolved client defaults when a disabled observer attaches to a paused query", async () => {
    onlineManager.setOnline(false); client.setDefaultOptions({ queries: { retry: false, enabled: false } });
    void client.fetchQuery({ queryKey: key, queryFn: read }).catch(() => undefined);
    await render();
    expect(result.isPaused).toBe(true); expect(result.isEnabled).toBe(false); expect(result.isLoading).toBe(false);
  });

  it("removes the added loading state when disabled while paused and re-enables recovery", async () => {
    onlineManager.setOnline(false); await render(); await render({ enabled: () => false });
    expect(result.fetchStatus).toBe("paused"); expect(result.isLoading).toBe(false);
    await render({ enabled: true }); expect(result.isLoading).toBe(true);
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(result.data).toBe("Confirmed content");
  });

  it("does not reinterpret a skipToken observer as loading, including an existing paused key", async () => {
    onlineManager.setOnline(false); await render({ queryFn: skipToken });
    expect(result.isEnabled).toBe(false); expect(result.isLoading).toBe(false);
    await render({ queryFn: read }); expect(result.isLoading).toBe(true);
    await render({ queryFn: skipToken }); expect(result.isPaused).toBe(true);
    expect(result.isEnabled).toBe(false); expect(result.isLoading).toBe(false); expect(read).not.toHaveBeenCalled();
  });

  it("retains cached content and explicit initial data during a paused background read", async () => {
    client.setQueryData(key, "Cached body"); onlineManager.setOnline(false); await render();
    expect(result.fetchStatus).toBe("paused"); expect(result.data).toBe("Cached body");
    expect(result.isLoading).toBe(false); expect(result.isRefreshing).toBe(false);
    await render({ queryKey: ["admin", "initial-seed"], initialData: "Initial body" });
    expect(result.isPaused).toBe(true); expect(result.data).toBe("Initial body"); expect(result.isLoading).toBe(false);
  });

  it("keeps the actual HTML initialization seed visible while its refresh is paused", async () => {
    seed.payload = { siteSettings: { company_name: "HTML company" } };
    onlineManager.setOnline(false);
    let settings!: ReturnType<typeof useInteractionQuery<{ company_name: string }>>;
    function HtmlProbe() {
      settings = useInteractionQuery<{ company_name: string }>({ queryKey: ["site-settings"], queryFn: async () => ({ company_name: "Live company" }), staleTime: 0 });
      return <p>{settings.data?.company_name}</p>;
    }
    await act(async () => root.render(<QueryClientProvider client={client}><HtmlProbe /></QueryClientProvider>)); await settle();
    expect(settings.isPaused).toBe(true); expect(settings.isLoading).toBe(false); expect(node.textContent).toBe("HTML company");
  });

  it("preserves initial error semantics and lets an offline-independent fallback finish", async () => {
    read.mockRejectedValueOnce(new Error("Synthetic read failure")); await render();
    expect(result.isInitialError).toBe(true); expect(result.isLoading).toBe(false); expect(result.refreshError).toBeNull();
    onlineManager.setOnline(false); await render({ queryKey: ["admin", "local-fallback"], networkMode: "always" });
    expect(result.data).toBe("Confirmed content"); expect(result.isLoading).toBe(false);
  });

  it("cancels a paused first read and preserves the existing reconnect recovery policy", async () => {
    onlineManager.setOnline(false); await render();
    await act(async () => { await client.cancelQueries({ queryKey: key }); }); await settle();
    expect(result.fetchStatus).toBe("idle"); expect(result.isLoading).toBe(false);
    expect(read).not.toHaveBeenCalled();
    await act(async () => onlineManager.setOnline(true)); await settle();
    expect(result.data).toBe("Confirmed content"); expect(read).toHaveBeenCalledOnce();
  });

  it("preserves in-flight disable/cancellation and does not cache a late cancelled response", async () => {
    let complete!: (value: string) => void;
    const pending = new Promise<string>((resolve) => { complete = resolve; }); read.mockReturnValueOnce(pending);
    await render(); const signal = read.mock.calls[0]![0].signal;
    await render({ enabled: false }); expect(result.isFetching).toBe(true); expect(result.isLoading).toBe(true);
    await act(async () => { await client.cancelQueries({ queryKey: key }); }); await settle();
    expect(signal.aborted).toBe(true); expect(result.isLoading).toBe(false);
    complete("Late cancelled body"); await settle(); expect(client.getQueryData(key)).toBeUndefined();
    await render({ enabled: true }); await settle(); expect(result.data).toBe("Confirmed content");
  });
});
