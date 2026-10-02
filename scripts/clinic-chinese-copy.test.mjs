import { test } from "node:test";
import assert from "node:assert/strict";
import { targetConfigs } from "./publish-content-trust-fixes.mjs";
const source = { id: "2d580a53-4b91-48b0-82c2-98bb910073ff", updated_at: "2026-08-14T14:23:44.447044+00:00",
  content_zh: "材料建议：人造石、Light oak veneer、Terrazzo、Frosted glass。", content_en: "Original English content.",
  scope: ["Reception counter"], materials: ["Light oak veneer"], location: "Legacy location", area: "Legacy area", status: "published" };
const build = targetConfigs["clinic-zh-copy-20261003"].buildRecord;
test("Chinese CMS repair preserves English and shared labels while honoring case privacy", () => {
  const result = build(source);
  assert.equal(result.content_zh, "材料建议：人造石、浅橡木饰面、水磨石、磨砂玻璃。");
  assert.equal(result.content_en, source.content_en);
  assert.deepEqual(result.scope, source.scope);
  assert.deepEqual(result.materials, source.materials);
  assert.equal(result.location, null); assert.equal(result.area, null);
});
test("a newer source or different record stops publication before any write", () => {
  assert.throws(() => build({ ...source, updated_at: "2026-10-03T00:00:00Z" }), /source changed/);
  assert.throws(() => build({ ...source, id: "other-record" }), /source changed/);
});
