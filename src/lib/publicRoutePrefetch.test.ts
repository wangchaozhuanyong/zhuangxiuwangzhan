import { describe, expect, it } from "vitest";
import { getPublicRoutePrefetchTasks } from "@/lib/publicRoutePrefetch";

const keysFor = (pathname: string, language: "zh" | "en") =>
  getPublicRoutePrefetchTasks(pathname, language).map((task) => task.queryKey);

describe("public route language prefetch", () => {
  it("matches the home and listing query keys used by the public hooks", () => {
    expect(keysFor("/zh", "en")).toEqual([
      ["published", "home_bundle", "en"],
    ]);

    expect(keysFor("/en/projects", "zh")).toEqual([
      ["published", "site_page", "zh", "projects"],
      ["published", "project_summaries", "zh", "all"],
    ]);
  });

  it("prefetches detail data together with its supporting collection", () => {
    expect(keysFor("/zh/blog/site-planning", "en")).toEqual([
      ["published", "blog_post", "site-planning", "en"],
      ["published", "blog", "en"],
    ]);

    expect(keysFor("/en/services/interior-design", "zh")).toEqual([
      ["published", "service", "interior-design", "zh"],
      ["published", "services", "zh"],
    ]);
  });

  it("keeps static legal pages free of unnecessary content requests", () => {
    expect(keysFor("/en/privacy", "zh")).toEqual([]);
  });
});
