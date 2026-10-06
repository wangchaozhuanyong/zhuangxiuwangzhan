import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { buildQuotePreparationBody } from "../../functions/readablePublicBody";
import { quotePageText } from "@/i18n/quotePageText";
import furnitureLabels from "@/i18n/furnitureTaxonomyLabels.json";
import catalog from "@/data/furnitureCatalog.json";

const shell = '<!doctype html><html><head><title>App</title></head><body><div id="root"></div></body></html>';
const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
async function readHtml(path: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { headers: { "content-type": "application/json" } })));
  const response = await onRequest({ request: new Request(`https://flashcast.com.my${path}`), env: {
    ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) },
  }, next: async () => new Response(shell) } as Parameters<typeof onRequest>[0]);
  expect(response.status).toBe(200);
  return response.text();
}
afterEach(() => vi.unstubAllGlobals());
describe("reviewed renderer sources rebased on current main", () => {
  it.each(["en", "zh"] as const)("renders the same %s quote preparation only inside the no-JS summary", async (language) => {
    const html = await readHtml(`/${language}/quote`);
    const noJs = html.match(/<noscript data-flashcast-geo-summary>([\s\S]*?)<\/noscript>/)?.[1];
    const copy = quotePageText[language].preparation;
    expect(noJs).toContain(escapeText(copy.heading));
    expect(noJs).toContain(escapeText(copy.paragraphOne));
    expect(noJs).toContain(`href="/${language}/blog/renovation-quotation-checklist-malaysia"`);
    expect(noJs).toContain(escapeText(copy.linkText));
    expect(html.match(/data-flashcast-quote-preparation/g)).toHaveLength(1);
  });
  it.each(["en", "zh"] as const)("keeps reviewed %s bedroom category copy in the no-JS summary", async (language) => {
    const html = await readHtml(`/${language}/furniture/bedroom`);
    expect(html).toContain(escapeText(furnitureLabels.categoryPages.bedroom[language].h1));
    expect(html).toContain(escapeText(furnitureLabels.categoryPages.bedroom[language].intro));
    expect(html).toContain(`rel="canonical" href="https://flashcast.com.my/${language}/furniture/bedroom"`);
  });
  it.each(["en", "zh"] as const)("uses real %s catalogue parents for a furniture product breadcrumb", async (language) => {
    const html = await readHtml(`/${language}/furniture/product/${catalog.products[0].slug}`);
    const script = html.match(/<script type="application\/ld\+json" data-flashcast-edge-schema>([\s\S]*?)<\/script>/)?.[1];
    const graph = JSON.parse(script!)["@graph"];
    const breadcrumb = graph.find((node: Record<string, unknown>) => node["@type"] === "BreadcrumbList");
    const paths = breadcrumb.itemListElement.map((item: { item: string }) => new URL(item.item).pathname);
    expect(paths).toContain(`/${language}/furniture`);
    expect(paths).not.toContain(`/${language}/furniture/product`);
    expect(paths.every((path: string) => path.startsWith(`/${language}`))).toBe(true);
  });
  it("does not inject quote-specific copy into other routes", () => {
    expect(buildQuotePreparationBody("/en/contact")).toBe("");
    expect(buildQuotePreparationBody("/admin/quote")).toBe("");
  });
});
