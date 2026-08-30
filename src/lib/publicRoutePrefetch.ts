import type { QueryClient, QueryKey } from "@tanstack/react-query";
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

const STALE_TIME = 60 * 1000;
const GC_TIME = 30 * 60 * 1000;

type PrefetchTask = {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
};

const sitePageTask = (language: Language, pageKey: string): PrefetchTask => ({
  queryKey: ["published", "site_page", language, pageKey],
  queryFn: () => getPublishedSitePage(language, pageKey),
});

const pathSegments = (pathname: string) => stripLanguagePrefix(pathname).split("/").filter(Boolean);

export const getPublicRoutePrefetchTasks = (pathname: string, language: Language): PrefetchTask[] => {
  const path = stripLanguagePrefix(pathname);
  const segments = pathSegments(path);
  const [section, slug] = segments;

  if (path === "/") {
    return [{
      queryKey: ["published", "home_bundle", language],
      queryFn: () => getPublishedHomeContentBundle(language),
    }];
  }

  if (section === "about") {
    return [
      sitePageTask(language, "about"),
      ...["hero", "stats", "core_values"].map((sectionKey) => ({
        queryKey: ["published", "about_section", language, sectionKey],
        queryFn: () => getPublishedAboutSection(language, sectionKey),
      })),
    ];
  }

  if (section === "services") {
    if (slug && slug !== "old-house") {
      return [
        { queryKey: ["published", "service", slug, language], queryFn: () => getPublishedServiceBySlug(slug, language) },
        { queryKey: ["published", "services", language], queryFn: () => getPublishedServices(language) },
      ];
    }
    if (slug === "old-house") return [];
    return [
      sitePageTask(language, "services"),
      { queryKey: ["published", "services", language], queryFn: () => getPublishedServices(language) },
    ];
  }

  if (section === "materials" || section === "products") {
    const isDirectory = segments.length === 1 || segments[1] === "category";
    if (!isDirectory && slug) {
      return [{ queryKey: ["published", "material", slug, language], queryFn: () => getPublishedMaterialBySlug(slug, language) }];
    }
    return [
      sitePageTask(language, section),
      { queryKey: ["published", "materials", language], queryFn: () => getPublishedMaterials(language) },
    ];
  }

  if (section === "projects") {
    const projectsTask: PrefetchTask = {
      queryKey: ["published", "project_summaries", language, "all"],
      queryFn: () => getPublishedProjectSummaries(language),
    };
    return slug
      ? [{ queryKey: ["published", "project", slug, language], queryFn: () => getPublishedProjectBySlug(slug, language) }, projectsTask]
      : [sitePageTask(language, "projects"), projectsTask];
  }

  if (section === "blog") {
    const blogTask: PrefetchTask = {
      queryKey: ["published", "blog", language],
      queryFn: () => getPublishedBlogPosts(language),
    };
    return slug
      ? [{ queryKey: ["published", "blog_post", slug, language], queryFn: () => getPublishedBlogPostBySlug(slug, language) }, blogTask]
      : [sitePageTask(language, "blog"), blogTask];
  }

  if (section === "locations") {
    return slug
      ? [{ queryKey: ["published", "service_area", slug, language], queryFn: () => getPublishedServiceAreaBySlug(slug, language) }]
      : [
          sitePageTask(language, "locations"),
          { queryKey: ["published", "service_areas", language], queryFn: () => getPublishedServiceAreas(language) },
        ];
  }

  if (section === "landing" && slug) {
    return [{ queryKey: ["published", "landing", slug, language], queryFn: () => getPublishedLandingPageBySlug(slug, language) }];
  }

  if (section === "before-after") {
    return [{ queryKey: ["published", "before_after", language], queryFn: () => getPublishedBeforeAfterItems(language) }];
  }

  if (section === "process") {
    return [
      sitePageTask(language, "process"),
      { queryKey: ["published", "process_steps", language], queryFn: () => getPublishedProcessSteps(language) },
    ];
  }

  if (section === "faq") {
    return [
      sitePageTask(language, "faq"),
      { queryKey: ["published", "faqs", language, "general"], queryFn: () => getPublishedFaqs(language, "general") },
      { queryKey: ["published", "faqs", language, "home"], queryFn: () => getPublishedFaqs(language, "home") },
    ];
  }

  if (["contact", "quote", "promotions"].includes(section || "")) {
    return [sitePageTask(language, section)];
  }

  if (["privacy", "terms"].includes(section || "")) return [];

  return [{
    queryKey: ["published", "cms_path", language, path],
    queryFn: () => getPublishedCmsPageByPath(language, path),
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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })));
};
