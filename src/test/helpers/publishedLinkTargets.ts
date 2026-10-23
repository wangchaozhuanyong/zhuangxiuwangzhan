import snapshot from "../fixtures/published-link-targets.json";
import type { ContentPublishClient } from "../../../supabase/functions/content-publish/types.ts";

/** Add real target-read semantics to historical one-row write/CAS transports.
 * Unknown, draft and deleted destinations stay unavailable. Never mock the validator.
 */
export function withPublishedLinkTargets(client: ContentPublishClient): ContentPublishClient {
  const rows = Object.entries(snapshot.tables).flatMap(([table, values]) => values.map(value => ({
    table, id: `${table}:${value}`, status: "published", deleted_at: null,
    ...(table === "cms_pages" ? { path: value } : { slug: value }),
  })));
  const lookup = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let count = Infinity;
    const query = {
      eq: (field: string, value: unknown) => { filters.push([field, value]); return query; },
      is: (field: string, value: null) => { filters.push([field, value]); return query; },
      limit: (value: number) => { count = value; return query; },
      then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => Promise.resolve({
        data: rows.filter(row => row.table === table
          && filters.every(([field, value]) => (row as Record<string, unknown>)[field] === value)).slice(0, count), error: null,
      }).then(resolve),
    };
    return query;
  };
  return { ...client, from: (table: string) => new Proxy({}, {
    get: (_target, method: string) => (...args: unknown[]) => {
      if (method === "select" && args[0] === "id") return lookup(table);
      const original = client.from(table);
      const operation = (original as unknown as Record<string, (...args: unknown[]) => unknown>)[method];
      return operation.apply(original, args);
    },
  }) } as ContentPublishClient;
}
