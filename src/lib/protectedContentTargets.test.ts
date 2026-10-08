import { describe, expect, it } from "vitest";
import { MANAGED_TARGETS, isProtectedContentRecord } from "../../supabase/functions/_shared/managed-targets.ts";
import { MANAGED_TARGETS as publisherTargets } from "../../supabase/functions/content-publish/managed-targets.ts";

const tables = { service: "services", service_area: "service_areas", blog: "blog_posts", site_page: "site_pages", faq: "faqs" };
describe("shared protected content admission", () => {
  it("keeps the publisher compatibility export bound to the same single target registry", () => {
    expect(publisherTargets).toBe(MANAGED_TARGETS);
  });
  it("protects every exact row and supported alias without blocking another table's same ID", () => {
    for (const target of MANAGED_TARGETS) {
      const table = target.table || tables[target.contentType];
      expect(isProtectedContentRecord(table, { id: target.id })).toBe(true);
      expect(isProtectedContentRecord("ordinary_table", { id: target.id, slug: target.slug })).toBe(false);
      if (["service", "service_area", "blog"].includes(target.contentType)) {
        expect(isProtectedContentRecord(table, { slug: target.slug })).toBe(true);
      }
      if (target.contentType === "site_page") expect(isProtectedContentRecord(table, { page_key: target.slug })).toBe(true);
    }
  });
  it("leaves an ordinary content record outside the managed publication permit scope", () => {
    expect(isProtectedContentRecord("blog_posts", { id: "ordinary-row", slug: "ordinary-article" })).toBe(false);
    expect(isProtectedContentRecord("faqs", {})).toBe(false);
  });
});
