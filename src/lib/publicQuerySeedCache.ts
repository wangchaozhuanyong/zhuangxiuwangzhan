import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
let resolveContentSeed: ((key: QueryKey) => unknown) | undefined;
export function registerPublicQuerySeedResolver(resolver: (key: QueryKey) => unknown) { resolveContentSeed = resolver; }
const seededClients = new WeakMap<QueryClient, Set<string>>();
export const documentSeedTime = typeof performance === "undefined" ? Date.now() : performance.timeOrigin;
export function claimPublicQuerySeed(client: QueryClient, queryKey: QueryKey): unknown {
  if (queryKey[0] !== "published" && queryKey[0] !== "site-settings") return undefined;
  if (client.getQueryState(queryKey)?.isInvalidated) return undefined;
  const seeded = seededClients.get(client) ?? new Set<string>();
  seededClients.set(client, seeded);
  const key = JSON.stringify(queryKey);
  if (seeded.has(key)) return undefined;
  seeded.add(key);
  if (queryKey[0] === "site-settings") {
    const settings = readPreloadedPublicData()?.siteSettings;
    return settings ? { ...fallbackSiteSettings, ...settings } : undefined;
  }
  return resolveContentSeed?.(queryKey);
}
