import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const site = "https://flashcast.com.my";
const withdrawn = `${site}/en/blog/withdrawn-post`;
const current = `${site}/en/blog/current-post`;
const blog = `${site}/en/blog`;
const about = `${site}/zh/about`;
const xml = (locations: string[]) => `<urlset>${locations.map((location) => `<url><loc>${location}</loc></url>`).join("")}</urlset>`;
const staleSource = `# FLASH CAST\n\n## Content Scope\nCompany services remain described here.\n\n## Route Inventory\n- blog: 999 localized URLs\n\n## Priority Chinese Pages\n- ${withdrawn}: stale Chinese body\n\n## Priority English Pages\n- ${withdrawn}: stale English body\n\n## Canonical URL List\n- ${withdrawn}\n\n## Notes For AI Assistants\nUse current official sources.\n`;

async function readLlms(staticLocations: string[], dynamicLocations: string[], source = staleSource) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/rest/v1/blog_posts") && !url.searchParams.has("id")) {
      return new Response(JSON.stringify(dynamicLocations.filter(location=>/^\/en\/blog\/[^/]+$/.test(new URL(location).pathname)).map((location,index)=>({id:String(index+1),slug:new URL(location).pathname.split("/").pop(),status:"published",title_en:"Current post",content_en:"Current published body"}))));
    }
    return new Response("[]", { headers: { "content-type": "application/json" } });
  }));
  const env = {
    VITE_SUPABASE_URL: "https://fixture.supabase.co", VITE_SUPABASE_ANON_KEY: "fixture-public-key",
    ASSETS: { fetch: async (request: Request) => new Response(request.url.endsWith("/sitemap.xml") ? xml(staticLocations) : source) },
  };
  const response = await onRequest({ request: new Request(`${site}/llms.txt`), env, next: async () => new Response(source) } as Parameters<typeof onRequest>[0]);
  expect(response.status).toBe(200);
  return response.text();
}

afterEach(() => vi.unstubAllGlobals());
describe("AI discovery source consistency", () => {
  it("updates all URL-derived sections after a published blog is withdrawn", async () => {
    const text = await readLlms([withdrawn, about, blog], [current, about, blog]);
    expect(text).not.toContain(withdrawn);
    expect(text).not.toContain("stale Chinese body");
    expect(text).not.toContain("stale English body");
    expect(text).not.toContain("999 localized URLs");
    expect(text).toContain("- blog: 2 localized URLs");
    expect(text).toContain("- about: 1 localized URLs");
    expect(text).toContain(`## Priority English Pages\n- ${blog}`);
    expect(text).toContain(current);
    expect(text).toContain("Company services remain described here.");
    expect(text).toContain("Use current official sources.");
  });
  it("clears stale inventory and priority URLs when no canonical URLs are emitted", async () => {
    const text = await readLlms([], []);
    expect(text).not.toContain(withdrawn);
    expect(text).not.toContain("999 localized URLs");
    expect(text).not.toContain("stale English body");
    expect(text).toContain("## Canonical URL List");
  });
  it("adds missing index sections while retaining unrelated source text", async () => {
    const text = await readLlms([about, blog], [about, blog], "# FLASH CAST\n\n## Notes For AI Assistants\nOfficial source instructions.\n");
    expect(text).toContain(`## Canonical URL List\n- ${blog}\n- ${about}`);
    expect(text).toContain("## Route Inventory");
    expect(text).toContain("Official source instructions.");
  });
});
