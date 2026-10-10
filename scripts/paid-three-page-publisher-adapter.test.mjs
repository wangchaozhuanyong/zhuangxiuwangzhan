import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { lockedPaidThreePageCandidates } from "./managed-cms-targets-paid-three-page-v1.mjs";
import {
  targetConfigs, assertLockedServiceCandidate, assertLockedRollbackCurrent,
  assertLockedPublishGate, buildLockedDryRunRequest, assertLockedDryRunResult, stableDigest,
  resolveLockedPublicPaths, inspectPublicReadback,
} from "./publish-content-trust-fixes.mjs";
import { reviewedBodyPhrases } from "./lib/publisher-public-readback.mjs";

const names = [
  "paid-three-page-builtin-exact-fields-v1",
  "paid-three-page-kitchen-exact-fields-v1",
  "paid-three-page-renovation-exact-fields-v1",
];
const bindings = Object.values(lockedPaidThreePageCandidates);
const cli = readFileSync(new URL("./publish-content-trust-fixes.mjs", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../.github/workflows/content-publish-approved.yml", import.meta.url), "utf8");
const registry = readFileSync(new URL("../supabase/functions/_shared/managed-targets.ts", import.meta.url), "utf8");
const nativeFields = vm.runInNewContext(registry.match(/const PAID_THREE_PAGE_NATIVE_FIELDS = (\[[\s\S]*?\]) as const;/)[1]);
const clone = (value) => JSON.parse(JSON.stringify(value));
const sharedTarget = (slug) => {
  const block = registry.match(new RegExp('  \\{\\n    id: "[^"\\n]+",\\n    slug: "' + slug + '",[\\s\\S]*?\\n  \\},'));
  assert.ok(block, "the original task must have its own shared target");
  return clone(vm.runInNewContext(`(${block[0].trim().slice(0, -1)})`, { PAID_THREE_PAGE_NATIVE_FIELDS: nativeFields }));
};

// Synthetic native fields exercise the real exported guards without a copied CMS record.
const fixture = (binding) => {
  const current = Object.fromEntries(binding.baselineProjectionFields.map((field) => [field, `fixture-${field}`]));
  Object.assign(current, {
    id: binding.recordId, slug: binding.slug, status: "published", updated_at: binding.expectedUpdatedAt,
    created_at: "2000-01-01T00:00:00+00:00", version: 1, sort_order: 0,
  });
  const locked = { ...binding, baselineFieldsSha256: stableDigest(current) };
  return { current, locked };
};

test("registers three distinct action keys sharing the original CV and only five desired fields", () => {
  assert.deepEqual(Object.keys(lockedPaidThreePageCandidates), names);
  assert.equal(new Set(bindings.map((value) => value.candidateVersion)).size, 1);
  assert.equal(bindings[0].candidateVersion, "paid-three-page-exact-native-diff-v1-20261010");
  assert.equal(bindings.reduce((count, value) => count + Object.keys(value.desiredFields).length, 0), 5);
  assert.equal(targetConfigs[bindings[0].candidateVersion], undefined, "shared CV cannot collapse three targets into one");
  for (const binding of bindings) {
    assert.equal(targetConfigs[binding.actionId].lockedCandidate, binding);
    assert.deepEqual(Object.keys(binding.desiredFields).sort(), [...binding.changedFields].sort());
    assert.equal(stableDigest(binding.desiredFields), binding.desiredFieldsSha256);
    assert.equal(Object.hasOwn(binding, "record"), false);
    assert.ok(Object.isFrozen(binding.desiredFields));
    assert.throws(() => { binding.rollbackAllowed = false; }, TypeError);
  }
});

test("matches current shared identity, raw CAS, native projection and three recovery bindings", () => {
  for (const binding of bindings) {
    const shared = sharedTarget(binding.slug);
    assert.equal(binding.recordId, shared.id);
    for (const field of [
      "taskId", "actionId", "candidateVersion", "scope", "contentType", "expectedUpdatedAt",
      "baselineFieldsSha256", "desiredFieldsSha256", "rollbackFieldsSha256", "retainedFieldsSha256",
      "rollbackAllowed", "requiresParentRun", "changedFields", "baselineProjectionFields", "retainedProjectionFields",
    ]) assert.deepEqual(binding[field], shared[field], `${binding.actionId}: ${field}`);
    assert.equal(binding.rollbackAllowed, true);
    assert.equal(binding.requiresParentRun, true);
    assert.equal(targetConfigs[binding.actionId].keyField, "id");
    assert.equal(targetConfigs[binding.actionId].key, binding.recordId);
    assert.equal(binding.baselineProjectionFields.length, 30);
  }
});

test("builds only the approved 1/2/2 field delta while retaining all synthetic native fields", () => {
  for (const binding of bindings) {
    const { current } = fixture(binding);
    const desired = targetConfigs[binding.actionId].buildRecord(current);
    const changed = Object.keys(desired).filter((field) => stableDigest(desired[field]) !== stableDigest(current[field]));
    assert.deepEqual(changed.sort(), [...binding.changedFields].sort());
    for (const field of binding.baselineProjectionFields.filter((field) => !binding.changedFields.includes(field))) {
      assert.deepEqual(desired[field], current[field]);
    }
    assert.equal(current.title_en, "fixture-title_en");
  }
});

test("real native guard rejects wrong identity, raw CAS, retained digest and candidate hash", () => {
  for (const binding of bindings) {
    const { locked, current } = fixture(binding);
    assert.doesNotThrow(() => assertLockedServiceCandidate(locked, current));
    for (const patch of [{ id: "other-row" }, { slug: "other-slug" }, { status: "draft" }]) {
      assert.throws(() => assertLockedServiceCandidate(locked, { ...current, ...patch }), /identity mismatch/);
    }
    assert.throws(() => assertLockedServiceCandidate(locked, { ...current, updated_at: current.updated_at.replace(/\.\d+/, ".000000") }), /updated_at drift/);
    assert.throws(() => assertLockedServiceCandidate(locked, { ...current, content_en: "altered retained field" }), /field drift/);
    assert.throws(() => assertLockedServiceCandidate({ ...locked, desiredFieldsSha256: "0".repeat(64) }, current), /payload mismatch/);
  }
});

test("builds exact publish and distinct rollback preview identities without creating a permit", () => {
  for (const binding of bindings) {
    const { current } = fixture(binding);
    const forward = buildLockedDryRunRequest(binding, current, "fixture-read-only");
    assert.equal(forward.expectedUpdatedAt, binding.expectedUpdatedAt);
    assert.deepEqual(forward.managedCandidate, {
      taskId: binding.taskId, actionId: binding.actionId, operation: "publish", scope: binding.scope,
      candidateVersion: binding.candidateVersion,
    });
    const restore = buildLockedDryRunRequest(binding, current, "fixture-read-only", "rollback");
    assert.equal(restore.managedCandidate.actionId, `rollback-${binding.candidateVersion}`);
    assert.equal(restore.managedCandidate.candidateVersion, `${binding.candidateVersion}-rollback-v1`);
    assert.equal(restore.managedCandidate.operation, "rollback");
    assert.equal(restore.managedCandidate.scope, binding.scope);
    assert.equal(Object.hasOwn(forward, "managedPermit"), false);
    assert.equal(Object.hasOwn(restore, "ownerApproved"), false);
    const published = { ...current, ...binding.desiredFields };
    assert.doesNotThrow(() => assertLockedRollbackCurrent(binding, published));
    assert.throws(() => assertLockedRollbackCurrent(binding, { ...published, [binding.changedFields[0]]: "other candidate" }), /does not match/);
  }
});

test("real dry-run guard requires the exact five-field patch and an unchanged row", () => {
  for (const binding of bindings) {
    const { current } = fixture(binding);
    const desired = { ...current, ...binding.desiredFields };
    const response = { ok: true, dry_run: true, content_type: "service", existing_id: binding.recordId,
      slug: binding.slug, payload_preview: binding.desiredFields };
    assert.doesNotThrow(() => assertLockedDryRunResult(binding, response, 200, current, clone(current), desired));
    assert.throws(() => assertLockedDryRunResult(binding, { ...response, payload_preview: { ...binding.desiredFields, content_en: "extra" } }, 200, current, current, desired), /exact SQL patch/);
    assert.throws(() => assertLockedDryRunResult(binding, response, 200, current, { ...current, version: 2 }, desired), /changed during dry-run/);
  }
});

test("actual recovery branches keep false blocked and true separately permitted without auto-restore", () => {
  const reject = cli.indexOf("if (rollbackFrom && config.lockedCandidate?.rollbackAllowed === false)");
  assert.ok(reject >= 0 && reject < cli.indexOf('const env = loadEnv("", envDir, "")'));
  assert.match(cli, /restoration_allowed: config\.lockedCandidate\.rollbackAllowed === true/);
  assert.match(cli, /restoration_requires_distinct_completed_parent_permit: config\.lockedCandidate\.rollbackAllowed === true/);
  assert.match(cli, /const rollbackCommand = config\.lockedCandidate\?\.exactPatchOnly && config\.lockedCandidate\.rollbackAllowed !== true/);
  assert.match(cli, /recovery: config\.lockedCandidate\.exactPatchOnly && config\.lockedCandidate\.rollbackAllowed !== true/);
  assert.match(cli, /distinct one-time rollback permit bound to this completed publish permit and its saved_updated_at/);
  assert.match(cli, /native_restore_preview_executed: false/);
  assert.equal(targetConfigs["org020-shop-intent-body-r1-v7"].lockedCandidate.rollbackAllowed, false);
  assert.equal(targetConfigs["design-body-faq-unified-20261009-v1"].lockedCandidate.rollbackAllowed, false);
  const environment = { GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main",
    ACTIONS_ID_TOKEN_REQUEST_URL: "fixture", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "fixture" };
  for (const binding of bindings) {
    assert.throws(() => assertLockedPublishGate(binding, {}, ""), /exact single-use permit/);
    assert.throws(() => assertLockedPublishGate(binding, environment, ""), /exact single-use permit/);
    assert.throws(() => assertLockedPublishGate(binding, { ...environment, GITHUB_REF: "refs/heads/fixture" }, "00000000-0000-0000-0000-000000000001"), /approved main workflow/);
  }
});

test("original workflow pre-credential gate requires a permit and exact parent for all three new targets", () => {
  const match = workflow.match(/- name: Reject unverified locked-target writes[\s\S]*?\n        run: \|\n([\s\S]*?)(?=\n      - name:)/);
  assert.ok(match);
  const gate = match[1].replace(/^          /gm, "");
  const run = (target, operation, patch = {}) => spawnSync("/bin/bash", ["-c", gate], {
    env: { GITHUB_REF: "refs/heads/main", PUBLISH_MODE: "publish", PUBLISH_TARGET: target,
      MANAGED_OPERATION: operation, MANAGED_PERMIT_ID: "00000000-0000-0000-0000-000000000001",
      PARENT_RUN_ID: "42", APPROVAL_ID: "fixture-authorization", ...patch },
    encoding: "utf8",
  }).status;
  for (const name of names) {
    assert.ok(workflow.includes(`          - ${name}\n`));
    assert.equal(run(name, "publish"), 0);
    assert.equal(run(name, "rollback"), 0);
    assert.notEqual(run(name, "publish", { MANAGED_PERMIT_ID: "" }), 0);
    assert.notEqual(run(name, "rollback", { PARENT_RUN_ID: "" }), 0);
    assert.notEqual(run(name, "rollback", { MANAGED_PERMIT_ID: "" }), 0);
  }
  assert.notEqual(run("org020-shop-intent-body-r1-v7", "rollback"), 0);
  assert.notEqual(run("design-body-faq-unified-20261009-v1", "rollback"), 0);
  assert.match(workflow, /name: approved-content-publish-\$\{\{ inputs\.parent_run_id \}\}/);
  assert.match(workflow, /--rollback-from="audits\/parent-\$\{PARENT_RUN_ID\}\/\$\{PUBLISH_TARGET\}\/backup\.json"/);
});

test("public readback uses frozen metadata expectations and short approved visible phrases", () => {
  for (const binding of bindings) {
    assert.deepEqual(binding.publicPaths.map((page) => page.path), [`/zh/services/${binding.slug}`, `/en/services/${binding.slug}`]);
    assert.ok(binding.publicPaths.every((page) => typeof page.expected === "string" && page.expected.length > 0));
    for (const phrase of binding.publicPaths[0].requiredPhrases) {
      assert.ok(phrase.length > 0 && phrase.length < 300);
      assert.ok(Object.values(binding.desiredFields).some((value) => value.replace(/<[^>]*>/g, "").includes(phrase)));
    }
  }
});

const builtinPublicFixture = () => {
  const binding = lockedPaidThreePageCandidates[names[0]];
  const forward = binding.publicPaths[0];
  const restore = binding.rollbackPublicPaths[0];
  const after = binding.desiredFields.content_zh;
  const nextSpan = after.match(/若主要需求是[\s\S]*?<\/a>[^<]*?。/)[0];
  const anchor = nextSpan.match(/<a\b[^>]*>[\s\S]*?<\/a>/)[0];
  const priorSpan = `${restore.requiredPhrases[0]} ${anchor}${restore.requiredPhrases[1]}`;
  const before = after.replace(nextSpan, priorSpan);
  // Exact original rollback digest, rather than an invented old-page fixture.
  assert.equal(stableDigest({ content_zh: before }), binding.rollbackFieldsSha256);
  return { binding, forward, restore, before, after, anchor };
};
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const publicHtml = (page, body) => `<title>${escapeHtml(page.expected)}</title><main>${body}</main>`;
const publicPasses = (check) => check.status === 200 && check.found
  && check.forbiddenFound.length === 0 && check.missingRequired.length === 0;

test("public assertions reject the stale builtin even when its metadata and unchanged first paragraph match", () => {
  const { binding, forward, before, after, anchor } = builtinPublicFixture();
  assert.equal(reviewedBodyPhrases(before)[0], reviewedBodyPhrases(after)[0]);
  assert.ok(before.includes(anchor) && after.includes(anchor));
  assert.equal(forward.forbidden.includes(anchor), false);
  const config = targetConfigs[binding.actionId];
  const paths = resolveLockedPublicPaths(config, {}, false);
  assert.equal(paths, config.publicPaths);
  const stale = inspectPublicReadback(paths[0], 200, publicHtml(forward, before));
  assert.equal(stale.found, true, "the same SEO title must not prove the changed body");
  assert.deepEqual(stale.missingRequired, forward.requiredPhrases);
  assert.deepEqual(stale.forbiddenFound, forward.forbidden);
  assert.equal(publicPasses(stale), false);
  assert.equal(publicPasses(inspectPublicReadback(paths[0], 200, publicHtml(forward, after))), true);
  for (const target of bindings) {
    const { current } = fixture(target);
    const desired = targetConfigs[target.actionId].buildRecord(current);
    for (const field of Object.keys(current).filter((field) => field.endsWith("_en"))) {
      assert.deepEqual(desired[field], current[field], "the original English fields remain unchanged");
    }
    const body = target.desiredFields.content_zh || Object.values(target.desiredFields).join("<br>");
    for (const page of resolveLockedPublicPaths(targetConfigs[target.actionId], {}, false)) {
      assert.equal(page.strictMetadataTitle, true);
      const html = publicHtml(page, body);
      if (page.path.startsWith("/en/")) {
        assert.ok(page.expected.includes("&") && !page.expected.includes("&amp;"));
        assert.ok(html.includes("&amp;"));
      }
      assert.equal(publicPasses(inspectPublicReadback(page, 200, html)), true, page.path);
      const wrongTitle = `<title>Incorrect frozen title</title><main>${body}${page.expected}</main>`;
      assert.equal(inspectPublicReadback(page, 200, wrongTitle).found, false, "correct body text cannot mask a wrong title");
    }
  }
});

test("public assertions accept legitimate old builtin recovery and reverse only unique changed text", () => {
  const { binding, before, after, anchor } = builtinPublicFixture();
  const desired = { content_zh: before, seo_title_zh: binding.publicPaths[0].expected, seo_title_en: binding.publicPaths[1].expected };
  const paths = resolveLockedPublicPaths(targetConfigs[binding.actionId], desired, true);
  assert.deepEqual(paths[0].requiredPhrases, binding.rollbackPublicPaths[0].requiredPhrases);
  assert.deepEqual(paths[0].forbidden, binding.publicPaths[0].requiredPhrases);
  assert.equal(paths[0].forbidden.includes(anchor), false);
  assert.equal(paths[0].forbidden.includes(reviewedBodyPhrases(before)[0]), false);
  assert.equal(publicPasses(inspectPublicReadback(paths[0], 200, publicHtml(paths[0], before))), true);
  assert.equal(publicPasses(inspectPublicReadback(paths[0], 200, publicHtml(paths[0], after))), false);
  for (const page of paths) {
    assert.equal(publicPasses(inspectPublicReadback(page, 200, publicHtml(page, before))), true);
    assert.equal(inspectPublicReadback(page, 200, `<title>Wrong restore title</title><main>${before}${page.expected}</main>`).found, false);
    if (page.path.startsWith("/en/")) assert.equal(page.expected, binding.publicPaths[1].expected, "rollback keeps raw English title with &");
  }
  for (const titleBinding of bindings.slice(1)) {
    const fields = Object.fromEntries(titleBinding.changedFields.map((field, index) => [field, titleBinding.rollbackPublicPaths[0].requiredPhrases[index]]));
    assert.equal(stableDigest(fields), titleBinding.rollbackFieldsSha256);
    const restored = { ...fields, seo_title_zh: titleBinding.publicPaths[0].expected, seo_title_en: titleBinding.publicPaths[1].expected };
    const reversePaths = resolveLockedPublicPaths(targetConfigs[titleBinding.actionId], restored, true);
    const reverse = reversePaths[0];
    const oldText = `<h1>${fields.title_zh}</h1><p>${fields.excerpt_zh}</p>`;
    const newText = `<h1>${titleBinding.desiredFields.title_zh}</h1><p>${titleBinding.desiredFields.excerpt_zh}</p>`;
    assert.equal(publicPasses(inspectPublicReadback(reverse, 200, publicHtml(reverse, oldText))), true);
    assert.equal(publicPasses(inspectPublicReadback(reverse, 200, publicHtml(reverse, newText))), false);
    for (const page of reversePaths) {
      assert.equal(publicPasses(inspectPublicReadback(page, 200, publicHtml(page, oldText))), true, page.path);
      assert.equal(inspectPublicReadback(page, 200, `<title>Wrong restore title</title><main>${oldText}${page.expected}</main>`).found, false);
      if (page.path.startsWith("/en/")) {
        assert.equal(page.expected, titleBinding.publicPaths[1].expected);
        assert.ok(publicHtml(page, oldText).includes("&amp;"));
      }
    }
    const positive = resolveLockedPublicPaths(targetConfigs[titleBinding.actionId], {}, false)[0];
    assert.equal(publicPasses(inspectPublicReadback(positive, 200, publicHtml(positive, oldText))), false);
    assert.equal(publicPasses(inspectPublicReadback(positive, 200, publicHtml(positive, newText))), true);
  }
  // Targets without the new explicit contract keep the original FAQ rollback fallback.
  const legacy = { lockedCandidate: {}, publicPaths: [{ path: "/zh/services/fixture", expected: "new", requiredPhrases: ["new question"], forbidden: ["existing forbidden"] }] };
  assert.deepEqual(resolveLockedPublicPaths(legacy, { seo_title_zh: "old title", faqs_zh: [{ q: "old question" }] }, true), [
    { path: "/zh/services/fixture", expected: "old title", requiredPhrases: ["old question"], forbidden: ["existing forbidden", "new question"] },
  ]);
});
