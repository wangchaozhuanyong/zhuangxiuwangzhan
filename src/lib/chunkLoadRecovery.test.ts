import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumePendingChunkRecoveryLog,
  getFriendlySystemMessage,
  getSystemEventCategory,
  isChunkLoadError,
  installChunkLoadRecovery,
} from "@/lib/chunkLoadRecovery";
import { chunkLoadRecoveryText } from "@/i18n/chunkLoadRecoveryText";

describe("chunkLoadRecovery", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/zh");
  });

  afterEach(() => vi.restoreAllMocks());

  it("cleans a legacy refresh parameter without dropping route, query, hash or browser state", () => {
    window.history.replaceState({ draft: true }, "", "/en/services/design?preview=yes&__flashcast_refresh=123#details");
    window.sessionStorage.setItem("draft", "keep");
    window.localStorage.setItem("preference", "keep");
    window.sessionStorage.setItem("flashcast:chunk-load-recovery", "legacy retry state");
    installChunkLoadRecovery();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/en/services/design?preview=yes#details");
    expect(window.history.state).toEqual({ draft: true });
    expect(window.sessionStorage.getItem("draft")).toBe("keep");
    expect(window.localStorage.getItem("preference")).toBe("keep");
    expect(window.sessionStorage.getItem("flashcast:chunk-load-recovery")).toBeNull();
  });

  it("keeps normal URLs and does not register handlers that can initiate another navigation", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const url = window.location.href;
    installChunkLoadRecovery();
    installChunkLoadRecovery();
    expect(window.location.href).toBe(url);
    expect(addListener).not.toHaveBeenCalled();
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
    expect(friendly).toBe(chunkLoadRecoveryText.zh.loadMessage);
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
