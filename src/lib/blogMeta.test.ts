import { describe, expect, it } from "vitest";
import { estimateBlogReadMinutes, formatBlogDate, formatBlogReadTime, getBlogDateDisplay } from "@/lib/blogMeta";

describe("blog metadata", () => {
  it("estimates English reading time from the article body", () => {
    expect(estimateBlogReadMinutes(`<p>${"word ".repeat(440)}</p>`, "en")).toBe(2);
  });

  it("estimates Chinese reading time by readable characters", () => {
    expect(estimateBlogReadMinutes("装".repeat(601), "zh")).toBe(3);
  });

  it("keeps localized date and read-time labels", () => {
    expect(formatBlogReadTime(3, "en")).toBe("3 min read");
    expect(formatBlogReadTime(3, "zh")).toBe("3 分钟阅读");
    expect(formatBlogDate("2026-08-14", "en")).toBe("14 Aug 2026");
  });

  it("only exposes an updated date when the Malaysia calendar date changed", () => {
    expect(getBlogDateDisplay("2026-08-22T12:00:00Z", "2026-08-22T14:00:00Z", "en")).toEqual({
      publishedDate: "22 Aug 2026",
      updatedDate: "",
    });
    expect(getBlogDateDisplay("2026-08-22T12:00:00Z", "2026-08-23T14:00:00Z", "en")).toEqual({
      publishedDate: "22 Aug 2026",
      updatedDate: "23 Aug 2026",
    });
    expect(getBlogDateDisplay("2026-08-22T20:30:00Z", "2026-08-23T00:30:00Z", "zh")).toEqual({
      publishedDate: "2026年8月23日",
      updatedDate: "",
    });
  });
});
