import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const aliases = ["闪铸装饰", "闪铸设计", "闪铸装修"];
const settings = { company_name: "FLASH CAST SDN. BHD.", brand_name: "FLASH CAST" };
const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
type SourceFixture = {
  path: string;
  brand: string;
  table: "site_pages" | "services";
  row: Record<string, unknown>;
};

const fixtures: SourceFixture[] = [
  {
    path: "", brand: "闪铸装饰", table: "site_pages",
    row: {
      id: "published-home", page_key: "home", path: "/", status: "published",
      title_zh: "首页", title_en: "Home",
      seo_title_zh: "吉隆坡装修公司 | 住宅与商业空间设计施工 | FLASH CAST",
      seo_title_en: "Renovation Company Kuala Lumpur | Home & Commercial Renovation | FLASH CAST",
      seo_description_zh: "FLASH CAST 为吉隆坡、雪兰莪和巴生谷提供住宅、厨房、浴室、办公室、店铺和定制柜体装修服务，支持现场测量、空间规划、材料建议与施工协调。",
      seo_description_en: "FLASH CAST provides home, kitchen, bathroom, office, shop, and custom built-in renovation services across Kuala Lumpur, Selangor, and Klang Valley, with site measurement, planning, material advice, and project coordination.",
    },
  },
  {
    path: "/about", brand: "闪铸装饰", table: "site_pages",
    row: {
      id: "published-about", page_key: "about", path: "/about", status: "published",
      title_zh: "关于我们", title_en: "About Us",
      seo_title_zh: "关于 FLASH CAST | 吉隆坡装修规划与项目协调",
      seo_title_en: "About FLASH CAST | Renovation Planning in Kuala Lumpur",
      seo_description_zh: "了解 FLASH CAST 如何为吉隆坡与雪兰莪住宅及商业空间整理装修范围、材料方向、现场协调与报价准备。",
      seo_description_en: "Learn how FLASH CAST approaches renovation planning, material decisions, site coordination and quotation preparation in Kuala Lumpur and Selangor.",
    },
  },
  {
    path: "/services/design", brand: "闪铸设计", table: "services",
    row: {
      id: "published-design", slug: "design", status: "published",
      title_zh: "室内设计", title_en: "Interior Design",
      content_zh: "<p>室内设计和空间规划。</p>", content_en: "<p>Interior design and space planning.</p>",
      seo_title_zh: "吉隆坡室内设计与空间规划｜住宅与商业设计施工衔接 | FLASH CAST SDN. BHD.",
      seo_title_en: "Interior Design Kuala Lumpur | FLASH CAST",
      seo_description_zh: "FLASH CAST 提供吉隆坡、雪兰莪与 Klang Valley 室内设计、空间规划、3D 效果图方向、材料建议、施工图协调和装修报价咨询。",
      seo_description_en: "FLASH CAST provides interior design in Kuala Lumpur, Selangor, and Klang Valley, including space planning, 3D visualization direction, material advice, drawing coordination, and renovation quotation support.",
    },
  },
  {
    path: "/services/renovation", brand: "闪铸装修", table: "services",
    row: {
      id: "published-renovation", slug: "renovation", status: "published",
      title_zh: "住宅装修", title_en: "Residential Renovation",
      content_zh: "<p>住宅装修与旧屋翻新。</p>", content_en: "<p>Residential renovation and refurbishment.</p>",
      seo_title_zh: "吉隆坡住宅装修与旧屋翻新 | FLASH CAST",
      seo_title_en: "Residential Renovation Kuala Lumpur & Selangor | FLASH CAST",
      seo_description_zh: "FLASH CAST 提供吉隆坡、雪兰莪与巴生谷住宅装修、旧屋翻新、空间规划、材料建议与报价咨询。先提交照片、面积和装修目标，获取下一步建议。",
      seo_description_en: "Plan residential renovation in Kuala Lumpur or Selangor with FLASH CAST. Review scope, materials, site condition, budget factors, and quotation steps before starting.",
    },
  },
];

