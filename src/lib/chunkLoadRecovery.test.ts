import { beforeEach, describe, expect, it } from "vitest";
import {
  consumePendingChunkRecoveryLog,
  getFriendlySystemMessage,
  getSystemEventCategory,
  isChunkLoadError,
} from "@/lib/chunkLoadRecovery";
import { chunkLoadRecoveryText } from "@/i18n/chunkLoadRecoveryText";

describe("chunkLoadRecovery", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("detects missing dynamic import chunks", () => {
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toBe(true);
  });

  it("detects module script MIME mismatch from stale SPA fallback HTML", () => {
    expect(
      isChunkLoadError(
        'Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". /assets/AdminLayout-yH2aL-YC.js',
      ),
    ).toBe(true);
  });

  it("detects React lazy module default failures from built assets", () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'default')");
    error.stack = "TypeError: Cannot read properties of undefined (reading 'default')\n    at le (http://127.0.0.1:4174/assets/ui-1_PRuCWQ.js:1:3721)";

    expect(isChunkLoadError(error)).toBe(true);
  });

  it("does not treat unrelated default property errors as chunk failures", () => {
    expect(isChunkLoadError("Cannot read properties of undefined (reading 'default')")).toBe(false);
  });

  it("uses the cache mismatch friendly message when the event is already categorized", () => {
    const friendly = getFriendlySystemMessage(
      "Cannot read properties of undefined (reading 'default')",
      "frontend_deploy_cache_mismatch",
    );

    expect(friendly).not.toContain("Cannot read properties");
    expect(friendly.length).toBeGreaterThan(20);
  });

  it("shows a friendly Chinese system log message for chunk failures", () => {
    expect(
      getFriendlySystemMessage("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toBe(chunkLoadRecoveryText.zh.loadMessage);
  });

  it("categorizes chunk failures as production deploy cache mismatches", () => {
    expect(
      getSystemEventCategory("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toEqual({
      key: "frontend_deploy_cache_mismatch",
      label: "前端生产部署缓存不一致",
    });
  });

  it("consumes one pending recovery log for backend Chinese classification", () => {
    window.sessionStorage.setItem(
      "flashcast:chunk-load-recovery-log",
      JSON.stringify({
        eventType: "frontend_deploy_cache_mismatch",
        message: "Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js",
        path: "/admin",
        url: "https://flashcast.com.my/admin",
        timestamp: 1760000000000,
      }),
    );

    expect(consumePendingChunkRecoveryLog()).toEqual({
      eventType: "frontend_deploy_cache_mismatch",
      message: "Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js",
      path: "/admin",
      url: "https://flashcast.com.my/admin",
      timestamp: 1760000000000,
    });
    expect(consumePendingChunkRecoveryLog()).toBeNull();
  });
});
