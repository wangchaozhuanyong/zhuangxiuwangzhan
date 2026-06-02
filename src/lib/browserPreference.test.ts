import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";

const clearCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

describe("browser preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearCookie("test_pref_cookie");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearCookie("test_pref_cookie");
    window.localStorage.clear();
  });

  it("persists to localStorage and cookie fallback", () => {
    writeBrowserPreference("test-pref", "zh", "test_pref_cookie");

    expect(window.localStorage.getItem("test-pref")).toBe("zh");
    expect(readBrowserPreference("test-pref", "test_pref_cookie")).toBe("zh");
  });

  it("prefers cookie when localStorage is stale", () => {
    window.localStorage.setItem("test-pref", "en");
    document.cookie = "test_pref_cookie=zh; Path=/; SameSite=Lax";

    expect(readBrowserPreference("test-pref", "test_pref_cookie")).toBe("zh");
  });

  it("does not throw when localStorage writes are blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => writeBrowserPreference("test-pref", "zh", "test_pref_cookie")).not.toThrow();
    expect(readBrowserPreference("test-pref", "test_pref_cookie")).toBe("zh");
  });
});
