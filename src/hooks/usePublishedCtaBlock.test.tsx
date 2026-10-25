import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/i18n/routes";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { publicContentQueryKeys } from "@/lib/publicContentQueryKeys";
import { mapPublishedCtaBlockRow } from "@/lib/publicCta";
import { getPublicCtaSeed } from "@/lib/publicQuerySeedCache";
import { usePublishedCtaBlock } from "./usePublishedCtaBlock";

const fixture = vi.hoisted(() => ({ payload: null as PublicDataPayload | null, read: vi.fn() }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => fixture.payload }));
vi.mock("@/lib/supabaseConfig", () => ({ isSupabaseConfigured: true }));
vi.mock("@/backend/modules/cms/repository/publicContentRepository", () => ({
  fetchPublishedCtaBlockRow: fixture.read,
  hasPublicContentDatabaseClient: () => true,
}));

const row = { id: "invitation", block_key: "home_final", title_en: "Saved invitation", title_zh: "已保存邀请", title_ms: "Jemputan disimpan", primary_url: "/quote#quote-form" };
let client: QueryClient;
let root: Root;
let container: HTMLDivElement;
let observed: ReturnType<typeof usePublishedCtaBlock>;
function Probe({ language, enabled }: { language: Language; enabled: boolean }) {
  observed = usePublishedCtaBlock(language, "home_final", { enabled });
  return null;
}
const render = (language: Language = "en", enabled = true) => act(async () => {
  root.render(<QueryClientProvider client={client}><Probe language={language} enabled={enabled} /></QueryClientProvider>);
});
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixture.payload = null;
  fixture.read.mockReset().mockResolvedValue(null);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("lightweight shared CTA reads", () => {
  it.each(["en", "zh", "ms"] as const)("hydrates the same %s record before lazy content readers load", async language => {
    fixture.payload = { ctaBlocks: { home_final: row } };
    await render(language);
    expect(observed.data).toEqual(mapPublishedCtaBlockRow(row, language));
    expect(client.getQueryData(publicContentQueryKeys.ctaBlock.key(language, "home_final"))).toEqual(observed.data);
    expect(fixture.read).not.toHaveBeenCalled();
  });

  it("keeps a confirmed empty seed distinct from an unperformed read", async () => {
    fixture.payload = { ctaBlocks: { home_final: null } };
    expect(getPublicCtaSeed(["published", "cta", "en", "about_final"])).toBeUndefined();
    expect(getPublicCtaSeed(["published", "services", "en"])).toBeUndefined();
    await render();
    expect(observed.data).toBeNull();
    expect(fixture.read).not.toHaveBeenCalled();
  });

  it("uses the existing reader, cache key and AbortSignal when HTML has no CTA", async () => {
    fixture.read.mockResolvedValue(row);
    await render();
    await vi.waitFor(() => expect(observed.data?.title).toBe("Saved invitation"));
    expect(fixture.read).toHaveBeenCalledExactlyOnceWith("home_final", expect.any(AbortSignal));
    expect(client.getQueryData(["published", "cta", "en", "home_final"])).toEqual(observed.data);
  });

  it("retains errors without manufacturing successful fallback data", async () => {
    fixture.read.mockRejectedValue(new Error("CTA read unavailable"));
    await render();
    await vi.waitFor(() => expect(observed.isInitialError).toBe(true));
    expect(client.getQueryData(["published", "cta", "en", "home_final"])).toBeUndefined();
    expect(fixture.read).toHaveBeenCalledOnce();
  });

  it("does not replay old document content after invalidation or removal", async () => {
    fixture.payload = { ctaBlocks: { home_final: row } };
    await render();
    fixture.read.mockResolvedValue({ ...row, title_en: "Current invitation" });
    await act(async () => { await client.invalidateQueries({ queryKey: ["published", "cta", "en", "home_final"] }); });
    await vi.waitFor(() => expect(observed.data?.title).toBe("Current invitation"));
    await act(async () => root.unmount());
    client.removeQueries({ queryKey: ["published", "cta", "en", "home_final"] });
    root = createRoot(container);
    fixture.read.mockResolvedValue({ ...row, title_en: "Newer invitation" });
    await render();
    await vi.waitFor(() => expect(observed.data?.title).toBe("Newer invitation"));
    expect(fixture.read).toHaveBeenCalledTimes(2);
  });

  it("keeps unrelated or consultation-owned pages from starting an optional read", async () => {
    await render("en", false);
    expect(observed.isLoading).toBe(false);
    expect(fixture.read).not.toHaveBeenCalled();
  });

  it("preserves localized fields, English Malay fallback and default URLs", () => {
    expect(mapPublishedCtaBlockRow({ ...row, title_ms: " " }, "ms").title).toBe("Saved invitation");
    expect(mapPublishedCtaBlockRow({}, "zh")).toEqual({ id: "", block_key: "", title: "", description: "", primary_label: "", primary_url: "/quote", secondary_label: "", secondary_url: "", image_url: null });
  });
});
