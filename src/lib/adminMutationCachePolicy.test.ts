import { describe, expect, it } from "vitest";
import { mutationAffectsPublishedContent } from "@/lib/adminMutation";

describe("admin mutation public cache policy", () => {
  it("invalidates when a public record is published or unpublished", () => {
    expect(mutationAffectsPublishedContent("site_pages", null, { status: "published" })).toBe(true);
    expect(mutationAffectsPublishedContent("site_pages", { status: "published" }, { status: "draft" })).toBe(true);
  });

  it("does not invalidate drafts or private admin tables", () => {
    expect(mutationAffectsPublishedContent("site_pages", null, { status: "draft" })).toBe(false);
    expect(mutationAffectsPublishedContent("admin_users", null, { status: "published" })).toBe(false);
  });

  it("always invalidates public site settings", () => {
    expect(mutationAffectsPublishedContent("site_settings", {}, {})).toBe(true);
  });
});
