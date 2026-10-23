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
    expect(result).toEqual({ title: "Selamat datang {name}", content: '<p>Selamat datang <a href="/ms/contact">FLASH CAST</a></p>', href: "/ms/contact" });
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

  it.each(["en", "ms"] as const)("never sends HTML attributes, slugs, URLs or IDs for %s translation", async language => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
      const params = language === "ms" ? new URL(input).searchParams : new URLSearchParams(String(init?.body));
      const source = params.get("q")!;
      requests.push(source);
      // Models a provider translating every visible occurrence of these words.
      const translated = source.replaceAll("office", "pejabat").replaceAll("material", "bahan");
      return { ok: true, json: async () => language === "ms" ? [[translated, "en"]] : [[[translated]]] };
    }));
    const value = {
      content: '<p>office <a title="office > material" href="/zh/services/office-renovation?source=office&amp;page=1#material">office</a> <a href="https://flashcast.com.my/en/blog/kitchen-cabinet-material-guide">material</a></p>',
      slug: "office-renovation", id: "office", path: "/office", href: "/zh/services/office-renovation",
      nested: [{ button_url: "/en/blog/office-fit-out-me-it-planning-checklist-malaysia", src: "/images/office.webp", label: "office" }],
    };
    const result = await translateValue(value, language) as typeof value;
    expect(requests.every(request => !request.includes("office-renovation") && !request.includes('href=') && !request.includes(".webp"))).toBe(true);
    expect(result.slug).toBe(value.slug); expect(result.id).toBe(value.id); expect(result.path).toBe(value.path);
    expect(result.href).toBe(`/${language}/services/office-renovation`);
    expect(result.content).toContain(`href="/${language}/services/office-renovation?source=office&amp;page=1#material"`);
    expect(result.content).toContain('title="office > material"');
    expect(result.content).toContain(`/en/blog/kitchen-cabinet-material-guide`.replace("/en/", `/${language}/`));
    expect(result.nested[0].button_url).toBe(`/${language}/blog/office-fit-out-me-it-planning-checklist-malaysia`);
    expect(result.nested[0].src).toBe(value.nested[0].src);
    expect(result.nested[0].label).toBe("pejabat");
    expect(value.href).toBe("/zh/services/office-renovation");
  });

  it.each(["en", "ms"] as const)("fails closed when the %s provider duplicates a protected tag", async language => {
    vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
      const params = language === "ms" ? new URL(input).searchParams : new URLSearchParams(String(init?.body));
      const text = params.get("q")!;
      return { ok: true, json: async () => language === "ms" ? [[text + " ZXQ0QXZ", "en"]] : [[[text + " ZXQ0QXZ"]]] };
    }));
    await expect(translateValue('<p><a href="/en/services/office-renovation">office</a></p>', language)).rejects.toThrow("protected placeholder");
  });

  it("refuses extra HTML inserted by the translation provider", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string) => ({ ok: true,
      json: async () => [[new URL(input).searchParams.get("q") + '<a href="/ms/blog/invented">extra</a>', "en"]] })));
    await expect(translateValue("Welcome", "ms")).rejects.toThrow("protected HTML");
  });
});
