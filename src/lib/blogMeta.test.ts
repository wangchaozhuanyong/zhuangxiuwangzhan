import { describe, expect, it } from "vitest";
import { estimateBlogReadMinutes, formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";

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
});
