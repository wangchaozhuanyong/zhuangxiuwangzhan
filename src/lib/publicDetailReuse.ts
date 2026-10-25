import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Language } from "@/i18n/routes";
import type { getPublishedBlogPosts } from "./contentApi";
import type { FurnitureProduct } from "./furnitureCatalogPresentation";
import { publicContentQueryKeys as keys, readPublicContentQueryKey } from "./publicContentQueryKeys";
import { INTERACTION_POLICY } from "./interactionPolicy";
import { claimPublicQuerySeed, documentSeedTime } from "./publicQuerySeedCache";

export function freshPublicData<T>(client: QueryClient, key: QueryKey) {
  const state = client.getQueryState<T>(key);
  return state?.status === "success" && !state.isInvalidated && state.data !== undefined
    && Date.now() - state.dataUpdatedAt < INTERACTION_POLICY.publicStaleTime ? state : undefined;
}

type Definition<T> = { queryKey: QueryKey; queryFn: (context: { signal: AbortSignal }) => Promise<T> };

/** The hook and speculative prefetch use the same completeness/freshness rules. */
export function withPublicDetailReuse<T>(client: QueryClient, definition: Definition<T>) {
  const parameters = readPublicContentQueryKey(definition.queryKey);
  const language = parameters?.language as Language;
  const slug = parameters?.slug;
  const allowed = () => !client.getQueryState(definition.queryKey)?.isInvalidated;
  const article = (displayOnly = false) => {
    if (!allowed() || parameters?.resource !== "blog_post") return undefined;
    const key = keys.blogPosts.key(language);
    const state = displayOnly ? client.getQueryState<Awaited<ReturnType<typeof getPublishedBlogPosts>>>(key) : freshPublicData<Awaited<ReturnType<typeof getPublishedBlogPosts>>>(client, key);
    if (state?.isInvalidated || state?.status !== "success") return undefined;
    const post = state?.data?.find(item => item.slug === slug && Boolean(item.content?.trim()));
    return post ? { post, updatedAt: state!.dataUpdatedAt } : undefined;
  };
  return {
    ...definition,
    initialData: () => article(true)?.post as T | undefined ?? claimPublicQuerySeed(client, definition.queryKey) as T | undefined,
    initialDataUpdatedAt: () => article(true)?.updatedAt ?? documentSeedTime,
    queryFn: async (context: { signal: AbortSignal }): Promise<T> => {
      const cached = article();
      if (cached) return cached.post as T;
      if (allowed() && parameters?.resource === "furniture_catalog" && typeof slug === "string") {
        const catalog = freshPublicData<FurnitureProduct[]>(client, keys.furnitureCatalog.key(language))?.data;
        if (catalog) {
          const { hasBaselineFurnitureSlug } = await import("./furnitureCatalogPresentation");
          // Managed listing rows may omit their gallery; only the complete
          // baseline catalog plus its already-read overrides can seed a detail.
          if (hasBaselineFurnitureSlug(slug)) {
            const { normalizeFurnitureSlug } = await import("./furnitureCatalogOverrides");
            const product = catalog.find(item => normalizeFurnitureSlug(item.slug) === normalizeFurnitureSlug(slug));
            if (product) return product as T;
          }
        }
      }
      return definition.queryFn(context);
    },
  };
}
