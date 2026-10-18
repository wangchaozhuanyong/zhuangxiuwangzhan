import { afterEach, describe, expect, it, vi } from "vitest";
import { translateValue } from "../../supabase/functions/generate-english-content/translator";

afterEach(() => vi.unstubAllGlobals());

describe("Malay translation provider", () => {
  it("handles automatic source detection and preserves HTML, placeholders and structured links", async () => {
    const fetch = vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get("tl")).toBe("ms");
      const text = url.searchParams.get("q")!.replaceAll("Welcome", "Selamat datang");
      return { ok: true, json: async () => [[text, "en"]] };
    });
    vi.stubGlobal("fetch", fetch);
    const source = { title: "Welcome {name}", content: '<p>Welcome <a href="/en/contact">FLASH CAST</a></p>', href: "/en/contact" };
    const result = await translateValue(source, "ms");
    expect(result).toEqual({ title: "Selamat datang {name}", content: '<p>Selamat datang <a href="/en/contact">FLASH CAST</a></p>', href: "/en/contact" });
    expect(source.title).toBe("Welcome {name}");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("refuses corrupted interpolation rather than returning a broken body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [["Rosak", "en"]] })));
    await expect(translateValue("Welcome {name}", "ms")).rejects.toThrow("protected placeholder");
  });

  it("bounds long requests and fails explicitly when the provider is unavailable", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const text = new URL(input).searchParams.get("q")!; calls.push(text);
      return { ok: true, json: async () => [[text, "en"]] };
    }));
    const text = "Long source text. ".repeat(400);
    expect(await translateValue(text, "ms")).toContain("Long source text.");
    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every((text) => text.length <= 1800)).toBe(true);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(translateValue("Welcome", "ms")).rejects.toThrow("unavailable");
  });
});