let fixtureId = 0;
async function render(language: "en" | "zh", fixture: SourceFixture, identity = settings, backend = true) {
  const origin = `https://chinese-brand-${++fixtureId}.invalid`;
  const requests: Request[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    requests.push(request);
    const url = new URL(request.url);
    if (url.pathname.endsWith("/site_settings")) return Response.json([identity]);
    // The existing homepage bundle is a read RPC invoked with POST, not a table write.
    if (url.pathname.endsWith("/rpc/get_public_home_bundle")) {
      return Response.json({ site_pages: fixture.path === "" ? [fixture.row] : [] });
    }
    if (url.pathname.endsWith(`/${fixture.table}`)) {
      const selector = fixture.table === "services" ? url.searchParams.get("slug") : url.searchParams.get("path") || url.searchParams.get("page_key");
      const expected = fixture.table === "services" ? fixture.row.slug : url.searchParams.has("path") ? fixture.row.path : fixture.row.page_key;
      return Response.json(selector === `eq.${expected}` ? [fixture.row] : []);
    }
    return Response.json([]);
  }));
  const pending: Promise<unknown>[] = [];
  const path = `/${language}${fixture.path}`;
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${path}`),
    env: {
      ...(backend ? { VITE_SUPABASE_URL: origin, VITE_SUPABASE_ANON_KEY: "local-public-placeholder" } : {}),
      CF_PAGES_COMMIT_SHA: `chinese-brand-${fixtureId}`,
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }) },
    },
    next: async () => new Response(shell),
    waitUntil: (task: Promise<unknown>) => pending.push(task),
  } as Parameters<typeof onRequest>[0]);
  const document = new DOMParser().parseFromString(await response.text(), "text/html");
  await Promise.all(pending);
  for (const request of requests) {
    const url = new URL(request.url);
    expect(url.origin).toBe(origin);
    expect(request.method).toBe(url.pathname.endsWith("/rpc/get_public_home_bundle") ? "POST" : "GET");
  }
  if (!backend) expect(requests).toHaveLength(0);
  const graph = JSON.parse(document.querySelector("script[data-flashcast-edge-schema]")?.textContent || "{}")["@graph"] as Record<string, unknown>[];
  const node = (type: string) => graph.find(item => item["@type"] === type);
  return { response, document, node, path };
}

const metadata = (document: Document, selector: string) => document.querySelector(selector)?.getAttribute("content");
const expectMetadataParity = (document: Document, node: (type: string) => Record<string, unknown> | undefined) => {
  const description = metadata(document, 'meta[name="description"]');
  expect(metadata(document, 'meta[property="og:title"]')).toBe(document.title);
  expect(metadata(document, 'meta[name="twitter:title"]')).toBe(document.title);
  expect(metadata(document, 'meta[property="og:description"]')).toBe(description);
  expect(metadata(document, 'meta[name="twitter:description"]')).toBe(description);
  expect(node("WebPage")?.name).toBe(document.title);
  expect(node("WebPage")?.description).toBe(description);
  if (node("Service")) expect(node("Service")?.description).toBe(description);
};
const expectBrandIdentity = (document: Document, node: (type: string) => Record<string, unknown> | undefined) => {
  expect(metadata(document, 'meta[property="og:site_name"]')).toBe("FLASH CAST");
  expect(node("WebSite")?.name).toBe("FLASH CAST");
  expect(node("HomeAndConstructionBusiness")?.name).toBe("FLASH CAST SDN. BHD.");
  expect(node("WebSite")?.alternateName).toEqual(expect.arrayContaining(aliases));
  expect(node("HomeAndConstructionBusiness")?.alternateName).toEqual(expect.arrayContaining(aliases));
};

afterEach(() => vi.unstubAllGlobals());

describe("Edge Chinese brand identity from current published sources", () => {
  it.each(fixtures)("adds the route brand while preserving current CMS metadata on /zh$path", async fixture => {
    const { response, document, node, path } = await render("zh", fixture);
    expect(response.status).toBe(200);
    expect(document.title).toBe(`${fixture.brand} | ${fixture.row.seo_title_zh}`);
    expect(document.title.split(fixture.brand)).toHaveLength(2);
    const description = metadata(document, 'meta[name="description"]');
    expect(description?.startsWith(String(fixture.row.seo_description_zh))).toBe(true);
    for (const alias of aliases) expect(description).toContain(alias);
    expect(description).toContain("FLASH CAST");
    expect(document.querySelector("noscript[data-flashcast-geo-summary]")?.textContent).toContain("中文品牌：闪铸装饰 · 闪铸设计 · 闪铸装修");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://flashcast.com.my${path}`);
    expect(document.querySelector('link[hreflang="en"]')?.getAttribute("href")).toBe(`https://flashcast.com.my/en${fixture.path}`);
    expectMetadataParity(document, node);
    expectBrandIdentity(document, node);
  });

  it.each(fixtures)("keeps English CMS copy and only includes aliases in machine data on /en$path", async fixture => {
    const { response, document, node } = await render("en", fixture);
    expect(response.status).toBe(200);
    expect(document.title).toBe(fixture.row.seo_title_en);
    expect(metadata(document, 'meta[name="description"]')).toBe(fixture.row.seo_description_en);
    expectMetadataParity(document, node);
    expectBrandIdentity(document, node);
    document.querySelectorAll("script").forEach(script => script.remove());
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it("does not repeat an already saved route brand", async () => {
    const original = fixtures[2];
    const fixture = { ...original, row: { ...original.row, seo_title_zh: `闪铸设计 | ${original.row.seo_title_zh}` } };
    const { document } = await render("zh", fixture);
    expect(document.title).toBe(fixture.row.seo_title_zh);
    expect(document.title.split("闪铸设计")).toHaveLength(2);
  });

  it.each(["en", "zh"] as const)("reads a newer CMS title and description rather than the build snapshot in %s", async language => {
    const original = fixtures[1];
    const title = language === "zh" ? "当前后台更新的公司介绍 | FLASH CAST" : "Current Admin Company Introduction | FLASH CAST";
    const description = language === "zh" ? "当前后台更新的介绍摘要。" : "Current company summary updated in Admin.";
    const fixture = { ...original, row: { ...original.row, [`seo_title_${language}`]: title, [`seo_description_${language}`]: description } };
    const { document, node } = await render(language, fixture);
    expect(document.title).toBe(language === "zh" ? `闪铸装饰 | ${title}` : title);
    expect(metadata(document, 'meta[name="description"]')?.startsWith(description)).toBe(true);
    expectMetadataParity(document, node);
  });

  it("does not attach FLASH CAST Chinese aliases to another configured company", async () => {
    const fixture = fixtures[1];
    const { document, node } = await render("zh", fixture, { company_name: "Other Company Sdn. Bhd.", brand_name: "OTHER" });
    expect(document.title).toBe(fixture.row.seo_title_zh);
    expect(metadata(document, 'meta[name="description"]')).toBe(fixture.row.seo_description_zh);
    for (const alias of aliases) {
      expect(JSON.stringify(node("WebSite"))).not.toContain(alias);
      expect(JSON.stringify(node("HomeAndConstructionBusiness"))).not.toContain(alias);
      expect(document.body.textContent).not.toContain(alias);
    }
  });

  it("keeps the confirmed brand in built-in fallback HTML without backend access", async () => {
    const { response, document, node } = await render("zh", fixtures[0], settings, false);
    expect(response.status).toBe(200);
    expect(document.title).toBe(`闪铸装饰 | ${fixtures[0].row.seo_title_zh}`);
    expectMetadataParity(document, node);
    expectBrandIdentity(document, node);
  });
});
