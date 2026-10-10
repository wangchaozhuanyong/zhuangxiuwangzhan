import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
type SeedResolver = (key: QueryKey) => unknown;
let resolveContentSeed: SeedResolver | undefined;
const resourceResolvers = new Map<string, SeedResolver>();
export function registerPublicQuerySeedResolver(resolver: SeedResolver, resource?: string) {
  if (resource) resourceResolvers.set(resource, resolver);
  else resolveContentSeed = resolver;
}
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
  const resolver = resourceResolvers.get(String(queryKey[1])) ?? resolveContentSeed;
  return resolver?.(queryKey);
}
