import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadMediaStorageWebp } from "./mediaRepository";

const { sign, bucket } = vi.hoisted(() => ({ sign: vi.fn(), bucket: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  supabase: { storage: { from: bucket } },
}));

describe("private media transformation download", () => {
  afterEach(() => { vi.unstubAllGlobals(); sign.mockReset(); bucket.mockReset(); });

  it("signs the existing private object briefly and requests WebP without exposing the URL", async () => {
    const signedUrl = "http://127.0.0.1:56321/storage/v1/render/image/sign/qa-fixture?qa=fixture";
    const blob = new Blob(["fixture"], { type: "image/webp" });
    sign.mockResolvedValue({ data: { signedUrl }, error: null });
    bucket.mockReturnValue({ createSignedUrl: sign });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await downloadMediaStorageWebp("site-media-originals", "qa/source.png", { width: 1200, height: 800, quality: 82 });
    expect(bucket).toHaveBeenCalledWith("site-media-originals");
    expect(sign).toHaveBeenCalledWith("qa/source.png", 60, { transform: { width: 1200, height: 800, quality: 82, resize: "contain" } });
    expect(fetchMock).toHaveBeenCalledWith(signedUrl, {
      headers: { Accept: "image/webp" }, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
    });
    expect(result).toBe(blob);
  });

  it("does not fetch when Storage signing denies access", async () => {
    sign.mockResolvedValue({ data: null, error: new Error("Access denied") });
    bucket.mockReturnValue({ createSignedUrl: sign });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(downloadMediaStorageWebp("site-media-originals", "qa/source.png", { width: 1200, height: 800, quality: 82 })).rejects.toThrow("Access denied");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a failed conversion without exposing the signed response body or URL", async () => {
    sign.mockResolvedValue({ data: { signedUrl: "https://example.test/private-qa-fixture" }, error: null });
    bucket.mockReturnValue({ createSignedUrl: sign });
    const blob = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, blob }));
    await expect(downloadMediaStorageWebp("site-media-originals", "qa/source.png", { width: 1200, height: 800, quality: 82 })).rejects.toThrow(/^Image conversion failed\.$/);
    expect(blob).not.toHaveBeenCalled();
  });
});
