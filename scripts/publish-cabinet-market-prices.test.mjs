import assert from "node:assert/strict";
import test from "node:test";
import { CABINET_PRICE_TARGETS } from "../supabase/functions/_shared/cabinet-price-targets.ts";
import { findManagedTarget, managedAction, MANAGED_BLOGS } from "../supabase/functions/_shared/managed-targets.ts";
import { buildCabinetCandidate, digest, getCabinetCandidate } from "./publish-cabinet-market-prices.mjs";

test("each price candidate admits one existing blog and only its three body fields", () => {
  assert.equal(CABINET_PRICE_TARGETS.length, 3);
  for (const target of CABINET_PRICE_TARGETS) {
    const { entry } = getCabinetCandidate(target.candidateVersion);
    const binding = { ...managedAction(target, "publish"), operation: "publish" };
    assert.equal(findManagedTarget(MANAGED_BLOGS, target.id, target.slug, binding), target);
    assert(!findManagedTarget(MANAGED_BLOGS, "another-id", "another-slug", binding));
    assert(!findManagedTarget(MANAGED_BLOGS, target.id, target.slug, { ...binding, scope: "unrelated" }));
    assert.deepEqual(target.changedFields, ["content_en", "content_ms", "content_zh"]);
    assert.equal(target.baselineProjectionFields.length, 29);
    assert.equal(target.retainedProjectionFields.length, 24);
    for (const field of target.changedFields) {
      assert.match(entry.insertions[field].fragment, /RM[0-9]/u);
      assert.match(entry.insertions[field].fragment, /href="https:\/\//u);
    }
  }
});

test("the exact patch preserves all preceding and following bytes and fails on a changed version or fragment", () => {
  const before = { id: "row", slug: "article", status: "published", updated_at: "latest", content_en: "<p>Keep</p><h2>After</h2>" };
  const anchor = "<h2>After</h2>";
  const fragment = "<p>RM500</p>";
  const entry = { insertions: { content_en: { anchor, fragment } } };
  const desired = { content_en: "<p>Keep</p><p>RM500</p><h2>After</h2>" };
  const rollback = { content_en: before.content_en };
  const target = {
    id: before.id, slug: before.slug, expectedUpdatedAt: before.updated_at,
    changedFields: ["content_en"], baselineProjectionFields: Object.keys(before), retainedProjectionFields: ["status"],
    baselineFieldsSha256: digest(before), desiredFieldsSha256: digest(desired), rollbackFieldsSha256: digest(rollback),
    retainedFieldsSha256: digest({ status: before.status }),
  };
  assert.deepEqual(buildCabinetCandidate(before, target, entry), { desired, rollback });
  assert.throws(() => buildCabinetCandidate({ ...before, updated_at: "other" }, target, entry), /version changed/);
  assert.throws(() => buildCabinetCandidate({ ...before, content_en: "new content" }, target, entry), /baseline changed/);
  assert.throws(() => buildCabinetCandidate(before, target,
    { insertions: { content_en: { anchor, fragment: "<p>RM1000</p>" } } }), /Draft bytes differ/);
});
