import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getInitialPublicTheme } from "@/contexts/PublicChromeContext";

describe("public theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("uses the fixed dark public theme", () => {
    expect(getInitialPublicTheme()).toBe("dark");
  });

  it("ignores obsolete saved light preferences", () => {
    window.localStorage.setItem("flashcast-public-theme", "light");

    expect(getInitialPublicTheme()).toBe("dark");
  });
});
