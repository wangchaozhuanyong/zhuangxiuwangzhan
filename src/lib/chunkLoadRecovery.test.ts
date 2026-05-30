import { describe, expect, it } from "vitest";
import { getFriendlySystemMessage, isChunkLoadError } from "@/lib/chunkLoadRecovery";

describe("chunkLoadRecovery", () => {
  it("detects missing dynamic import chunks", () => {
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toBe(true);
  });

  it("shows a friendly Chinese system log message for chunk failures", () => {
    expect(
      getFriendlySystemMessage("Failed to fetch dynamically imported module: /assets/AdminLayout-yH2aL-YC.js"),
    ).toBe("前端版本文件加载失败，通常是浏览器缓存了旧版本页面导致。系统会尝试自动刷新一次。");
  });
});
