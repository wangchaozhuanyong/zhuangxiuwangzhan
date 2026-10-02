import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnosticUrl, diagnosticMessage, isCriticalPublicRequest } from "./public-network-diagnostics.mjs";

test("diagnostics retain resource identity without query credentials", () => {
  assert.equal(diagnosticUrl("https://user:pass@example.com/asset.js?token=private#fragment"), "https://example.com/asset.js");
  assert.equal(diagnosticMessage("Failed https://example.com/image?customer=private (503)"), "Failed https://example.com/image (503)");
});

test("application failures block the gate while optional third party fetches are explicit warnings", () => {
  const base = "https://flashcast.com.my";
  assert.equal(isCriticalPublicRequest(`${base}/api/content`, "fetch", base), true);
  assert.equal(isCriticalPublicRequest("https://project.supabase.co/rest/v1/projects", "fetch", base), true);
  assert.equal(isCriticalPublicRequest("https://cdn.example.com/image.webp", "image", base), true);
  assert.equal(isCriticalPublicRequest("https://analytics.example.com/collect", "fetch", base), false);
  assert.equal(isCriticalPublicRequest("https://supabase.co.evil.test/rest/v1/projects", "fetch", base), false);
});
