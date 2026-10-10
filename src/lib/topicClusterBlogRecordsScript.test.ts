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

  it("locks exact publish and safe rollback target sets before production secrets", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"),
      "utf8",
    );
    const lockedTargets = [
      "builtin-whole-house-custom-v1",
      "en-renovation-owner-cms-v2",
      "pg002-shop-cms-v1",
      "kitchen-r1-cms-row-20260924-v1",
      "design-r1-cms-row-20260924-v1",
      "selangor-service-area-r1-v4",
      "org-017-bathroom-faq-parity-reconciliation-v4",
      "blog-kitchen-cabinet-cost-r1-v1",
      "blog-renovation-quotation-links-r1-v1",
      "blog-office-checklist-links-r1-v1",
      "office-service-scope-r1-v1",
    ];
    for (const target of lockedTargets) {
      expect(workflow).toContain(`          - ${target}`);
    }
    expect(workflow).toContain("Reject unverified locked-target writes before loading production credentials");
    const mediaTargets = [
      "org026-builtin-media-r1-v5", "org026-warehouse-media-r1-v6", "org026-office-renovation-media-r1-v6",
      "blog-kitchen-cabinet-media-r1-v1", "blog-office-checklist-media-r1-v1",
    ];
    const nativeBodyTargets = [
      "design-framework-cms-content-v4",
      "kitchen-initial-framework-body-v1",
      "bathroom-initial-framework-body-v1",
      "c01-bilingual-body-v1",
      "c02-bilingual-body-v1",
      "c03-bilingual-body-v1",
      "c04-bilingual-body-v1",
      "c05-bilingual-body-v1",
      "c06-bilingual-body-v1",
      "c07-bilingual-body-v1",
      "c08-bilingual-body-v1",
      "c09-bilingual-body-v1",
      "c10-bilingual-body-v1",
      "c11-bilingual-body-v1",
      "c12-bilingual-body-v1",
      "c13-bilingual-body-v1",
      "c14-bilingual-body-v1",
      "c15-bilingual-body-v1",
    ];
    const rollbackTargets = [...lockedTargets, "kl-location-intent-r1-v2", ...nativeBodyTargets];
    const org020Targets = [
      "org020-shop-intent-body-r1-v7",
      "org020-zh-renovation-study-room-r1-v7",
      "org020-budget-timeline-r1-v7",
      "org020-area-ampang-prune-r1-v7",
      "org020-area-ara-damansara-prune-r1-v7",
      "org020-area-bangsar-prune-r1-v7",
      "org020-area-bukit-jalil-prune-r1-v7",
      "org020-area-cheras-prune-r1-v7",
      "org020-area-cyberjaya-prune-r1-v7",
      "org020-area-damansara-prune-r1-v7",
      "org020-area-kepong-prune-r1-v7",
      "org020-area-kota-damansara-prune-r1-v7",
      "org020-area-mont-kiara-prune-r1-v7",
      "org020-area-petaling-jaya-prune-r1-v7",
      "org020-area-puchong-prune-r1-v7",
      "org020-area-selangor-prune-r1-v7",
      "org020-area-setapak-prune-r1-v7",
      "org020-area-setia-alam-prune-r1-v7",
      "org020-area-shah-alam-prune-r1-v7",
      "org020-area-sri-petaling-prune-r1-v7",
      "org020-area-subang-jaya-prune-r1-v7",
      "org020-general-quote-30km-answer-r1-v8",
      "org020-home-quote-30km-answer-r1-v8",
      "org020-home-one-year-warranty-answer-r1-v8",
      "org020-locations-hub-availability-r1-v7",
      "org020-coating-fact-safe-body-r1-v7",
      "org020-condo-current-sources-r1-v7",
      "org020-dbkl-current-sources-r1-v7",
    ];
    const publisherThreeTargets = ["v17-owner-publisher-native-preparation-v2-20261007",
      "v18-owner-publisher-native-preparation-v2-20261007", "v20-owner-publisher-native-preparation-v2-20261007"];
    const unifiedTargets = ["design-body-faq-unified-20261009-v1", "bathroom-body-step-unified-20261009-v1"];
    const paidThreeTargets = ["paid-three-page-builtin-exact-fields-v1", "paid-three-page-kitchen-exact-fields-v1", "paid-three-page-renovation-exact-fields-v1"];
    const publishTargets = [...paidThreeTargets, ...lockedTargets, "kl-location-intent-r1-v2", ...mediaTargets, ...org020Targets, ...nativeBodyTargets, ...publisherThreeTargets, ...unifiedTargets];
    const cases = [...workflow.matchAll(/case "\$PUBLISH_TARGET" in\s*([^)]*)\)/g)]
      .map((match) => match[1].trim().split("|"));
    expect(cases).toHaveLength(2);
    expect(cases[0]).toEqual([...paidThreeTargets, ...rollbackTargets]);
    expect(cases[1]).toEqual(publishTargets);
    for (const target of publishTargets) expect(workflow).toContain(`          - ${target}`);
    for (const target of mediaTargets) expect(cases[0]).not.toContain(target);
    for (const target of [...publisherThreeTargets, ...unifiedTargets]) expect(cases[0]).not.toContain(target);
    for (const targets of cases) for (const fixedBatch of ["remaining-completion-20261009", "remaining-completion-after-37893433883", "remaining-completion-after-37898568406", "remaining-completion-after-37903094390", "remaining-completion-after-38037667102"]) expect(targets).not.toContain(fixedBatch);
    expect(workflow).toContain('if [ "$PUBLISH_TARGET" = "remaining-completion-20261009" ]; then');
    expect(workflow).toContain('[ "$APPROVAL_ID" != "owner-authorized-remaining-completion-20261009" ]');
    expect(workflow).toContain('[ -n "$MANAGED_PERMIT_ID" ] || [ -n "$PARENT_RUN_ID" ]');
    expect(workflow).toContain("if: ${{ inputs.target != 'remaining-completion-20261009' && inputs.target != 'remaining-completion-after-37893433883' && inputs.target != 'remaining-completion-after-37898568406' && inputs.target != 'remaining-completion-after-37903094390' && inputs.target != 'remaining-completion-after-38037667102' }}");
    expect(workflow.indexOf("Reject unverified locked-target writes before loading production credentials"))
      .toBeLessThan(workflow.indexOf("Confirm production source and required secrets"));
    for (const reference of ["qa_receipt_id", "release_decision_id", "policy_permit_id", "policy_scope"]) {
      expect(workflow).not.toContain(`inputs.${reference}`);
    }
  });
});
