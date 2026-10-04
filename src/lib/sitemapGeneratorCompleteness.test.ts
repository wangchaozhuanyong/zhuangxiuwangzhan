import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSitemapXml } from "../../supabase/functions/sitemap/service";

const tables = ["projects", "blog_posts", "materials", "service_areas", "landing_pages", "services", "site_pages", "cms_pages"];
type Row = { id: string; slug?: string; path?: string };
type Options = { cap?: number; failure?: { table: string; later?: boolean; malformed?: boolean } };
const row = (table: string, index: number): Row => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  ...(["site_pages", "cms_pages"].includes(table) ? { path: `/current-${table}-${index}` } : { slug: `current-${table}-${index}` }),
});

const fixture = (records: Record<string, Row[]>, options: Options = {}) => {
  const calls: { table: string; cursor?: string }[] = [];
  const client = {
    from(table: string) {
      let cursor: string | undefined;
      let limit = 500;
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        order: () => query,
        limit: (value: number) => { limit = value; return query; },
        gt: (_field: string, value: string) => { cursor = value; return query; },
        then(onFulfilled: (value: { data: unknown; error: unknown }) => unknown) {
          calls.push({ table, cursor });
          const failed = options.failure?.table === table && (!options.failure.later || Boolean(cursor));
          const data = failed && options.failure?.malformed ? null : (records[table] || [])
            .filter(item => !cursor || item.id > cursor).slice(0, Math.min(limit, options.cap || 500));
          return Promise.resolve({ data, error: failed && !options.failure?.malformed ? { message: "synthetic unavailable source" } : null }).then(onFulfilled);
        },
      };
      return query;
    },
  };
  return { client: client as unknown as Parameters<typeof buildSitemapXml>[0], calls };
};

beforeEach(() => vi.stubGlobal("Deno", { env: { get: () => undefined } }));
afterEach(() => vi.unstubAllGlobals());

describe("complete dynamic sitemap snapshots", () => {
  it.each([100, 500, 1000])("reads beyond 1000 rows at server cap %s before marking complete", async cap => {
    const records = Object.fromEntries(tables.map(table => [table, Array.from({ length: table === "blog_posts" ? 1201 : 1 }, (_, i) => row(table, i + 1))]));
    const { client, calls } = fixture(records, { cap });
    const xml = await buildSitemapXml(client);
    expect(xml).toMatch(/flashcast-sitemap-snapshot:v1 complete=true generated-at="[^"\n]+"/);
    expect(xml).toContain("/en/blog/current-blog_posts-1201");
    expect(xml).toContain("/zh/blog/current-blog_posts-1201");
    expect(new Set(calls.map(call => call.table))).toEqual(new Set(tables));
    expect(calls.filter(call => call.table === "blog_posts").length).toBeGreaterThan(3);
    expect(new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])).size)
      .toBe([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].length);
  });

  it.each(tables)("rejects a partial later-page failure in %s", async table => {
    const { client } = fixture({ [table]: [row(table, 1)] }, { failure: { table, later: true } });
    await expect(buildSitemapXml(client)).rejects.toThrow(`Sitemap source read failed: ${table}`);
  });

  it("rejects malformed successful source responses", async () => {
    const { client } = fixture({}, { failure: { table: "blog_posts", malformed: true } });
    await expect(buildSitemapXml(client)).rejects.toThrow("Sitemap source response is invalid: blog_posts");
  });

  it("rejects missing source IDs and blank source values", async () => {
    for (const value of [{ id: "", slug: "guide" }, { id: row("services", 1).id, slug: " " }]) {
      await expect(buildSitemapXml(fixture({ services: [value] }).client)).rejects.toThrow("Sitemap source row is invalid: services");
    }
  });

  it("allows a verified empty snapshot and omits withdrawn dynamic URLs", async () => {
    const xml = await buildSitemapXml(fixture({}).client);
    expect(xml).toContain("complete=true");
    expect(xml).toContain("/en/blog</loc>");
    expect(xml).not.toContain("/blog/current-blog_posts");
    expect(xml).not.toContain("undefined");
  });
});
