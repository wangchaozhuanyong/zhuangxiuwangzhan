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

  it.each([
    /\bsecrets\s+set\b/i,
    /\bfunctions\s+deploy\b/i,
    /SUPABASE_ACCESS_TOKEN/,
    /setup-cli/i,
  ])("keeps infrastructure provisioning out of the content workflow: %s", (operation) => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"),
      "utf8",
    );

    expect(workflow).not.toMatch(operation);
  });

  it("retains the main-only authenticated publisher, dry-run gate and audit package", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"),
      "utf8",
    );
    const mainGate = 'test "$GITHUB_REF" = "refs/heads/main"';
    const dryRun = 'npm run content:trust-fixes -- --target="$CONTENT_TARGET" --artifact-dir=';
    const publishGate = 'if [ "$PUBLISH_MODE" != "publish" ]; then\n            exit 0';
    const publish = 'npm run content:trust-fixes -- --target="$CONTENT_TARGET" --execute --approval-id="$APPROVAL_ID"';

    for (const variable of ["CONTENT_PUBLISH_SECRET", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
      expect(workflow).toContain(variable + ": ${{ secrets." + variable + " }}");
      expect(workflow).toContain(`test -n "$${variable}"`);
    }
    for (const required of [mainGate, dryRun, publishGate, publish]) expect(workflow).toContain(required);
    expect(workflow.indexOf(mainGate)).toBeLessThan(workflow.indexOf(dryRun));
    expect(workflow.indexOf(dryRun)).toBeLessThan(workflow.indexOf(publishGate));
    expect(workflow.indexOf(publishGate)).toBeLessThan(workflow.indexOf(publish));
    expect(workflow).toContain("default: dry-run");
    expect(workflow).toContain("          - dry-run\n          - publish");
    expect(workflow).toContain("APPROVAL_ID: ${{ inputs.approval_id }}");
    expect(workflow).toContain("owner-standing-flashcast-site-publish-20260906");
    expect(workflow).toContain("uses: actions/upload-artifact@v7");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("path: audits/content-publish-${{ github.run_id }}");
  });
});
