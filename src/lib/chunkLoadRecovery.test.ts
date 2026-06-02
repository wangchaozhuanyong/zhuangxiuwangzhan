import { describe, expect, it } from "vitest";
import { getFriendlySystemMessage, getSystemEventCategory, isChunkLoadError } from "@/lib/chunkLoadRecovery";

describe("chunkLoadRecovery", () => {
  it("detects missing dynamic import chunks", () => {
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
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
    ).toBe("前端版本文件加载失败：浏览器或 CDN 还保留着旧的 SPA 入口 HTML，旧 HTML 引用了已经被新部署替换的 hashed JS chunk。系统会自动刷新一次并重新拉取最新入口。");
  });

  it("categorizes chunk failures as production deploy cache mismatches", () => {
    expect(
      getSystemEventCategory("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toEqual({
      key: "frontend_deploy_cache_mismatch",
      label: "前端生产部署缓存不一致",
    });
  });
});
