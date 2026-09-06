import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildTopicClusterBlogRecord,
  topicClusterBlogConfigs,
} from "../../scripts/topic-cluster-blog-records.mjs";

const targetSlugs = [
  "malaysia-renovation-budget-guide",
  "kitchen-renovation-quotation-checklist-malaysia",
  "bathroom-waterproofing-drainage-planning-malaysia",
  "office-fit-out-me-it-planning-checklist-malaysia",
  "restaurant-fit-out-planning-checklist-malaysia",
];

describe("topic-cluster Blog publish records", () => {
  it("adds one same-language Service link before the existing first heading", () => {
    for (const slug of targetSlugs) {
      const current = {
        id: `blog-${slug}`,
        slug,
        status: "published",
        title_en: "English title",
        title_zh: "中文标题",
        content_en: "<p>Direct answer.</p><p>How to use.</p><h2>Existing English heading</h2><p>Body.</p>",
        content_zh: "<p>直接答案。</p><p>使用方法。</p><h2>现有中文标题</h2><p>正文。</p>",
      };

      const desired = buildTopicClusterBlogRecord(current);
      const config = topicClusterBlogConfigs[slug];

      expect(desired.status).toBe("published");
      expect(desired.id).toBe(current.id);
      expect(desired.content_en).toContain(config.enMarker);
      expect(desired.content_zh).toContain(config.zhMarker);
      expect(desired.content_en.indexOf(config.enMarker)).toBeLessThan(desired.content_en.indexOf("<h2>Existing English heading"));
      expect(desired.content_zh.indexOf(config.zhMarker)).toBeLessThan(desired.content_zh.indexOf("<h2>现有中文标题"));
      expect(desired.content_en).not.toContain('href="/zh/');
      expect(desired.content_zh).not.toContain('href="/en/');
    }
  });

  it("is idempotent when the intended links already exist", () => {
    for (const slug of targetSlugs) {
      const first = buildTopicClusterBlogRecord({
        slug,
        content_en: "<p>Intro.</p><h2>English</h2>",
        content_zh: "<p>简介。</p><h2>中文</h2>",
      });

      expect(buildTopicClusterBlogRecord(first)).toEqual(first);
    }
  });

  it("rejects unsupported records and content without an insertion heading", () => {
    expect(() => buildTopicClusterBlogRecord({
      slug: "not-approved",
      content_en: "<h2>English</h2>",
      content_zh: "<h2>中文</h2>",
    })).toThrow("Unsupported topic-cluster blog slug");

    expect(() => buildTopicClusterBlogRecord({
      slug: targetSlugs[0],
      content_en: "<p>No heading.</p>",
      content_zh: "<h2>中文</h2>",
    })).toThrow("missing the first <h2>");
  });

  it("keeps every approved target in the protected workflow batch", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"),
      "utf8",
    );

    expect(workflow).toContain("topic-cluster-links-20260907");
    for (const slug of targetSlugs) expect(workflow).toContain(slug);
  });
});
