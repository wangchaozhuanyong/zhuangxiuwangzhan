import "@/lib/publicQuerySeed";
import type { QueryClient, QueryKey, QueryFunction } from "@tanstack/react-query";
import type { Language } from "@/i18n/routes";
import { stripLanguagePrefix } from "@/i18n/routes";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getPublishedLandingPageBySlug,
  getPublishedMaterialBySlug,
  getPublishedMaterials,
  getPublishedProjectBySlug,
  getPublishedProjectSummaries,
  getPublishedServiceAreaBySlug,
  getPublishedServiceAreas,
  getPublishedServiceBySlug,
  getPublishedServices,
} from "@/lib/contentApi";
import {
  getPublishedAboutSection,
  getPublishedBeforeAfterItems,
  getPublishedCmsPageByPath,
  getPublishedFaqs,
  getPublishedHomeContentBundle,
  getPublishedProcessSteps,
  getPublishedSitePage,
} from "@/lib/homeContentApi";

import { claimPublicQuerySeed, documentSeedTime } from "@/lib/publicQuerySeedCache";
import { INTERACTION_POLICY, runReadQuery } from "@/lib/interactionPolicy";
const STALE_TIME = INTERACTION_POLICY.publicStaleTime;
const GC_TIME = INTERACTION_POLICY.gcTime;

type PrefetchTask = {
  queryKey: QueryKey;
  queryFn: QueryFunction<unknown, QueryKey>;
};

const sitePageTask = (language: Language, pageKey: string): PrefetchTask => ({
  queryKey: ["published", "site_page", language, pageKey],
  queryFn: ({ signal }) => getPublishedSitePage(language, pageKey, signal),
});

const pathSegments = (pathname: string) => stripLanguagePrefix(pathname).split("/").filter(Boolean);

export const getPublicRoutePrefetchTasks = (pathname: string, language: Language): PrefetchTask[] => {
  const path = stripLanguagePrefix(pathname);
  const segments = pathSegments(path);
  const [section, slug] = segments;

  if (path === "/") {
    return [{
      queryKey: ["published", "home_bundle", language],
      queryFn: ({ signal }) => getPublishedHomeContentBundle(language, signal),
    }];
  }

  if (section === "about") {
    return [
      sitePageTask(language, "about"),
      ...["hero", "stats", "core_values"].map((sectionKey) => ({
        queryKey: ["published", "about_section", language, sectionKey],
        queryFn: ({ signal }) => getPublishedAboutSection(language, sectionKey, signal),
      })),
    ];
  }

  if (section === "services") {
    if (slug && slug !== "old-house") {
      return [
        { queryKey: ["published", "service", slug, language], queryFn: ({ signal }) => getPublishedServiceBySlug(slug, language, signal) },
        { queryKey: ["published", "services", language], queryFn: ({ signal }) => getPublishedServices(language, signal) },
      ];
    }
    if (slug === "old-house") return [];
    return [
      sitePageTask(language, "services"),
      { queryKey: ["published", "services", language], queryFn: ({ signal }) => getPublishedServices(language, signal) },
    ];
  }

  if (section === "materials" || section === "products") {
    const isDirectory = segments.length === 1 || segments[1] === "category";
    if (!isDirectory && slug) {
      return [{ queryKey: ["published", "material", slug, language], queryFn: ({ signal }) => getPublishedMaterialBySlug(slug, language, signal) }];
    }
    return [
      sitePageTask(language, section),
      { queryKey: ["published", "materials", language], queryFn: ({ signal }) => getPublishedMaterials(language, signal) },
    ];
  }

  if (section === "projects") {
    const projectsTask: PrefetchTask = {
      queryKey: ["published", "project_summaries", language, "all"],
      queryFn: ({ signal }) => getPublishedProjectSummaries(language, undefined, signal),
    };
    return slug
      ? [{ queryKey: ["published", "project", slug, language], queryFn: ({ signal }) => getPublishedProjectBySlug(slug, language, signal) }, projectsTask]
      : [sitePageTask(language, "projects"), projectsTask];
  }

  if (section === "blog") {
    const blogTask: PrefetchTask = {
      queryKey: ["published", "blog", language],
      queryFn: ({ signal }) => getPublishedBlogPosts(language, signal),
    };
    return slug
      ? [{ queryKey: ["published", "blog_post", slug, language], queryFn: ({ signal }) => getPublishedBlogPostBySlug(slug, language, signal) }, blogTask]
      : [sitePageTask(language, "blog"), blogTask];
  }

  if (section === "locations") {
    return slug
      ? [{ queryKey: ["published", "service_area", slug, language], queryFn: ({ signal }) => getPublishedServiceAreaBySlug(slug, language, signal) }]
      : [
          sitePageTask(language, "locations"),
          { queryKey: ["published", "service_areas", language], queryFn: ({ signal }) => getPublishedServiceAreas(language, signal) },
        ];
  }

  if (section === "landing" && slug) {
    return [{ queryKey: ["published", "landing", slug, language], queryFn: ({ signal }) => getPublishedLandingPageBySlug(slug, language, signal) }];
  }

  if (section === "before-after") {
    return [{ queryKey: ["published", "before_after", language], queryFn: ({ signal }) => getPublishedBeforeAfterItems(language, signal) }];
  }

  if (section === "process") {
    return [
      sitePageTask(language, "process"),
      { queryKey: ["published", "process_steps", language], queryFn: ({ signal }) => getPublishedProcessSteps(language, signal) },
    ];
  }

  if (section === "faq") {
    return [
      sitePageTask(language, "faq"),
      { queryKey: ["published", "faqs", language, "general"], queryFn: ({ signal }) => getPublishedFaqs(language, "general", signal) },
      { queryKey: ["published", "faqs", language, "home"], queryFn: ({ signal }) => getPublishedFaqs(language, "home", signal) },
    ];
  }

  if (["contact", "quote", "promotions"].includes(section || "")) {
    return [sitePageTask(language, section)];
  }

  // Furniture has its own static catalog and optional managed-product queries.
  // It is not a CMS path; a speculative CMS lookup only adds a wasted request.
  if (["privacy", "terms", "furniture"].includes(section || "")) return [];

  return [{
    queryKey: ["published", "cms_path", language, path],
    queryFn: ({ signal }) => getPublishedCmsPageByPath(language, path, signal),
  }];
};

export const prefetchPublishedRouteContent = async (
  queryClient: QueryClient,
  pathname: string,
  language: Language,
) => {
  const tasks = getPublicRoutePrefetchTasks(pathname, language);
  await Promise.allSettled(tasks.map((task) => queryClient.prefetchQuery({
    ...task,
    initialData: () => claimPublicQuerySeed(queryClient, task.queryKey),
    initialDataUpdatedAt: documentSeedTime,
    queryFn: (context) => runReadQuery(context.signal, async (signal) => task.queryFn({ ...context, signal })),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })));
};
