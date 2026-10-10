import "@/lib/publicQuerySeed";
import type { QueryClient, QueryKey, QueryFunction } from "@tanstack/react-query";
import type { Language } from "@/i18n/routes";
import { stripLanguagePrefix } from "@/i18n/routes";
import { publicContentQueries } from "@/lib/publicContentQueries";

import { claimPublicQuerySeed, documentSeedTime } from "@/lib/publicQuerySeedCache";
import { INTERACTION_POLICY, runReadQuery } from "@/lib/interactionPolicy";
const STALE_TIME = INTERACTION_POLICY.publicStaleTime;
const GC_TIME = INTERACTION_POLICY.gcTime;

type PrefetchTask = {
  queryKey: QueryKey;
  queryFn: QueryFunction<unknown, QueryKey>;
};

const sitePageTask = (language: Language, pageKey: string): PrefetchTask => publicContentQueries.sitePage(language, pageKey);

const pathSegments = (pathname: string) => stripLanguagePrefix(pathname).split("/").filter(Boolean);

export const getPublicRoutePrefetchTasks = (pathname: string, language: Language): PrefetchTask[] => {
  const path = stripLanguagePrefix(pathname);
  const segments = pathSegments(path);
  const [section, slug] = segments;

  if (path === "/") {
    return [
      publicContentQueries.homeBundle(language),
      publicContentQueries.homeFurniture(language),
      publicContentQueries.homeJournal(language),
      publicContentQueries.homeServiceAreas(language),
    ];
  }

  if (section === "about") {
    return [
      sitePageTask(language, "about"),
      ...["hero", "intro", "stats", "core_values", "team", "milestones", "office"].map((sectionKey) => publicContentQueries.aboutSection(language, sectionKey)),
    ];
  }

  if (section === "services") {
    if (slug && slug !== "old-house") {
      return [
        publicContentQueries.service(slug, language),
        publicContentQueries.services(language),
      ];
    }
    if (slug === "old-house") return [];
    return [
      sitePageTask(language, "services"),
      publicContentQueries.services(language),
    ];
  }

  if (section === "materials" || section === "products") {
    const isDirectory = segments.length === 1 || segments[1] === "category";
    if (!isDirectory && slug) {
      return [publicContentQueries.material(slug, language)];
    }
    return [
      sitePageTask(language, section),
      publicContentQueries.materials(language),
    ];
  }

  if (section === "projects") {
    const projectsTask: PrefetchTask = publicContentQueries.projectSummaries(language);
    return slug
      ? [publicContentQueries.project(slug, language), projectsTask]
      : [sitePageTask(language, "projects"), projectsTask];
  }

  if (section === "blog") {
    const blogTask: PrefetchTask = publicContentQueries.blogPosts(language);
    return slug
      ? [publicContentQueries.blogPost(slug, language), blogTask]
      : [sitePageTask(language, "blog"), blogTask];
  }

  if (section === "locations") {
    return slug
      ? [publicContentQueries.serviceArea(slug, language)]
      : [
          sitePageTask(language, "locations"),
          publicContentQueries.serviceAreas(language),
        ];
  }

  if (section === "landing" && slug) {
    return [publicContentQueries.landingPage(slug, language)];
  }

  if (section === "before-after") {
    return [publicContentQueries.beforeAfterItems(language)];
  }

  if (section === "process") {
    return [
      sitePageTask(language, "process"),
      publicContentQueries.processSteps(language),
    ];
  }

  if (section === "faq") {
    return [
      sitePageTask(language, "faq"),
      publicContentQueries.faqs(language, "general"),
      publicContentQueries.faqs(language, "home"),
    ];
  }

  if (["contact", "quote", "promotions"].includes(section || "")) {
    return [sitePageTask(language, section)];
  }

  // Furniture has its own static catalog and optional managed-product queries.
  // It is not a CMS path; a speculative CMS lookup only adds a wasted request.
  if (section === "furniture") {
    const productSlug = segments[1] === "product" ? segments[2] : undefined;
    return productSlug
      ? [publicContentQueries.furnitureProduct(productSlug, language)]
      : [publicContentQueries.furnitureCatalog(language)];
  }
  if (["privacy", "terms"].includes(section || "")) return [];

  return [publicContentQueries.cmsPage(language, path)];
};

export const prefetchPublishedRouteContent = async (
  queryClient: QueryClient,
  pathname: string,
  language: Language,
) => {
  const tasks = getPublicRoutePrefetchTasks(pathname, language);
  // claimPublicQuerySeed consumes each client/key once. Register the furniture
  // mapper before claiming, including hover/keyboard prefetch before page mount.
  if (tasks.some((task) => task.queryKey[1] === "furniture_catalog")) {
    await import("./furnitureQuerySeed");
  }
  await Promise.allSettled(tasks.map((task) => queryClient.prefetchQuery({
    ...task,
    initialData: () => claimPublicQuerySeed(queryClient, task.queryKey),
    initialDataUpdatedAt: documentSeedTime,
    queryFn: (context) => runReadQuery(context.signal, async (signal) => task.queryFn({ ...context, signal })),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })));
};
