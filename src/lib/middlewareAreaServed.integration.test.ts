import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (html: string) => {
  window: { document: Document; close: () => void };
};
const oldAreas = ["Kuala Lumpur", "Selangor", "Petaling Jaya", "Cheras", "Mont Kiara", "Bangsar", "Subang Jaya", "Shah Alam", "Puchong"];
const addedAreas = ["Balakong", "Desa ParkCity", "Kajang", "Klang", "Putrajaya", "Rawang", "Semenyih", "Seri Kembangan", "Sungai Buloh", "Taman Tun Dr Ismail", "Wangsa Maju"];
const targetSlugs = ["balakong", "desa-parkcity", "kajang", "klang", "putrajaya", "rawang", "semenyih", "seri-kembangan", "sungai-buloh", "taman-tun-dr-ismail", "wangsa-maju"];
const targetPaths = ["en", "zh"].flatMap(lang => [
  ...targetSlugs.map(slug => `/${lang}/locations/${slug}`),
  `/${lang}/services/renovation`,
  `/${lang}/services/kitchen`,
]);
const shell = '<!doctype html><html><head><title>App</title></head><body><div id="root"></div><p id="untouched">Existing public content</p></body></html>';

const render = async (pathname: string) => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
    const rows = url.pathname.endsWith("/service_areas") || url.pathname.endsWith("/services")
      ? [{ slug, status: "published", name_en: slug, name_zh: "测试地区", title_en: "Test service", title_zh: "测试服务", description_en: "Existing description", description_zh: "原有说明" }]
      : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
  }));
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${pathname}`),
    env: {
      VITE_SUPABASE_URL: "https://area-served-fixture.supabase.co",
      VITE_SUPABASE_ANON_KEY: "fixture-public-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }) },
    },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);
  const dom = new JSDOM(await response.text());
  const document = dom.window.document;
  const graph = JSON.parse(document.querySelector("script[data-flashcast-edge-schema]")?.textContent || "{}")["@graph"] as Record<string, unknown>[];
  const result = {
    status: response.status,
    company: graph.filter(node => node["@id"] === "https://flashcast.com.my/#localbusiness" && node["@type"] === "HomeAndConstructionBusiness"),
    service: graph.find(node => node["@type"] === "Service"),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(node => ({ language: node.getAttribute("hreflang"), href: node.getAttribute("href") })),
    unchangedText: document.getElementById("untouched")?.textContent,
  };
  dom.window.close();
  return result;
};

afterEach(() => vi.unstubAllGlobals());

describe("owner-confirmed company service areas", () => {
  it.each(targetPaths)("appends the exact 11 areas once on %s while retaining metadata and the service node", async pathname => {
    const result = await render(pathname);
    expect(result.status).toBe(200);
    expect(result.company).toHaveLength(1);
    expect(result.company[0].areaServed).toEqual([...oldAreas, ...addedAreas]);
    expect(new Set(result.company[0].areaServed as string[]).size).toBe(20);
    expect(result.canonical).toBe(`https://flashcast.com.my${pathname}`);
    const tail = pathname.replace(/^\/(en|zh)/, "");
    expect(result.alternates).toEqual([
      { language: "zh-CN", href: `https://flashcast.com.my/zh${tail}` },
      { language: "en", href: `https://flashcast.com.my/en${tail}` },
      { language: "x-default", href: `https://flashcast.com.my/en${tail}` },
    ]);
    expect(result.unchangedText).toBe("Existing public content");
    expect(result.company[0].address).toMatchObject({ addressLocality: "Kuala Lumpur", addressCountry: "MY" });
    expect(result.company[0].telephone).toBe("+601128853888");
    expect(result.company[0].url).toBe("https://flashcast.com.my");
    expect(result.company[0].openingHoursSpecification).toEqual([{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        .map(day => `https://schema.org/${day}`),
      opens: "10:00",
      closes: "19:00",
    }]);
    expect(result.company[0]).not.toHaveProperty("openingHours");
    expect(result.company[0]).not.toHaveProperty("department");
    expect(result.company[0]).not.toHaveProperty("branchOf");
    if (result.service) expect(result.service.areaServed).toEqual(["Kuala Lumpur", "Selangor", "Klang Valley"]);
  });

  it.each(["/en", "/zh", "/en/services/design", "/zh/services/warehouse", "/en/locations/puchong", "/zh/locations/petaling-jaya"])("keeps the original company areas outside the approved scope: %s", async pathname => {
    const result = await render(pathname);
    expect(result.status).toBe(200);
    expect(result.company).toHaveLength(1);
    expect(result.company[0].areaServed).toEqual(oldAreas);
  });
});
